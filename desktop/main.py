"""Velatura — marca d'água em lote.

Aplicativo de desktop (Windows) com interface customtkinter.
Processa JPG, PNG, WEBP e BMP com Pillow, respeita a orientação EXIF
e nunca substitui os arquivos originais.

Execute:  python main.py
Empacote: veja LEIA-ME.md (PyInstaller).
"""

from __future__ import annotations

import json
import os
import queue
import re
import sys
import threading
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import unquote, urlparse

from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 250_000_000

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
SETTINGS_NAME = "watermark_settings.json"

COLOR = {
    "bg": "#101110",
    "surface": "#1a1916",
    "raised": "#24221e",
    "line": "#34312b",
    "text": "#f3f0e8",
    "muted": "#a39e93",
    "accent": "#efeae1",
    "accent_hover": "#f7f4ee",
    "ink": "#16140f",
    "danger": "#c46b5a",
}

CURATED_FONTS = [
    ("Segoe UI", "segoeui.ttf"),
    ("Arial", "arial.ttf"),
    ("Arial Black", "ariblk.ttf"),
    ("Calibri", "calibri.ttf"),
    ("Cambria", "cambria.ttc"),
    ("Candara", "candara.ttf"),
    ("Comic Sans MS", "comic.ttf"),
    ("Consolas", "consola.ttf"),
    ("Constantia", "constan.ttf"),
    ("Corbel", "corbel.ttf"),
    ("Courier New", "cour.ttf"),
    ("Georgia", "georgia.ttf"),
    ("Impact", "impact.ttf"),
    ("Lucida Console", "lucon.ttf"),
    ("Palatino Linotype", "pala.ttf"),
    ("Tahoma", "tahoma.ttf"),
    ("Times New Roman", "times.ttf"),
    ("Trebuchet MS", "trebuc.ttf"),
    ("Verdana", "verdana.ttf"),
    ("Garamond", "gara.ttf"),
]

LINUX_FONTS = [
    ("DejaVu Sans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ("DejaVu Serif", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"),
    ("Liberation Sans", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
    ("Liberation Serif", "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"),
]

POSITIONS = [
    ("top-left", "Sup. esq."),
    ("top-right", "Sup. dir."),
    ("center", "Centro"),
    ("bottom-left", "Inf. esq."),
    ("bottom-right", "Inf. dir."),
    ("tile", "Mosaico"),
]


@dataclass
class MarkSettings:
    mode: str = "text"
    text: str = "© Seu estúdio"
    font_path: str = ""
    color: str = "#FFFFFF"
    font_scale: int = 100
    opacity: int = 62
    size_percent: int = 36
    rotation: float = 0
    position: str = "bottom-right"
    margin_percent: float = 4
    quality: int = 92
    suffix: str = "_marca"
    output_dir: str = ""
    logo_path: str = ""


def app_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def settings_file() -> Path:
    return app_dir() / SETTINGS_NAME


def clamp_int(value: object, default: int, lo: int, hi: int) -> int:
    try:
        number = int(round(float(value)))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, number))


def clamp_float(value: object, default: float, lo: float, hi: float) -> float:
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, number))


