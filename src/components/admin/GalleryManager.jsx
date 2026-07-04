import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function GalleryManager() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fileRef = useRef(null);

  const fetchGallery = async () => {
    try {
      const snap = await getDocs(collection(db, "gallery"));
      setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Lepanto");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dxcwgsjvk/image/upload",
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please select an image");

    setUploading(true);

    try {
      const imageUrl = await uploadImage(image);

      const data = {
        title,
        description,
        imageUrl,
        createdAt: Timestamp.now(),
      };

      if (editingId) {
        // For now we only update metadata (not replacing image)
        await updateDoc(doc(db, "gallery", editingId), data);
        alert("Gallery item updated!");
      } else {
        await addDoc(collection(db, "gallery"), data);
        alert("Added to gallery!");
      }

      resetForm();
      fetchGallery();
    } catch (err) {
      console.error(err);
      alert("Failed to upload");
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
    await deleteDoc(doc(db, "gallery", id));
    fetchGallery();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-blue-900">Gallery Manager</h2>

      {/* Upload Form */}
      <div className="bg-white border p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Gallery Item" : "Add New Gallery Item"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title / Caption"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg h-24"
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full p-3 border rounded-lg"
            required={!editingId}
          />

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl font-semibold disabled:opacity-50"
          >
            {uploading ? "Uploading..." : editingId ? "Update Item" : "Add to Gallery"}
          </button>
        </form>
      </div>

      {/* Gallery Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Gallery Items ({galleryItems.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl overflow-hidden shadow">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold">{item.title}</h4>
                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}