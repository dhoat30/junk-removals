import sharp from "sharp";
import { sendHubspotMultiplePhotos } from "./hubspotMultiplePhotos.mjs";
import { randomUUID } from "node:crypto";
import { quoteImagesError } from "../quoteImage.mjs";
import { getEmailConfiguration, validEmail } from "./emailConfig.mjs";

export class SubmissionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readSubmission(req) {
  // Leave room for multipart boundaries and the existing quote fields.
  if (Number(req.headers.get("content-length")) > 4 * 1024 * 1024) {
    throw new SubmissionError("The photos are too large together. Please remove some photos and try again.", 413);
  }
  let payload;
  let images = [];
  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      payload = JSON.parse(form.get("payload"));
      images = form.getAll("image");
    } else {
      payload = await req.json();
    }
  } catch (error) {
    if (error instanceof SubmissionError) throw error;
    throw new SubmissionError("Invalid form submission.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new SubmissionError("Invalid form submission.");
  }
  if (payload.hasImage && !images.length) {
    throw new SubmissionError("The selected photo was missing from the request. Please choose it again and retry.");
  }
  if (payload.imageCount !== undefined && (!Number.isInteger(payload.imageCount) || payload.imageCount !== images.length)) {
    throw new SubmissionError("Not all selected photos arrived. Please choose them again and retry.");
  }
  if (images.some(image => !image || typeof image.arrayBuffer !== "function")) throw new SubmissionError("Invalid image upload.");
  const validationError = quoteImagesError(images);
  if (validationError) throw new SubmissionError(validationError);
  const validatedImages = [];
  for (const image of images) {
    const bytes = Buffer.from(await image.arrayBuffer());
    try {
      // Decode the image as well as checking its declared MIME type.
      const metadata = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
      const formatTypes = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
      if (formatTypes[metadata.format] !== image.type || !metadata.width || !metadata.height) {
        throw new Error("Unsupported image");
      }
      await sharp(bytes, { limitInputPixels: 40000000 }).stats();
      validatedImages.push(new File([bytes], `quote-photo-${randomUUID()}.${metadata.format === "jpeg" ? "jpg" : metadata.format}`, { type: image.type }));
    } catch {
      throw new SubmissionError("This image could not be read. Please choose another JPG, PNG or WebP photo.");
    }
  }
  return { payload, images: validatedImages, image: validatedImages[0] || null };
}

const imageList = image => Array.isArray(image) ? image : image ? [image] : [];

