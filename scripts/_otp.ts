import { prisma } from "../src/lib/db";

async function main() {
  const email = process.argv[2];
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return console.log("no user");
  const otp = await prisma.otpCode.findFirst({
    where: { userId: user.id, consumed: false },
    orderBy: { createdAt: "desc" },
  });
  console.log(otp?.code ?? "no otp");
}
main().finally(() => prisma.$disconnect());
