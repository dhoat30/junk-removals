// Create a fresh multipart request for each destination. Fetch sets the
// boundary; setting a JSON Content-Type would strip the file from the request.
export async function submitQuote(endpoint, payload, image, fetcher = fetch) {
  const images = Array.isArray(image) ? image : image ? [image] : [];
  const body = new FormData();
  body.append("payload", JSON.stringify({ ...payload, hasImage: images.length > 0, imageCount: images.length }));
  for (const file of images) body.append("image", file, file.name);

  const response = await fetcher(endpoint, { method: "POST", body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    const error = new Error(result.message || "Your quote request could not be sent. Please try again.");
    if (typeof result.adminEmailReceipt === "string") error.adminEmailReceipt = result.adminEmailReceipt;
    throw error;
  }
  if (images.length && result.imageReceived !== true) {
    throw new Error("Your photo was not confirmed. Please try again before leaving this page.");
  }
  if (images.length && result.imageCount !== images.length) {
    throw new Error("Not all your photos were confirmed. Please try again before leaving this page.");
  }
  return result;
}
