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

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fileRef = useRef(null);

  const fetchAnnouncements = async () => {
    try {
      const snap = await getDocs(collection(db, "announcements"));
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
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
    if (!title || !description) return alert("Title and description are required");

    setUploading(true);

    try {
      let imageUrl = "";
      if (image) imageUrl = await uploadImage(image);

      const data = {
        title,
        description,
        publishDate: publishDate ? Timestamp.fromDate(new Date(publishDate)) : null,
        expiryDate: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        featured,
        imageUrl: imageUrl || "",
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), data);
        alert("Announcement updated successfully!");
      } else {
        await addDoc(collection(db, "announcements"), { ...data, createdAt: Timestamp.now() });
        alert("Announcement added successfully!");
      }

      resetForm();
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Failed to save announcement");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPublishDate("");
    setExpiryDate("");
    setFeatured(false);
    setImage(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (ann) => {
    setTitle(ann.title || "");
    setDescription(ann.description || "");
    setPublishDate(ann.publishDate?.toDate()?.toISOString().split("T")[0] || "");
    setExpiryDate(ann.expiryDate?.toDate()?.toISOString().split("T")[0] || "");
    setFeatured(ann.featured || false);
    setEditingId(ann.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-blue-900">Announcements Manager</h2>
        {editingId && (
          <button
            onClick={resetForm}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* FORM */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl h-28 focus:outline-none focus:border-blue-500"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Publish Date</label>
              <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Expiry Date</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
            <span className="text-gray-700">Mark as Featured</span>
          </label>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="w-full p-3 border border-gray-300 rounded-xl" />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-4 rounded-xl font-semibold transition"
          >
            {uploading ? "Saving..." : editingId ? "Update Announcement" : "Add Announcement"}
          </button>
        </form>
      </div>

      {/* LIST */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-gray-700">Existing Announcements ({announcements.length})</h3>

        {loading ? (
          <p className="text-gray-500">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-gray-500">No announcements yet.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col md:flex-row gap-5">
                {ann.imageUrl && (
                  <img src={ann.imageUrl} alt="" className="w-full md:w-48 h-40 object-cover rounded-xl" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-blue-900">{ann.title}</h4>
                  <p className="text-gray-600 mt-1 line-clamp-3">{ann.description}</p>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => startEdit(ann)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
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