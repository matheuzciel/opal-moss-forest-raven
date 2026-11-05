import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import * as Slider from "@radix-ui/react-slider";
import { FolderOpen, ImagePlus, Stamp, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { makeSampleFile } from "@/lib/sample";
import { buildZip } from "@/lib/zip";
import {
  FONT_CHOICES,
  coerceSettings,
  explainError,
  loadStoredSettings,
  mimeForName,
  outputName,
  processArrayBuffer,
  renderPreviewBlob,
  storeSettings,
  uniqueName,
  type MarkPosition,
  type MarkSettings,
  defaultSettings,
} from "@/lib/watermark";

type Item = { id: string; name: string; size: number; file: File };
type Failure = { name: string; error: string };
type Summary = {
  ok: number;
  failed: Failure[];
  cancelled: boolean;
  total: number;
  destination: string;
};
type WorkerOk = { id: number; ok: true; name: string; buffer: ArrayBuffer; mime: string };
type WorkerErr = { id: number; ok: false; name: string; error: string };

const POSITIONS: { id: MarkPosition; label: string }[] = [
  { id: "top-left", label: "Sup. esq." },
  { id: "top-right", label: "Sup. dir." },
  { id: "center", label: "Centro" },
  { id: "bottom-left", label: "Inf. esq." },
  { id: "bottom-right", label: "Inf. dir." },
  { id: "tile", label: "Mosaico" },
];

const fieldClass =
  "h-11 w-full rounded-control border border-line bg-raised px-3 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

async function filesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));
    return [file];
  }
  if (!entry.isDirectory) return [];
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const nested: File[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (batch.length === 0) break;
    for (const child of batch) nested.push(...(await filesFromEntry(child)));
  }
  return nested;
}

async function filesFromTransfer(transfer: DataTransfer): Promise<File[]> {
  const entries = [...transfer.items]
    .filter((item) => item.kind === "file" && typeof item.webkitGetAsEntry === "function")
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => Boolean(entry));
  if (entries.length === 0) return [...transfer.files];
  const files: File[] = [];
  for (const entry of entries) {
    try {
      files.push(...(await filesFromEntry(entry)));
    } catch {
      /* pasta sem permissão: ignora e segue */
    }
  }
  return files;
}

