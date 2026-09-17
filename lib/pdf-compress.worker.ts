import { PDFDocument, PDFDict, PDFName, PDFNumber, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { DOCUMENT_LIMIT, SOURCE_LIMIT } from "./portal-documents";

const name = PDFName.of;
const status = (message: string) => self.postMessage({ type: "progress", message });
const done = (bytes: Uint8Array, imagesChanged: boolean, pages: number) => {
  self.postMessage({ type: "done", bytes, imagesChanged, pages });
};

self.onmessage = async (event: MessageEvent<{ bytes: ArrayBuffer }>) => {
  try {
    const original = new Uint8Array(event.data.bytes);
    if (!original.length || original.length > SOURCE_LIMIT) throw new Error("Choose a PDF up to 50 MB.");
    if (!new TextDecoder().decode(original.slice(0, 8)).startsWith("%PDF-")) throw new Error("This file is not a PDF.");
    status("Checking PDF…");
    let pdf: PDFDocument;
    try { pdf = await PDFDocument.load(original, { updateMetadata: false }); }
    catch { throw new Error("This PDF is damaged or password-protected. Export an unlocked PDF and try again."); }
    const pages = pdf.getPageCount();
    if (!pages) throw new Error("This PDF has no pages.");
    // Do not rewrite PDFs that already meet the limit (including signed documents).
    if (original.length < DOCUMENT_LIMIT) { done(original, false, pages); return; }
    const objects = pdf.context.enumerateIndirectObjects();
    const signed = objects.some(([, obj]) => obj instanceof PDFDict && (obj.has(name("ByteRange")) || obj.get(name("Type")) === name("Sig")));
    if (signed) throw new Error("This PDF has a digital signature. Compression would invalidate it. Upload a signed copy below 5 MB.");

    status("Optimising PDF structure…");
    let best = await pdf.save({ useObjectStreams: true, updateFieldAppearances: false });
    if (best.length < DOCUMENT_LIMIT) { done(best, false, pages); return; }
    if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") throw new Error("Automatic image compression is unavailable in this browser. Use a recent Chrome, Edge or Safari, or select a PDF below 5 MB.");

    // Keep text, vectors, page dimensions, links and forms. Recompress only
    // supported opaque 8-bit RGB/gray images, never rasterise whole pages.
    const images = objects.filter(([, obj]) => {
      if (!(obj instanceof PDFRawStream)) return false;
      const dict = obj.dict;
      const filter = dict.get(name("Filter"));
      const colour = dict.get(name("ColorSpace"));
      const bits = dict.get(name("BitsPerComponent"));
      const width = dict.get(name("Width"));
      const height = dict.get(name("Height"));
      return dict.get(name("Subtype")) === name("Image")
        && (filter === name("DCTDecode") || filter === name("FlateDecode"))
        && (colour === name("DeviceRGB") || colour === name("DeviceGray"))
        && bits instanceof PDFNumber && bits.asNumber() === 8
        && width instanceof PDFNumber && height instanceof PDFNumber
        && width.asNumber() > 0 && height.asNumber() > 0
        && width.asNumber() * height.asNumber() <= 25_000_000
        && !["SMask", "Mask", "Decode", "ImageMask", "SMaskInData"].some(key => dict.has(name(key)));
    });
    let changed = false;
    for (const [pass, preset] of [{ edge: 3600, quality: 0.85 }, { edge: 2800, quality: 0.75 }, { edge: 2200, quality: 0.65 }].entries()) {
      for (const [index, [ref, obj]] of images.entries()) {
        status(`Compressing images: pass ${pass + 1} of 3, image ${index + 1} of ${images.length}…`);
        const image = obj as PDFRawStream;
        const width = (image.dict.get(name("Width")) as PDFNumber).asNumber();
        const height = (image.dict.get(name("Height")) as PDFNumber).asNumber();
        let bitmap: ImageBitmap | undefined;
        try {
          if (image.dict.get(name("Filter")) === name("DCTDecode")) {
            bitmap = await createImageBitmap(new Blob([new Uint8Array(image.contents)], { type: "image/jpeg" }));
          } else {
            const channels = image.dict.get(name("ColorSpace")) === name("DeviceRGB") ? 3 : 1;
            const raw = decodePDFRawStream(image).decode();
            if (raw.length !== width * height * channels) continue;
            const rgba = new Uint8ClampedArray(width * height * 4);
            for (let pixel = 0; pixel < width * height; pixel++) {
              rgba[pixel * 4] = raw[pixel * channels];
              rgba[pixel * 4 + 1] = raw[pixel * channels + (channels === 3 ? 1 : 0)];
              rgba[pixel * 4 + 2] = raw[pixel * channels + (channels === 3 ? 2 : 0)];
              rgba[pixel * 4 + 3] = 255;
            }
            bitmap = await createImageBitmap(new ImageData(rgba, width, height));
          }
          const scale = Math.min(1, preset.edge / Math.max(width, height));
          const canvas = new OffscreenCanvas(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const jpeg = new Uint8Array(await (await canvas.convertToBlob({ type: "image/jpeg", quality: preset.quality })).arrayBuffer());
          const current = pdf.context.lookup(ref);
          if (!(current instanceof PDFRawStream) || jpeg.length >= current.contents.length) continue;
          const dict = image.dict.clone(pdf.context);
          dict.set(name("Filter"), name("DCTDecode"));
          dict.set(name("ColorSpace"), name("DeviceRGB"));
          dict.set(name("Width"), PDFNumber.of(canvas.width));
          dict.set(name("Height"), PDFNumber.of(canvas.height));
          dict.delete(name("DecodeParms"));
          dict.set(name("Length"), PDFNumber.of(jpeg.length));
          pdf.context.assign(ref, PDFRawStream.of(dict, jpeg));
          changed = true;
        } catch {
          // Unsupported image encoding: preserve this image instead of corrupting it.
        } finally { bitmap?.close(); }
      }
      best = await pdf.save({ useObjectStreams: true, updateFieldAppearances: false });
      if (best.length < DOCUMENT_LIMIT) { done(best, changed, pages); return; }
    }
    throw new Error(`This PDF is still ${(Math.min(best.length, original.length) / 1_000_000).toFixed(2)} MB after compression. Export a smaller PDF or split it into separate documents. Nothing was uploaded.`);
  } catch (error) {
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : "Unable to prepare this PDF." });
  }
};
