import { endpoint } from "../../../lib/server/http";
import { requireOwner } from "../../../lib/server/supabase";
import {
  detectImage,
  HttpError,
  MAX_UPLOAD,
} from "../../../lib/server/security";
export const GET = endpoint(async () => {
  const owner = await requireOwner();
  const { data, error } = await owner.client
    .from("assets")
    .select("id,name,url,size,created_at")
    .eq("site_id", owner.siteId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(503, "Could not load media.");
  return Response.json({ assets: data });
});
export const POST = endpoint(async (request) => {
  const owner = await requireOwner();
  // Bound the multipart body even when Content-Length is absent or dishonest.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Choose an image.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > MAX_UPLOAD + 65536) {
      await reader.cancel();
      throw new HttpError(413, "Image exceeds 4 MB.");
    }
    chunks.push(value);
  }
  const form = await new Response(Buffer.concat(chunks), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose an image.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  const objectKey = `${owner.siteId}/${crypto.randomUUID()}.${kind.extension}`;
  const { error } = await owner.service.storage
    .from("site-media")
    .upload(objectKey, bytes, {
      contentType: kind.mime,
      upsert: false,
      cacheControl: "31536000",
    });
  if (error) throw new HttpError(503, "Image upload failed. Try again.");
  const {
    data: { publicUrl },
  } = owner.service.storage.from("site-media").getPublicUrl(objectKey);
  const { data, error: metadataError } = await owner.service
    .from("assets")
    .insert({
      site_id: owner.siteId,
      object_key: objectKey,
      url: publicUrl,
      name: file.name.slice(0, 200),
      size: bytes.length,
    })
    .select("id,name,url,size,created_at")
    .single();
  if (metadataError) {
    await owner.service.storage.from("site-media").remove([objectKey]);
    throw new HttpError(503, "Could not save media metadata. Try again.");
  }
  return Response.json({ asset: data }, { status: 201 });
}, true);
