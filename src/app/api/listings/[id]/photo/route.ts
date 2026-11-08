import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR, findListing } from "@/lib/userListings";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await findListing(id);
  if (!listing) return new Response("Not found", { status: 404 });
  const i = Number(new URL(request.url).searchParams.get("i") ?? 0);
  const all = listing.photos ?? [{ file: listing.photo, type: listing.photoType }];
  const pick = Number.isInteger(i) && i >= 0 && i < all.length ? all[i] : all[0];
  const bytes = await fs.readFile(path.join(UPLOAD_DIR, path.basename(pick.file))).catch(() => null);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": pick.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