def sanitize_suffix(suffix: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", suffix or "").strip()
    return cleaned[:40]


def parse_hex(value: str) -> tuple[int, int, int]:
    raw = (value or "").strip().lstrip("#")
    if len(raw) == 3:
        raw = "".join(ch * 2 for ch in raw)
    if len(raw) != 6:
        return (255, 255, 255)
    try:
        return (int(raw[0:2], 16), int(raw[2:4], 16), int(raw[4:6], 16))
    except ValueError:
        return (255, 255, 255)


def coerce_settings(data: object) -> MarkSettings:
    base = MarkSettings()
    if not isinstance(data, dict):
        return base
    mode = data.get("mode", base.mode)
    position = data.get("position", base.position)
    color = str(data.get("color", base.color))
    if not re.fullmatch(r"#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?", color.strip()):
        color = base.color
    if not color.startswith("#"):
        color = "#" + color
    return MarkSettings(
        mode=mode if mode in {"text", "image"} else base.mode,
        text=str(data.get("text", base.text))[:500],
        font_path=str(data.get("font_path", "") or ""),
        color=color,
        font_scale=clamp_int(data.get("font_scale"), base.font_scale, 50, 200),
        opacity=clamp_int(data.get("opacity"), base.opacity, 0, 100),
        size_percent=clamp_int(data.get("size_percent"), base.size_percent, 5, 90),
        rotation=clamp_float(data.get("rotation"), base.rotation, -180, 180),
        position=position if position in {key for key, _ in POSITIONS} else base.position,
        margin_percent=clamp_float(data.get("margin_percent"), base.margin_percent, 0, 20),
        quality=clamp_int(data.get("quality"), base.quality, 70, 100),
        suffix=sanitize_suffix(str(data.get("suffix", base.suffix))) or base.suffix,
        output_dir=str(data.get("output_dir", "") or ""),
        logo_path=str(data.get("logo_path", "") or ""),
    )


def load_settings() -> MarkSettings:
    path = settings_file()
    try:
        return coerce_settings(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError, UnicodeError):
        return MarkSettings()


def save_settings(settings: MarkSettings) -> None:
    path = settings_file()
    payload = json.dumps(asdict(settings), ensure_ascii=False, indent=2)
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(payload, encoding="utf-8")
    os.replace(temporary, path)


def friendly_error(exc: BaseException) -> str:
    if isinstance(exc, UnidentifiedImageError):
        return "arquivo corrompido ou formato não reconhecido"
    if isinstance(exc, PermissionError):
        return "sem permissão de leitura ou gravação"
    if isinstance(exc, FileNotFoundError):
        return "arquivo não encontrado"
    if isinstance(exc, Image.DecompressionBombError):
        return "imagem grande demais ou possivelmente maliciosa"
    if isinstance(exc, OSError):
        detail = exc.strerror or str(exc)
        return f"erro de arquivo ({detail})"
    text = str(exc).strip()
    return text or exc.__class__.__name__


def windows_fonts_dir() -> Path:
    windir = os.environ.get("WINDIR", r"C:\Windows")
    return Path(windir) / "Fonts"


_FONT_CACHE: list[tuple[str, str]] | None = None


def discover_fonts() -> list[tuple[str, str]]:
    global _FONT_CACHE
    if _FONT_CACHE is None:
        _FONT_CACHE = _scan_fonts()
    return _FONT_CACHE


def _scan_fonts() -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    seen: set[str] = set()
    folder = windows_fonts_dir()
    if folder.is_dir():
        for label, filename in CURATED_FONTS:
            path = folder / filename
            if path.is_file():
                found.append((label, str(path)))
                seen.add(str(path).lower())
        extras: list[tuple[str, str]] = []
        try:
            for path in folder.iterdir():
                if path.suffix.lower() in {".ttf", ".otf"} and str(path).lower() not in seen:
                    extras.append((path.stem, str(path)))
                    seen.add(str(path).lower())
        except OSError:
            extras = []
        extras.sort(key=lambda item: item[0].lower())
        found.extend(extras[:250])
    for label, filename in LINUX_FONTS:
        if Path(filename).is_file() and filename.lower() not in seen:
            found.append((label, filename))
            seen.add(filename.lower())
    return found


def load_font(font_path: str, size: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    size = max(8, min(2000, int(size)))
    candidates = []
    if font_path:
        candidates.append(font_path)
    candidates.extend(path for _, path in discover_fonts()[:8])
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            try:
                return ImageFont.truetype(candidate, size=size)
            except OSError:
                continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def render_text_stamp(
    text: str,
    font: ImageFont.ImageFont | ImageFont.FreeTypeFont,
    color: tuple[int, int, int],
) -> Image.Image:
    probe = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
    draw = ImageDraw.Draw(probe)
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=6)
    pad = 8
    width = max(1, bbox[2] - bbox[0] + pad * 2)
    height = max(1, bbox[3] - bbox[1] + pad * 2)
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.multiline_text(
        (pad - bbox[0], pad - bbox[1]),
        text,
        font=font,
        fill=color + (255,),
        spacing=6,
    )
    return image


def render_text_fitted(
    text: str,
    font_path: str,
    target_width: int,
    color: tuple[int, int, int],
) -> Image.Image:
    target_width = max(8, int(target_width))
    probe_font = load_font(font_path, 100)
    probe = render_text_stamp(text, probe_font, color)
    if probe.width <= 0:
        return probe
    size = max(8, min(2000, int(100 * target_width / probe.width)))
    font = load_font(font_path, size)
    stamp = render_text_stamp(text, font, color)
    probe.close()
    if stamp.width > 0 and abs(stamp.width - target_width) > 2:
        new_height = max(1, int(stamp.height * target_width / stamp.width))
        resized = stamp.resize((target_width, new_height), Image.Resampling.LANCZOS)
        stamp.close()
        stamp = resized
    return stamp


def resize_width(image: Image.Image, width: int) -> Image.Image:
    width = max(1, int(width))
    if image.width == width:
        return image.copy()
    height = max(1, round(image.height * width / max(1, image.width)))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def apply_opacity(image: Image.Image, factor: float) -> Image.Image:
    factor = max(0.0, min(1.0, factor))
    rgba = image.convert("RGBA")
    if factor >= 0.999:
        if rgba is not image:
            return rgba
        return image.copy()
    red, green, blue, alpha = rgba.split()
    alpha = alpha.point(lambda value: int(value * factor))
    return Image.merge("RGBA", (red, green, blue, alpha))


def build_stamp(
    image_size: tuple[int, int],
    settings: MarkSettings,
    logo: Image.Image | None,
) -> Image.Image:
    width, _height = image_size
    if settings.mode == "image":
        if logo is None:
            raise ValueError("escolha um arquivo PNG para a marca")
        target = max(1, int(width * settings.size_percent / 100))
        stamp = resize_width(logo.convert("RGBA"), target)
    else:
        text = settings.text.replace("\r\n", "\n").strip()[:500]
        if not text:
            raise ValueError("digite o texto da marca")
        target = int(width * settings.size_percent / 100 * settings.font_scale / 100)
        target = max(8, min(target, max(8, width * 2)))
        stamp = render_text_fitted(text, settings.font_path, target, parse_hex(settings.color))
    faded = apply_opacity(stamp, settings.opacity / 100)
    if faded is not stamp:
        stamp.close()
    if abs(settings.rotation) % 360 > 0.05:
        # Pillow gira no sentido anti-horário; o controle é horário, como no canvas.
        rotated = faded.rotate(-settings.rotation, expand=True, resample=Image.Resampling.BICUBIC)
        faded.close()
        return rotated
    return faded


def position_xy(
    base_size: tuple[int, int],
    stamp_size: tuple[int, int],
    settings: MarkSettings,
) -> tuple[int, int]:
    base_w, base_h = base_size
    stamp_w, stamp_h = stamp_size
    margin = int(min(base_w, base_h) * settings.margin_percent / 100)
    key = settings.position
    if key == "top-left":
        x, y = margin, margin
    elif key == "top-right":
        x, y = base_w - stamp_w - margin, margin
    elif key == "bottom-left":
        x, y = margin, base_h - stamp_h - margin
    elif key == "bottom-right":
        x, y = base_w - stamp_w - margin, base_h - stamp_h - margin
    else:
        x, y = (base_w - stamp_w) // 2, (base_h - stamp_h) // 2
    if stamp_w < base_w:
        x = max(0, min(int(x), base_w - stamp_w))
    else:
        x = (base_w - stamp_w) // 2
    if stamp_h < base_h:
        y = max(0, min(int(y), base_h - stamp_h))
    else:
        y = (base_h - stamp_h) // 2
    return int(x), int(y)


def paste_stamp(base: Image.Image, stamp: Image.Image, settings: MarkSettings) -> Image.Image:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    if settings.position == "tile":
        stamp_w, stamp_h = stamp.size
        step_x = max(1, stamp_w + max(8, int(stamp_w * 0.42)))
        step_y = max(1, stamp_h + max(8, int(stamp_h * 0.5)))
        y = -stamp_h
        while y < base.height + stamp_h:
            x = -stamp_w
            while x < base.width + stamp_w:
                layer.paste(stamp, (x, y), stamp)
                x += step_x
            y += step_y
    else:
        layer.paste(stamp, position_xy(base.size, stamp.size, settings), stamp)
    try:
        return Image.alpha_composite(base, layer)
    finally:
        layer.close()


def apply_mark(
    src: Image.Image,
    settings: MarkSettings,
    logo: Image.Image | None,
) -> Image.Image:
    base = src.convert("RGBA")
    stamp = build_stamp(base.size, settings, logo)
    try:
        out = paste_stamp(base, stamp, settings)
    finally:
        stamp.close()
    if base is not src and base is not out:
        base.close()
    return out


def flatten_rgb(image: Image.Image) -> Image.Image:
    if image.mode == "RGB":
        return image.copy()
    if image.mode != "RGBA":
        return image.convert("RGB")
    background = Image.new("RGB", image.size, (255, 255, 255))
    background.paste(image, mask=image.getchannel("A"))
    return background


def save_image(
    image: Image.Image,
    dest: Path,
    icc: bytes | None,
    dpi: object,
    quality: int,
) -> None:
    quality = max(70, min(100, int(quality)))
    ext = dest.suffix.lower()
    dest.parent.mkdir(parents=True, exist_ok=True)
    temporary = dest.with_name(dest.name + ".part")
    try:
        if ext in {".jpg", ".jpeg"}:
            flat = flatten_rgb(image)
            kwargs: dict[str, object] = {
                "format": "JPEG",
                "quality": quality,
                "subsampling": 0,
                "optimize": True,
            }
            if icc:
                kwargs["icc_profile"] = icc
            if isinstance(dpi, tuple):
                kwargs["dpi"] = dpi
            flat.save(temporary, **kwargs)
            flat.close()
        elif ext == ".png":
            kwargs = {"format": "PNG", "optimize": True}
            if icc:
                kwargs["icc_profile"] = icc
            if isinstance(dpi, tuple):
                kwargs["dpi"] = dpi
            image.save(temporary, **kwargs)
        elif ext == ".webp":
            kwargs = {"format": "WEBP", "quality": quality, "method": 6}
            if icc:
                kwargs["icc_profile"] = icc
            image.save(temporary, **kwargs)
        elif ext == ".bmp":
            flat = flatten_rgb(image)
            flat.save(temporary, format="BMP")
            flat.close()
        else:
            raise ValueError("formato de saída não suportado")
        os.replace(temporary, dest)
    except Exception:
        try:
            if temporary.exists():
                temporary.unlink()
        except OSError:
            pass
        raise


def destination_for(src: Path, folder: Path, suffix: str) -> Path:
    suffix = sanitize_suffix(suffix)
    folder_resolved = folder.resolve()
    number = 0
    while number < 5000:
        extra = "" if number == 0 else f" ({number})"
        candidate = folder / f"{src.stem}{suffix}{extra}{src.suffix}"
        try:
            parent = candidate.parent.resolve()
            same = candidate.resolve() == src.resolve()
        except OSError:
            parent = candidate.parent
            same = False
        if parent != folder_resolved:
            raise OSError("nome de saída inválido")
        if not same and not candidate.exists():
            return candidate
        number += 1
    raise OSError("muitos arquivos com o mesmo nome na pasta de saída")


def ensure_writable(folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    probe = folder / ".velatura_write_test"
    probe.write_text("ok", encoding="utf-8")
    probe.unlink()


def process_one(
    src: Path,
    folder: Path,
    settings: MarkSettings,
    logo: Image.Image | None,
) -> Path:
    if src.suffix.lower() not in SUPPORTED:
        raise ValueError("formato não suportado")
    dest = destination_for(src, folder, settings.suffix)
    with Image.open(src) as raw:
        raw.load()
        icc = raw.info.get("icc_profile")
        dpi = raw.info.get("dpi")
        oriented = ImageOps.exif_transpose(raw) or raw
        try:
            marked = apply_mark(oriented, settings, logo)
            try:
                save_image(
                    marked,
                    dest,
                    icc if isinstance(icc, bytes) else None,
                    dpi,
                    settings.quality,
                )
            finally:
                marked.close()
        finally:
            if oriented is not raw:
                oriented.close()
    return dest


def render_preview(
    path: Path,
    settings: MarkSettings,
    logo: Image.Image | None,
    max_edge: int = 900,
) -> Image.Image:
    with Image.open(path) as raw:
        raw.load()
        oriented = ImageOps.exif_transpose(raw) or raw
        copy = oriented.copy()
        if oriented is not raw:
            oriented.close()
    copy.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    marked = apply_mark(copy, settings, logo)
    copy.close()
    flat = flatten_rgb(marked)
    marked.close()
    return flat


def human_size(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.0f} KB"
    return f"{size / 1024 / 1024:.1f} MB"


def parse_drop_paths(data: str) -> list[Path]:
    tokens: list[str] = []
    current: list[str] = []
    in_brace = False
    for char in data or "":
        if char == "{":
            in_brace = True
            current = []
        elif char == "}" and in_brace:
            in_brace = False
            tokens.append("".join(current))
            current = []
        elif char == " " and not in_brace:
            if current:
                tokens.append("".join(current))
                current = []
        else:
            current.append(char)
    if current:
        tokens.append("".join(current))
    paths: list[Path] = []
    for token in tokens:
        token = token.strip().strip('"')
        if not token:
            continue
        if token.lower().startswith("file:"):
            parsed = urlparse(token)
            path = unquote(parsed.path)
            if re.match(r"^/[A-Za-z]:", path):
                path = path[1:]
            paths.append(Path(path))
        else:
            paths.append(Path(token))
    return paths


def iter_supported(path: Path) -> list[Path]:
    found: list[Path] = []
    if path.is_file():
        if path.suffix.lower() in SUPPORTED:
            found.append(path)
        return found
    if path.is_dir():
        try:
            for child in path.rglob("*"):
                if child.is_file() and child.suffix.lower() in SUPPORTED:
                    found.append(child)
        except (PermissionError, OSError):
            return found
    return found


def main() -> None:
    if sys.platform == "win32":
        try:
            import ctypes

            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            try:
                import ctypes

                ctypes.windll.user32.SetProcessDPIAware()
            except Exception:
                pass

    try:
        import customtkinter as ctk
    except Exception as exc:  # tkinter ausente ou pacote não instalado
        sys.stderr.write(
            "Não foi possível carregar a interface (customtkinter/tkinter).\n"
            "Instale com: pip install -r requirements.txt\n"
            "No instalador do Python, mantenha a opção tcl/tk marcada.\n"
            f"Detalhe: {exc}\n"
        )
        raise SystemExit(1) from exc

    try:
        from tkinterdnd2 import DND_FILES, TkinterDnD
    except Exception:
        DND_FILES = None  # type: ignore[assignment]
        TkinterDnD = None  # type: ignore[assignment]

    from tkinter import colorchooser, filedialog, messagebox

    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")

    bases: tuple[type, ...]
    if TkinterDnD is not None:
        bases = (ctk.CTk, TkinterDnD.DnDWrapper)
    else:
        bases = (ctk.CTk,)

    class App(*bases):  # type: ignore[misc]
        def __init__(self) -> None:
            super().__init__()
            self.title("Velatura — marca d'água em lote")
            self.geometry("1180x800")
            self.minsize(1020, 700)
            self.configure(fg_color=COLOR["bg"])
            self.protocol("WM_DELETE_WINDOW", self.on_close)

            self.dnd_ready = False
            if TkinterDnD is not None and DND_FILES is not None:
                try:
                    self.TkdndVersion = TkinterDnD._require(self)
                    self.drop_target_register(DND_FILES)
                    self.dnd_bind("<<Drop>>", self.on_drop)
                    self.dnd_ready = True
                except Exception:
                    self.dnd_ready = False

            self.ui_ready = False
            self.processing = False
            self.files: list[Path] = []
            self.logo_image: Image.Image | None = None
            self.font_map: dict[str, str] = {}
            self.cancel_event = threading.Event()
            self.ui_queue: queue.Queue[tuple] = queue.Queue()
            self._stop = threading.Event()
            self._preview_wakeup = threading.Event()
            self._preview_lock = threading.Lock()
            self._preview_payload: dict | None = None
            self._token = 0
            self._preview_ref: object | None = None
            self._settings = load_settings()

            self.font_title = ctk.CTkFont(family="Segoe UI", size=26, weight="bold")
            self.font_body = ctk.CTkFont(family="Segoe UI", size=13)
            self.font_small = ctk.CTkFont(family="Segoe UI", size=12)
            self.font_button = ctk.CTkFont(family="Segoe UI", size=13, weight="bold")

            self._build()
            self._apply_loaded_settings()
            self.ui_ready = True
            threading.Thread(target=self._preview_loop, name="velatura-preview", daemon=True).start()
            self.after(60, self._poll)
            self.request_preview()

        def _build(self) -> None:
            self.grid_columnconfigure(0, weight=1)
            self.grid_rowconfigure(1, weight=1)

            header = ctk.CTkFrame(self, fg_color=COLOR["bg"])
            header.grid(row=0, column=0, sticky="ew", padx=20, pady=(16, 6))
            ctk.CTkLabel(
                header,
                text="Velatura",
                font=self.font_title,
                text_color=COLOR["text"],
                anchor="w",
            ).pack(anchor="w")
            ctk.CTkLabel(
                header,
                text="Marca d'água em lote. As fotos originais não são alteradas.",
                font=self.font_body,
                text_color=COLOR["muted"],
                anchor="w",
            ).pack(anchor="w")

            body = ctk.CTkFrame(self, fg_color=COLOR["bg"])
            body.grid(row=1, column=0, sticky="nsew", padx=20, pady=6)
            body.grid_columnconfigure(0, weight=0, minsize=380)
            body.grid_columnconfigure(1, weight=1)
            body.grid_rowconfigure(0, weight=1)

            self._build_files(body)
            self._build_controls(body)
            self._build_footer()

        def _panel(self, master: object) -> ctk.CTkFrame:
            return ctk.CTkFrame(
                master,
                fg_color=COLOR["surface"],
                corner_radius=18,
                border_width=1,
                border_color=COLOR["line"],
            )

        def _build_files(self, body: ctk.CTkFrame) -> None:
            panel = self._panel(body)
            panel.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
            panel.grid_rowconfigure(3, weight=1)
            panel.grid_columnconfigure(0, weight=1)

            ctk.CTkLabel(
                panel, text="Fotos", font=self.font_button, text_color=COLOR["text"], anchor="w"
            ).grid(row=0, column=0, sticky="ew", padx=16, pady=(14, 6))

            drop = ctk.CTkFrame(panel, fg_color=COLOR["raised"], corner_radius=12)
            drop.grid(row=1, column=0, sticky="ew", padx=16, pady=4)
            hint = (
                "Solte fotos ou pastas aqui"
                if self.dnd_ready
                else "Arrastar indisponível — use os botões abaixo"
            )
            ctk.CTkLabel(
                drop,
                text=hint,
                font=self.font_body,
                text_color=COLOR["muted"],
                wraplength=320,
            ).pack(padx=12, pady=18)

            buttons = ctk.CTkFrame(panel, fg_color="transparent")
            buttons.grid(row=2, column=0, sticky="ew", padx=16, pady=8)
            buttons.grid_columnconfigure((0, 1), weight=1)
            self._button(buttons, "Adicionar arquivos", self.add_files, primary=True).grid(
                row=0, column=0, sticky="ew", padx=(0, 4)
            )
            self._button(buttons, "Adicionar pasta", self.add_folder, primary=False).grid(
                row=0, column=1, sticky="ew", padx=(4, 0)
            )

            self.list_scroll = ctk.CTkScrollableFrame(
                panel,
                fg_color=COLOR["raised"],
                corner_radius=12,
            )
            self.list_scroll.grid(row=3, column=0, sticky="nsew", padx=16, pady=(0, 8))
            self.list_inner = ctk.CTkFrame(self.list_scroll, fg_color="transparent")
            self.list_inner.pack(fill="both", expand=True)

            foot = ctk.CTkFrame(panel, fg_color="transparent")
            foot.grid(row=4, column=0, sticky="ew", padx=16, pady=(0, 14))
            self.count_label = ctk.CTkLabel(
                foot, text="0 fotos", font=self.font_small, text_color=COLOR["muted"]
            )
            self.count_label.pack(side="left")
            self._button(foot, "Limpar", self.clear_files, primary=False, width=90).pack(side="right")
            self.refresh_list()

        def _build_controls(self, body: ctk.CTkFrame) -> None:
            panel = self._panel(body)
            panel.grid(row=0, column=1, sticky="nsew")
            panel.grid_rowconfigure(0, weight=1)
            panel.grid_columnconfigure(0, weight=1)

            scroll = ctk.CTkScrollableFrame(panel, fg_color="transparent")
            scroll.grid(row=0, column=0, sticky="nsew", padx=8, pady=8)
            scroll.grid_columnconfigure(0, weight=1)

            self.preview_frame = ctk.CTkFrame(scroll, fg_color=COLOR["raised"], corner_radius=12)
            self.preview_frame.grid(row=0, column=0, sticky="ew", pady=(4, 10))
            self.preview_label = ctk.CTkLabel(
                self.preview_frame,
                text="A pré-visualização da primeira foto aparece aqui.",
                font=self.font_body,
                text_color=COLOR["muted"],
                wraplength=460,
                height=280,
            )
            self.preview_label.pack(fill="both", expand=True, padx=10, pady=10)
            self.preview_caption = ctk.CTkLabel(
                scroll, text="", font=self.font_small, text_color=COLOR["muted"], anchor="w"
            )
            self.preview_caption.grid(row=1, column=0, sticky="ew", pady=(0, 8))

            mode_row = ctk.CTkFrame(scroll, fg_color="transparent")
            mode_row.grid(row=2, column=0, sticky="ew", pady=(4, 8))
            mode_row.grid_columnconfigure((0, 1), weight=1)
            self.mode_text_btn = self._button(mode_row, "Texto", lambda: self.set_mode("text"), primary=True)
            self.mode_image_btn = self._button(
                mode_row, "Logo PNG", lambda: self.set_mode("image"), primary=False
            )
            self.mode_text_btn.grid(row=0, column=0, sticky="ew", padx=(0, 4))
            self.mode_image_btn.grid(row=0, column=1, sticky="ew", padx=(4, 0))

            self.text_box = ctk.CTkTextbox(
                scroll,
                height=72,
                fg_color=COLOR["raised"],
                text_color=COLOR["text"],
                border_color=COLOR["line"],
                border_width=1,
                corner_radius=12,
                font=self.font_body,
            )
            self.text_box.grid(row=3, column=0, sticky="ew", pady=4)
            self.text_box.bind("<KeyRelease>", lambda _event: self.request_preview())

            font_row = ctk.CTkFrame(scroll, fg_color="transparent")
            font_row.grid(row=4, column=0, sticky="ew", pady=4)
            font_row.grid_columnconfigure(0, weight=1)
            self.font_labels, self.font_map = self._font_choices()
            self.font_combo = ctk.CTkComboBox(
                font_row,
                values=self.font_labels or ["Padrão"],
                command=lambda _value: self.request_preview(),
                fg_color=COLOR["raised"],
                button_color=COLOR["line"],
                button_hover_color=COLOR["muted"],
                border_color=COLOR["line"],
                text_color=COLOR["text"],
                dropdown_fg_color=COLOR["surface"],
                dropdown_text_color=COLOR["text"],
                font=self.font_body,
                height=36,
            )
            self.font_combo.grid(row=0, column=0, sticky="ew", padx=(0, 6))
            self._button(font_row, "Outra fonte", self.pick_font, primary=False, width=120).grid(
                row=0, column=1
            )

            color_row = ctk.CTkFrame(scroll, fg_color="transparent")
            color_row.grid(row=5, column=0, sticky="ew", pady=4)
            color_row.grid_columnconfigure(0, weight=1)
            self.color_entry = ctk.CTkEntry(
                color_row,
                fg_color=COLOR["raised"],
                border_color=COLOR["line"],
                text_color=COLOR["text"],
                font=self.font_body,
                height=36,
            )
            self.color_entry.grid(row=0, column=0, sticky="ew", padx=(0, 6))
            self.color_entry.bind("<KeyRelease>", lambda _event: self.request_preview())
            self._button(color_row, "Cor", self.pick_color, primary=False, width=90).grid(row=0, column=1)
            self.color_swatch = ctk.CTkLabel(color_row, text="    ", width=36, height=36, corner_radius=8)
            self.color_swatch.grid(row=0, column=2, padx=(6, 0))

            self.logo_frame = ctk.CTkFrame(scroll, fg_color="transparent")
            self.logo_frame.grid(row=6, column=0, sticky="ew", pady=4)
            self.logo_frame.grid_columnconfigure(0, weight=1)
            self.logo_label = ctk.CTkLabel(
                self.logo_frame,
                text="Nenhum PNG selecionado",
                font=self.font_small,
                text_color=COLOR["muted"],
                anchor="w",
            )
            self.logo_label.grid(row=0, column=0, sticky="ew", padx=(0, 6))
            self._button(self.logo_frame, "Escolher PNG", self.pick_logo, primary=False, width=140).grid(
                row=0, column=1
            )

            self.size_caption = ctk.CTkLabel(
                scroll, text="", font=self.font_small, text_color=COLOR["muted"], anchor="w", wraplength=520
            )
            self.size_caption.grid(row=7, column=0, sticky="ew", pady=(8, 0))
            self.size_value = ctk.StringVar(value="36%")
            self.size_slider = self._slider(scroll, 8, "Tamanho (% da imagem)", self.size_value, 5, 90, 36)

            self.font_scale_value = ctk.StringVar(value="100%")
            self.font_scale_slider = self._slider(
                scroll,
                9,
                "Tamanho da fonte",
                self.font_scale_value,
                50,
                200,
                100,
                block_name="font_scale_block",
            )

            self.opacity_value = ctk.StringVar(value="62%")
            self.opacity_slider = self._slider(scroll, 10, "Opacidade", self.opacity_value, 0, 100, 62)

            self.rotation_value = ctk.StringVar(value="0°")
            self.rotation_slider = self._slider(
                scroll, 11, "Rotação (horário)", self.rotation_value, -180, 180, 0
            )

            self.margin_value = ctk.StringVar(value="4%")
            self.margin_slider = self._slider(scroll, 12, "Margem", self.margin_value, 0, 20, 4)

            ctk.CTkLabel(
                scroll, text="Posição", font=self.font_small, text_color=COLOR["muted"], anchor="w"
            ).grid(row=13, column=0, sticky="ew", pady=(10, 4))
            pos = ctk.CTkFrame(scroll, fg_color="transparent")
            pos.grid(row=14, column=0, sticky="ew")
            for index in range(3):
                pos.grid_columnconfigure(index, weight=1)
            self.position_buttons: dict[str, ctk.CTkButton] = {}
            for index, (key, label) in enumerate(POSITIONS):
                button = self._button(
                    pos,
                    label,
                    lambda key=key: self.set_position(key),
                    primary=False,
                )
                button.grid(row=index // 3, column=index % 3, sticky="ew", padx=3, pady=3)
                self.position_buttons[key] = button

            self.quality_value = ctk.StringVar(value="92")
            self.quality_slider = self._slider(
                scroll, 15, "Qualidade JPEG/WEBP", self.quality_value, 70, 100, 92
            )

            suffix_row = ctk.CTkFrame(scroll, fg_color="transparent")
            suffix_row.grid(row=16, column=0, sticky="ew", pady=(10, 4))
            suffix_row.grid_columnconfigure(1, weight=1)
            ctk.CTkLabel(
                suffix_row, text="Sufixo do arquivo", font=self.font_small, text_color=COLOR["muted"]
            ).grid(row=0, column=0, padx=(0, 8))
            self.suffix_entry = ctk.CTkEntry(
                suffix_row,
                fg_color=COLOR["raised"],
                border_color=COLOR["line"],
                text_color=COLOR["text"],
                font=self.font_body,
                height=36,
            )
            self.suffix_entry.grid(row=0, column=1, sticky="ew")

            out_row = ctk.CTkFrame(scroll, fg_color="transparent")
            out_row.grid(row=17, column=0, sticky="ew", pady=(8, 12))
            out_row.grid_columnconfigure(0, weight=1)
            self.output_label = ctk.CTkLabel(
                out_row,
                text="Nenhuma pasta de saída",
                font=self.font_small,
                text_color=COLOR["muted"],
                anchor="w",
                wraplength=420,
                justify="left",
            )
            self.output_label.grid(row=0, column=0, sticky="ew", padx=(0, 8))
            self._button(out_row, "Escolher pasta", self.pick_output, primary=True, width=150).grid(
                row=0, column=1
            )

        def _slider(
            self,
            master: ctk.CTkScrollableFrame,
            row: int,
            label: str,
            variable: ctk.StringVar,
            start: int,
            end: int,
            initial: int,
            block_name: str | None = None,
        ) -> ctk.CTkSlider:
            block = ctk.CTkFrame(master, fg_color="transparent")
            block.grid(row=row, column=0, sticky="ew", pady=(8, 0))
            block.grid_columnconfigure(0, weight=1)
            ctk.CTkLabel(
                block, text=label, font=self.font_small, text_color=COLOR["text"], anchor="w"
            ).grid(row=0, column=0, sticky="w")
            ctk.CTkLabel(
                block, textvariable=variable, font=self.font_small, text_color=COLOR["muted"]
            ).grid(row=0, column=1, sticky="e")
            steps = max(1, end - start)
            slider = ctk.CTkSlider(
                block,
                from_=start,
                to=end,
                number_of_steps=steps,
                command=lambda value, var=variable, kind=label: self._on_slider(value, var, kind),
                fg_color=COLOR["raised"],
                progress_color=COLOR["accent"],
                button_color=COLOR["accent"],
                button_hover_color=COLOR["accent_hover"],
                height=18,
            )
            slider.set(initial)
            slider.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(2, 0))
            if block_name:
                setattr(self, block_name, block)
            return slider

        def _button(
            self,
            master: object,
            text: str,
            command: object,
            primary: bool,
            width: int = 140,
        ) -> ctk.CTkButton:
            if primary:
                return ctk.CTkButton(
                    master,
                    text=text,
                    command=command,
                    width=width,
                    height=36,
                    corner_radius=10,
                    font=self.font_button,
                    fg_color=COLOR["accent"],
                    hover_color=COLOR["accent_hover"],
                    text_color=COLOR["ink"],
                )
            return ctk.CTkButton(
                master,
                text=text,
                command=command,
                width=width,
                height=36,
                corner_radius=10,
                font=self.font_body,
                fg_color=COLOR["raised"],
                hover_color=COLOR["line"],
                text_color=COLOR["text"],
                border_width=1,
                border_color=COLOR["line"],
            )

        def _build_footer(self) -> None:
            footer = ctk.CTkFrame(self, fg_color=COLOR["bg"])
            footer.grid(row=2, column=0, sticky="ew", padx=20, pady=(4, 16))
            footer.grid_columnconfigure(0, weight=1)
            self.status_label = ctk.CTkLabel(
                footer,
                text="Pronto.",
                font=self.font_small,
                text_color=COLOR["muted"],
                anchor="w",
            )
            self.status_label.grid(row=0, column=0, sticky="ew")
            self.progress = ctk.CTkProgressBar(
                footer,
                fg_color=COLOR["raised"],
                progress_color=COLOR["accent"],
                height=10,
                corner_radius=6,
            )
            self.progress.grid(row=1, column=0, sticky="ew", pady=(6, 8))
            self.progress.set(0)
            actions = ctk.CTkFrame(footer, fg_color="transparent")
            actions.grid(row=1, column=1, rowspan=2, padx=(12, 0))
            self.cancel_button = self._button(actions, "Cancelar", self.cancel_processing, primary=False, width=120)
            self.cancel_button.pack(side="left", padx=(0, 8))
            self.cancel_button.configure(state="disabled")
            self.run_button = self._button(actions, "Aplicar marca", self.start_processing, primary=True, width=160)
            self.run_button.pack(side="left")

        def _font_choices(self) -> tuple[list[str], dict[str, str]]:
            mapping: dict[str, str] = {}
            labels: list[str] = []
            for label, path in discover_fonts():
                name = label
                suffix = 2
                while name in mapping:
                    name = f"{label} ({suffix})"
                    suffix += 1
                mapping[name] = path
                labels.append(name)
            if not labels:
                labels = ["Padrão"]
                mapping["Padrão"] = ""
            return labels, mapping

        def _apply_loaded_settings(self) -> None:
            settings = self._settings
            self.text_box.insert("1.0", settings.text)
            self.color_entry.insert(0, settings.color)
            self._paint_swatch(settings.color)
            self.suffix_entry.insert(0, settings.suffix)
            self.size_slider.set(settings.size_percent)
            self.font_scale_slider.set(settings.font_scale)
            self.opacity_slider.set(settings.opacity)
            self.rotation_slider.set(settings.rotation)
            self.margin_slider.set(settings.margin_percent)
            self.quality_slider.set(settings.quality)
            self._sync_slider_labels()
            self.set_position(settings.position)
            self.set_mode(settings.mode)
            self._select_font(settings.font_path)
            if settings.output_dir and Path(settings.output_dir).is_dir():
                self.output_label.configure(text=settings.output_dir, text_color=COLOR["text"])
            if settings.logo_path and Path(settings.logo_path).is_file():
                self._load_logo(Path(settings.logo_path), warn=False)

        def _select_font(self, font_path: str) -> None:
            if font_path and Path(font_path).is_file():
                for label, path in self.font_map.items():
                    if path.lower() == font_path.lower():
                        self.font_combo.set(label)
                        return
                label = Path(font_path).stem
                base = label
                index = 2
                while label in self.font_map and self.font_map[label].lower() != font_path.lower():
                    label = f"{base} ({index})"
                    index += 1
                self.font_map[label] = font_path
                values = list(self.font_combo.cget("values"))
                if label not in values:
                    values.append(label)
                    self.font_combo.configure(values=values)
                self.font_combo.set(label)
                return
            self.font_combo.set(self.font_labels[0] if self.font_labels else "Padrão")

        def _sync_slider_labels(self) -> None:
            self.size_value.set(f"{int(round(self.size_slider.get()))}%")
            self.font_scale_value.set(f"{int(round(self.font_scale_slider.get()))}%")
            self.opacity_value.set(f"{int(round(self.opacity_slider.get()))}%")
            self.rotation_value.set(f"{int(round(self.rotation_slider.get()))}°")
            self.margin_value.set(f"{int(round(self.margin_slider.get()))}%")
            self.quality_value.set(str(int(round(self.quality_slider.get()))))

        def _on_slider(self, value: float, variable: ctk.StringVar, kind: str) -> None:
            number = int(round(float(value)))
            if "Rotação" in kind:
                variable.set(f"{number}°")
            elif "Qualidade" in kind:
                variable.set(str(number))
            else:
                variable.set(f"{number}%")
            self.request_preview()

        def set_status(self, text: str) -> None:
            self.status_label.configure(text=text)

        def current_font_path(self) -> str:
            label = self.font_combo.get()
            return self.font_map.get(label, "")

        def collect_settings(self) -> MarkSettings:
            text = self.text_box.get("1.0", "end").strip()
            return coerce_settings(
                {
                    "mode": self._settings.mode,
                    "text": text,
                    "font_path": self.current_font_path(),
                    "color": self.color_entry.get().strip() or "#FFFFFF",
                    "font_scale": self.font_scale_slider.get(),
                    "opacity": self.opacity_slider.get(),
                    "size_percent": self.size_slider.get(),
                    "rotation": self.rotation_slider.get(),
                    "position": self._settings.position,
                    "margin_percent": self.margin_slider.get(),
                    "quality": self.quality_slider.get(),
                    "suffix": self.suffix_entry.get(),
                    "output_dir": self._settings.output_dir,
                    "logo_path": self._settings.logo_path,
                }
            )

        def set_mode(self, mode: str) -> None:
            self._settings.mode = "image" if mode == "image" else "text"
            text_mode = self._settings.mode == "text"
            self._style_mode_button(self.mode_text_btn, text_mode)
            self._style_mode_button(self.mode_image_btn, not text_mode)
            if text_mode:
                self.text_box.grid()
                self.font_combo.master.grid()
                self.color_entry.master.grid()
                self.font_scale_block.grid()
                self.logo_frame.grid_remove()
                self.size_caption.configure(
                    text="Largura do texto em relação à foto. O tamanho da fonte multiplica esse valor."
                )
            else:
                self.text_box.grid_remove()
                self.font_combo.master.grid_remove()
                self.color_entry.master.grid_remove()
                self.font_scale_block.grid_remove()
                self.logo_frame.grid()
                self.size_caption.configure(text="Largura do logo em relação à largura da foto.")
            self.request_preview()

        def _style_mode_button(self, button: ctk.CTkButton, active: bool) -> None:
            if active:
                button.configure(
                    fg_color=COLOR["accent"],
                    hover_color=COLOR["accent_hover"],
                    text_color=COLOR["ink"],
                    border_width=0,
                )
            else:
                button.configure(
                    fg_color=COLOR["raised"],
                    hover_color=COLOR["line"],
                    text_color=COLOR["text"],
                    border_width=1,
                    border_color=COLOR["line"],
                )

        def set_position(self, key: str) -> None:
            if key not in {item[0] for item in POSITIONS}:
                key = "bottom-right"
            self._settings.position = key
            for name, button in self.position_buttons.items():
                self._style_mode_button(button, name == key)
            self.request_preview()

        def _paint_swatch(self, color: str) -> None:
            red, green, blue = parse_hex(color)
            self.color_swatch.configure(fg_color=f"#{red:02x}{green:02x}{blue:02x}")

        def pick_color(self) -> None:
            _rgb, hex_color = colorchooser.askcolor(color=self.color_entry.get() or "#FFFFFF", parent=self)
            if not hex_color:
                return
            self.color_entry.delete(0, "end")
            self.color_entry.insert(0, hex_color.upper())
            self._paint_swatch(hex_color)
            self.request_preview()

        def pick_font(self) -> None:
            chosen = filedialog.askopenfilename(
                parent=self,
                title="Escolher fonte",
                filetypes=[("Fontes", "*.ttf *.otf *.ttc"), ("Todos os arquivos", "*.*")],
            )
            if not chosen:
                return
            self._select_font(chosen)
            self.request_preview()

        def pick_logo(self) -> None:
            chosen = filedialog.askopenfilename(
                parent=self,
                title="Escolher logo PNG",
                filetypes=[("PNG", "*.png")],
            )
            if not chosen:
                return
            self._load_logo(Path(chosen), warn=True)

        def _load_logo(self, path: Path, warn: bool) -> None:
            try:
                with Image.open(path) as image:
                    image.load()
                    if (image.format or "").upper() != "PNG":
                        raise ValueError("use um arquivo PNG")
                    converted = image.convert("RGBA")
            except Exception as exc:
                if warn:
                    messagebox.showerror("Logo", f"Não foi possível abrir o PNG.\n{friendly_error(exc)}", parent=self)
                self.logo_label.configure(text="PNG inválido ou inacessível", text_color=COLOR["danger"])
                return
            if self.logo_image is not None:
                self.logo_image.close()
            self.logo_image = converted
            self._settings.logo_path = str(path)
            self.logo_label.configure(
                text=f"{path.name}  ·  {converted.width}×{converted.height}",
                text_color=COLOR["text"],
            )
            self.request_preview()

        def pick_output(self) -> None:
            initial = self._settings.output_dir if Path(self._settings.output_dir).is_dir() else str(Path.home())
            chosen = filedialog.askdirectory(parent=self, title="Pasta de saída", initialdir=initial)
            if not chosen:
                return
            self._settings.output_dir = chosen
            self.output_label.configure(text=chosen, text_color=COLOR["text"])
            self.persist()

        def add_files(self) -> None:
            chosen = filedialog.askopenfilenames(
                parent=self,
                title="Adicionar fotos",
                filetypes=[
                    ("Imagens", "*.jpg *.jpeg *.png *.webp *.bmp"),
                    ("Todos os arquivos", "*.*"),
                ],
            )
            if chosen:
                self.ingest([Path(item) for item in chosen])

        def add_folder(self) -> None:
            chosen = filedialog.askdirectory(parent=self, title="Adicionar pasta")
            if chosen:
                self.ingest([Path(chosen)])

        def on_drop(self, event: object) -> None:
            data = getattr(event, "data", "") or ""
            self.ingest(parse_drop_paths(str(data)))

        def ingest(self, paths: list[Path]) -> None:
            if self.processing:
                self.set_status("Espere o lote atual terminar para adicionar arquivos.")
                return
            known = set()
            for path in self.files:
                try:
                    known.add(str(path.resolve()).lower())
                except OSError:
                    known.add(str(path).lower())
            added = 0
            skipped = 0
            for raw in paths:
                try:
                    candidates = iter_supported(raw)
                except (PermissionError, OSError):
                    skipped += 1
                    continue
                if not candidates:
                    skipped += 1
                    continue
                for candidate in candidates:
                    try:
                        key = str(candidate.resolve()).lower()
                    except OSError:
                        key = str(candidate).lower()
                    if key in known:
                        skipped += 1
                        continue
                    known.add(key)
                    self.files.append(candidate)
                    added += 1
            self.refresh_list()
            self.set_status(f"{added} adicionada(s), {skipped} ignorada(s).")
            self.request_preview()

        def remove_file(self, path: Path) -> None:
            if self.processing:
                return
            self.files = [item for item in self.files if item != path]
            self.refresh_list()
            self.request_preview()

        def clear_files(self) -> None:
            if self.processing:
                return
            self.files = []
            self.refresh_list()
            self.request_preview()

        def refresh_list(self) -> None:
            for child in self.list_inner.winfo_children():
                child.destroy()
            total = len(self.files)
            self.count_label.configure(text=f"{total} foto{'s' if total != 1 else ''}")
            if not self.files:
                ctk.CTkLabel(
                    self.list_inner,
                    text="Nenhuma foto na fila.",
                    font=self.font_small,
                    text_color=COLOR["muted"],
                    anchor="w",
                ).pack(anchor="w", padx=8, pady=8)
                return
            names = [path.name for path in self.files]
            for path in self.files:
                row = ctk.CTkFrame(self.list_inner, fg_color="transparent")
                row.pack(fill="x", pady=2)
                label = path.name if names.count(path.name) == 1 else f"{path.parent.name}/{path.name}"
                try:
                    size = human_size(path.stat().st_size)
                except OSError:
                    size = "—"
                ctk.CTkLabel(
                    row,
                    text=f"{label}   {size}",
                    font=self.font_small,
                    text_color=COLOR["text"],
                    anchor="w",
                ).pack(side="left", fill="x", expand=True, padx=(6, 4))
                ctk.CTkButton(
                    row,
                    text="Remover",
                    width=78,
                    height=28,
                    corner_radius=8,
                    font=self.font_small,
                    fg_color=COLOR["bg"],
                    hover_color=COLOR["line"],
                    text_color=COLOR["muted"],
                    command=lambda item=path: self.remove_file(item),
                ).pack(side="right", padx=4)

        def request_preview(self) -> None:
            if not self.ui_ready or self.processing:
                return
            self._paint_swatch(self.color_entry.get())
            logo = None
            if self.logo_image is not None:
                try:
                    logo = self.logo_image.copy()
                except Exception:
                    logo = None
            self._token += 1
            payload = {
                "token": self._token,
                "path": self.files[0] if self.files else None,
                "settings": self.collect_settings(),
                "logo": logo,
            }
            with self._preview_lock:
                old = self._preview_payload
                self._preview_payload = payload
            if old and old.get("logo") is not None:
                try:
                    old["logo"].close()
                except Exception:
                    pass
            self._preview_wakeup.set()

        def _preview_loop(self) -> None:
            while not self._stop.is_set():
                self._preview_wakeup.wait(0.4)
                self._preview_wakeup.clear()
                if self._stop.is_set():
                    break
                with self._preview_lock:
                    payload = self._preview_payload
                    self._preview_payload = None
                if not payload:
                    continue
                try:
                    path = payload["path"]
                    if path is None:
                        self.ui_queue.put(("preview_clear", payload["token"]))
                    else:
                        image = render_preview(path, payload["settings"], payload["logo"])
                        self.ui_queue.put(("preview", payload["token"], image, path.name))
                except Exception as exc:
                    self.ui_queue.put(("preview_error", payload["token"], friendly_error(exc)))
                finally:
                    logo = payload.get("logo")
                    if logo is not None:
                        try:
                            logo.close()
                        except Exception:
                            pass

        def _show_preview(self, token: int, image: Image.Image, name: str) -> None:
            if token != self._token:
                image.close()
                return
            max_w, max_h = 560, 320
            scale = min(max_w / image.width, max_h / image.height, 1)
            size = (max(1, int(image.width * scale)), max(1, int(image.height * scale)))
            preview = ctk.CTkImage(light_image=image, dark_image=image, size=size)
            self._preview_ref = (preview, image)
            self.preview_label.configure(image=preview, text="")
            self.preview_caption.configure(text=f"Prévia de {name}  ·  {image.width}×{image.height} px na miniatura")

        def _poll(self) -> None:
            try:
                while True:
                    message = self.ui_queue.get_nowait()
                    kind = message[0]
                    if kind == "preview":
                        self._show_preview(message[1], message[2], message[3])
                    elif kind == "preview_clear" and message[1] == self._token:
                        self._preview_ref = None
                        self.preview_label.configure(
                            image=None,
                            text="A pré-visualização da primeira foto aparece aqui.",
                        )
                        self.preview_caption.configure(text="")
                    elif kind == "preview_error" and message[1] == self._token:
                        self.preview_caption.configure(text=f"Prévia indisponível: {message[2]}")
                    elif kind == "progress":
                        done, total, name, error = message[1], message[2], message[3], message[4]
                        self.progress.set(0 if total == 0 else done / total)
                        if error:
                            self.set_status(f"{done} de {total} — {name} falhou: {error}")
                        else:
                            self.set_status(f"{done} de {total} — {name}")
                    elif kind == "done":
                        self._finish(message[1], message[2], message[3], message[4])
            except queue.Empty:
                pass
            if not self._stop.is_set():
                self.after(60, self._poll)

        def start_processing(self) -> None:
            if self.processing:
                return
            if not self.files:
                messagebox.showwarning("Fila vazia", "Adicione pelo menos uma foto.", parent=self)
                return
            settings = self.collect_settings()
            folder = Path(settings.output_dir) if settings.output_dir else None
            if folder is None or not str(settings.output_dir).strip():
                messagebox.showwarning(
                    "Pasta de saída",
                    "Escolha a pasta onde as cópias serão gravadas.\nOs originais não serão modificados.",
                    parent=self,
                )
                return
            if settings.mode == "text" and not settings.text.strip():
                messagebox.showwarning("Texto", "Digite o texto da marca d'água.", parent=self)
                return
            if settings.mode == "image" and (self.logo_image is None or not settings.logo_path):
                messagebox.showwarning("Logo", "Escolha um arquivo PNG para usar como marca.", parent=self)
                return
            try:
                ensure_writable(folder)
            except Exception as exc:
                messagebox.showerror(
                    "Pasta de saída",
                    f"Não foi possível gravar nessa pasta.\n{friendly_error(exc)}",
                    parent=self,
                )
                return
            logo_copy = None
            if settings.mode == "image" and self.logo_image is not None:
                logo_copy = self.logo_image.copy()
            self._settings = settings
            self.persist()
            self.processing = True
            self.cancel_event.clear()
            self.run_button.configure(state="disabled")
            self.cancel_button.configure(state="normal")
            self.progress.set(0)
            self.set_status("Processando…")
            files = list(self.files)
            threading.Thread(
                target=self._process_thread,
                args=(files, settings, folder, logo_copy),
                name="velatura-batch",
                daemon=True,
            ).start()

        def cancel_processing(self) -> None:
            if self.processing:
                self.cancel_event.set()
                self.set_status("Cancelando depois da foto atual…")

        def _process_thread(
            self,
            files: list[Path],
            settings: MarkSettings,
            folder: Path,
            logo: Image.Image | None,
        ) -> None:
            ok = 0
            errors: list[str] = []
            total = len(files)
            try:
                for index, path in enumerate(files, start=1):
                    if self.cancel_event.is_set():
                        break
                    error = None
                    try:
                        process_one(path, folder, settings, logo)
                        ok += 1
                    except Exception as exc:
                        error = friendly_error(exc)
                        errors.append(f"{path.name}: {error}")
                    self.ui_queue.put(("progress", index, total, path.name, error))
            except Exception as exc:
                errors.append(f"Falha geral: {friendly_error(exc)}")
            finally:
                if logo is not None:
                    try:
                        logo.close()
                    except Exception:
                        pass
            self.ui_queue.put(("done", ok, errors, self.cancel_event.is_set(), total))

        def _finish(self, ok: int, errors: list[str], cancelled: bool, total: int) -> None:
            self.processing = False
            self.run_button.configure(state="normal")
            self.cancel_button.configure(state="disabled")
            if not cancelled and not errors:
                self.progress.set(1)
            self.set_status(f"Concluído: {ok} salva(s), {len(errors)} falha(s).")
            self._show_summary(ok, errors, cancelled, total)
            self.request_preview()

        def _show_summary(self, ok: int, errors: list[str], cancelled: bool, total: int) -> None:
            window = ctk.CTkToplevel(self)
            window.title("Resultado")
            window.geometry("520x440")
            window.configure(fg_color=COLOR["bg"])
            window.transient(self)
            try:
                window.grab_set()
            except Exception:
                pass
            lines = [f"{ok} de {total} fotos foram salvas na pasta de saída."]
            if cancelled:
                lines.append("O processamento foi interrompido.")
            if errors:
                lines.append(f"{len(errors)} arquivo(s) não puderam ser processados.")
            lines.append("As fotos originais não foram alteradas.")
            ctk.CTkLabel(
                window,
                text="\n".join(lines),
                font=self.font_body,
                text_color=COLOR["text"],
                wraplength=460,
                justify="left",
                anchor="w",
            ).pack(fill="x", padx=18, pady=(18, 8))
            box = ctk.CTkTextbox(
                window,
                fg_color=COLOR["surface"],
                text_color=COLOR["text"],
                font=self.font_small,
                corner_radius=12,
            )
            box.pack(fill="both", expand=True, padx=18, pady=8)
            if errors:
                shown = errors[:30]
                box.insert("1.0", "\n".join(shown))
                if len(errors) > len(shown):
                    box.insert("end", f"\n… e mais {len(errors) - len(shown)}.")
            else:
                box.insert("1.0", "Nenhum erro.")
            box.configure(state="disabled")
            self._button(window, "Fechar", window.destroy, primary=True, width=120).pack(pady=(4, 16))

        def persist(self) -> None:
            try:
                save_settings(self.collect_settings() if self.ui_ready else self._settings)
            except Exception as exc:
                self.set_status(f"Não foi possível salvar as configurações: {friendly_error(exc)}")

        def on_close(self) -> None:
            self._stop.set()
            self.cancel_event.set()
            self._preview_wakeup.set()
            if self.ui_ready:
                try:
                    save_settings(self.collect_settings())
                except Exception:
                    pass
            if self.logo_image is not None:
                try:
                    self.logo_image.close()
                except Exception:
                    pass
            self.destroy()

    App().mainloop()


if __name__ == "__main__":
    main()
