// Follow the published v4 form embed's two-step file protocol. Multiple signed
// URLs in a single integration-API value can otherwise be imported as one file.
const formsHost = "https://forms.hsforms.com";

function submissionResult(text) {
  try { return JSON.parse(text); } catch { /* The native iframe endpoint may return HTML. */ }
  // Read the JSON object in its postMessage script without executing any code.
  // Scan balanced braces so validation messages containing braces are safe.
  for (const script of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const content = script[1];
    for (const match of content.matchAll(/\{(?=\s*"(?:accepted|formGuid|conversionId|validationResults|status)")/g)) {
      let depth = 0, quoted = false, escaped = false;
      for (let end = match.index; end < content.length; end++) {
        const char = content[end];
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === "{") depth++;
        else if (char === "}" && --depth === 0) {
          try {
            const result = JSON.parse(content.slice(match.index, end + 1));
            if (typeof result.accepted === "boolean" && result.formGuid) return result;
          } catch { /* Ignore other script objects. */ }
          break;
        }
      }
    }
  }
  return null;
}

export async function sendHubspotMultiplePhotos(payload, images, fields, fetcher) {
  const { portalID, hubspotFormID, hubspotFileField } = payload;
  const definitionResponse = await fetcher(`${formsHost}/embed/v4/render-definition/${portalID}/${hubspotFormID}`);
  if (!definitionResponse.ok) throw new Error("HubSpot could not load the photo upload settings. Please try again.");
  const definition = await definitionResponse.json();
  const fileReference = `0-1/${hubspotFileField}`;
  const modules = [];
  const visit = module => {
    if (!module || typeof module !== "object") return;
    if (module.propertyReference === fileReference && module.type === "file") modules.push(module);
    for (const child of module.modules || []) visit(child);
  };
  visit(definition.form);
  if (!modules.some(module => module.allowMultipleFiles === true)) {
    throw new Error("HubSpot is not ready to receive multiple photos. Please try again later.");
  }

  const upload = new FormData();
  for (const image of images) upload.append(fileReference, image, image.name);
  const uploadResponse = await fetcher(`${formsHost}/submissions-files/v1/upload/files?formGuid=${hubspotFormID}&portalId=${portalID}&locale=en`, { method: "POST", body: upload });
  if (uploadResponse.status !== 202) throw new Error("HubSpot could not receive all your photos. Please try again.");
  const { uploadGuid } = await uploadResponse.json();
  if (typeof uploadGuid !== "string" || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(uploadGuid)) {
    throw new Error("HubSpot did not confirm your photo upload. Please try again.");
  }
  const body = new FormData();
  const fieldValues = {};
  for (const field of fields) {
    if (field.name !== hubspotFileField) fieldValues[`0-1/${field.name}`] = String(field.value);
  }
  fieldValues[fileReference] = uploadGuid;
  for (const [name, value] of Object.entries(fieldValues)) body.append(name, value);
  body.append("hs_context", JSON.stringify({
    source: "forms-embed-static", sourceName: "forms-embed", sourceVersion: "1.0",
    sourceVersionMajor: "1", sourceVersionMinor: "0",
    locale: (definition.settings?.locale || "en").toLowerCase(),
    formDefinitionUpdatedAt: definition.form.lastUpdatedAt,
    pageUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.junkremovals.co.nz",
    pageTitle: payload.formName,
    fieldValues, renderedFieldsIds: Object.keys(fieldValues), shortenedFieldsIds: [],
    boolCheckBoxFields: "", emailResubscribeStatus: "NOT_APPLICABLE", captchaStatus: "NOT_APPLICABLE",
  }));
  const response = await fetcher(`${formsHost}/submissions/v3/public/submit/formsnext/multipart/${portalID}/${hubspotFormID}`, { method: "POST", body });
  const result = response.ok ? submissionResult(await response.text()) : null;
  if (result?.accepted !== true || result.formGuid !== hubspotFormID) {
    throw new Error("HubSpot could not confirm your quote and photos. Please try again.");
  }
}
