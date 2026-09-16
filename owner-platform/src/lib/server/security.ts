export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function deploymentOrigin(
  env: Record<string, string | undefined>,
): string | undefined {
  return env.VERCEL_ENV === "preview" && env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : env.APP_URL;
}
export function privateResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
export const MAX_UPLOAD = 4 * 1024 * 1024;
export function assertOrigin(request: Request, appUrl: string) {
  if (request.headers.get("origin") !== new URL(appUrl).origin)
    throw new HttpError(403, "Request origin is not allowed.");
}
export function parseVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new HttpError(400, "A valid draft version is required.");
  return value;
}
export function detectImage(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_UPLOAD)
    throw new HttpError(400, "Images must be between 1 byte and 4 MB.");
  const signature = (...values: number[]) =>
    values.every((v, i) => bytes[i] === v);
  if (signature(137, 80, 78, 71, 13, 10, 26, 10))
    return { mime: "image/png", extension: "png" };
  if (signature(255, 216, 255)) return { mime: "image/jpeg", extension: "jpg" };
  const prefix = new TextDecoder().decode(bytes.slice(0, 12));
  if (prefix.startsWith("GIF87a") || prefix.startsWith("GIF89a"))
    return { mime: "image/gif", extension: "gif" };
  if (prefix.startsWith("RIFF") && prefix.slice(8) === "WEBP")
    return { mime: "image/webp", extension: "webp" };
  throw new HttpError(
    400,
    "Upload a PNG, JPEG, GIF or WebP image. SVG and other file types are not supported.",
  );
}
export async function jsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Expected JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_UPLOAD) {
      await reader.cancel();
      throw new HttpError(413, "Request exceeds 4 MB.");
    }
    chunks.push(value);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || Array.isArray(data) || typeof data !== "object")
      throw new Error();
    return data;
  } catch {
    throw new HttpError(400, "Invalid JSON request.");
  }
}
