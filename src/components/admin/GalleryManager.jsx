import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function GalleryManager() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fileRef = useRef(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "gallery"));
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
      let imageUrl = "";

      if (image) {
        imageUrl = await uploadImage(image);
      }

      const data = {
        title,
        description,
        ...(imageUrl && { imageUrl }),
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "gallery", editingId), data);
        alert("Gallery item updated!");
      } else {
        if (!image) return alert("Please select an image");
        data.imageUrl = imageUrl;
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
    setImage(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (item) => {
    setTitle(item.title || "");
    setDescription(item.description || "");
    setEditingId(item.id);
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

          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              {editingId ? "Replace Image (optional)" : "Image *"}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-xl"
              required={!editingId}
            />
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

      {/* Gallery Grid */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-gray-700">
          Gallery Items ({galleryItems.length})
        </h3>

        {loading ? (
          <p className="text-gray-500">Loading gallery...</p>
        ) : galleryItems.length === 0 ? (
          <p className="text-gray-500">No items in the gallery yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-52 object-cover"
                />
                <div className="p-5">
                  <h4 className="font-bold text-lg text-blue-900">{item.title}</h4>
                  {item.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-3">{item.description}</p>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium"
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