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
  const [mediaType, setMediaType] = useState("image"); // image | youtube | link
  const [mediaUrl, setMediaUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fileRef = useRef(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Lepanto");

    const res = await fetch("https://api.cloudinary.com/v1_1/dxcwgsjvk/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Title is required");

    setUploading(true);

    try {
      let finalMediaUrl = mediaUrl;

      // Upload image if file selected
      if (mediaType === "image" && imageFile) {
        finalMediaUrl = await uploadImage(imageFile);
      }

      if (!finalMediaUrl) {
        alert("Please provide a media URL or upload an image");
        setUploading(false);
        return;
      }

      const data = {
        title,
        description,
        mediaType,
        mediaUrl: finalMediaUrl,
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
      alert("Failed to save");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaType("image");
    setMediaUrl("");
    setImageFile(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (item) => {
    setTitle(item.title || "");
    setDescription(item.description || "");
    setMediaType(item.mediaType || "image");
    setMediaUrl(item.mediaUrl || "");
    setEditingId(item.id);
    setImageFile(null);
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
              onChange={(e) => setMediaType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl"
            >
              <option value="image">Image</option>
              <option value="youtube">YouTube Video</option>
              <option value="link">External Link / Website</option>
            </select>
          </div>

          {/* Media Input */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              {mediaType === "image" ? "Image URL or Upload" : "URL *"}
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

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold transition"
          >
            {uploading ? "Saving..." : editingId ? "Update Gallery Item" : "Add to Gallery"}
          </button>
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
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.mediaType === "image" || (!item.mediaType && item.imageUrl) ? (
                    <img src={item.mediaUrl || item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.mediaType === "youtube" ? (
                    <div className="text-center">
                      <div className="text-4xl mb-1">▶️</div>
                      <p className="text-sm text-gray-600">YouTube Video</p>
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
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {item.mediaType || "image"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description}</p>
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