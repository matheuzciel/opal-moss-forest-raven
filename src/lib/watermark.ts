export const FONT_CHOICES = [
  "Georgia",
  "Palatino Linotype",
  "Times New Roman",
  "Garamond",
  "Cambria",
  "Segoe UI",
  "Arial",
  "Verdana",
  "Trebuchet MS",
  "Tahoma",
  "Calibri",
  "Courier New",
  "Consolas",
  "Impact",
] as const;

export type MarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "tile";

export type MarkSettings = {
  mode: "text" | "image";
  text: string;
  fontFamily: string;
  color: string;
  fontScale: number;
  opacity: number;
  sizePercent: number;
  rotation: number;
  position: MarkPosition;
  margin: number;
  quality: number;
  suffix: string;
};

export const defaultSettings: MarkSettings = {
  mode: "text",
  text: "© Seu estúdio",
  fontFamily: "Georgia",
  color: "#ffffff",
  fontScale: 100,
  opacity: 62,
  sizePercent: 36,
  rotation: 0,
  position: "bottom-right",
  margin: 4,
  quality: 92,
  suffix: "_marca",
};

const POSITIONS = new Set<MarkPosition>([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
  "tile",
]);

const SERIF = new Set<string>(["Georgia", "Times New Roman", "Palatino Linotype", "Garamond", "Cambria"]);
const STORAGE_KEY = "velatura-settings-v1";

function clamp(value: unknown, fallback: number, lo: number, hi: number): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(number)));
}

export function sanitizeSuffix(suffix: string): string {
  return suffix.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim().slice(0, 40);
}

export function coerceSettings(value: unknown): MarkSettings {
  const data = value && typeof value === "object" ? (value as Partial<MarkSettings>) : {};
  const mode = data.mode === "image" ? "image" : "text";
  const position = POSITIONS.has(data.position as MarkPosition)
    ? (data.position as MarkPosition)
    : defaultSettings.position;
  const color = typeof data.color === "string" && /^#?[0-9a-fA-F]{6}$/.test(data.color.trim())
    ? data.color.trim().startsWith("#")
      ? data.color.trim()
      : `#${data.color.trim()}`
    : defaultSettings.color;
  const fontFamily = FONT_CHOICES.includes(data.fontFamily as (typeof FONT_CHOICES)[number])
    ? (data.fontFamily as string)
    : defaultSettings.fontFamily;
  return {
    mode,
    text: typeof data.text === "string" ? data.text.slice(0, 500) : defaultSettings.text,
    fontFamily,
    color,
    fontScale: clamp(data.fontScale, defaultSettings.fontScale, 50, 200),
    opacity: clamp(data.opacity, defaultSettings.opacity, 0, 100),
    sizePercent: clamp(data.sizePercent, defaultSettings.sizePercent, 5, 90),
    rotation: clamp(data.rotation, defaultSettings.rotation, -180, 180),
    position,
    margin: clamp(data.margin, defaultSettings.margin, 0, 20),
    quality: clamp(data.quality, defaultSettings.quality, 70, 100),
    suffix: sanitizeSuffix(typeof data.suffix === "string" ? data.suffix : defaultSettings.suffix) || defaultSettings.suffix,
  };
}

export function loadStoredSettings(): MarkSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return coerceSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export function storeSettings(settings: MarkSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* quota or private mode */
  }
}

export function explainError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/memory|allocation|out of memory/i.test(raw)) return "memória insuficiente para esta imagem";
  if (/decode|unsupported|corrupt|bitmap|invalid image|could not be decoded/i.test(raw)) {
    return "arquivo corrompido ou formato não reconhecido";
  }
  if (/notallowed|security|permiss/i.test(raw)) return "sem permissão de leitura ou gravação";
  return raw.trim() || "erro desconhecido";
}

export function mimeForName(name: string, type = ""): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png" || type === "image/png") return "image/png";
  if (ext === "webp" || type === "image/webp") return "image/webp";
  if (ext === "bmp" || type === "image/bmp" || type === "image/x-ms-bmp") return "image/bmp";
  if (ext === "jpg" || ext === "jpeg" || type === "image/jpeg") return "image/jpeg";
  return "";
}

export function extForMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/bmp") return ".bmp";
  return ".jpg";
}

export function outputName(original: string, suffix: string, ext: string): string {
  const base = (original.split(/[/\\]/).pop() || "foto").replace(/\.[^.]+$/, "");
  const safeBase = base.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 120) || "foto";
  return `${safeBase}${sanitizeSuffix(suffix)}${ext}`;
}

