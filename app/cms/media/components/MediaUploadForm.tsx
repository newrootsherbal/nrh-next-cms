// app/cms/media/components/MediaUploadForm.tsx
"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation"; // To refresh data after upload
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; // Assuming you have this shadcn/ui component
import { UploadCloud, XCircle, CheckCircle2 } from "lucide-react";
import { recordMediaUpload } from "../actions"; // Server action
import type { Media } from "@/utils/supabase/types"; // Import Media type

interface UploadResponse {
  presignedUrl: string;
  objectKey: string;
  method: "PUT";
}

interface MediaUploadFormProps {
  onUploadSuccess?: (newMedia: Media) => void;
  // If true, the form expects recordMediaUpload to return data instead of redirecting.
  // And will use onUploadSuccess instead of router.refresh().
  returnJustData?: boolean;
}

export default function MediaUploadForm({ onUploadSuccess, returnJustData }: MediaUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For image preview
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Clean up previous preview
      setPreviewUrl(null);
    }
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus("idle");
      setUploadProgress(0);
      setErrorMessage(null);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    } else {
      setFile(null); // Clear file if selection is cancelled
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage(null);
    startTransition(async () => {
      try {
        // 1. Get pre-signed URL from our API route
        const presignedUrlResponse = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!presignedUrlResponse.ok) {
          const errorData = await presignedUrlResponse.json();
          throw new Error(errorData.error || "Failed to get upload URL.");
        }
        const { presignedUrl, objectKey, method }: UploadResponse = await presignedUrlResponse.json();

        // 2. Upload file directly to R2 using XMLHttpRequest for progress
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, presignedUrl, true);
            // xhr.setRequestHeader('Content-Type', file.type); // S3 presigned URLs for PUT usually don't need this if ContentType was in signed headers

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
              }
            };

            xhr.onload = async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // 3. Record media in Supabase
                const recordResult = await recordMediaUpload(
                  {
                    fileName: file.name,
                    objectKey: objectKey,
                    fileType: file.type,
                    sizeBytes: file.size,
                    // description: "" // Optionally add a description field here
                  },
                  returnJustData // Pass the flag to the action
                );

                // recordResult can now be { success: true, data: Media } | { error: string } | void (if redirecting)
                if (returnJustData) {
                  if (recordResult && 'success' in recordResult && recordResult.success && recordResult.data) {
                    setUploadStatus("success");
                    setFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    onUploadSuccess?.(recordResult.data); // Call callback with new media data
                    resolve();
                  } else if (recordResult && 'error' in recordResult && recordResult.error) {
                    reject(new Error(recordResult.error));
                  } else {
                    // This case should ideally not happen if returnJustData is true and action is well-behaved
                    reject(new Error("Media record action did not return expected data."));
                  }
                } else { // Original behavior: expecting redirect or void, then refresh
                  // If recordResult is not an error object from the modified action (meaning it redirected or had an issue not returning error obj)
                  // This part is a bit tricky because the action now *can* return an error object.
                  // Let's assume if returnJustData is false, we still check for explicit error return before relying on redirect.
                  if (recordResult && typeof recordResult === 'object' && 'error' in recordResult && recordResult.error) {
                     reject(new Error(recordResult.error));
                  } else {
                    // Assuming redirect happened or no error was explicitly returned by the action
                    setUploadStatus("success");
                    setFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    router.refresh(); // Refresh the media list (original behavior)
                    resolve();
                  }
                }
              } else {
                reject(new Error(`Upload failed: ${xhr.statusText} - ${xhr.responseText}`));
              }
            };
            xhr.onerror = () => {
              reject(new Error("Upload failed due to network error."));
            };
            xhr.onabort = () => {
              reject(new Error("Upload was aborted by the user."));
            };
            xhr.ontimeout = () => {
              reject(new Error("Upload timed out. Please try again."));
            };
            xhr.send(file);
        });

      } catch (err: any) {
        console.error("Upload process error:", err);
        setUploadStatus("error");
        setErrorMessage(err.message || "An unknown error occurred during upload.");
        setUploadProgress(0);
      }
    });
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-card mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="media-file" className="text-base font-medium">Upload New Media</Label>
          <div className="mt-2 flex items-center justify-center w-full">
            <label
              htmlFor="media-file-input"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">SVG, PNG, JPG, GIF, MP4, PDF (MAX. 10MB)</p>
              </div>
              <Input id="media-file-input" type="file" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
            </label>
          </div>
          {previewUrl && file && file.type.startsWith("image/") && (
            <div className="mt-4">
              <Label>Preview:</Label>
              <img src={previewUrl} alt="Preview" className="mt-2 rounded-md max-h-48 w-auto object-contain border" />
            </div>
          )}
          {file && <p className="text-sm mt-2 text-muted-foreground">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </div>

        {uploadStatus === "uploading" && (
          <Progress value={uploadProgress} className="w-full h-2" />
        )}
        {uploadStatus === "success" && (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <p>Upload successful!</p>
          </div>
        )}
        {uploadStatus === "error" && errorMessage && (
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            <p>Error: {errorMessage}</p>
          </div>
        )}

        <Button type="submit" disabled={isPending || uploadStatus === "uploading" || !file} className="w-full sm:w-auto">
          {isPending || uploadStatus === "uploading" ? `Uploading ${uploadProgress}%...` : "Upload File"}
        </Button>
      </form>
    </div>
  );
}