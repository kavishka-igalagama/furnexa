import { describe, expect, it, vi, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { authorizeCredentials } from "@/lib/auth";
import { resetRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

const { prisma } = await import("@/lib/db");
const prismaMock = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

afterEach(() => {
  resetRateLimit();
});

describe("authOptions Credentials authorize", () => {
  it("returns user for valid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "USER",
      passwordHash: "hash",
    });
    (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      true,
    );

    const user = await authorizeCredentials(
      { email: "USER@EXAMPLE.COM", password: "StrongPass1!" },
      { headers: new Headers({ "x-forwarded-for": "10.1.1.1" }) } as Request,
    );

    expect(user).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "USER",
    });
  });

  it("returns null for invalid password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "USER",
      passwordHash: "hash",
    });
    (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );

    const user = await authorizeCredentials(
      { email: "user@example.com", password: "WrongPass1!" },
      { headers: new Headers({ "x-forwarded-for": "10.1.1.1" }) } as Request,
    );

    expect(user).toBeNull();
  });
});
