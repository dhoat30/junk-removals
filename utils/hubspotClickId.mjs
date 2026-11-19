// Use HubSpot's existing Google Click ID contact property. Omit missing IDs so
// an organic enquiry cannot clear attribution already saved on the contact.
export function hubspotClickIdFields(clickIds) {
  const value = typeof clickIds?.gclid === "string" ? clickIds.gclid.trim() : "";
  if (!value || value.length > 512 || !/^[A-Za-z0-9._~-]+$/.test(value)) return [];
  return [{ name: "hs_google_click_id", value }];
}
