import { useEffect, useReducer, useRef, useState } from "react";
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
import useMediaRecorder from "../../hooks/useMediaRecorder";

const CLOUD_NAME = "dxcwgsjvk";
const UPLOAD_PRESET = "Lepanto";

async function uploadToCloudinary(file, resourceType = "video") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const endpoint = resourceType === "raw" ? "raw" : resourceType;
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const initialForm = {
  title: "",
  description: "",
  date: "",
  audioFile: null,
  videoFile: null,
  documentFile: null,
  audioUrl: "",
  videoUrl: "",
  documentUrl: "",
  editingId: null,
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "LOAD":
      return {
        ...initialForm,
        title: action.payload.title || "",
        description: action.payload.description || "",
        date: action.payload.date || "",
        audioUrl: action.payload.audioUrl || "",
        videoUrl: action.payload.videoUrl || "",
        documentUrl: action.payload.documentUrl || "",
        editingId: action.payload.id,
      };
    case "RESET":
      return initialForm;
    default:
      return state;
  }
}

export default function HomiliesManager() {
  const [homilies, setHomilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, dispatch] = useReducer(formReducer, initialForm);

  const audioRecorder = useMediaRecorder("audio");
  const videoRecorder = useMediaRecorder("video");
  const audioFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const documentFileRef = useRef(null);

  const setField = (field, value) =>
    dispatch({ type: "SET_FIELD", field, value });

  const fetchHomilies = async () => {
    try {
      const q = query(collection(db, "homilies"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHomilies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomilies();
  }, []);

  const resetForm = () => {
    dispatch({ type: "RESET" });
    audioRecorder.discard();
    videoRecorder.discard();
    if (audioFileRef.current) audioFileRef.current.value = "";
    if (videoFileRef.current) videoFileRef.current.value = "";
    if (documentFileRef.current) documentFileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Title is required");

    setUploading(true);

    try {
      // Start from the saved files so editing without a new upload keeps them.
      let audioUrl = form.audioUrl;
      let videoUrl = form.videoUrl;
      let documentUrl = form.documentUrl;

      if (form.audioFile) {
        audioUrl = await uploadToCloudinary(form.audioFile, "video");
      } else if (audioRecorder.mediaBlob) {
        audioUrl = await uploadToCloudinary(audioRecorder.mediaBlob, "video");
      }

      if (form.videoFile) {
        videoUrl = await uploadToCloudinary(form.videoFile, "video");
      } else if (videoRecorder.mediaBlob) {
        videoUrl = await uploadToCloudinary(videoRecorder.mediaBlob, "video");
      }

      if (form.documentFile) {
        documentUrl = await uploadToCloudinary(form.documentFile, "raw");
      }

      const data = {
        title: form.title,
        description: form.description,
        date: form.date,
        audioUrl,
        videoUrl,
        documentUrl,
        updatedAt: Timestamp.now(),
      };

      if (form.editingId) {
        await updateDoc(doc(db, "homilies", form.editingId), data);
        alert("Homily updated!");
      } else {
        await addDoc(collection(db, "homilies"), {
          ...data,
          createdAt: Timestamp.now(),
        });
        alert("Homily added!");
      }

      resetForm();
      fetchHomilies();
    } catch (err) {
      console.error(err);
      alert("Failed to save homily");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (item) => {
    dispatch({ type: "LOAD", payload: item });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this homily?")) return;
    await deleteDoc(doc(db, "homilies", id));
    fetchHomilies();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-900">Homilies Manager</h2>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Homily title"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            className="w-full p-3 border rounded-xl"
            required
          />

          <textarea
            placeholder="Short description (optional)"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className="w-full p-3 border rounded-xl h-24"
          />

          {form.editingId && (form.audioUrl || form.videoUrl || form.documentUrl) && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-900 space-y-2">
              <p className="font-medium">Saved files stay unless you upload a replacement or remove them:</p>
              {[
                ["audioUrl", "Audio"],
                ["videoUrl", "Video"],
                ["documentUrl", "Document"],
              ]
                .filter(([field]) => form[field])
                .map(([field, label]) => (
                  <p key={field} className="flex items-center gap-3">
                    <a href={form[field]} target="_blank" rel="noopener noreferrer" className="underline">
                      {label}
                    </a>
                    <button type="button" onClick={() => setField(field, "")} className="text-red-600 underline">
                      remove
                    </button>
                  </p>
                ))}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Date (optional)</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          {/* Audio */}
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <p className="font-medium text-gray-700">🎙️ Audio (higher quality)</p>
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              onChange={(e) => setField("audioFile", e.target.files[0])}
              className="w-full p-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500">
              Tip: Uploading a phone recording is often clearer than browser recording.
              For browser recording, use a headset or external mic and speak close to it.
            </p>
            {audioRecorder.microphones.length > 1 && (
              <select
                value={audioRecorder.micId}
                onChange={(e) => audioRecorder.setMicId(e.target.value)}
                disabled={audioRecorder.recording}
                className="w-full p-2 border rounded-lg bg-white text-sm"
              >
                <option value="">Default microphone</option>
                {audioRecorder.microphones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={audioRecorder.recording ? audioRecorder.stop : audioRecorder.start}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                audioRecorder.recording ? "bg-red-600" : "bg-blue-700"
              }`}
            >
              {audioRecorder.recording ? "Stop Recording" : "Record Audio"}
            </button>
            {audioRecorder.previewUrl && (
              <div>
                <audio src={audioRecorder.previewUrl} controls className="w-full mt-2" />
                <button
                  type="button"
                  onClick={audioRecorder.discard}
                  className="text-red-600 text-sm mt-1"
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Video */}
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <p className="font-medium text-gray-700">🎥 Video (720p quality)</p>
            <input
              ref={videoFileRef}
              type="file"
              accept="video/*"
              onChange={(e) => setField("videoFile", e.target.files[0])}
              className="w-full p-2 border rounded-lg"
            />
            {videoRecorder.microphones.length > 1 && (
              <select
                value={videoRecorder.micId}
                onChange={(e) => videoRecorder.setMicId(e.target.value)}
                disabled={videoRecorder.recording}
                className="w-full p-2 border rounded-lg bg-white text-sm"
              >
                <option value="">Default microphone</option>
                {videoRecorder.microphones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={videoRecorder.recording ? videoRecorder.stop : videoRecorder.start}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                videoRecorder.recording ? "bg-red-600" : "bg-blue-700"
              }`}
            >
              {videoRecorder.recording ? "Stop Recording" : "Record Video"}
            </button>

            {videoRecorder.recording && videoRecorder.stream && (
              <div className="mt-2">
                <p className="text-sm text-red-600 mb-1 animate-pulse">🔴 Recording...</p>
                <video
                  ref={(el) => {
                    if (el && videoRecorder.stream) el.srcObject = videoRecorder.stream;
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg bg-black"
                />
              </div>
            )}

            {videoRecorder.previewUrl && !videoRecorder.recording && (
              <div>
                <video
                  src={videoRecorder.previewUrl}
                  controls
                  className="w-full rounded-lg mt-2"
                />
                <button
                  type="button"
                  onClick={videoRecorder.discard}
                  className="text-red-600 text-sm mt-1"
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Document */}
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <p className="font-medium text-gray-700">📄 Document</p>
            <input
              ref={documentFileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setField("documentFile", e.target.files[0])}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold"
          >
            {uploading ? "Saving..." : form.editingId ? "Update Homily" : "Add Homily"}
          </button>

          {form.editingId && (
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

      {/* List */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Homilies ({homilies.length})</h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : homilies.length === 0 ? (
          <p className="text-gray-500">No homilies yet.</p>
        ) : (
          <div className="space-y-4">
            {homilies.map((item) => (
              <div key={item.id} className="bg-white border rounded-2xl p-5 shadow-sm">
                <h4 className="font-bold text-lg text-blue-900">{item.title}</h4>
                {item.date && <p className="text-sm text-gray-500 mt-1">{item.date}</p>}
                {item.description && (
                  <p className="text-gray-600 mt-2 text-sm">{item.description}</p>
                )}

                {item.audioUrl && (
                  <audio src={item.audioUrl} controls className="w-full mt-3" />
                )}
                {item.videoUrl && (
                  <video
                    src={item.videoUrl}
                    controls
                    className="w-full max-w-md rounded-xl mt-3"
                  />
                )}
                {item.documentUrl && (
                  <a
                    href={item.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-600 text-sm hover:underline"
                  >
                    📄 Open document
                  </a>
                )}

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
