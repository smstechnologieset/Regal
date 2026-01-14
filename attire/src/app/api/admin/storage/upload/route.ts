export const runtime = "nodejs";

/**
 * Admin Storage Upload API
 * 
 * POST /api/admin/storage/upload - Upload file to a specific bucket
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string;

        if (!file || !bucket) {
            return NextResponse.json({ error: 'File and bucket are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Ensure bucket exists (optional, but good for robustness)
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === bucket);

        if (!bucketExists) {
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            });
            if (createError) throw createError;
        }

        // Generate a unique file name
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

        // Convert file to Buffer for upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
