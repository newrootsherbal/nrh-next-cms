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

  const performXhrUpload = (presignedMethod: string, presignedUrl: string, currentFile: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(presignedMethod, presignedUrl, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`XHR Upload failed: ${xhr.statusText} - ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error("XHR Upload failed due to network error."));
      xhr.onabort = () => reject(new Error("XHR Upload was aborted."));
      xhr.ontimeout = () => reject(new Error("XHR Upload timed out."));
      xhr.send(currentFile);
    });
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

    // Keep a reference to the file to use inside startTransition,
    // as the 'file' state might be cleared by another event.
    const currentFileForUpload = file;

    startTransition(async () => {
      try {
        // 1. Get pre-signed URL
        const presignedUrlResponse = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: currentFileForUpload.name,
            contentType: currentFileForUpload.type,
            size: currentFileForUpload.size,
          }),
        });

        if (!presignedUrlResponse.ok) {
          const errorData = await presignedUrlResponse.json();
          throw new Error(errorData.error || "Failed to get upload URL.");
        }
        const { presignedUrl, objectKey, method }: UploadResponse = await presignedUrlResponse.json();

        // 2. Upload file directly to R2
        await performXhrUpload(method, presignedUrl, currentFileForUpload);
        setUploadProgress(100); // Ensure progress hits 100 after XHR completes

        // 3. Record media in Supabase (this is the server action that might redirect)
        const recordResult = await recordMediaUpload(
          {
            fileName: currentFileForUpload.name,
            objectKey: objectKey,
            fileType: currentFileForUpload.type,
            sizeBytes: currentFileForUpload.size,
          },
          returnJustData
        );

        // This part is reached only if recordMediaUpload does NOT throw (i.e., no redirect)
        if (returnJustData) {
          if (recordResult && 'success' in recordResult && recordResult.success && recordResult.data) {
            setUploadStatus("success");
            onUploadSuccess?.(recordResult.data);
          } else {
            throw new Error(recordResult?.error || "Media record action did not return expected data.");
          }
        } else {
          // If !returnJustData and recordMediaUpload didn't throw, it's unexpected.
          // The redirect should have happened. Log a warning.
          console.warn("recordMediaUpload was expected to redirect but completed without error.");
          setUploadStatus("success"); // Still mark as success for UI consistency
        }

        // Common success cleanup (if no redirect occurred)
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

      } catch (err: any) {
        const isRedirect = err.message === 'NEXT_REDIRECT' || (typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT'));

        if (isRedirect) {
          // Redirect is happening. Reset UI to a clean state.
          // isPending will become false automatically.
          setUploadStatus("success"); // Clears "Uploading..." text from button if isPending becomes false
          setFile(null);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          // No error message needed, page will refresh.
        } else {
          // Genuine error
          console.error("Upload process error:", err);
          setUploadStatus("error");
          setErrorMessage(err.message || "An unknown error occurred during upload.");
          setUploadProgress(0); // Reset progress on actual error
        }
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