import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasEmailFrom: !!process.env.EMAIL_FROM,
    hasRedirectTo: !!process.env.EMAIL_REDIRECT_TO,
    redirectToLength: process.env.EMAIL_REDIRECT_TO?.length ?? 0,
  });
}
