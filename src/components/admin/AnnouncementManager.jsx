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
    if (!title || !description) return alert("Title and description required");

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
        imageUrl,
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), data);
        alert("Updated successfully!");
      } else {
        await addDoc(collection(db, "announcements"), { ...data, createdAt: Timestamp.now() });
        alert("Announcement added successfully!");
      }

      resetForm();
      await fetchAnnouncements();   // ← This is the key fix
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPublishDate(""); setExpiryDate("");
    setFeatured(false); setImage(null); setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (ann) => {
    setTitle(ann.title || "");
    setDescription(ann.description || "");
    setPublishDate(ann.publishDate?.toDate()?.toISOString().split("T")[0] || "");
    setExpiryDate(ann.expiryDate?.toDate()?.toISOString().split("T")[0] || "");
    setFeatured(ann.featured || false);
    setEditingId(ann.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteDoc(doc(db, "announcements", id));
    fetchAnnouncements();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-red-600">Announcements Manager</h2>

      {/* Form */}
      <div className="bg-white border p-6 rounded-xl shadow">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border rounded" required />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border rounded h-28" required />
          
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} className="p-3 border rounded" />
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="p-3 border rounded" />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
            Featured
          </label>

          <input ref={fileRef} type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} className="w-full p-3 border rounded" />

          <button type="submit" disabled={uploading} className="w-full bg-red-600 text-white py-4 rounded font-semibold">
            {uploading ? "Saving..." : editingId ? "Update" : "Add Announcement"}
          </button>
        </form>
      </div>

      {/* List */}
      <div>
        <h3 className="font-semibold mb-4">Existing Announcements</h3>
        {announcements.map(ann => (
          <div key={ann.id} className="bg-white p-5 rounded-xl border mb-4">
            {ann.imageUrl && <img src={ann.imageUrl} className="w-full h-48 object-cover rounded mb-4" alt="" />}
            <h4 className="font-bold text-lg">{ann.title}</h4>
            <p className="text-gray-600">{ann.description}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => startEdit(ann)} className="bg-yellow-500 text-white px-4 py-2 rounded">Edit</button>
              <button onClick={() => handleDelete(ann.id)} className="bg-red-600 text-white px-4 py-2 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}