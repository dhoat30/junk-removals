// Create a fresh multipart request for each destination. Fetch sets the
// boundary; setting a JSON Content-Type would strip the file from the request.
export async function submitQuote(endpoint, payload, image, fetcher = fetch) {
  const body = new FormData();
  body.append("payload", JSON.stringify({ ...payload, hasImage: Boolean(image) }));
  if (image) body.append("image", image, image.name);

  const response = await fetcher(endpoint, { method: "POST", body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Your quote request could not be sent. Please try again.");
  }
  if (image && result.imageReceived !== true) {
    throw new Error("Your photo was not confirmed. Please try again before leaving this page.");
  }
  return result;
}
