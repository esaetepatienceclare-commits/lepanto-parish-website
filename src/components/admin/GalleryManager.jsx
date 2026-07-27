import { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../firebase";

export default function GalleryManager() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const documentRef = useRef(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setGalleryItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // Improved upload function
  const uploadToCloudinary = async (file, type = "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Lepanto");

    let endpoint = "image";
    if (type === "video") endpoint = "video";
    if (type === "document") endpoint = "raw";

    setUploadProgress(`Uploading ${type}…`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dxcwgsjvk/${endpoint}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    setUploadProgress("");

    if (!res.ok || !data.secure_url) {
      console.error("Cloudinary error:", data);
      throw new Error(data.error?.message || "Upload failed");
    }

    // For documents, return the public URL
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Title is required");

    setUploading(true);

    try {
      let finalMediaUrl = mediaUrl;
      let fileName = "";

      if (mediaType === "image" && imageFile) {
        finalMediaUrl = await uploadToCloudinary(imageFile, "image");
      }

      if (mediaType === "video" && videoFile) {
        finalMediaUrl = await uploadToCloudinary(videoFile, "video");
      }

      if (mediaType === "document" && documentFile) {
        finalMediaUrl = await uploadToCloudinary(documentFile, "document");
        fileName = documentFile.name;
      }

      if (!finalMediaUrl && mediaType !== "document") {
        alert("Please provide a media URL or upload a file");
        setUploading(false);
        return;
      }

      if (mediaType === "document" && !documentFile && !mediaUrl) {
        alert("Please upload a document");
        setUploading(false);
        return;
      }

      const data = {
        title,
        description,
        mediaType,
        mediaUrl: finalMediaUrl,
        fileName: fileName || "",
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "gallery", editingId), data);
        alert("Gallery item updated!");
      } else {
        data.createdAt = Timestamp.now();
        await addDoc(collection(db, "gallery"), data);
        alert("Added to gallery!");
      }

      resetForm();
      fetchGallery();
    } catch (err) {
      console.error(err);
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaType("image");
    setMediaUrl("");
    setImageFile(null);
    setVideoFile(null);
    setDocumentFile(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
    if (documentRef.current) documentRef.current.value = "";
  };

  const startEdit = (item) => {
    setTitle(item.title || "");
    setDescription(item.description || "");
    setMediaType(item.mediaType || "image");
    setMediaUrl(item.mediaUrl || "");
    setEditingId(item.id);
    setImageFile(null);
    setVideoFile(null);
    setDocumentFile(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this gallery item?")) return;
    try {
      await deleteDoc(doc(db, "gallery", id));
      fetchGallery();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-blue-900">Gallery Manager</h2>

      {/* Form */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-xl mb-5 text-blue-900">
          {editingId ? "Edit Gallery Item" : "Add New Gallery Item"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Title / Caption"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl"
            required
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl h-24"
          />

          {/* Media Type */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Media Type</label>
            <select
              value={mediaType}
              onChange={(e) => {
                setMediaType(e.target.value);
                setMediaUrl("");
                setImageFile(null);
                setVideoFile(null);
                setDocumentFile(null);
              }}
              className="w-full p-3 border border-gray-300 rounded-xl"
            >
              <option value="image">Image</option>
              <option value="video">Video Upload</option>
              <option value="youtube">YouTube Video</option>
              <option value="link">External Link / Website</option>
              <option value="document">Document (PDF, Word, Excel, etc.)</option>
            </select>
          </div>

          {/* Media Input */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              {mediaType === "image"
                ? "Image URL or Upload"
                : mediaType === "video"
                ? "Upload Video File"
                : mediaType === "document"
                ? "Upload Document"
                : "URL *"}
            </label>

            {mediaType === "image" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Paste image URL (optional)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
              </div>
            ) : mediaType === "video" ? (
              <div className="space-y-3">
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
                {videoFile && (
                  <p className="text-sm text-gray-500">
                    Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>
            ) : mediaType === "document" ? (
              <div className="space-y-3">
                <input
                  ref={documentRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={(e) => setDocumentFile(e.target.files[0])}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
                {documentFile && (
                  <p className="text-sm text-gray-500">
                    Selected: {documentFile.name}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Supported: PDF, Word, Excel, PowerPoint, Text files
                </p>
              </div>
            ) : (
              <input
                type="text"
                placeholder={
                  mediaType === "youtube"
                    ? "Paste YouTube link"
                    : "Paste website link"
                }
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl"
                required
              />
            )}
          </div>

          {uploadProgress && (
            <p className="text-sm text-blue-600 font-medium animate-pulse">
              {uploadProgress}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold transition"
          >
            {uploading
              ? "Saving..."
              : editingId
              ? "Update Gallery Item"
              : "Add to Gallery"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* Gallery List */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-gray-700">
          Gallery Items ({galleryItems.length})
        </h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : galleryItems.length === 0 ? (
          <p className="text-gray-500">No items yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.mediaType === "image" ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : item.mediaType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : item.mediaType === "youtube" ? (
                    <div className="text-center">
                      <div className="text-4xl mb-1">▶️</div>
                      <p className="text-sm text-gray-600">YouTube Video</p>
                    </div>
                  ) : item.mediaType === "document" ? (
                    <div className="text-center">
                      <div className="text-4xl mb-1">📄</div>
                      <p className="text-sm text-gray-600">Document</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-1">🔗</div>
                      <p className="text-sm text-gray-600">External Link</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-blue-900">{item.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 capitalize">
                      {item.mediaType || "image"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  )}

                  {item.mediaType === "document" && item.mediaUrl && (
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mb-3 text-sm text-blue-600 hover:underline"
                    >
                      ⬇️ Open / Download
                    </a>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-xl text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}