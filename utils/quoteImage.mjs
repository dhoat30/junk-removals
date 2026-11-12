export const MAX_QUOTE_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_QUOTE_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
export const QUOTE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function quoteImageError(file, maxBytes = MAX_QUOTE_IMAGE_BYTES) {
  if (!file) return "";
  if (!QUOTE_IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (!file.size) return "This image is empty. Please choose another photo.";
  if (file.size > maxBytes) return `Please choose an image smaller than ${maxBytes / 1024 / 1024} MB.`;
  return "";
}
