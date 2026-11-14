export const MAX_QUOTE_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_QUOTE_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_QUOTE_IMAGES = 10;
// Keep the full multipart request below the existing hosting request limit.
export const MAX_QUOTE_IMAGES_BYTES = 3 * 1024 * 1024;
export const QUOTE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_IMAGE_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
export const QUOTE_IMAGE_SOURCE_ACCEPT = [...QUOTE_IMAGE_TYPES, ...HEIC_IMAGE_TYPES, ".heic", ".heif"].join(",");

export function isHeicImage(file) {
  if (!file) return false;
  const type = (file.type || "").toLowerCase();
  // Some file pickers provide no MIME type for HEIC. Respect JPEG MIME types
  // when iOS has already converted a photo but retained its original name.
  return HEIC_IMAGE_TYPES.includes(type) ||
    ((!type || type === "application/octet-stream") && /\.hei[cf]$/i.test(file.name || ""));
}

export function quoteSourceImageError(file) {
  const candidate = isHeicImage(file) ? { type: "image/jpeg", size: file.size } : file;
  return quoteImageError(candidate, MAX_QUOTE_SOURCE_IMAGE_BYTES)
    .replace("JPG, PNG or WebP", "JPG, PNG, WebP or HEIC");
}

export function quoteImageError(file, maxBytes = MAX_QUOTE_IMAGE_BYTES) {
  if (!file) return "";
  if (!QUOTE_IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (!file.size) return "This image is empty. Please choose another photo.";
  if (file.size > maxBytes) return `Please choose an image smaller than ${maxBytes / 1024 / 1024} MB.`;
  return "";
}

export function quoteImagesError(images) {
  if (images.length > MAX_QUOTE_IMAGES) return `Please choose up to ${MAX_QUOTE_IMAGES} photos.`;
  for (const image of images) {
    const error = quoteImageError(image);
    if (error) return error;
  }
  if (images.reduce((total, image) => total + image.size, 0) > MAX_QUOTE_IMAGES_BYTES) {
    return "The photos are too large together. Please remove some photos and try again.";
  }
  return "";
}