function makeWorker(): Worker | null {
  try {
    return new Worker(new URL("../workers/watermark.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

function RangeField({
  label,
  value,
  min,
  max,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="text-muted">{label}</p>
        <span className="tabular-nums text-fg">
          {value}
          {suffix}
        </span>
      </div>
      <Slider.Root
        className="relative flex h-11 w-full touch-none items-center"
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(next[0] ?? value)}
      >
        <Slider.Track className="relative h-1 w-full grow rounded-full bg-canvas">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb
          className="block size-5 rounded-full border border-line bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={label}
        />
      </Slider.Root>
    </div>
  );
}

export function Studio() {
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const logoBitmap = useRef<ImageBitmap | null>(null);
  const rememberedLogo = useRef<File | null>(null);
  const cancelRef = useRef(false);
  const previewToken = useRef(0);
  const itemsRef = useRef<Item[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [settings, setSettings] = useState<MarkSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoVersion, setLogoVersion] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, name: "" });
  const [summary, setSummary] = useState<Summary | null>(null);
  itemsRef.current = items;

  useEffect(() => {
    folderRef.current?.setAttribute("webkitdirectory", "");
    folderRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    setSettings(loadStoredSettings());
    setHydrated(true);
    let cancelled = false;
    void makeSampleFile()
      .then((file) => {
        if (cancelled) return;
        setItems((current) =>
          current.length > 0 ? current : [{ id: "amostra", name: file.name, size: file.size, file }],
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) storeSettings(settings);
  }, [settings, hydrated]);

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (![...(event.dataTransfer?.types ?? [])].includes("Files")) return;
      event.preventDefault();
      setDragging(true);
    };
    const onDrop = (event: DragEvent) => {
      if (![...(event.dataTransfer?.types ?? [])].includes("Files")) return;
      event.preventDefault();
      setDragging(false);
    };
    const onLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) setDragging(false);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragleave", onLeave);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const token = ++previewToken.current;
    const first = items[0];
    if (!first || !hydrated) {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setPreviewMeta("");
      setPreviewError("");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const rendered = await renderPreviewBlob(first.file, settings, logoBitmap.current);
          if (cancelled || token !== previewToken.current) return;
          const url = URL.createObjectURL(rendered.blob);
          setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return url;
          });
          setPreviewMeta(`${first.name} · ${rendered.width}×${rendered.height}`);
          setPreviewError("");
        } catch (err) {
          if (cancelled || token !== previewToken.current) return;
          setPreviewError(explainError(err));
        }
      })();
    }, 90);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [items, settings, logoVersion, hydrated]);

  function patch(partial: Partial<MarkSettings>) {
    setSettings((current) => coerceSettings({ ...current, ...partial }));
  }

  function addFiles(files: File[]) {
    const current = itemsRef.current;
    const known = new Set(current.map((item) => `${item.name}:${item.size}:${item.file.lastModified}`));
    const next = [...current];
    const skipped: string[] = [];
    for (const file of files) {
      const mime = mimeForName(file.name, file.type);
      if (!mime) {
        skipped.push(`${file.name}: formato não suportado`);
        continue;
      }
      if (file.size <= 0) {
        skipped.push(`${file.name}: arquivo vazio`);
        continue;
      }
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (known.has(key)) {
        skipped.push(`${file.name}: já está na lista`);
        continue;
      }
      if (next.length >= 400) {
        skipped.push("Limite de 400 fotos nesta sessão.");
        break;
      }
      known.add(key);
      next.push({ id: `${key}:${next.length}`, name: file.name, size: file.size, file });
    }
    itemsRef.current = next;
    setItems(next);
    setNotes(skipped.slice(0, 4));
  }

  async function onDrop(event: ReactDragEvent) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    try {
      addFiles(await filesFromTransfer(event.dataTransfer));
    } catch (err) {
      setNotes([explainError(err)]);
    }
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".png") && file.type !== "image/png") {
      setNotes(["Use um PNG com transparência para o logo."]);
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      logoBitmap.current?.close();
      logoBitmap.current = bitmap;
      setLogoName(file.name);
      setLogoVersion((value) => value + 1);
      setNotes([]);
    } catch {
      setNotes(["Não foi possível abrir o PNG. O arquivo pode estar corrompido."]);
    }
  }

  async function run(mode: "zip" | "folder") {
    if (busy) return;
    if (items.length === 0) {
      setNotes(["Adicione pelo menos uma foto."]);
      return;
    }
    if (settings.mode === "text" && !settings.text.trim()) {
      setNotes(["Digite o texto da marca d'água."]);
      return;
    }
    if (settings.mode === "image" && !logoBitmap.current) {
      setNotes(["Escolha um arquivo PNG para usar como marca."]);
      return;
    }

    let directory: FileSystemDirectoryHandle | null = null;
    if (mode === "folder") {
      const picker = (
        window as Window & {
          showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker;
      if (!picker) {
        setNotes(["Este navegador não deixa escolher uma pasta. Use Baixar ZIP."]);
        return;
      }
      try {
        directory = await picker.call(window, { mode: "readwrite" });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setNotes([explainError(err)]);
        return;
      }
    }

    const logoFile = settings.mode === "image" ? rememberedLogo.current : null;
    if (settings.mode === "image" && !logoFile) {
      setNotes(["Escolha um arquivo PNG para usar como marca."]);
      return;
    }

    setBusy(true);
    cancelRef.current = false;
    setSummary(null);
    setProgress({ done: 0, total: items.length, name: "" });
    const failed: Failure[] = [];
    const zipEntries: { name: string; data: Uint8Array }[] = [];
    const used = new Set<string>();
    let ok = 0;
    let worker = makeWorker();
    const snapshot = items.slice();
    const activeSettings = coerceSettings(settings);
    let logoBytes: ArrayBuffer | null = null;

    if (logoFile) {
      try {
        logoBytes = await logoFile.arrayBuffer();
      } catch {
        worker?.terminate();
        setBusy(false);
        setNotes(["Não foi possível ler o PNG da marca."]);
        return;
      }
    }

    try {
      for (let index = 0; index < snapshot.length; index += 1) {
        if (cancelRef.current) break;
        const item = snapshot[index]!;
        setProgress({ done: index, total: snapshot.length, name: item.name });
        try {
          const mime = mimeForName(item.name, item.file.type);
          if (!mime) throw new Error("formato não suportado");
          const buffer = await item.file.arrayBuffer();
          let result: WorkerOk | WorkerErr;
          try {
            result = await processOne(worker, {
              id: index + 1,
              name: item.name,
              buffer,
              mime,
              settings: activeSettings,
              logoBuffer: logoBytes,
            });
          } catch (err) {
            worker?.terminate();
            worker = null;
            result = await processOne(null, {
              id: index + 1,
              name: item.name,
              buffer,
              mime,
              settings: activeSettings,
              logoBuffer: logoBytes,
            });
            if (!result.ok && !result.error) result = { ...result, error: explainError(err) };
          }
          if (!result.ok) throw new Error(result.error);
          const filename = uniqueName(used, result.name || outputName(item.name, activeSettings.suffix, ".jpg"));
          if (directory) {
            await writeUnique(directory, filename, new Blob([result.buffer], { type: result.mime }));
          } else {
            zipEntries.push({ name: `marcadas/${filename}`, data: new Uint8Array(result.buffer) });
          }
          ok += 1;
        } catch (err) {
          failed.push({ name: item.name, error: explainError(err) });
        }
        setProgress({ done: index + 1, total: snapshot.length, name: item.name });
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    } finally {
      worker?.terminate();
    }

    if (!directory && zipEntries.length > 0 && !cancelRef.current) {
      downloadBlob(buildZip(zipEntries), "velatura-marcadas.zip");
    }
    setBusy(false);
    setSummary({
      ok,
      failed,
      cancelled: cancelRef.current,
      total: snapshot.length,
      destination: directory ? `pasta ${directory.name}` : ok > 0 ? "arquivo ZIP" : "nenhum arquivo",
    });
  }

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-4 pt-6 pb-4">
        <span className="flex size-11 items-center justify-center rounded-control border border-line bg-surface text-fg">
          <Stamp className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl tracking-display text-fg">Velatura</h1>
          <p className="text-sm text-muted">Marca d'água em lote. As fotos originais não são alteradas.</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)]">
        <section className="order-1 flex min-h-0 min-w-0 flex-col gap-3 rounded-panel border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium">Fotos</h2>
            <span className="text-sm tabular-nums text-muted">{items.length}</span>
          </div>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDrop={(event) => void onDrop(event)}
            className={`flex flex-col items-center gap-3 rounded-control border border-dashed px-4 py-4 text-center ${dragging ? "border-accent bg-raised" : "border-line bg-canvas"}`}
          >
            <ImagePlus className="size-5 text-muted" aria-hidden="true" />
            <p className="text-sm text-muted">Arraste fotos ou pastas para cá.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => fileRef.current?.click()} disabled={busy}>
                Adicionar arquivos
              </Button>
              <Button variant="secondary" onClick={() => folderRef.current?.click()} disabled={busy}>
                <FolderOpen className="size-4" aria-hidden="true" />
                Adicionar pasta
              </Button>
            </div>
          </div>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp"
            onChange={(event) => {
              addFiles([...(event.target.files ?? [])]);
              event.target.value = "";
            }}
          />
          <input
            ref={folderRef}
            className="sr-only"
            type="file"
            multiple
            onChange={(event) => {
              addFiles([...(event.target.files ?? [])]);
              event.target.value = "";
            }}
          />
          {notes.length > 0 && (
            <ul className="rounded-control bg-canvas px-3 py-2 text-sm text-muted">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-faint">JPG, PNG, WEBP e BMP</p>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || items.length === 0}
              onClick={() => {
                setItems([]);
                setNotes([]);
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Limpar
            </Button>
          </div>
          <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {items.length === 0 && <li className="px-1 py-6 text-sm text-muted">Nenhuma foto na fila.</li>}
            {items.map((item) => (
              <li key={item.id} className="flex min-w-0 items-center gap-2 rounded-control px-2 py-1 hover:bg-raised">
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-faint">{formatSize(item.size)}</span>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-control text-muted hover:bg-canvas hover:text-fg"
                  aria-label={`Remover ${item.name}`}
                  disabled={busy}
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="order-2 flex min-w-0 flex-col gap-4 rounded-panel border border-line bg-surface p-4">
          <div className="overflow-hidden rounded-control bg-canvas">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Pré-visualização da primeira foto com a marca d'água"
                className="max-h-96 w-full object-contain"
              />
            ) : (
              <div className="flex min-h-48 items-center justify-center px-6 py-16 text-center text-sm text-muted">
                {previewError || "A pré-visualização da primeira foto aparece aqui."}
              </div>
            )}
          </div>
          <p className="text-sm text-muted">{previewMeta || "A prévia usa a primeira foto da fila."}</p>

          <div className="grid grid-cols-2 gap-2">
            <Button variant={settings.mode === "text" ? "primary" : "secondary"} onClick={() => patch({ mode: "text" })}>
              Texto
            </Button>
            <Button
              variant={settings.mode === "image" ? "primary" : "secondary"}
              onClick={() => patch({ mode: "image" })}
            >
              Logo PNG
            </Button>
          </div>

          {settings.mode === "text" ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-2 text-sm text-muted">
                Texto da marca
                <textarea
                  value={settings.text}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => patch({ text: event.target.value })}
                  className="min-h-24 w-full rounded-control border border-line bg-raised px-3 py-2 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-muted">
                Fonte
                <select
                  value={settings.fontFamily}
                  onChange={(event) => patch({ fontFamily: event.target.value })}
                  className={fieldClass}
                >
                  {FONT_CHOICES.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-3">
                <label className="flex flex-col gap-2 text-sm text-muted">
                  Cor
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(event) => patch({ color: event.target.value })}
                    className="h-11 w-16 cursor-pointer rounded-control border border-line bg-raised"
                    aria-label="Cor da marca"
                  />
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-muted">
                  Hex
                  <input
                    value={settings.color}
                    onChange={(event) => patch({ color: event.target.value })}
                    className={fieldClass}
                    spellCheck={false}
                  />
                </label>
              </div>
              <RangeField
                label="Tamanho da fonte"
                value={settings.fontScale}
                min={50}
                max={200}
                suffix="%"
                onChange={(fontScale) => patch({ fontScale })}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => logoRef.current?.click()}>
                Escolher PNG
              </Button>
              <p className="min-w-0 truncate text-sm text-muted">{logoName || "Nenhum logo selecionado"}</p>
              <input
                ref={logoRef}
                className="sr-only"
                type="file"
                accept="image/png,.png"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  rememberedLogo.current = file ?? null;
                  void onLogo(file);
                  event.target.value = "";
                }}
              />
            </div>
          )}

          <RangeField
            label="Tamanho (% da imagem)"
            value={settings.sizePercent}
            min={5}
            max={90}
            suffix="%"
            onChange={(sizePercent) => patch({ sizePercent })}
          />
          <p className="text-sm text-faint">
            {settings.mode === "text"
              ? "Largura do texto em relação à foto. O tamanho da fonte multiplica esse valor."
              : "Largura do logo em relação à largura da foto."}
          </p>
          <RangeField
            label="Opacidade"
            value={settings.opacity}
            min={0}
            max={100}
            suffix="%"
            onChange={(opacity) => patch({ opacity })}
          />
          <RangeField
            label="Rotação (horário)"
            value={settings.rotation}
            min={-180}
            max={180}
            suffix="°"
            onChange={(rotation) => patch({ rotation })}
          />
          <RangeField
            label="Margem"
            value={settings.margin}
            min={0}
            max={20}
            suffix="%"
            onChange={(margin) => patch({ margin })}
          />

          <div>
            <p className="mb-2 text-sm text-muted">Posição</p>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((position) => (
                <Button
                  key={position.id}
                  variant={settings.position === position.id ? "primary" : "secondary"}
                  size="sm"
                  aria-pressed={settings.position === position.id}
                  onClick={() => patch({ position: position.id })}
                >
                  {position.label}
                </Button>
              ))}
            </div>
          </div>

          <RangeField
            label="Qualidade JPEG/WEBP"
            value={settings.quality}
            min={70}
            max={100}
            onChange={(quality) => patch({ quality })}
          />
          <label className="flex flex-col gap-2 text-sm text-muted">
            Sufixo do arquivo
            <input
              value={settings.suffix}
              onChange={(event) => patch({ suffix: event.target.value })}
              className={fieldClass}
            />
          </label>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-canvas"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)}
            >
              <div
                className="h-full bg-accent transition-[width] duration-150 ease-out"
                style={{ width: `${progress.total === 0 ? 0 : (progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted">
              {busy
                ? `${progress.done} de ${progress.total}${progress.name ? ` — ${progress.name}` : ""}`
                : "A saída é uma cópia. O original permanece onde está."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void run("zip")}>
                Baixar ZIP
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => void run("folder")}>
                Salvar numa pasta
              </Button>
              <Button variant="ghost" disabled={!busy} onClick={() => (cancelRef.current = true)}>
                Cancelar
              </Button>
            </div>
          </div>

          <details className="rounded-control border border-line px-3 py-3 text-sm">
            <summary className="cursor-pointer text-fg">Aplicativo para Windows</summary>
            <p className="mt-3 text-muted">
              O arquivo <span className="text-fg">main.py</span> é o programa de janela, com a mesma marca d'água.
              Baixe os três arquivos, instale o Python e siga o passo a passo para gerar o <span className="text-fg">.exe</span>.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a className="text-fg underline decoration-line underline-offset-4" href="/download/main.py" download="main.py">
                main.py
              </a>
              <a
                className="text-fg underline decoration-line underline-offset-4"
                href="/download/requirements.txt"
                download="requirements.txt"
              >
                requirements.txt
              </a>
              <a
                className="text-fg underline decoration-line underline-offset-4"
                href="/download/LEIA-ME.md"
                download="LEIA-ME.md"
              >
                passo a passo do .exe
              </a>
            </div>
          </details>
        </section>
      </main>

      {summary && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-canvas/80 p-4 sm:items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resultado-titulo"
            className="w-full max-w-lg rounded-panel border border-line bg-surface p-5"
          >
            <h2 id="resultado-titulo" className="font-display text-2xl tracking-display">
              Resultado
            </h2>
            <p className="mt-3 text-sm text-fg">
              {summary.ok} de {summary.total} fotos salvas ({summary.destination}).
              {summary.cancelled ? " O processamento foi interrompido." : ""} As originais não foram alteradas.
            </p>
            {summary.failed.length > 0 && (
              <ul className="mt-3 max-h-48 overflow-y-auto text-sm text-muted">
                {summary.failed.slice(0, 12).map((failure) => (
                  <li key={`${failure.name}:${failure.error}`}>
                    {failure.name}: {failure.error}
                  </li>
                ))}
              </ul>
            )}
            <Button className="mt-5" onClick={() => setSummary(null)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

async function writeUnique(dir: FileSystemDirectoryHandle, filename: string, blob: Blob) {
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  let chosen = filename;
  for (let n = 0; n < 5000; n += 1) {
    const candidate = n === 0 ? filename : `${stem} (${n})${ext}`;
    try {
      await dir.getFileHandle(candidate);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotFoundError") {
        chosen = candidate;
        break;
      }
      throw err;
    }
  }
  const handle = await dir.getFileHandle(chosen, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function processOne(
  worker: Worker | null,
  payload: {
    id: number;
    name: string;
    buffer: ArrayBuffer;
    mime: string;
    settings: MarkSettings;
    logoBuffer: ArrayBuffer | null;
  },
): Promise<WorkerOk | WorkerErr> {
  if (!worker) {
    try {
      const result = await processArrayBuffer(payload);
      const bytes = result.bytes.slice();
      return { id: payload.id, ok: true, name: result.name, buffer: bytes.buffer as ArrayBuffer, mime: result.mime };
    } catch (err) {
      return { id: payload.id, ok: false, name: payload.name, error: explainError(err) };
    }
  }
  const copy = payload.buffer.slice(0);
  const logoCopy = payload.logoBuffer ? payload.logoBuffer.slice(0) : null;
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorkerOk | WorkerErr>) => {
      if (event.data.id !== payload.id) return;
      cleanup();
      resolve(event.data);
    };
    const onError = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message || "Falha no processamento"));
    };
    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ ...payload, buffer: copy, logoBuffer: logoCopy }, logoCopy ? [copy, logoCopy] : [copy]);
  });
}