export function uniqueName(used: Set<string>, filename: string): string {
  const key = filename.toLowerCase();
  if (!used.has(key)) {
    used.add(key);
    return filename;
  }
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  let n = 1;
  let next = `${stem} (${n})${ext}`;
  while (used.has(next.toLowerCase())) {
    n += 1;
    next = `${stem} (${n})${ext}`;
  }
  used.add(next.toLowerCase());
  return next;
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function makeCanvas(width: number, height: number): AnyCanvas {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function context2d(canvas: AnyCanvas): AnyContext {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem");
  return ctx;
}

function fontCss(px: number, family: string): string {
  const generic = SERIF.has(family) ? "Georgia, serif" : "Segoe UI, sans-serif";
  return `600 ${Math.max(8, Math.round(px))}px "${family}", ${generic}`;
}

export async function decodeBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    try {
      return await createImageBitmap(blob);
    } catch {
      throw new Error("arquivo corrompido ou formato não reconhecido");
    }
  }
}

function measureText(text: string, px: number, family: string) {
  const canvas = makeCanvas(4, 4);
  const ctx = context2d(canvas);
  ctx.font = fontCss(px, family);
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || px * 0.8;
  const descent = metrics.actualBoundingBoxDescent || px * 0.2;
  return {
    width: Math.max(1, Math.ceil(metrics.width)),
    height: Math.max(1, Math.ceil(ascent + descent)),
    ascent,
  };
}

function makeTextStamp(text: string, family: string, color: string, targetWidth: number): AnyCanvas {
  const lines = text.split("\n");
  const samplePx = 100;
  let widest = 1;
  for (const line of lines) {
    widest = Math.max(widest, measureText(line || " ", samplePx, family).width);
  }
  const px = Math.max(8, Math.min(1600, Math.round(samplePx * (targetWidth / widest))));
  const measured = lines.map((line) => measureText(line || " ", px, family));
  const width = Math.max(...measured.map((box) => box.width));
  const lineHeight = Math.max(...measured.map((box) => box.height));
  const padX = Math.ceil(px * 0.08);
  const padY = Math.ceil(px * 0.12);
  const canvas = makeCanvas(width + padX * 2, lineHeight * lines.length + padY * 2);
  const ctx = context2d(canvas);
  ctx.font = fontCss(px, family);
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  measured.forEach((box, index) => {
    ctx.fillText(lines[index] ?? "", padX, padY + box.ascent + index * lineHeight);
  });
  return canvas;
}

