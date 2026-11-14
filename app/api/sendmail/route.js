import { NextResponse } from "next/server";
import { readSubmission, SubmissionError } from "@/utils/server/formSubmissions.mjs";
import { sendEnquiryEmails, EnquiryEmailError } from "@/utils/server/enquiryEmails.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { payload, images } = await readSubmission(req);
    const confirmation = await sendEnquiryEmails(payload, images);
    return NextResponse.json({ message: "Email sent", success: true, imageReceived: images.length > 0, imageCount: images.length, ...confirmation });
  } catch (error) {
    return NextResponse.json({ message: error instanceof SubmissionError ? error.message : "Unable to send the email. Please try again.", success: false, ...(error instanceof EnquiryEmailError ? { adminEmailReceipt: error.adminEmailReceipt } : {}) }, { status: error instanceof SubmissionError ? error.status : 500 });
  }
}
