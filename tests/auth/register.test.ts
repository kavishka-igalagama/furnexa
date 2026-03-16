import { describe, expect, it, vi, afterEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { resetRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
  },
}));

const { prisma } = await import("@/lib/db");
const prismaMock = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const buildRequest = (body: unknown, ip = "10.1.1.1") =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });

afterEach(() => {
  resetRateLimit();
});

describe("POST /api/auth/register", () => {
  it("rejects weak passwords", async () => {
    const res = await POST(
      buildRequest({
        name: "Test User",
        email: "user@example.com",
        password: "weakpass",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("normalizes email and creates user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user-1" });

    const res = await POST(
      buildRequest({
        name: "Test User",
        email: "User@Example.com ",
        password: "StrongPass1!",
      }),
    );

    expect(res.status).toBe(201);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });

  it("rate limits repeated sign-up attempts", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user-1" });

    for (let i = 0; i < 5; i += 1) {
      const res = await POST(
        buildRequest({
          name: "Test User",
          email: `user${i}@example.com`,
          password: "StrongPass1!",
        }),
      );
      expect([201, 409]).toContain(res.status);
    }

    const res = await POST(
      buildRequest({
        name: "Test User",
        email: "blocked@example.com",
        password: "StrongPass1!",
      }),
    );
    expect(res.status).toBe(429);
  });
});
