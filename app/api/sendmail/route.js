import { NextResponse } from "next/server";
import { readSubmission, sendAdminEmail, SubmissionError } from "@/utils/server/formSubmissions.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { payload, image } = await readSubmission(req);
    await sendAdminEmail(payload, image);
    return NextResponse.json({ message: "Email sent", success: true, imageReceived: Boolean(image) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof SubmissionError ? error.message : "Unable to send the email. Please try again.", success: false }, { status: error instanceof SubmissionError ? error.status : 500 });
  }
}
