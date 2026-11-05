import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as ImagePlus, i as Stamp, o as FolderOpen, r as Trash2, t as X } from "../_libs/lucide-react.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B2qD50zr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("press inline-flex items-center justify-center gap-2 rounded-control font-medium transition-[background-color,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", {
	variants: {
		variant: {
			primary: "bg-accent text-ink hover:bg-fg",
			secondary: "border border-line bg-raised text-fg hover:bg-surface",
			ghost: "text-muted hover:bg-raised hover:text-fg"
		},
		size: {
			md: "h-11 px-4 text-sm",
			sm: "h-9 px-3 text-sm"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
async function makeSampleFile() {
	const canvas = document.createElement("canvas");
	canvas.width = 1600;
	canvas.height = 1066;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Não foi possível criar a amostra");
	ctx.fillStyle = "#2a2723";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#1a1816";
	ctx.fillRect(0, 0, canvas.width, 90);
	ctx.fillStyle = "#d9d3c6";
	ctx.fillRect(180, 140, 460, 620);
	ctx.fillStyle = "#b7b1a4";
	ctx.fillRect(400, 140, 18, 620);
	ctx.fillRect(180, 430, 460, 16);
	ctx.fillStyle = "#8d887c";
	ctx.fillRect(214, 176, 160, 220);
	ctx.fillRect(430, 176, 176, 220);
	ctx.fillRect(214, 470, 160, 250);
	ctx.fillRect(430, 470, 176, 250);
	ctx.fillStyle = "#3c362f";
	ctx.beginPath();
	ctx.moveTo(0, 760);
	ctx.lineTo(1600, 820);
	ctx.lineTo(1600, 1066);
	ctx.lineTo(0, 1066);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = "#2c2824";
	ctx.fillRect(860, 700, 280, 36);
	ctx.fillStyle = "#6e4d38";
	ctx.fillRect(900, 640, 200, 64);
	ctx.fillStyle = "#efeae1";
	ctx.beginPath();
	ctx.ellipse(1180, 760, 78, 24, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#d7d0c4";
	ctx.fillRect(1110, 600, 140, 164);
	ctx.fillStyle = "#f4f0e8";
	ctx.beginPath();
	ctx.ellipse(1180, 600, 70, 22, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#c8c0b4";
	ctx.lineWidth = 10;
	ctx.beginPath();
	ctx.arc(1248, 680, 36, Math.PI * .7, Math.PI * 1.5);
	ctx.stroke();
	ctx.fillStyle = "#243028";
	ctx.beginPath();
	ctx.ellipse(640, 790, 90, 18, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#314237";
	ctx.lineWidth = 8;
	ctx.beginPath();
	ctx.moveTo(640, 790);
	ctx.lineTo(640, 700);
	ctx.stroke();
	ctx.fillStyle = "#3e5a48";
	ctx.beginPath();
	ctx.ellipse(610, 700, 46, 22, -.4, 0, Math.PI * 2);
	ctx.ellipse(670, 692, 50, 24, .5, 0, Math.PI * 2);
	ctx.fill();
	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((result) => result ? resolve(result) : reject(/* @__PURE__ */ new Error("amostra inválida")), "image/jpeg", .92);
	});
	return new File([blob], "amostra.jpg", { type: "image/jpeg" });
}
var CRC_TABLE = (() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();
function crc32(data) {
	let c = 4294967295;
	for (let i = 0; i < data.length; i += 1) c = CRC_TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
function part(data) {
	return data;
}
function dosStamp(date) {
	const year = Math.max(1980, date.getFullYear());
	return {
		time: date.getHours() << 11 | date.getMinutes() << 5 | Math.floor(date.getSeconds() / 2),
		day: year - 1980 << 9 | date.getMonth() + 1 << 5 | date.getDate()
	};
}
function buildZip(entries) {
	const encoder = new TextEncoder();
	const now = dosStamp(/* @__PURE__ */ new Date());
	const locals = [];
	const centrals = [];
	let offset = 0;
	let centralSize = 0;
	for (const entry of entries) {
		const name = encoder.encode(entry.name);
		const crc = crc32(entry.data);
		const local = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(30));
		local.setUint32(0, 67324752, true);
		local.setUint16(4, 20, true);
		local.setUint16(6, 2048, true);
		local.setUint16(8, 0, true);
		local.setUint16(10, now.time, true);
		local.setUint16(12, now.day, true);
		local.setUint32(14, crc, true);
		local.setUint32(18, entry.data.length, true);
		local.setUint32(22, entry.data.length, true);
		local.setUint16(26, name.length, true);
		local.setUint16(28, 0, true);
		const localBytes = new Uint8Array(local.buffer);
		locals.push(part(localBytes), part(name), part(entry.data));
		const central = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(46));
		central.setUint32(0, 33639248, true);
		central.setUint16(4, 20, true);
		central.setUint16(6, 20, true);
		central.setUint16(8, 2048, true);
		central.setUint16(10, 0, true);
		central.setUint16(12, now.time, true);
		central.setUint16(14, now.day, true);
		central.setUint32(16, crc, true);
		central.setUint32(20, entry.data.length, true);
		central.setUint32(24, entry.data.length, true);
		central.setUint16(28, name.length, true);
		central.setUint16(30, 0, true);
		central.setUint16(32, 0, true);
		central.setUint16(34, 0, true);
		central.setUint16(36, 0, true);
		central.setUint32(38, 0, true);
		central.setUint32(42, offset, true);
		centrals.push(part(new Uint8Array(central.buffer)), part(name));
		offset += localBytes.length + name.length + entry.data.length;
		centralSize += 46 + name.length;
	}
	const end = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(22));
	end.setUint32(0, 101010256, true);
	end.setUint16(8, entries.length, true);
	end.setUint16(10, entries.length, true);
	end.setUint32(12, centralSize, true);
	end.setUint32(16, offset, true);
	return new Blob([
		...locals,
		...centrals,
		part(new Uint8Array(end.buffer))
	], { type: "application/zip" });
}
var FONT_CHOICES = [
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
	"Impact"
];
var defaultSettings = {
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
	suffix: "_marca"
};
var POSITIONS$1 = /* @__PURE__ */ new Set([
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right",
	"center",
	"tile"
]);
var SERIF = /* @__PURE__ */ new Set([
	"Georgia",
	"Times New Roman",
	"Palatino Linotype",
	"Garamond",
	"Cambria"
]);
var STORAGE_KEY = "velatura-settings-v1";
function clamp(value, fallback, lo, hi) {
	const number = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.max(lo, Math.min(hi, Math.round(number)));
}
function sanitizeSuffix(suffix) {
	return suffix.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim().slice(0, 40);
}
function coerceSettings(value) {
	const data = value && typeof value === "object" ? value : {};
	const mode = data.mode === "image" ? "image" : "text";
	const position = POSITIONS$1.has(data.position) ? data.position : defaultSettings.position;
	const color = typeof data.color === "string" && /^#?[0-9a-fA-F]{6}$/.test(data.color.trim()) ? data.color.trim().startsWith("#") ? data.color.trim() : `#${data.color.trim()}` : defaultSettings.color;
	const fontFamily = FONT_CHOICES.includes(data.fontFamily) ? data.fontFamily : defaultSettings.fontFamily;
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
		suffix: sanitizeSuffix(typeof data.suffix === "string" ? data.suffix : defaultSettings.suffix) || defaultSettings.suffix
	};
}
function loadStoredSettings() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultSettings;
		return coerceSettings(JSON.parse(raw));
	} catch {
		return defaultSettings;
	}
}
function storeSettings(settings) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {}
}
function explainError(err) {
	const raw = err instanceof Error ? err.message : String(err ?? "");
	if (/memory|allocation|out of memory/i.test(raw)) return "memória insuficiente para esta imagem";
	if (/decode|unsupported|corrupt|bitmap|invalid image|could not be decoded/i.test(raw)) return "arquivo corrompido ou formato não reconhecido";
	if (/notallowed|security|permiss/i.test(raw)) return "sem permissão de leitura ou gravação";
	return raw.trim() || "erro desconhecido";
}
function mimeForName(name, type = "") {
	const ext = name.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "png" || type === "image/png") return "image/png";
	if (ext === "webp" || type === "image/webp") return "image/webp";
	if (ext === "bmp" || type === "image/bmp" || type === "image/x-ms-bmp") return "image/bmp";
	if (ext === "jpg" || ext === "jpeg" || type === "image/jpeg") return "image/jpeg";
	return "";
}
function extForMime(mime) {
	if (mime === "image/png") return ".png";
	if (mime === "image/webp") return ".webp";
	if (mime === "image/bmp") return ".bmp";
	return ".jpg";
}
function outputName(original, suffix, ext) {
	return `${(original.split(/[/\\]/).pop() || "foto").replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 120) || "foto"}${sanitizeSuffix(suffix)}${ext}`;
}
function uniqueName(used, filename) {
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
function makeCanvas(width, height) {
	const w = Math.max(1, Math.round(width));
	const h = Math.max(1, Math.round(height));
	if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	return canvas;
}
function context2d(canvas) {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Não foi possível preparar a imagem");
	return ctx;
}
function fontCss(px, family) {
	const generic = SERIF.has(family) ? "Georgia, serif" : "Segoe UI, sans-serif";
	return `600 ${Math.max(8, Math.round(px))}px "${family}", ${generic}`;
}
async function decodeBitmap(blob) {
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
function measureText(text, px, family) {
	const ctx = context2d(makeCanvas(4, 4));
	ctx.font = fontCss(px, family);
	const metrics = ctx.measureText(text);
	const ascent = metrics.actualBoundingBoxAscent || px * .8;
	const descent = metrics.actualBoundingBoxDescent || px * .2;
	return {
		width: Math.max(1, Math.ceil(metrics.width)),
		height: Math.max(1, Math.ceil(ascent + descent)),
		ascent
	};
}
function makeTextStamp(text, family, color, targetWidth) {
	const lines = text.split("\n");
	const samplePx = 100;
	let widest = 1;
	for (const line of lines) widest = Math.max(widest, measureText(line || " ", samplePx, family).width);
	const px = Math.max(8, Math.min(1600, Math.round(samplePx * (targetWidth / widest))));
	const measured = lines.map((line) => measureText(line || " ", px, family));
	const width = Math.max(...measured.map((box) => box.width));
	const lineHeight = Math.max(...measured.map((box) => box.height));
	const padX = Math.ceil(px * .08);
	const padY = Math.ceil(px * .12);
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
function scaleBitmap(source, sourceW, sourceH, targetW) {
	const width = Math.max(1, targetW);
	const height = Math.max(1, Math.round(sourceH * (width / Math.max(1, sourceW))));
	const canvas = makeCanvas(width, height);
	const ctx = context2d(canvas);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(source, 0, 0, width, height);
	return canvas;
}
function rotateCanvas(source, degrees) {
	const normalized = (degrees % 360 + 360) % 360;
	if (normalized < .05 || Math.abs(normalized - 360) < .05) return source;
	const rad = degrees * Math.PI / 180;
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
function buildStamp(photoWidth, settings, logo) {
	if (settings.mode === "image") {
		if (!logo) throw new Error("escolha um arquivo PNG para a marca");
		const target = Math.max(8, Math.round(photoWidth * (settings.sizePercent / 100)));
		return rotateCanvas(scaleBitmap(logo, logo.width, logo.height, target), settings.rotation);
	}
	const text = settings.text.replace(/\r\n/g, "\n").trim().slice(0, 500);
	if (!text) throw new Error("digite o texto da marca");
	const target = Math.max(8, Math.round(photoWidth * (settings.sizePercent / 100) * (settings.fontScale / 100)));
	return rotateCanvas(makeTextStamp(text, settings.fontFamily, settings.color, Math.min(target, photoWidth * 2)), settings.rotation);
}
function positionOf(photoW, photoH, stampW, stampH, settings) {
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
	return {
		x: Math.round(x),
		y: Math.round(y)
	};
}
function renderMarked(source, settings, logo, maxEdge) {
	if (source.width < 1 || source.height < 1) throw new Error("arquivo corrompido ou formato não reconhecido");
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
		const stepX = Math.max(1, stamp.width + Math.max(8, Math.round(stamp.width * .42)));
		const stepY = Math.max(1, stamp.height + Math.max(8, Math.round(stamp.height * .5)));
		for (let y = -stamp.height; y < height + stamp.height; y += stepY) for (let x = -stamp.width; x < width + stamp.width; x += stepX) ctx.drawImage(stamp, x, y);
	} else {
		const { x, y } = positionOf(width, height, stamp.width, stamp.height, settings);
		ctx.drawImage(stamp, x, y);
	}
	ctx.restore();
	return canvas;
}
function encodeBmp(image) {
	const width = image.width;
	const height = image.height;
	const rowStride = Math.ceil(width * 3 / 4) * 4;
	const pixelSize = rowStride * height;
	const headerSize = 54;
	const bytes = new Uint8Array(headerSize + pixelSize);
	const view = new DataView(bytes.buffer);
	bytes[0] = 66;
	bytes[1] = 77;
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
async function canvasToBlob(canvas, type, quality) {
	if (canvas instanceof OffscreenCanvas) return canvas.convertToBlob({
		type,
		quality
	});
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => blob ? resolve(blob) : reject(/* @__PURE__ */ new Error("não foi possível exportar a imagem")), type, quality);
	});
}
async function encodeCanvas(canvas, mime, quality) {
	if (mime === "image/bmp") return {
		bytes: encodeBmp(context2d(canvas).getImageData(0, 0, canvas.width, canvas.height)),
		mime: "image/bmp"
	};
	const q = Math.min(1, Math.max(.7, quality / 100));
	try {
		const blob = await canvasToBlob(canvas, mime, q);
		return {
			bytes: new Uint8Array(await blob.arrayBuffer()),
			mime
		};
	} catch (err) {
		if (mime === "image/png") throw err;
		const blob = await canvasToBlob(canvas, "image/png", q);
		return {
			bytes: new Uint8Array(await blob.arrayBuffer()),
			mime: "image/png"
		};
	}
}
async function processArrayBuffer(input) {
	const settings = coerceSettings(input.settings);
	const bitmap = await decodeBitmap(new Blob([input.buffer], { type: input.mime || "application/octet-stream" }));
	let logo = null;
	try {
		if (settings.mode === "image") {
			if (!input.logoBuffer) throw new Error("escolha um arquivo PNG para a marca");
			logo = await decodeBitmap(new Blob([input.logoBuffer], { type: "image/png" }));
		}
		const encoded = await encodeCanvas(renderMarked(bitmap, settings, logo), input.mime || "image/jpeg", settings.quality);
		return {
			name: outputName(input.name, settings.suffix, extForMime(encoded.mime)),
			bytes: encoded.bytes,
			mime: encoded.mime
		};
	} finally {
		bitmap.close();
		logo?.close();
	}
}
async function renderPreviewBlob(file, settings, logo) {
	const bitmap = await decodeBitmap(file);
	const width = bitmap.width;
	const height = bitmap.height;
	try {
		return {
			blob: await canvasToBlob(renderMarked(bitmap, settings, logo, 1200), "image/jpeg", .86),
			width,
			height
		};
	} finally {
		bitmap.close();
	}
}
var POSITIONS = [
	{
		id: "top-left",
		label: "Sup. esq."
	},
	{
		id: "top-right",
		label: "Sup. dir."
	},
	{
		id: "center",
		label: "Centro"
	},
	{
		id: "bottom-left",
		label: "Inf. esq."
	},
	{
		id: "bottom-right",
		label: "Inf. dir."
	},
	{
		id: "tile",
		label: "Mosaico"
	}
];
var fieldClass = "h-11 w-full rounded-control border border-line bg-raised px-3 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
function formatSize(size) {
	if (size < 1024) return `${size} B`;
	if (size < 1048576) return `${Math.round(size / 1024)} KB`;
	return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 15e3);
}
async function filesFromEntry(entry) {
	if (entry.isFile) {
		const fileEntry = entry;
		return [await new Promise((resolve, reject) => fileEntry.file(resolve, reject))];
	}
	if (!entry.isDirectory) return [];
	const reader = entry.createReader();
	const nested = [];
	for (;;) {
		const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
		if (batch.length === 0) break;
		for (const child of batch) nested.push(...await filesFromEntry(child));
	}
	return nested;
}
async function filesFromTransfer(transfer) {
	const entries = [...transfer.items].filter((item) => item.kind === "file" && typeof item.webkitGetAsEntry === "function").map((item) => item.webkitGetAsEntry()).filter((entry) => Boolean(entry));
	if (entries.length === 0) return [...transfer.files];
	const files = [];
	for (const entry of entries) try {
		files.push(...await filesFromEntry(entry));
	} catch {}
	return files;
}
function makeWorker() {
	try {
		return new Worker(new URL("../workers/watermark.worker.ts", import.meta.url), { type: "module" });
	} catch {
		return null;
	}
}
function RangeField({ label, value, min, max, onChange, suffix = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "tabular-nums text-fg",
				children: [value, suffix]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider, {
			className: "relative flex h-11 w-full touch-none items-center",
			min,
			max,
			step: 1,
			value: [value],
			onValueChange: (next) => onChange(next[0] ?? value),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
				className: "relative h-1 w-full grow rounded-full bg-canvas",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-accent" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, {
				className: "block size-5 rounded-full border border-line bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
				"aria-label": label
			})]
		})]
	});
}
function Studio() {
	const fileRef = (0, import_react.useRef)(null);
	const folderRef = (0, import_react.useRef)(null);
	const logoRef = (0, import_react.useRef)(null);
	const logoBitmap = (0, import_react.useRef)(null);
	const rememberedLogo = (0, import_react.useRef)(null);
	const cancelRef = (0, import_react.useRef)(false);
	const previewToken = (0, import_react.useRef)(0);
	const itemsRef = (0, import_react.useRef)([]);
	const [items, setItems] = (0, import_react.useState)([]);
	const [notes, setNotes] = (0, import_react.useState)([]);
	const [settings, setSettings] = (0, import_react.useState)(defaultSettings);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [logoName, setLogoName] = (0, import_react.useState)("");
	const [logoVersion, setLogoVersion] = (0, import_react.useState)(0);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	const [previewMeta, setPreviewMeta] = (0, import_react.useState)("");
	const [previewError, setPreviewError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)({
		done: 0,
		total: 0,
		name: ""
	});
	const [summary, setSummary] = (0, import_react.useState)(null);
	itemsRef.current = items;
	(0, import_react.useEffect)(() => {
		folderRef.current?.setAttribute("webkitdirectory", "");
		folderRef.current?.setAttribute("directory", "");
	}, []);
	(0, import_react.useEffect)(() => {
		setSettings(loadStoredSettings());
		setHydrated(true);
		let cancelled = false;
		makeSampleFile().then((file) => {
			if (cancelled) return;
			setItems((current) => current.length > 0 ? current : [{
				id: "amostra",
				name: file.name,
				size: file.size,
				file
			}]);
		}).catch(() => void 0);
		return () => {
			cancelled = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (hydrated) storeSettings(settings);
	}, [settings, hydrated]);
	(0, import_react.useEffect)(() => {
		const onDragOver = (event) => {
			if (![...event.dataTransfer?.types ?? []].includes("Files")) return;
			event.preventDefault();
			setDragging(true);
		};
		const onDrop = (event) => {
			if (![...event.dataTransfer?.types ?? []].includes("Files")) return;
			event.preventDefault();
			setDragging(false);
		};
		const onLeave = (event) => {
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
	(0, import_react.useEffect)(() => {
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
			(async () => {
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
	}, [
		items,
		settings,
		logoVersion,
		hydrated
	]);
	function patch(partial) {
		setSettings((current) => coerceSettings({
			...current,
			...partial
		}));
	}
	function addFiles(files) {
		const current = itemsRef.current;
		const known = new Set(current.map((item) => `${item.name}:${item.size}:${item.file.lastModified}`));
		const next = [...current];
		const skipped = [];
		for (const file of files) {
			if (!mimeForName(file.name, file.type)) {
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
			next.push({
				id: `${key}:${next.length}`,
				name: file.name,
				size: file.size,
				file
			});
		}
		itemsRef.current = next;
		setItems(next);
		setNotes(skipped.slice(0, 4));
	}
	async function onDrop(event) {
		event.preventDefault();
		setDragging(false);
		if (busy) return;
		try {
			addFiles(await filesFromTransfer(event.dataTransfer));
		} catch (err) {
			setNotes([explainError(err)]);
		}
	}
	async function onLogo(file) {
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
	async function run(mode) {
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
		let directory = null;
		if (mode === "folder") {
			const picker = window.showDirectoryPicker;
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
		setProgress({
			done: 0,
			total: items.length,
			name: ""
		});
		const failed = [];
		const zipEntries = [];
		const used = /* @__PURE__ */ new Set();
		let ok = 0;
		let worker = makeWorker();
		const snapshot = items.slice();
		const activeSettings = coerceSettings(settings);
		let logoBytes = null;
		if (logoFile) try {
			logoBytes = await logoFile.arrayBuffer();
		} catch {
			worker?.terminate();
			setBusy(false);
			setNotes(["Não foi possível ler o PNG da marca."]);
			return;
		}
		try {
			for (let index = 0; index < snapshot.length; index += 1) {
				if (cancelRef.current) break;
				const item = snapshot[index];
				setProgress({
					done: index,
					total: snapshot.length,
					name: item.name
				});
				try {
					const mime = mimeForName(item.name, item.file.type);
					if (!mime) throw new Error("formato não suportado");
					const buffer = await item.file.arrayBuffer();
					let result;
					try {
						result = await processOne(worker, {
							id: index + 1,
							name: item.name,
							buffer,
							mime,
							settings: activeSettings,
							logoBuffer: logoBytes
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
							logoBuffer: logoBytes
						});
						if (!result.ok && !result.error) result = {
							...result,
							error: explainError(err)
						};
					}
					if (!result.ok) throw new Error(result.error);
					const filename = uniqueName(used, result.name || outputName(item.name, activeSettings.suffix, ".jpg"));
					if (directory) await writeUnique(directory, filename, new Blob([result.buffer], { type: result.mime }));
					else zipEntries.push({
						name: `marcadas/${filename}`,
						data: new Uint8Array(result.buffer)
					});
					ok += 1;
				} catch (err) {
					failed.push({
						name: item.name,
						error: explainError(err)
					});
				}
				setProgress({
					done: index + 1,
					total: snapshot.length,
					name: item.name
				});
				await new Promise((resolve) => window.setTimeout(resolve, 0));
			}
		} finally {
			worker?.terminate();
		}
		if (!directory && zipEntries.length > 0 && !cancelRef.current) downloadBlob(buildZip(zipEntries), "velatura-marcadas.zip");
		setBusy(false);
		setSummary({
			ok,
			failed,
			cancelled: cancelRef.current,
			total: snapshot.length,
			destination: directory ? `pasta ${directory.name}` : ok > 0 ? "arquivo ZIP" : "nenhum arquivo"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-canvas text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex max-w-6xl items-center gap-4 px-4 pt-6 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-11 items-center justify-center rounded-control border border-line bg-surface text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stamp, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl tracking-display text-fg",
						children: "Velatura"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Marca d'água em lote. As fotos originais não são alteradas."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto grid max-w-6xl gap-4 px-4 pb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "order-1 flex min-h-0 min-w-0 flex-col gap-3 rounded-panel border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-medium",
								children: "Fotos"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm tabular-nums text-muted",
								children: items.length
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onDragOver: (event) => {
								event.preventDefault();
								setDragging(true);
							},
							onDrop: (event) => void onDrop(event),
							className: `flex flex-col items-center gap-3 rounded-control border border-dashed px-4 py-4 text-center ${dragging ? "border-accent bg-raised" : "border-line bg-canvas"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
									className: "size-5 text-muted",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Arraste fotos ou pastas para cá."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap justify-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => fileRef.current?.click(),
										disabled: busy,
										children: "Adicionar arquivos"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "secondary",
										onClick: () => folderRef.current?.click(),
										disabled: busy,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
											className: "size-4",
											"aria-hidden": "true"
										}), "Adicionar pasta"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							className: "sr-only",
							type: "file",
							multiple: true,
							accept: "image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp",
							onChange: (event) => {
								addFiles([...event.target.files ?? []]);
								event.target.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: folderRef,
							className: "sr-only",
							type: "file",
							multiple: true,
							onChange: (event) => {
								addFiles([...event.target.files ?? []]);
								event.target.value = "";
							}
						}),
						notes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "rounded-control bg-canvas px-3 py-2 text-sm text-muted",
							children: notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: note }, note))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-faint",
								children: "JPG, PNG, WEBP e BMP"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								disabled: busy || items.length === 0,
								onClick: () => {
									setItems([]);
									setNotes([]);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Limpar"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto",
							children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "px-1 py-6 text-sm text-muted",
								children: "Nenhuma foto na fila."
							}), items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex min-w-0 items-center gap-2 rounded-control px-2 py-1 hover:bg-raised",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate text-sm",
										children: item.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-sm tabular-nums text-faint",
										children: formatSize(item.size)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "flex size-9 items-center justify-center rounded-control text-muted hover:bg-canvas hover:text-fg",
										"aria-label": `Remover ${item.name}`,
										disabled: busy,
										onClick: () => setItems((current) => current.filter((entry) => entry.id !== item.id)),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
											className: "size-4",
											"aria-hidden": "true"
										})
									})
								]
							}, item.id))]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "order-2 flex min-w-0 flex-col gap-4 rounded-panel border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-control bg-canvas",
							children: previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: previewUrl,
								alt: "Pré-visualização da primeira foto com a marca d'água",
								className: "max-h-96 w-full object-contain"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-h-48 items-center justify-center px-6 py-16 text-center text-sm text-muted",
								children: previewError || "A pré-visualização da primeira foto aparece aqui."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: previewMeta || "A prévia usa a primeira foto da fila."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: settings.mode === "text" ? "primary" : "secondary",
								onClick: () => patch({ mode: "text" }),
								children: "Texto"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: settings.mode === "image" ? "primary" : "secondary",
								onClick: () => patch({ mode: "image" }),
								children: "Logo PNG"
							})]
						}),
						settings.mode === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-2 text-sm text-muted",
									children: ["Texto da marca", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: settings.text,
										maxLength: 500,
										rows: 3,
										onChange: (event) => patch({ text: event.target.value }),
										className: "min-h-24 w-full rounded-control border border-line bg-raised px-3 py-2 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-2 text-sm text-muted",
									children: ["Fonte", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: settings.fontFamily,
										onChange: (event) => patch({ fontFamily: event.target.value }),
										className: fieldClass,
										children: FONT_CHOICES.map((font) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: font,
											children: font
										}, font))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex flex-col gap-2 text-sm text-muted",
										children: ["Cor", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "color",
											value: settings.color,
											onChange: (event) => patch({ color: event.target.value }),
											className: "h-11 w-16 cursor-pointer rounded-control border border-line bg-raised",
											"aria-label": "Cor da marca"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex min-w-0 flex-1 flex-col gap-2 text-sm text-muted",
										children: ["Hex", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: settings.color,
											onChange: (event) => patch({ color: event.target.value }),
											className: fieldClass,
											spellCheck: false
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
									label: "Tamanho da fonte",
									value: settings.fontScale,
									min: 50,
									max: 200,
									suffix: "%",
									onChange: (fontScale) => patch({ fontScale })
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									onClick: () => logoRef.current?.click(),
									children: "Escolher PNG"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "min-w-0 truncate text-sm text-muted",
									children: logoName || "Nenhum logo selecionado"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: logoRef,
									className: "sr-only",
									type: "file",
									accept: "image/png,.png",
									onChange: (event) => {
										const file = event.target.files?.[0];
										rememberedLogo.current = file ?? null;
										onLogo(file);
										event.target.value = "";
									}
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
							label: "Tamanho (% da imagem)",
							value: settings.sizePercent,
							min: 5,
							max: 90,
							suffix: "%",
							onChange: (sizePercent) => patch({ sizePercent })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-faint",
							children: settings.mode === "text" ? "Largura do texto em relação à foto. O tamanho da fonte multiplica esse valor." : "Largura do logo em relação à largura da foto."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
							label: "Opacidade",
							value: settings.opacity,
							min: 0,
							max: 100,
							suffix: "%",
							onChange: (opacity) => patch({ opacity })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
							label: "Rotação (horário)",
							value: settings.rotation,
							min: -180,
							max: 180,
							suffix: "°",
							onChange: (rotation) => patch({ rotation })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
							label: "Margem",
							value: settings.margin,
							min: 0,
							max: 20,
							suffix: "%",
							onChange: (margin) => patch({ margin })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-sm text-muted",
							children: "Posição"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2",
							children: POSITIONS.map((position) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: settings.position === position.id ? "primary" : "secondary",
								size: "sm",
								"aria-pressed": settings.position === position.id,
								onClick: () => patch({ position: position.id }),
								children: position.label
							}, position.id))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
							label: "Qualidade JPEG/WEBP",
							value: settings.quality,
							min: 70,
							max: 100,
							onChange: (quality) => patch({ quality })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-2 text-sm text-muted",
							children: ["Sufixo do arquivo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: settings.suffix,
								onChange: (event) => patch({ suffix: event.target.value }),
								className: fieldClass
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 border-t border-line pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-1.5 overflow-hidden rounded-full bg-canvas",
									role: "progressbar",
									"aria-valuemin": 0,
									"aria-valuemax": 100,
									"aria-valuenow": progress.total === 0 ? 0 : Math.round(progress.done / progress.total * 100),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-accent transition-[width] duration-150 ease-out",
										style: { width: `${progress.total === 0 ? 0 : progress.done / progress.total * 100}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: busy ? `${progress.done} de ${progress.total}${progress.name ? ` — ${progress.name}` : ""}` : "A saída é uma cópia. O original permanece onde está."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											disabled: busy,
											onClick: () => void run("zip"),
											children: "Baixar ZIP"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "secondary",
											disabled: busy,
											onClick: () => void run("folder"),
											children: "Salvar numa pasta"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											disabled: !busy,
											onClick: () => cancelRef.current = true,
											children: "Cancelar"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "rounded-control border border-line px-3 py-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
									className: "cursor-pointer text-fg",
									children: "Aplicativo para Windows"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-muted",
									children: [
										"O arquivo ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-fg",
											children: "main.py"
										}),
										" é o programa de janela, com a mesma marca d'água. Baixe os três arquivos, instale o Python e siga o passo a passo para gerar o ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-fg",
											children: ".exe"
										}),
										"."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-wrap gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: "text-fg underline decoration-line underline-offset-4",
											href: "/download/main.py",
											download: "main.py",
											children: "main.py"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: "text-fg underline decoration-line underline-offset-4",
											href: "/download/requirements.txt",
											download: "requirements.txt",
											children: "requirements.txt"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: "text-fg underline decoration-line underline-offset-4",
											href: "/download/LEIA-ME.md",
											download: "LEIA-ME.md",
											children: "passo a passo do .exe"
										})
									]
								})
							]
						})
					]
				})]
			}),
			summary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-20 flex items-end justify-center bg-canvas/80 p-4 sm:items-center",
				role: "presentation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "resultado-titulo",
					className: "w-full max-w-lg rounded-panel border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "resultado-titulo",
							className: "font-display text-2xl tracking-display",
							children: "Resultado"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-fg",
							children: [
								summary.ok,
								" de ",
								summary.total,
								" fotos salvas (",
								summary.destination,
								").",
								summary.cancelled ? " O processamento foi interrompido." : "",
								" As originais não foram alteradas."
							]
						}),
						summary.failed.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 max-h-48 overflow-y-auto text-sm text-muted",
							children: summary.failed.slice(0, 12).map((failure) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								failure.name,
								": ",
								failure.error
							] }, `${failure.name}:${failure.error}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5",
							onClick: () => setSummary(null),
							children: "Fechar"
						})
					]
				})
			})
		]
	});
}
async function writeUnique(dir, filename, blob) {
	const dot = filename.lastIndexOf(".");
	const stem = dot > 0 ? filename.slice(0, dot) : filename;
	const ext = dot > 0 ? filename.slice(dot) : "";
	let chosen = filename;
	for (let n = 0; n < 5e3; n += 1) {
		const candidate = n === 0 ? filename : `${stem} (${n})${ext}`;
		try {
			await dir.getFileHandle(candidate);
		} catch (err) {
			if ((err instanceof DOMException ? err.name : "") === "NotFoundError") {
				chosen = candidate;
				break;
			}
			throw err;
		}
	}
	const writable = await (await dir.getFileHandle(chosen, { create: true })).createWritable();
	await writable.write(blob);
	await writable.close();
}
async function processOne(worker, payload) {
	if (!worker) try {
		const result = await processArrayBuffer(payload);
		const bytes = result.bytes.slice();
		return {
			id: payload.id,
			ok: true,
			name: result.name,
			buffer: bytes.buffer,
			mime: result.mime
		};
	} catch (err) {
		return {
			id: payload.id,
			ok: false,
			name: payload.name,
			error: explainError(err)
		};
	}
	const copy = payload.buffer.slice(0);
	const logoCopy = payload.logoBuffer ? payload.logoBuffer.slice(0) : null;
	return new Promise((resolve, reject) => {
		const onMessage = (event) => {
			if (event.data.id !== payload.id) return;
			cleanup();
			resolve(event.data);
		};
		const onError = (event) => {
			cleanup();
			reject(new Error(event.message || "Falha no processamento"));
		};
		const cleanup = () => {
			worker.removeEventListener("message", onMessage);
			worker.removeEventListener("error", onError);
		};
		worker.addEventListener("message", onMessage);
		worker.addEventListener("error", onError);
		worker.postMessage({
			...payload,
			buffer: copy,
			logoBuffer: logoCopy
		}, logoCopy ? [copy, logoCopy] : [copy]);
	});
}
var SplitComponent = Studio;
//#endregion
export { SplitComponent as component };
