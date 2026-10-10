import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";

const CLOUD_NAME = "dxcwgsjvk";
const UPLOAD_PRESET = "Lepanto";

async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Document upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function RciaLessonsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lessonNumber, setLessonNumber] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fileRef = useRef(null);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, "rciaLessons"), orderBy("lessonNumber", "asc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Error loading lessons. Check console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setLessonNumber("");
    setTitle("");
    setSummary("");
    setContent("");
    setVideoUrl("");
    setDocumentUrl("");
    setDocumentFile(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || lessonNumber === "") {
      return alert("Lesson number and title are required");
    }

    setSaving(true);
    try {
      // Keep the existing document unless a new one was chosen.
      const finalDocumentUrl = documentFile ? await uploadDocument(documentFile) : documentUrl;

      const data = {
        lessonNumber: Number(lessonNumber),
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        videoUrl: videoUrl.trim(),
        documentUrl: finalDocumentUrl,
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "rciaLessons", editingId), data);
        alert("Lesson updated!");
      } else {
        await addDoc(collection(db, "rciaLessons"), {
          ...data,
          createdAt: Timestamp.now(),
        });
        alert("Lesson posted!");
      }

      resetForm();
      fetchItems();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setLessonNumber(item.lessonNumber ?? "");
    setTitle(item.title || "");
    setSummary(item.summary || "");
    setContent(item.content || "");
    setVideoUrl(item.videoUrl || "");
    setDocumentUrl(item.documentUrl || "");
    setDocumentFile(null);
    setEditingId(item.id);
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await deleteDoc(doc(db, "rciaLessons", id));
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const nextNumber = items.length ? Math.max(...items.map((i) => Number(i.lessonNumber) || 0)) + 1 : 1;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-900">RCIA Lessons</h2>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-[140px_1fr] gap-4">
            <input
              type="number"
              min="1"
              placeholder={`Lesson no. (${nextNumber})`}
              value={lessonNumber}
              onChange={(e) => setLessonNumber(e.target.value)}
              className="w-full p-3 border rounded-xl"
              required
            />
            <input
              type="text"
              placeholder="Lesson title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-xl"
              required
            />
          </div>

          <input
            type="text"
            placeholder="One-line summary (e.g. The Creed: what Catholics believe)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-3 border rounded-xl"
          />

          <textarea
            placeholder="Lesson content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border rounded-xl h-48"
          />

          <input
            type="url"
            placeholder="Video link (YouTube or other, optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full p-3 border rounded-xl"
          />

          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Lesson notes (PDF or Word, optional)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setDocumentFile(e.target.files[0] || null)}
              className="w-full p-3 border rounded-xl"
            />
            {documentUrl && !documentFile && (
              <p className="text-sm text-gray-500 mt-2">
                Current file:{" "}
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                  open
                </a>{" "}
                ·{" "}
                <button type="button" onClick={() => setDocumentUrl("")} className="text-red-600 underline">
                  remove
                </button>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : editingId ? "Update Lesson" : "Post Lesson"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full border border-gray-300 text-gray-600 py-3 rounded-xl"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-4">Lessons ({items.length})</h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No lessons yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border rounded-2xl p-5">
                <p className="text-xs font-medium text-blue-700 mb-1">Lesson {item.lessonNumber}</p>
                <h4 className="font-bold text-blue-900 text-lg">{item.title}</h4>
                {item.summary && <p className="text-gray-600 mt-1">{item.summary}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {[item.videoUrl && "Video", item.documentUrl && "Notes"].filter(Boolean).join(" · ")}
                </p>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => startEdit(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
