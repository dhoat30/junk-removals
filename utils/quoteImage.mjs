export const MAX_QUOTE_IMAGE_BYTES = 3 * 1024 * 1024;
export const QUOTE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function quoteImageError(file) {
  if (!file) return "";
  if (!QUOTE_IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (!file.size) return "This image is empty. Please choose another photo.";
  if (file.size > MAX_QUOTE_IMAGE_BYTES) return "Please choose an image smaller than 3 MB.";
  return "";
}
