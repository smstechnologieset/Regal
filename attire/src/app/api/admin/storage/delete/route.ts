export const runtime = "nodejs";

/**
 * Admin Storage Delete API
 *
 * POST /api/admin/storage/delete - Delete file from Supabase storage bucket
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { isAdmin, userId, error } = await verifyAdmin();
  if (!userId) return unauthorizedResponse(error);
  if (!isAdmin) return forbiddenResponse(error);

  try {
    const { url, bucket: explicitBucket } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    let bucketName = explicitBucket;
    let filePath = "";

    // Parse Supabase public URL format:
    // .../storage/v1/object/public/<bucket>/<filepath>
    if (url.includes("/storage/v1/object/public/")) {
      const parts = url.split("/storage/v1/object/public/")[1]?.split("/");
      if (parts && parts.length >= 2) {
        bucketName = bucketName || parts[0];
        filePath = parts.slice(1).join("/");
      }
    } else {
      // Fallback: extract last segment
      const urlParts = url.split("/");
      filePath = urlParts[urlParts.length - 1];
    }

    if (bucketName && filePath) {
      const { error: removeError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (removeError) {
        console.warn("Storage remove warning:", removeError);
      }
    }

    return NextResponse.json({ success: true, removed: filePath });
  } catch (err: any) {
    console.error("Error deleting storage file:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete image file" },
      { status: 500 }
    );
  }
}
