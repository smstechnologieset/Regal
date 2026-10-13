"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";

interface ImageUploadProps {
  bucket: "attire" | "events" | "bridal" | "catering" | "gifts";
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUpload({
  bucket,
  value,
  onChange,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const response = await fetch("/api/admin/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    if (!confirm("Are you sure you want to delete this image?")) return;

    setDeleting(true);
    try {
      // Call storage delete API
      await fetch("/api/admin/storage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value, bucket }),
      });
      onChange("");
    } catch (err) {
      console.error("Failed to delete storage file:", err);
      // Still clear local field if network error
      onChange("");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onClick={() => !uploading && !deleting && fileInputRef.current?.click()}
        className={`
          relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${value ? "border-transparent" : "border-slate-200 hover:border-slate-300 bg-slate-50"}
          ${uploading || deleting ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-sm font-medium">Click to Change Image</p>
            </div>
            {/* Delete Image Button Overlay */}
            <button
              type="button"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              title="Delete this image"
              className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-colors cursor-pointer"
            >
              {deleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-primary" />
            ) : (
              <>
                <Upload size={30} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Click to upload image
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {value && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium truncate">
          <ImageIcon size={12} />
          <span className="truncate">{value}</span>
        </div>
      )}
    </div>
  );
}
