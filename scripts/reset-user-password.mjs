import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    email: "",
    password: "",
    makeAdmin: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--email") {
      parsed.email = args[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--password") {
      parsed.password = args[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--make-admin") {
      parsed.makeAdmin = true;
    }
  }

  return parsed;
};

const validatePassword = (password) => {
  if (password.length < 10) {
    return "Password must be at least 10 characters.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a symbol.";
  }
  return null;
};

const main = async () => {
  const { email, password, makeAdmin } = parseArgs();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Missing --email");
  }

  if (!password) {
    throw new Error("Missing --password");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error(`User not found for email: ${normalizedEmail}`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      passwordHash,
      ...(makeAdmin ? { role: Role.ADMIN } : {}),
    },
  });

  console.log(
    `Password updated for ${normalizedEmail}${makeAdmin ? " and role set to ADMIN" : ""}.`,
  );
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