export async function sendHubspotSubmission(payload, image, fetcher = fetch) {
  const images = imageList(image);
  const token = process.env.HUBSPOT_API_KEY;
  const { portalID, hubspotFormID } = payload;
  if (!token || !portalID || !hubspotFormID) {
    throw new SubmissionError("Missing HubSpot configuration.", 503);
  }
  if (!/^\d+$/.test(portalID) || !/^[\da-f-]+$/i.test(hubspotFormID) || !Array.isArray(payload.hubspotFormObject)) {
    throw new SubmissionError("Invalid HubSpot form submission.");
  }
  const headers = { Authorization: `Bearer ${token}` };
  const fields = payload.hubspotFormObject.filter(field => field?.name && field.value !== undefined && field.value !== null).map(field => ({ ...field }));

  if (payload.hubspotFileField && !/^[a-z][a-z0-9_]*$/.test(payload.hubspotFileField)) {
    throw new SubmissionError("Invalid HubSpot photo field.");
  }
  if (images.length > 1 && payload.hubspotFileField) {
    try {
      await sendHubspotMultiplePhotos(payload, images, fields, fetcher);
    } catch (error) {
      throw new SubmissionError(error.message || "HubSpot could not receive your photos. Please try again.", 502);
    }
    return;
  }

  const photoReferences = [];
  for (const image of images) {
    const upload = new FormData();
    upload.append("file", image, image.name);
    upload.append("folderPath", "/quote-photos");
    upload.append("options", JSON.stringify({ access: "PRIVATE" }));
    const response = await fetcher("https://api.hubapi.com/files/v3/files", { method: "POST", headers, body: upload });
    if (!response.ok) throw new SubmissionError("The photo could not be saved to HubSpot. Please try again.", 502);
    const file = await response.json();
    if (!/^\d+$/.test(String(file.id))) throw new SubmissionError("HubSpot did not return a photo reference.", 502);
    // The authenticated redirect keeps the stored file private and the reference durable.
    const fileLink = `https://api.hubapi.com/filemanager/api/v2/files/${file.id}/signed-url-redirect?portalId=${portalID}`;
    const photoDetails = `Photo: ${image.name}\nView photo in HubSpot (sign-in required): ${fileLink}\nHubSpot file ID: ${file.id}`;
    if (payload.hubspotFileField) {
      if (!/^[a-z][a-z0-9_]*$/.test(payload.hubspotFileField)) {
        throw new SubmissionError("Invalid HubSpot photo field.");
      }
      // HubSpot imports file-field URLs server-side. An authenticated UI
      // redirect downloads the login HTML, not the image. A signed URL lets
      // HubSpot copy the private image into its own form-upload storage.
      const signedResponse = await fetcher(`https://api.hubapi.com/files/v3/files/${file.id}/signed-url`, { headers });
      if (!signedResponse.ok) throw new SubmissionError("HubSpot could not prepare the photo for the form. Please try again.", 502);
      const signed = await signedResponse.json();
      let signedUrl;
      try {
        signedUrl = new URL(signed.url);
        if (signedUrl.protocol !== "https:") throw new Error("Invalid photo URL");
      } catch {
        throw new SubmissionError("HubSpot did not return a valid photo download URL.", 502);
      }
      // Verify what HubSpot will download before accepting the submission.
      // Never send our bearer token to the signed download URL.
      const download = await fetcher(signedUrl.href, { redirect: "error" });
      const downloadedType = download.headers.get("content-type")?.split(";")[0];
      if (!download.ok || downloadedType !== image.type) {
        throw new SubmissionError("Your photo could not be attached. Please try again.", 502);
      }
      try {
        // HubSpot can rewrite image metadata while leaving the picture intact.
        // Validate the decoded image, not byte-for-byte file identity.
        const downloadedBytes = Buffer.from(await download.arrayBuffer());
        const options = { limitInputPixels: 40000000 };
        const originalMetadata = await sharp(Buffer.from(await image.arrayBuffer()), options).metadata();
        const downloadedImage = sharp(downloadedBytes, options);
        const downloadedMetadata = await downloadedImage.metadata();
        if (downloadedMetadata.format !== originalMetadata.format || downloadedMetadata.width !== originalMetadata.width || downloadedMetadata.height !== originalMetadata.height) {
          throw new Error("Unexpected image format or dimensions");
        }
        await downloadedImage.stats();
      } catch {
        throw new SubmissionError("Your photo could not be attached. Please try again.", 502);
      }
      const photoField = fields.find(field => field.name === payload.hubspotFileField);
      if (photoField) photoField.value = signedUrl.href;
      else fields.push({ name: payload.hubspotFileField, value: signedUrl.href });
    } else {
      photoReferences.push(photoDetails);
    }
  }

  if (photoReferences.length) {
    const message = fields.find(field => field.name === "message");
    const details = photoReferences.join("\n\n");
    if (message) message.value = `${message.value || ""}\n\n${details}`;
    else fields.push({ name: "message", value: details });
  }

  const response = await fetcher(`https://api.hsforms.com/submissions/v3/integration/secure/submit/${portalID}/${hubspotFormID}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      submittedAt: Date.now(),
      fields,

    }),
  });
  if (!response.ok) throw new SubmissionError("HubSpot submission failed. Please try again.", 502);
}

export async function sendAdminEmail(payload, image, fetcher = fetch) {
  const images = imageList(image);
  let configuration;
  try { configuration = getEmailConfiguration(); }
  catch (error) { throw new SubmissionError(error.message, 503); }
  const { domain, apiKey, recipient, from } = configuration;
  const { email, message, formName } = payload;
  if (!validEmail(email) || typeof message !== "string" || typeof formName !== "string" || /[\r\n]/.test(formName)) {
    throw new SubmissionError("Invalid email submission.");
  }
  const body = new FormData();
  body.append("from", from);
  body.append("h:Reply-To", email);
  body.append("to", recipient);
  body.append("subject", formName);
  body.append("text", `${message}${images.length === 1 ? "\n\nA photo of the items is attached." : images.length ? `\n\n${images.length} photos of the items are attached.` : ""}`);
  for (const image of images) body.append("attachment", image, image.name);
  const response = await fetcher(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
    body,
  });
  if (!response.ok) throw new SubmissionError("The admin email could not be sent. Please try again.", 502);
}
