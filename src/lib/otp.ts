import { prisma } from "@/lib/db";
import { sendCodeEmail } from "@/lib/mailer";

const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Creates and sends a sign-in code for an existing user. Returns false if no account has that email. */
export async function requestSignInCode(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return false;

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId: user.id, code, expiresAt },
  });

  await sendCodeEmail(email, code);
  return true;
}

/** Verifies a code for an email, consuming it on success. Returns the userId if valid. */
export async function verifySignInCode(
  email: string,
  code: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      code,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return null;

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  return user.id;
}
