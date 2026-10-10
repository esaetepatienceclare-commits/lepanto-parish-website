// One place for uploading files to Cloudinary.
// resourceType: "image" for photos, "video" for audio and video, "raw" for documents.
const CLOUD_NAME = "dxcwgsjvk";
const UPLOAD_PRESET = "Lepanto";

// Big phone photos (often 10–25 MB) are over Cloudinary's 10 MB limit.
// Shrink them to at most 2560px wide or tall as a JPEG before uploading.
const MAX_SIDE = 2560;
const SHRINK_OVER = 2 * 1024 * 1024; // 2 MB

async function shrinkImage(file) {
  if (!file.type?.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size <= SHRINK_OVER) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    // The browser could not read this image; send it as it is.
    return file;
  }
}

export async function uploadToCloudinary(file, resourceType = "image") {
  if (resourceType === "image") file = await shrinkImage(file);
  const formData = new FormData();
  // Recorded clips have no file name, so give them one.
  formData.append("file", file, file.name || (resourceType === "video" ? "media.webm" : "upload"));
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    console.error("Cloudinary error:", data);
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.secure_url;
}

export const uploadImage = (file) => uploadToCloudinary(file, "image");
export const uploadMedia = (file) => uploadToCloudinary(file, "video");
export const uploadDocument = (file) => uploadToCloudinary(file, "raw");