function scaleBitmap(source: CanvasImageSource, sourceW: number, sourceH: number, targetW: number): AnyCanvas {
  const width = Math.max(1, targetW);
  const height = Math.max(1, Math.round(sourceH * (width / Math.max(1, sourceW))));
  const canvas = makeCanvas(width, height);
  const ctx = context2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function rotateCanvas(source: AnyCanvas, degrees: number): AnyCanvas {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized < 0.05 || Math.abs(normalized - 360) < 0.05) return source;
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rw = Math.max(1, Math.ceil(source.width * cos + source.height * sin));
  const rh = Math.max(1, Math.ceil(source.width * sin + source.height * cos));
  const canvas = makeCanvas(rw, rh);
  const ctx = context2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(rw / 2, rh / 2);
  ctx.rotate(rad);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

function buildStamp(
  photoWidth: number,
  settings: MarkSettings,
  logo: ImageBitmap | null,
): AnyCanvas {
  if (settings.mode === "image") {
    if (!logo) throw new Error("escolha um arquivo PNG para a marca");
    const target = Math.max(8, Math.round(photoWidth * (settings.sizePercent / 100)));
    return rotateCanvas(scaleBitmap(logo, logo.width, logo.height, target), settings.rotation);
  }
  const text = settings.text.replace(/\r\n/g, "\n").trim().slice(0, 500);
  if (!text) throw new Error("digite o texto da marca");
  const target = Math.max(
    8,
    Math.round(photoWidth * (settings.sizePercent / 100) * (settings.fontScale / 100)),
  );
  return rotateCanvas(
    makeTextStamp(text, settings.fontFamily, settings.color, Math.min(target, photoWidth * 2)),
    settings.rotation,
  );
}

function positionOf(photoW: number, photoH: number, stampW: number, stampH: number, settings: MarkSettings) {
  const margin = Math.round(Math.min(photoW, photoH) * (settings.margin / 100));
  let x = 0;
  let y = 0;
  switch (settings.position) {
    case "top-left":
      x = margin;
      y = margin;
      break;
    case "top-right":
      x = photoW - stampW - margin;
      y = margin;
      break;
    case "bottom-left":
      x = margin;
      y = photoH - stampH - margin;
      break;
    case "bottom-right":
      x = photoW - stampW - margin;
      y = photoH - stampH - margin;
      break;
    default:
      x = (photoW - stampW) / 2;
      y = (photoH - stampH) / 2;
  }
  if (stampW < photoW) x = Math.max(0, Math.min(x, photoW - stampW));
  else x = (photoW - stampW) / 2;
  if (stampH < photoH) y = Math.max(0, Math.min(y, photoH - stampH));
  else y = (photoH - stampH) / 2;
  return { x: Math.round(x), y: Math.round(y) };
}

export function renderMarked(
  source: ImageBitmap,
  settings: MarkSettings,
  logo: ImageBitmap | null,
  maxEdge?: number,
): AnyCanvas {
  if (source.width < 1 || source.height < 1) {
    throw new Error("arquivo corrompido ou formato não reconhecido");
  }
  const scale = maxEdge ? Math.min(1, maxEdge / Math.max(source.width, source.height)) : 1;
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = makeCanvas(width, height);
  const ctx = context2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  const stamp = buildStamp(width, settings, logo);
  const alpha = Math.max(0, Math.min(100, settings.opacity)) / 100;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (settings.position === "tile") {
    const stepX = Math.max(1, stamp.width + Math.max(8, Math.round(stamp.width * 0.42)));
    const stepY = Math.max(1, stamp.height + Math.max(8, Math.round(stamp.height * 0.5)));
    for (let y = -stamp.height; y < height + stamp.height; y += stepY) {
      for (let x = -stamp.width; x < width + stamp.width; x += stepX) {
        ctx.drawImage(stamp, x, y);
      }
    }
  } else {
    const { x, y } = positionOf(width, height, stamp.width, stamp.height, settings);
    ctx.drawImage(stamp, x, y);
  }
  ctx.restore();
  return canvas;
}

function encodeBmp(image: ImageData): Uint8Array {
  const width = image.width;
  const height = image.height;
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const pixelSize = rowStride * height;
  const headerSize = 54;
  const bytes = new Uint8Array(headerSize + pixelSize);
  const view = new DataView(bytes.buffer);
  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, bytes.length, true);
  view.setUint32(10, headerSize, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  const src = image.data;
  for (let y = 0; y < height; y += 1) {
    const srcRow = (height - 1 - y) * width;
    const dst = headerSize + y * rowStride;
    for (let x = 0; x < width; x += 1) {
      const i = (srcRow + x) * 4;
      const o = dst + x * 3;
      bytes[o] = src[i + 2] ?? 0;
      bytes[o + 1] = src[i + 1] ?? 0;
      bytes[o + 2] = src[i] ?? 0;
    }
  }
  return bytes;
}

async function canvasToBlob(canvas: AnyCanvas, type: string, quality: number): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("não foi possível exportar a imagem"))),
      type,
      quality,
    );
  });
}

export async function encodeCanvas(
  canvas: AnyCanvas,
  mime: string,
  quality: number,
): Promise<{ bytes: Uint8Array; mime: string }> {
  if (mime === "image/bmp") {
    const ctx = context2d(canvas);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { bytes: encodeBmp(data), mime: "image/bmp" };
  }
  const q = Math.min(1, Math.max(0.7, quality / 100));
  try {
    const blob = await canvasToBlob(canvas, mime, q);
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mime };
  } catch (err) {
    if (mime === "image/png") throw err;
    const blob = await canvasToBlob(canvas, "image/png", q);
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: "image/png" };
  }
}

export async function processArrayBuffer(input: {
  name: string;
  buffer: ArrayBuffer;
  mime: string;
  settings: MarkSettings;
  logoBuffer: ArrayBuffer | null;
}): Promise<{ name: string; bytes: Uint8Array; mime: string }> {
  const settings = coerceSettings(input.settings);
  const bitmap = await decodeBitmap(new Blob([input.buffer], { type: input.mime || "application/octet-stream" }));
  let logo: ImageBitmap | null = null;
  try {
    if (settings.mode === "image") {
      if (!input.logoBuffer) throw new Error("escolha um arquivo PNG para a marca");
      logo = await decodeBitmap(new Blob([input.logoBuffer], { type: "image/png" }));
    }
    const canvas = renderMarked(bitmap, settings, logo);
    const encoded = await encodeCanvas(canvas, input.mime || "image/jpeg", settings.quality);
    return {
      name: outputName(input.name, settings.suffix, extForMime(encoded.mime)),
      bytes: encoded.bytes,
      mime: encoded.mime,
    };
  } finally {
    bitmap.close();
    logo?.close();
  }
}

export async function renderPreviewBlob(
  file: Blob,
  settings: MarkSettings,
  logo: ImageBitmap | null,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await decodeBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  try {
    const canvas = renderMarked(bitmap, settings, logo, 1200);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.86);
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}
