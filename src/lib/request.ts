const getHeaderValue = (headers: unknown, key: string) => {
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(key);
  }
  return (headers as Record<string, string | string[] | undefined>)[key] ?? null;
};

export const getClientIp = (
  req: Request | { headers?: unknown } | null,
) => {
  if (!req) return "unknown";
  const headers = "headers" in req ? req.headers : undefined;
  const forwarded = getHeaderValue(headers, "x-forwarded-for");
  const realIp = getHeaderValue(headers, "x-real-ip");
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp;
  }
  return "unknown";
};
