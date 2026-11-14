import { MAX_QUOTE_IMAGE_BYTES, MAX_QUOTE_IMAGES, MAX_QUOTE_IMAGES_BYTES, isHeicImage, quoteSourceImageError } from "./quoteImage.mjs";

async function convertHeic(file) {
  // Only load the decoder when needed; keep it out of server rendering.
  const { heicTo } = await import("heic-to/csp");
  return heicTo({ blob: file, type: "image/jpeg", quality: 0.85 });
}

// Resize in the browser so full-size phone photos never hit the upload API.
export async function prepareQuoteImage(file, browser = globalThis, heicConverter = convertHeic, maxBytes = MAX_QUOTE_IMAGE_BYTES) {
  const error = quoteSourceImageError(file);
  if (error) throw new Error(error);
  if (!file) return file;
  const isHeic = isHeicImage(file);
  if (!isHeic && file.size <= maxBytes) return file;

  let source = file;
  if (isHeic) {
    try {
      source = await heicConverter(file);
      if (!source || source.type !== "image/jpeg" || !source.size) throw new Error("Invalid conversion");
    } catch {
      throw new Error("This HEIC photo could not be converted. Please choose another photo or export it as a JPG.");
    }
  }

  const url = browser.URL.createObjectURL(source);
  try {
    const image = new browser.Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("This image could not be read. Please choose another JPG, PNG or WebP photo."));
      image.src = url;
    });
    const canvas = browser.document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context || !image.naturalWidth || !image.naturalHeight) {
      throw new Error("Your photo could not be resized. Please choose another photo.");
    }
    for (const maxDimension of [2560, 1920, 1280, 960, 640]) {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      // JPEG has no transparency; keep transparent areas white.
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.85, 0.7, 0.55]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) throw new Error("Your photo could not be resized. Please choose another photo.");
        if (blob.type === "image/jpeg" && blob.size > 0 && blob.size <= maxBytes) {
          return new browser.File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
        }
      }
    }
    throw new Error("Your photo is still too large after resizing. Please choose another photo.");
  } finally {
    browser.URL.revokeObjectURL(url);
  }
}

export async function prepareQuoteImages(files, browser = globalThis, heicConverter = convertHeic) {
  if (files.length > MAX_QUOTE_IMAGES) throw new Error(`Please choose up to ${MAX_QUOTE_IMAGES} photos.`);
  // Validate the whole selection before spending time converting any photo.
  for (const file of files) {
    const error = quoteSourceImageError(file);
    if (error) throw new Error(`${file.name}: ${error}`);
  }
  const maxBytes = Math.floor(MAX_QUOTE_IMAGES_BYTES / Math.max(1, files.length));
  const images = [];
  // Decode sequentially to limit memory use on phones, especially with HEIC.
  for (const file of files) {
    try {
      images.push(await prepareQuoteImage(file, browser, heicConverter, maxBytes));
    } catch (error) {
      throw new Error(`${file.name}: ${error.message}`);
    }
  }
  return images;
}
