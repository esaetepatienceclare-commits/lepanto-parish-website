import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

export default function DonorMessagesManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, "donorMessages"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "donorMessages", id));
      fetchMessages();
    } catch (err) {
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
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
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