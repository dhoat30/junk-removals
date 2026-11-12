import { MAX_QUOTE_IMAGE_BYTES, MAX_QUOTE_SOURCE_IMAGE_BYTES, quoteImageError } from "./quoteImage.mjs";

// Resize in the browser so full-size phone photos never hit the upload API.
export async function prepareQuoteImage(file, browser = globalThis) {
  const error = quoteImageError(file, MAX_QUOTE_SOURCE_IMAGE_BYTES);
  if (error) throw new Error(error);
  if (!file || file.size <= MAX_QUOTE_IMAGE_BYTES) return file;

  const url = browser.URL.createObjectURL(file);
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
    for (const maxDimension of [2560, 1920, 1280]) {
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
        if (blob.type === "image/jpeg" && blob.size > 0 && blob.size <= MAX_QUOTE_IMAGE_BYTES) {
          return new browser.File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
        }
      }
    }
    throw new Error("Your photo is still too large after resizing. Please choose another photo.");
  } finally {
    browser.URL.revokeObjectURL(url);
  }
}
