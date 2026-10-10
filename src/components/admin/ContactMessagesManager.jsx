import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Mail, Trash2, Check, Reply, Inbox } from "lucide-react";
import { db } from "../../firebase";
import useCollection from "../../hooks/useCollection";

// Replies are sent from the parish Gmail account (the same address shown on the Contact page).
const PARISH_EMAIL = "mostholyrosarioasamuk@gmail.com";

// Messages people send from the Contact page.
export default function ContactMessagesManager({ onChange }) {
  const { items: messages, loading, reload } = useCollection("contactMessages", { orderField: "timestamp" });
  const [filter, setFilter] = useState("new");

  const newCount = messages.filter((m) => m.status === "new").length;
  const shown = filter === "new" ? messages.filter((m) => m.status === "new") : messages;

  const refresh = () => {
    reload();
    onChange?.();
  };

  const setStatus = async (msg, status) => {
    try {
      await updateDoc(doc(db, "contactMessages", msg.id), { status });
      refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update the message");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "contactMessages", id));
      refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  // Opens a Gmail reply in a new tab from the parish account, already addressed, with their message quoted.
  const replyLink = (msg) => {
    const params = new URLSearchParams({
      authuser: PARISH_EMAIL,
      view: "cm",
      fs: "1",
      to: msg.email,
      su: "Re: " + (msg.subject || "Your message to the parish"),
      body: `\n\n----\n${msg.name || "They"} wrote:\n${msg.message || ""}`,
    });
    const compose = `https://mail.google.com/mail/?${params.toString().replace(/\+/g, "%20")}`;
    // Google's account chooser makes sure the parish account is used: it signs in to it if needed,
    // instead of quietly opening whichever Gmail account is already signed in.
    return `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(PARISH_EMAIL)}&continue=${encodeURIComponent(compose)}`;
  };

  if (loading) {
    return <p className="text-gray-500">Loading messages...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Contact Messages</h2>
          <p className="text-sm text-gray-500">Replies are sent from {PARISH_EMAIL}</p>
        </div>
        <div className="flex bg-blue-50 rounded-xl p-1 text-sm font-semibold">
          {[
            { key: "new", label: `New (${newCount})` },
            { key: "all", label: `All (${messages.length})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg transition ${
                filter === f.key ? "bg-blue-700 text-white shadow" : "text-blue-800 hover:bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="bg-white border border-dashed border-blue-200 rounded-2xl p-10 text-center text-gray-500">
          <Inbox className="mx-auto mb-3 text-blue-300" size={36} />
          {filter === "new" ? "No new messages. You're all caught up." : "No messages yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((msg) => {
            const isNew = msg.status === "new";
            return (
              <div
                key={msg.id}
                className={`bg-white border rounded-2xl p-5 md:p-6 shadow-sm ${
                  isNew ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-blue-900">{msg.name || "No name"}</h3>
                      {isNew && (
                        <span className="bg-amber-400 text-blue-950 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 break-all">
                      <Mail size={13} className="inline mr-1 -mt-0.5" />
                      {msg.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      {msg.timestamp?.toDate?.()?.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }) || "Unknown date"}
                    </p>
                    {msg.subject && <p className="text-sm font-semibold text-blue-700 mt-1">{msg.subject}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {msg.email && (
                      <a
                        href={replyLink(msg)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => isNew && setStatus(msg, "read")}
                        className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
                      >
                        <Reply size={15} /> Reply
                      </a>
                    )}
                    <button
                      onClick={() => setStatus(msg, isNew ? "read" : "new")}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg"
                    >
                      <Check size={15} /> {isNew ? "Mark as read" : "Mark as new"}
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
