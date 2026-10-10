import { useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import useCollection from "../../hooks/useCollection";

const AUDIENCES = ["Children", "Youth", "Adults", "Families", "Sacrament Preparation", "Everyone"];

export default function FaithFormationManager() {
  const { items, loading, reload: fetchItems } = useCollection("faithFormation", {
    orderField: "createdAt",
    errorMessage: "Error loading programmes. Check console.",
  });
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [venue, setVenue] = useState("");
  const [contact, setContact] = useState("");
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setTitle("");
    setAudience(AUDIENCES[0]);
    setDescription("");
    setSchedule("");
    setVenue("");
    setContact("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        audience,
        description: description.trim(),
        schedule: schedule.trim(),
        venue: venue.trim(),
        contact: contact.trim(),
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "faithFormation", editingId), data);
        alert("Programme updated!");
      } else {
        await addDoc(collection(db, "faithFormation"), {
          ...data,
          createdAt: Timestamp.now(),
        });
        alert("Programme posted!");
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
    setTitle(item.title || "");
    setAudience(item.audience || AUDIENCES[0]);
    setDescription(item.description || "");
    setSchedule(item.schedule || "");
    setVenue(item.venue || "");
    setContact(item.contact || "");
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this programme?")) return;
    try {
      await deleteDoc(doc(db, "faithFormation", id));
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-900">Faith Formation</h2>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Programme name * (e.g. Sunday School)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-xl"
              required
            />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="What the programme is about"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-xl h-32"
          />

          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="When (e.g. Sundays after 9 AM Mass)"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />
            <input
              type="text"
              placeholder="Where (e.g. Parish hall)"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />
            <input
              type="text"
              placeholder="Contact (name / phone)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : editingId ? "Update Programme" : "Post Programme"}
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
        <h3 className="font-semibold text-lg mb-4">Programmes ({items.length})</h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No programmes yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border rounded-2xl p-5">
                {item.audience && <p className="text-xs font-medium text-blue-700 mb-1">{item.audience}</p>}
                <h4 className="font-bold text-blue-900 text-lg">{item.title}</h4>
                {item.schedule && <p className="text-gray-600 mt-1 text-sm">{item.schedule}</p>}

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
