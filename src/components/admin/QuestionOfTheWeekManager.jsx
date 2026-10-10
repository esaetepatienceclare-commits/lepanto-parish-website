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

export default function QuestionOfTheWeekManager() {
  const { items, loading, reload: fetchItems } = useCollection("questionOfTheWeek", {
    orderField: "createdAt",
    errorMessage: "Error loading questions. Check console.",
  });
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [weekLabel, setWeekLabel] = useState("");
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setWeekLabel("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      return alert("Question and answer are required");
    }

    setSaving(true);
    try {
      const data = {
        question: question.trim(),
        answer: answer.trim(),
        weekLabel: weekLabel.trim(),
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "questionOfTheWeek", editingId), data);
        alert("Updated successfully!");
      } else {
        await addDoc(collection(db, "questionOfTheWeek"), {
          ...data,
          createdAt: Timestamp.now(),
        });
        alert("Posted successfully!");
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
    setQuestion(item.question || "");
    setAnswer(item.answer || "");
    setWeekLabel(item.weekLabel || "");
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteDoc(doc(db, "questionOfTheWeek", id));
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-900">Question of the Week</h2>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Week label (e.g. Week of July 28, 2026)"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            className="w-full p-3 border rounded-xl"
          />

          <textarea
            placeholder="Question *"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 border rounded-xl h-24"
            required
          />

          <textarea
            placeholder="Answer / Reflection *"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full p-3 border rounded-xl h-36"
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : editingId ? "Update Question" : "Post Question"}
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
        <h3 className="font-semibold text-lg mb-4">Posted ({items.length})</h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No questions yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border rounded-2xl p-5">
                {item.weekLabel && (
                  <p className="text-xs font-medium text-blue-700 mb-1">
                    {item.weekLabel}
                  </p>
                )}
                <h4 className="font-bold text-blue-900 text-lg">{item.question}</h4>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{item.answer}</p>

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