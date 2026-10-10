import { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import useMediaRecorder from "../../hooks/useMediaRecorder";
import { uploadToCloudinary } from "../../utils/cloudinary";

function SavedMedia({ label, url, onRemove, children }) {
  if (!url) return null;
  return (
    <div className="bg-white border rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-2">Current {label} (kept unless you add a new one)</p>
      {children}
      <button type="button" onClick={onRemove} className="text-red-600 text-sm mt-2">
        Remove {label}
      </button>
    </div>
  );
}

export default function AboutFatherManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docId, setDocId] = useState(null);

  const [name, setName] = useState("Father Patrick");
  const [title, setTitle] = useState("Parish Priest");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState(null);

  const fileRef = useRef(null);
  const videoFileRef = useRef(null);
  const audioFileRef = useRef(null);

  const videoRecorder = useMediaRecorder("video");
  const audioRecorder = useMediaRecorder("audio");

  const fetchProfile = async () => {
    try {
      const snap = await getDocs(collection(db, "aboutFather"));
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        setDocId(d.id);
        setName(data.name || "Father Patrick");
        setTitle(data.title || "Parish Priest");
        setBio(data.bio || "");
        setMessage(data.message || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setPhotoUrl(data.photoUrl || "");
        setVideoUrl(data.videoUrl || "");
        setAudioUrl(data.audioUrl || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load once when the tab opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Keep what is already saved unless something new was chosen or recorded.
      let finalPhotoUrl = photoUrl;
      let finalVideoUrl = videoUrl;
      let finalAudioUrl = audioUrl;

      if (photoFile) {
        finalPhotoUrl = await uploadToCloudinary(photoFile, "image");
      }

      const newVideo = videoFile || videoRecorder.mediaBlob;
      if (newVideo) {
        finalVideoUrl = await uploadToCloudinary(newVideo, "video");
      }

      const newAudio = audioFile || audioRecorder.mediaBlob;
      if (newAudio) {
        finalAudioUrl = await uploadToCloudinary(newAudio, "video");
      }

      const data = {
        name: name.trim(),
        title: title.trim(),
        bio: bio.trim(),
        message: message.trim(),
        phone: phone.trim(),
        email: email.trim(),
        photoUrl: finalPhotoUrl,
        videoUrl: finalVideoUrl,
        audioUrl: finalAudioUrl,
        updatedAt: Timestamp.now(),
      };

      if (docId) {
        await updateDoc(doc(db, "aboutFather", docId), data);
        alert("Profile updated!");
      } else {
        const ref = await addDoc(collection(db, "aboutFather"), {
          ...data,
          createdAt: Timestamp.now(),
        });
        setDocId(ref.id);
        alert("Profile created!");
      }

      setPhotoUrl(finalPhotoUrl);
      setVideoUrl(finalVideoUrl);
      setAudioUrl(finalAudioUrl);
      setPhotoFile(null);
      setVideoFile(null);
      setAudioFile(null);
      videoRecorder.discard();
      audioRecorder.discard();
      if (fileRef.current) fileRef.current.value = "";
      if (videoFileRef.current) videoFileRef.current.value = "";
      if (audioFileRef.current) audioFileRef.current.value = "";
      fetchProfile();
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-blue-900">About Father Patrick</h2>
      <p className="text-gray-600 text-sm">
        Update the priest profile shown on the Mass Times page.
      </p>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border rounded-xl"
                placeholder="Parish Priest"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Photo</label>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Father"
                className="w-32 h-32 object-cover rounded-2xl mb-3 border"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files[0])}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">About Me</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 border rounded-xl h-56"
              placeholder="Write about yourself: where you grew up, your vocation story, your years as a priest, what you love about the parish..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter twice to start a new paragraph.
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Message from Father</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border rounded-xl h-32"
              placeholder="A message to the parish family..."
            />
          </div>

          {/* Video */}
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <p className="font-medium text-gray-700">🎥 Video (optional)</p>

            <SavedMedia label="video" url={videoUrl} onRemove={() => setVideoUrl("")}>
              <video src={videoUrl} controls preload="metadata" className="w-full rounded-lg bg-black" />
            </SavedMedia>

            <input
              ref={videoFileRef}
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0] || null)}
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
                <video src={videoRecorder.previewUrl} controls className="w-full rounded-lg mt-2" />
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

          {/* Audio */}
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <p className="font-medium text-gray-700">🎙️ Audio (optional)</p>

            <SavedMedia label="audio" url={audioUrl} onRemove={() => setAudioUrl("")}>
              <audio src={audioUrl} controls preload="none" className="w-full" />
            </SavedMedia>

            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files[0] || null)}
              className="w-full p-2 border rounded-lg"
            />
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border rounded-xl"
                placeholder="+256..."
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-xl"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || videoRecorder.recording || audioRecorder.recording}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
