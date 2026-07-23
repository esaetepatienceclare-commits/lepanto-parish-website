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

// ---------- Cloudinary upload helpers ----------

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

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${resourceType}): ${res.status}`);
  }

  const data = await res.json();
  return data.secure_url;
}

const uploadImage = (file) => uploadToCloudinary(file, "image");
const uploadAudio = (blob, filename = "announcement.webm") =>
  uploadToCloudinary(blob, "video", filename);

// ---------- Audio recorder hook ----------

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
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

  const reset = useCallback(() => {
    discard();
    setRecording(false);
    setError("");
  }, [discard]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  return { recording, audioBlob, audioPreviewUrl, error, start, stop, discard, reset };
}

// ---------- Form state reducer ----------

const initialFormState = {
  title: "",
  description: "",
  publishDate: "",
  expiryDate: "",
  featured: false,
  image: null,
  editingId: null,
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "LOAD_FOR_EDIT":
      return {
        ...initialFormState,
        title: action.announcement.title || "",
        description: action.announcement.description || "",
        publishDate: action.announcement.publishDate?.toDate()?.toISOString().split("T")[0] || "",
        expiryDate: action.announcement.expiryDate?.toDate()?.toISOString().split("T")[0] || "",
        featured: action.announcement.featured || false,
        editingId: action.announcement.id,
      };
    case "RESET":
      return initialFormState;
    default:
      return state;
  }
}

// ---------- Main component ----------

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const fileRef = useRef(null);
  const recorder = useAudioRecorder();

  const setField = (field, value) => dispatch({ type: "SET_FIELD", field, value });

  const fetchAnnouncements = async () => {
    try {
      const snap = await getDocs(collection(db, "announcements"));
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    dispatch({ type: "RESET" });
    if (fileRef.current) fileRef.current.value = "";
    recorder.reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, publishDate, expiryDate, featured, image, editingId } = formState;

    if (!title || !description) return alert("Title and description are required");

    setUploading(true);

    try {
      let imageUrl = "";
      if (image) imageUrl = await uploadImage(image);

      let audioUrl = "";
      if (recorder.audioBlob) {
        setUploadProgress("Uploading audio...");
        audioUrl = await uploadAudio(recorder.audioBlob);
        setUploadProgress("");
      }

      const data = {
        title,
        description,
        publishDate: publishDate ? Timestamp.fromDate(new Date(publishDate)) : null,
        expiryDate: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        featured,
        imageUrl: imageUrl || "",
        audioUrl: audioUrl || "",
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
      setUploadProgress("");
    }
  };

  const startEdit = (ann) => {
    dispatch({ type: "LOAD_FOR_EDIT", announcement: ann });
    recorder.reset();
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

  const { title, description, publishDate, expiryDate, featured, editingId } = formState;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-blue-900">Announcements Manager</h2>
        {editingId && (
          <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">
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
            onChange={(e) => setField("title", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setField("description", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl h-28 focus:outline-none focus:border-blue-500"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Publish Date</label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setField("publishDate", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setField("expiryDate", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setField("featured", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Mark as Featured</span>
          </label>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Image (optional)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setField("image", e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-xl"
            />
          </div>

          {/* AUDIO RECORDING */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <p className="text-sm font-medium text-gray-700">Audio Announcement (optional)</p>

            {!recorder.audioBlob ? (
              <button
                type="button"
                onClick={recorder.recording ? recorder.stop : recorder.start}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition ${
                  recorder.recording
                    ? "bg-red-600 hover:bg-red-700 animate-pulse"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                {recorder.recording ? "⏹ Stop Recording" : "🎙 Start Recording"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-green-700 font-medium">✓ Recording ready — preview below</p>
                <audio src={recorder.audioPreviewUrl} controls className="w-full" />
                <button
                  type="button"
                  onClick={recorder.discard}
                  className="text-sm text-red-500 hover:text-red-700 underline"
                >
                  Discard and re-record
                </button>
              </div>
            )}

            {recorder.recording && (
              <p className="text-sm text-red-600 font-medium animate-pulse">🔴 Recording in progress...</p>
            )}

            {recorder.error && (
              <p className="text-sm text-red-600 font-medium">{recorder.error}</p>
            )}
          </div>

          {uploadProgress && (
            <p className="text-sm text-blue-600 font-medium animate-pulse">{uploadProgress}</p>
          )}

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

                  {ann.audioUrl && (
                    <audio src={ann.audioUrl} controls className="w-full mt-3" />
                  )}

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
