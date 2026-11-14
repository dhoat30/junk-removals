import { NextResponse } from "next/server";
import { readSubmission, sendHubspotSubmission, SubmissionError } from "@/utils/server/formSubmissions.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { payload, images } = await readSubmission(req);
    await sendHubspotSubmission(payload, images);
    return NextResponse.json({ message: "Submission received", success: true, imageReceived: images.length > 0, imageCount: images.length });
  } catch (error) {
    return NextResponse.json({ message: error instanceof SubmissionError ? error.message : "Unable to submit the form. Please try again.", success: false }, { status: error instanceof SubmissionError ? error.status : 500 });
  }
}
