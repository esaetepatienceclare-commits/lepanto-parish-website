import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, addDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import useMediaRecorder from "../hooks/useMediaRecorder";
import {
  CAUSE_COLORS,
    withOriginals,
  formatUGX,
  paymentOptions,
  visibleCauses,
} from "../data/supportCauses";

// Cloudinary
const CLOUD_NAME = "dxcwgsjvk";
const UPLOAD_PRESET = "Lepanto";

async function uploadToCloudinary(file, resourceType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

// One card on the Support page.
function CauseCard({ cause, onSelect }) {
  const color = CAUSE_COLORS[cause.color] || CAUSE_COLORS.blue;
  const percent = cause.goal > 0 ? Math.min(100, Math.round(((cause.raised || 0) / cause.goal) * 100)) : null;

  return (
    <div
      onClick={() => onSelect(cause.id)}
      className={`group bg-white border border-gray-200 rounded-3xl overflow-hidden ${color.hoverBorder} hover:shadow-xl transition-all cursor-pointer flex flex-col`}
    >
      {cause.imageUrl && (
        <img src={cause.imageUrl} alt={cause.title} className="w-full h-44 object-cover" />
      )}
      <div className="p-8 flex flex-col flex-1">
        {!cause.imageUrl && (
          <div className={`w-14 h-14 ${color.iconBg} rounded-2xl flex items-center justify-center mb-6 transition`}>
            <span className="text-3xl">{cause.emoji || "💛"}</span>
          </div>
        )}
        <h3 className="text-2xl font-bold text-blue-900 mb-3">{cause.title}</h3>
        <p className="text-gray-600 leading-relaxed">{cause.description}</p>

        {percent !== null && (
          <div className="mt-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${color.bar} rounded-full`} style={{ width: `${percent}%` }} />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-semibold text-blue-900">{formatUGX(cause.raised)}</span> raised of{" "}
              {formatUGX(cause.goal)} ({percent}%)
            </p>
          </div>
        )}

        <div className="mt-auto pt-8">
          <span
            className={`inline-block ${color.button} text-white px-6 py-3 rounded-2xl text-sm font-medium transition`}
          >
            {cause.buttonLabel || "Give Now"} →
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Support() {
  const [params] = useSearchParams();
  // Causes come from Admin → Support Causes; until some are added, the original three are shown.
  const [savedCauses, setSavedCauses] = useState(null);
  const [selectedId, setSelectedId] = useState(params.get("cause"));
  const paymentRef = useRef(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const audioRecorder = useMediaRecorder("audio");
  const videoRecorder = useMediaRecorder("video");

  const audioFileRef = useRef(null);
  const videoFileRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supportCauses"),
      (snap) => setSavedCauses(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Causes error:", err);
        setSavedCauses([]);
      }
    );
    return () => unsubscribe();
  }, []);

    const causes = visibleCauses(withOriginals(savedCauses || []));
  const projects = causes.filter((c) => c.kind === "project");
  const selectedCause = causes.find((c) => c.id === selectedId) || null;
  const pay = selectedCause ? paymentOptions(selectedCause) : null;
  const payCount = pay ? [pay.bank, pay.mobile, pay.cash].filter(Boolean).length : 0;

  // Bring the bank details into view when a cause is picked (also when arriving from the home page).
  const shownId = selectedCause?.id;
  useEffect(() => {
    if (shownId) paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [shownId]);

  const handleSubmitMessage = async (e) => {
    e.preventDefault();

    if (
      !message &&
      !audioRecorder.mediaBlob &&
      !videoRecorder.mediaBlob &&
      !audioFile &&
      !videoFile
    ) {
      return alert("Please write a message or add audio/video");
    }

    setUploading(true);

    try {
      let audioUrl = "";
      let videoUrl = "";

      if (audioFile) {
        audioUrl = await uploadToCloudinary(audioFile, "video");
      } else if (audioRecorder.mediaBlob) {
        audioUrl = await uploadToCloudinary(audioRecorder.mediaBlob, "video");
      }

      if (videoFile) {
        videoUrl = await uploadToCloudinary(videoFile, "video");
      } else if (videoRecorder.mediaBlob) {
        videoUrl = await uploadToCloudinary(videoRecorder.mediaBlob, "video");
      }

      await addDoc(collection(db, "donorMessages"), {
        name: name || "Anonymous",
        message,
        audioUrl,
        videoUrl,
        cause: selectedCause?.title || "General",
        createdAt: Timestamp.now(),
      });

      setSubmitted(true);
      setName("");
      setMessage("");
      setAudioFile(null);
      setVideoFile(null);
      audioRecorder.discard();
      videoRecorder.discard();
      if (audioFileRef.current) audioFileRef.current.value = "";
      if (videoFileRef.current) videoFileRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Failed to send. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pt-24 px-6 md:px-20 pb-20 bg-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Support Our Parish
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Your generous support helps sustain our parish mission, school, and development projects.
          </p>
        </div>

        {/* Cause Cards */}
        {savedCauses === null ? (
          <p className="text-center text-gray-500 mb-16">Loading causes...</p>
        ) : (
          <>
            {ongoing.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {ongoing.map((cause) => (
                  <CauseCard key={cause.id} cause={cause} onSelect={setSelectedId} />
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center">Parish Projects</h2>
                <p className="text-gray-500 text-center mb-8">See how far each project has come and help us finish it.</p>
                <div className="grid md:grid-cols-3 gap-8">
                  {projects.map((cause) => (
                    <CauseCard key={cause.id} cause={cause} onSelect={setSelectedId} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Payment Details */}
        {selectedCause && (
          <div ref={paymentRef} className="max-w-4xl mx-auto mb-16 scroll-mt-28">
            <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-blue-900 mb-2">{selectedCause.title}</h2>
                <p className="text-gray-500">Choose your preferred way to give</p>
              </div>

              <div
                className={`grid gap-6 ${
                  payCount === 3 ? "md:grid-cols-3" : payCount === 2 ? "md:grid-cols-2" : "max-w-md mx-auto"
                }`}
              >
                {pay.bank && (
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                    <div className="text-4xl mb-4">🏦</div>
                    <h4 className="font-semibold text-lg mb-4 text-slate-700">Bank Transfer</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Bank:</span><br />
                        <span className="font-semibold text-slate-800">{pay.bankName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Account Name:</span><br />
                        <span className="font-semibold text-slate-800">{pay.accountName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Account Number:</span><br />
                        <span className="font-bold text-2xl text-blue-900 tracking-wider">{pay.accountNumber}</span>
                      </div>
                    </div>
                  </div>
                )}

                {pay.mobile && (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                    <div className="text-4xl mb-4">📱</div>
                    <h4 className="font-semibold text-lg mb-4 text-emerald-700">Mobile Money</h4>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{pay.mobileNetwork}</p>
                      <p className="font-bold text-2xl text-emerald-800">{pay.mobileNumber}</p>
                      {pay.mobileName && (
                        <p className="text-sm text-gray-700 mt-2">
                          Name: <span className="font-semibold">{pay.mobileName}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-3">Send transaction reference after payment.</p>
                    </div>
                  </div>
                )}

                {pay.cash && (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
                    <div className="text-4xl mb-4">💵</div>
                    <h4 className="font-semibold text-lg mb-4 text-amber-700">Cash or Cheque</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Pay cash or issue a cheque to:</p>
                    <p className="font-semibold text-amber-800 mt-3">{pay.chequePayee}</p>
                  </div>
                )}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Donor Message Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2 text-center">
              Share a Message or Testimony
            </h2>
            <p className="text-gray-500 text-center mb-8">
              Leave a message, record audio/video, or upload a file
            </p>

            {submitted ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">🙏</div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Thank you!</h3>
                <p className="text-gray-600">Your message has been received. May God bless you.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-blue-700 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitMessage} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your Name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full p-4 border border-gray-300 rounded-2xl"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message or testimony..."
                    className="w-full p-4 border border-gray-300 rounded-2xl h-32"
                  />
                </div>

                {/* AUDIO SECTION */}
                <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                  <p className="font-medium text-gray-700 mb-4">🎙️ Audio</p>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Upload Audio File</label>
                    <input
                      ref={audioFileRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files[0])}
                      className="w-full p-3 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Or Record Audio</label>
                    <button
                      type="button"
                      onClick={audioRecorder.recording ? audioRecorder.stop : audioRecorder.start}
                      className={`px-6 py-3 rounded-xl text-white font-medium ${
                        audioRecorder.recording ? "bg-red-600" : "bg-blue-700"
                      }`}
                    >
                      {audioRecorder.recording ? "Stop Recording" : "Start Recording"}
                    </button>

                    {audioRecorder.previewUrl && (
                      <div className="mt-4">
                        <audio src={audioRecorder.previewUrl} controls className="w-full" />
                        <button
                          type="button"
                          onClick={audioRecorder.discard}
                          className="text-red-600 text-sm mt-2"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* VIDEO SECTION */}
                <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                  <p className="font-medium text-gray-700 mb-4">🎥 Video</p>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Upload Video File</label>
                    <input
                      ref={videoFileRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files[0])}
                      className="w-full p-3 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Or Record Video</label>
                    <button
                      type="button"
                      onClick={videoRecorder.recording ? videoRecorder.stop : videoRecorder.start}
                      className={`px-6 py-3 rounded-xl text-white font-medium mb-4 ${
                        videoRecorder.recording ? "bg-red-600" : "bg-blue-700"
                      }`}
                    >
                      {videoRecorder.recording ? "Stop Recording" : "Start Recording"}
                    </button>

                    {/* Live Preview while recording */}
                    {videoRecorder.recording && videoRecorder.stream && (
                      <div className="mb-4">
                        <p className="text-sm text-red-600 mb-2 animate-pulse">🔴 Recording...</p>
                        <video
                          ref={(videoEl) => {
                            if (videoEl && videoRecorder.stream) {
                              videoEl.srcObject = videoRecorder.stream;
                            }
                          }}
                          autoPlay
                          muted
                          playsInline
                          className="w-full rounded-xl bg-black"
                        />
                      </div>
                    )}

                    {/* Preview after recording */}
                    {videoRecorder.previewUrl && !videoRecorder.recording && (
                      <div className="mt-4">
                        <video
                          src={videoRecorder.previewUrl}
                          controls
                          className="w-full rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={videoRecorder.discard}
                          className="text-red-600 text-sm mt-2"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-4 rounded-2xl font-semibold"
                >
                  {uploading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">Thank you for your kindness and generosity.</p>
          <p className="text-sm text-gray-500 mt-1">
            May God bless you and your family abundantly.
          </p>
        </div>
      </div>
    </div>
  );
}