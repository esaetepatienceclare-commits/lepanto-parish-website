import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, orderBy, query, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";

export default function DonorMessagesManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  // IDs of messages currently shown in the home page "Thank you" strip.
  const [shownIds, setShownIds] = useState(new Set());

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, "donorMessages"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const shown = await getDocs(collection(db, "donorThanks"));
      setShownIds(new Set(shown.docs.map((d) => d.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load once when the tab opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, []);

  // Copies only the name, cause and text message to the public "donorThanks"
  // collection, so audio, video and unapproved messages stay private.
  const toggleOnHomePage = async (msg) => {
    try {
      if (shownIds.has(msg.id)) {
        await deleteDoc(doc(db, "donorThanks", msg.id));
      } else {
        await setDoc(doc(db, "donorThanks", msg.id), {
          name: msg.name || "Anonymous",
          cause: msg.cause || "",
          message: msg.message || "",
          createdAt: Timestamp.now(),
        });
      }
      fetchMessages();
    } catch (err) {
      console.error(err);
      alert("Failed to update the home page");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "donorMessages", id));
      await deleteDoc(doc(db, "donorThanks", id));
      fetchMessages();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading donor messages...</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">
        Donor Messages ({messages.length})
      </h2>

      {messages.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-gray-500">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-blue-900">
                    {msg.name || "Anonymous"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {msg.cause} •{" "}
                    {msg.createdAt?.toDate()?.toLocaleString() || "Unknown date"}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <button
                    onClick={() => toggleOnHomePage(msg)}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                      shownIds.has(msg.id)
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                  >
                    {shownIds.has(msg.id) ? "✓ On home page (remove)" : "Show on home page"}
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {msg.message && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {msg.message}
                </p>
              )}

              {msg.audioUrl && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">🎙️ Audio Message</p>
                  <audio src={msg.audioUrl} controls className="w-full" />
                </div>
              )}

              {msg.videoUrl && (
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-2">🎥 Video Message</p>
                  <video
                    src={msg.videoUrl}
                    controls
                    className="w-full max-w-md rounded-xl"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}