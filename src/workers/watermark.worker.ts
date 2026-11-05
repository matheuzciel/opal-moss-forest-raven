import { explainError, processArrayBuffer, type MarkSettings } from "../lib/watermark";

type InMessage = {
  id: number;
  name: string;
  buffer: ArrayBuffer;
  mime: string;
  settings: MarkSettings;
  logoBuffer: ArrayBuffer | null;
};

type OutMessage =
  | { id: number; ok: true; name: string; buffer: ArrayBuffer; mime: string }
  | { id: number; ok: false; name: string; error: string };

interface MarkWorkerScope {
  onmessage: ((this: MarkWorkerScope, event: MessageEvent<InMessage>) => void) | null;
  postMessage(message: OutMessage, transfer?: Transferable[]): void;
}

const scope = self as unknown as MarkWorkerScope;

scope.onmessage = async (event: MessageEvent<InMessage>) => {
  const message = event.data;
  try {
    const result = await processArrayBuffer(message);
    const bytes =
      result.bytes.byteOffset === 0 && result.bytes.byteLength === result.bytes.buffer.byteLength
        ? result.bytes
        : result.bytes.slice();
    const response: OutMessage = {
      id: message.id,
      ok: true,
      name: result.name,
      buffer: bytes.buffer as ArrayBuffer,
      mime: result.mime,
    };
    scope.postMessage(response, [bytes.buffer]);
  } catch (err) {
    const response: OutMessage = {
      id: message.id,
      ok: false,
      name: message.name,
      error: explainError(err),
    };
    scope.postMessage(response);
  }
};
