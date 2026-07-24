import { useEffect, useReducer, useRef, useState, useCallback } from "react";
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

// Cloudinary Helpers
const CLOUD_NAME = "dxcwgsjvk";
const UPLOAD_PRESET = "Lepanto";

async function uploadToCloudinary(file, resourceType, filename) {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const uploadImage = (file) => uploadToCloudinary(file, "image");
const uploadAudio = (file) => uploadToCloudinary(file, "video", file.name || "audio.webm");

// Audio Recorder Hook
function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied. Please allow access.");
    }
  }, []);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const discard = useCallback(() => {
    setAudioBlob(null);
    setAudioPreviewUrl("");
  }, []);

  return { recording, audioBlob, audioPreviewUrl, error, start, stop, discard };
}

// Form Reducer
const initialFormState = {
  title: "", description: "", publishDate: "", expiryDate: "", featured: false,
  image: null, audioFile: null, editingId: null,
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD": return { ...state, [action.field]: action.value };
    case "LOAD_FOR_EDIT": return { ...initialFormState, ...action.payload, editingId: action.payload.id };
    case "RESET": return initialFormState;
    default: return state;
  }
}

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const fileRef = useRef(null);
  const audioFileRef = useRef(null);
  const recorder = useAudioRecorder();

  const setField = (field, value) => dispatch({ type: "SET_FIELD", field, value });

  const fetchAnnouncements = async () => {
    try {
      const snap = await getDocs(collection(db, "announcements"));
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const resetForm = () => {
    dispatch({ type: "RESET" });
    if (fileRef.current) fileRef.current.value = "";
    if (audioFileRef.current) audioFileRef.current.value = "";
    recorder.discard();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, publishDate, expiryDate, featured, image, audioFile, editingId } = formState;

    if (!title || !description) return alert("Title and description are required");

    setUploading(true);

    try {
      let imageUrl = image ? await uploadImage(image) : "";
      let audioUrl = "";

      if (audioFile) {
        audioUrl = await uploadAudio(audioFile);
      } else if (recorder.audioBlob) {
        audioUrl = await uploadAudio(recorder.audioBlob);
      }

      const data = {
        title, description,
        publishDate: publishDate ? Timestamp.fromDate(new Date(publishDate)) : null,
        expiryDate: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        featured,
        imageUrl,
        audioUrl,
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), data);
      } else {
        await addDoc(collection(db, "announcements"), { ...data, createdAt: Timestamp.now() });
      }

      alert(editingId ? "Updated!" : "Added!");
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (ann) => {
    dispatch({ type: "LOAD_FOR_EDIT", payload: ann });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteDoc(doc(db, "announcements", id));
    fetchAnnouncements();
  };

  const { title, description, publishDate, expiryDate, featured, editingId } = formState;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h2 className="text-3xl font-bold text-blue-900">Announcement Manager</h2>

      {/* FORM */}
      <div className="bg-white border p-6 rounded-3xl shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setField("title", e.target.value)} className="w-full p-4 border rounded-2xl" required />
          <textarea placeholder="Description" value={description} onChange={(e) => setField("description", e.target.value)} className="w-full p-4 border rounded-2xl h-32" required />

          <div className="grid md:grid-cols-2 gap-4">
            <input type="date" value={publishDate} onChange={(e) => setField("publishDate", e.target.value)} className="p-4 border rounded-2xl" />
            <input type="date" value={expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} className="p-4 border rounded-2xl" />
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={featured} onChange={(e) => setField("featured", e.target.checked)} />
            Mark as Featured
          </label>

          <div>
            <label className="block mb-1">Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setField("image", e.target.files[0])} className="w-full p-4 border rounded-2xl" />
          </div>

          {/* Audio Section - Both Options */}
          <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
            <p className="font-medium mb-4">Audio Announcement (optional)</p>

            {/* Upload Pre-recorded */}
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">1. Upload Pre-recorded File</label>
              <input ref={audioFileRef} type="file" accept="audio/*" onChange={(e) => setField("audioFile", e.target.files[0])} className="w-full p-4 border rounded-2xl" />
            </div>

            {/* Live Recording */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">2. Or Record Live</label>
              <button
                type="button"
                onClick={recorder.recording ? recorder.stop : recorder.start}
                className={`px-6 py-3 rounded-2xl text-white font-medium ${recorder.recording ? "bg-red-600" : "bg-blue-700"}`}
              >
                {recorder.recording ? "Stop Recording" : "Start Recording"}
              </button>

              {recorder.audioPreviewUrl && (
                <div className="mt-4">
                  <audio src={recorder.audioPreviewUrl} controls className="w-full" />
                  <button type="button" onClick={recorder.discard} className="text-red-600 text-sm mt-2">Discard Recording</button>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={uploading} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-semibold">
            {uploading ? "Saving..." : editingId ? "Update Announcement" : "Add Announcement"}
          </button>
        </form>
      </div>

      {/* LIST */}
      <div>
        <h3 className="text-xl font-semibold mb-4">All Announcements ({announcements.length})</h3>

        {loading ? <p>Loading...</p> : announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          <div className="space-y-6">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-white border rounded-3xl p-6">
                <h4 className="font-bold text-xl">{ann.title}</h4>
                <p className="text-gray-600 mt-2">{ann.description}</p>

                {ann.audioUrl && <audio src={ann.audioUrl} controls className="w-full mt-4" />}

                <div className="mt-5 flex gap-3">
                  <button onClick={() => startEdit(ann)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-xl">Edit</button>
                  <button onClick={() => handleDelete(ann.id)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}