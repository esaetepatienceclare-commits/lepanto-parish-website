import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  CAUSE_COLORS,
  defaultCauses,
  formatUGX,
  paymentOptions,
  visibleCauses,
} from "../../data/supportCauses";
import { uploadImage } from "../../utils/cloudinary";

const EMPTY_FORM = {
  kind: "cause",
  title: "",
  emoji: "💛",
  color: "emerald",
  description: "",
  buttonLabel: "",
  payBank: true,
  bank: "Centenary Bank",
  accountName: "",
  accountNumber: "",
  payMobile: true,
  mobileNetwork: "MTN / Airtel",
  mobileNumber: "+256 772 473 247",
  mobileName: "",
  payCash: true,
  chequePayee: "Our Lady of the Most Holy Rosary Catholic Parish",
  goal: "",
  raised: "",
  order: "",
  active: true,
  imageUrl: "",
};

export default function SupportCausesManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const imageRef = useRef(null);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // Live list: updates by itself after every add, edit or delete.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supportCauses"),
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Hidden ones go last, the rest in their order.
        setItems([...visibleCauses(all), ...all.filter((c) => c.active === false)]);
        setLoading(false);
      },
      (err) => {
        console.error("Fetch error:", err);
        alert("Error loading causes. Check console.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImage(null);
    setEditingId(null);
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required");
    if (!form.payBank && !form.payMobile && !form.payCash) return alert("Tick at least one way to give");
    if (form.payBank && !form.accountNumber.trim()) return alert("Enter the bank account number, or untick Bank Transfer");
    if (form.payMobile && !form.mobileNumber.trim()) return alert("Enter the Mobile Money number, or untick Mobile Money");

    setSaving(true);
    try {
      const imageUrl = image ? await uploadImage(image) : form.imageUrl;
      const data = {
        kind: form.kind,
        title: form.title.trim(),
        emoji: form.emoji.trim() || "💛",
        color: form.color,
        description: form.description.trim(),
        buttonLabel: form.buttonLabel.trim(),
        payBank: form.payBank,
        bank: form.bank.trim(),
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        payMobile: form.payMobile,
        mobileNetwork: form.mobileNetwork.trim(),
        mobileNumber: form.mobileNumber.trim(),
        mobileName: form.mobileName.trim(),
        payCash: form.payCash,
        chequePayee: form.chequePayee.trim(),
        goal: Number(form.goal) || 0,
        raised: Number(form.raised) || 0,
        order: Number(form.order) || items.length + 1,
        active: form.active,
        imageUrl: imageUrl || "",
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "supportCauses", editingId), data);
        alert("Cause updated!");
      } else {
        await addDoc(collection(db, "supportCauses"), { ...data, createdAt: Timestamp.now() });
        alert("Cause added!");
      }

      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Check console.");
    } finally {
      setSaving(false);
    }
  };

  // Copies the three causes that were written into the Support page, so they can be edited here.
  // Original causes not yet in the list (matched by title), so they can be put back.
  const missingOriginals = defaultCauses.filter(
    (d) => !items.some((c) => c.title?.trim().toLowerCase() === d.title.toLowerCase())
  );

  const addOriginalCauses = async () => {
    const names = missingOriginals.map((c) => c.title).join(", ");
    if (!confirm(`Add these original causes back: ${names}?`)) return;
    setSaving(true);
    try {
      for (const cause of missingOriginals) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...data } = cause;
        const pay = paymentOptions(cause);
        await addDoc(collection(db, "supportCauses"), {
          ...data,
          payBank: pay.bank,
          payMobile: pay.mobile,
          mobileNetwork: pay.mobileNetwork,
          mobileNumber: pay.mobileNumber,
          mobileName: "",
          payCash: pay.cash,
          chequePayee: pay.chequePayee,
          goal: 0,
          raised: 0,
          active: true,
          imageUrl: "",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    const pay = paymentOptions(item);
    setForm({
      ...EMPTY_FORM,
      ...item,
      payBank: pay.bank,
      payMobile: pay.mobile,
      payCash: pay.cash,
      mobileNetwork: pay.mobileNetwork,
      mobileNumber: pay.mobileNumber,
      chequePayee: pay.chequePayee,
      goal: item.goal ? String(item.goal) : "",
      raised: item.raised ? String(item.raised) : "",
      order: item.order ? String(item.order) : "",
      active: item.active !== false,
    });
    setImage(null);
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this cause? It will disappear from the Support and Home pages.")) return;
    try {
      await deleteDoc(doc(db, "supportCauses", id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateDoc(doc(db, "supportCauses", item.id), { active: item.active === false });
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-900">Support Causes & Projects</h2>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <select value={form.kind} onChange={set("kind")} className="w-full p-3 border rounded-xl bg-white">
              <option value="cause">Cause (ongoing)</option>
              <option value="project">Project (with a goal)</option>
            </select>
            <input
              type="text"
              placeholder="Title * (e.g. Church Roof)"
              value={form.title}
              onChange={set("title")}
              className="w-full p-3 border rounded-xl md:col-span-2"
              required
            />
            <input
              type="text"
              placeholder="Emoji (e.g. ⛪)"
              value={form.emoji}
              onChange={set("emoji")}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <textarea
            placeholder="What the money is for"
            value={form.description}
            onChange={set("description")}
            className="w-full p-3 border rounded-xl h-28"
          />

          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Button text (e.g. Give to the Roof)"
              value={form.buttonLabel}
              onChange={set("buttonLabel")}
              className="w-full p-3 border rounded-xl"
            />
            <select value={form.color} onChange={set("color")} className="w-full p-3 border rounded-xl bg-white">
              {Object.entries(CAUSE_COLORS).map(([key, c]) => (
                <option key={key} value={key}>
                  Colour: {c.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              placeholder="Position (1 = first)"
              value={form.order}
              onChange={set("order")}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          {/* Ways to give: tick one or more */}
          <div className="border rounded-2xl p-4 space-y-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Ways to give for this cause (tick one or more)</p>

            <label className="flex items-center gap-2 font-medium text-gray-800">
              <input type="checkbox" checked={form.payBank} onChange={set("payBank")} className="w-4 h-4" />
              🏦 Bank Transfer
            </label>
            {form.payBank && (
              <div className="grid md:grid-cols-3 gap-4 pl-6">
                <input
                  type="text"
                  placeholder="Bank"
                  value={form.bank}
                  onChange={set("bank")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  placeholder="Account name"
                  value={form.accountName}
                  onChange={set("accountName")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  placeholder="Account number *"
                  value={form.accountNumber}
                  onChange={set("accountNumber")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
              </div>
            )}

            <label className="flex items-center gap-2 font-medium text-gray-800">
              <input type="checkbox" checked={form.payMobile} onChange={set("payMobile")} className="w-4 h-4" />
              📱 Mobile Money
            </label>
            {form.payMobile && (
              <div className="grid md:grid-cols-3 gap-4 pl-6">
                <input
                  type="text"
                  placeholder="Network (e.g. MTN / Airtel)"
                  value={form.mobileNetwork}
                  onChange={set("mobileNetwork")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  placeholder="Number *"
                  value={form.mobileNumber}
                  onChange={set("mobileNumber")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  placeholder="Registered name (optional)"
                  value={form.mobileName}
                  onChange={set("mobileName")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
              </div>
            )}

            <label className="flex items-center gap-2 font-medium text-gray-800">
              <input type="checkbox" checked={form.payCash} onChange={set("payCash")} className="w-4 h-4" />
              💵 Cash or Cheque
            </label>
            {form.payCash && (
              <div className="pl-6">
                <input
                  type="text"
                  placeholder="Cheques payable to"
                  value={form.chequePayee}
                  onChange={set("chequePayee")}
                  className="w-full p-3 border rounded-xl bg-white"
                />
              </div>
            )}
          </div>

          {form.kind === "project" && (
            <>
              <p className="text-sm font-semibold text-gray-700 pt-2">🎯 Fundraising progress (shown as a bar)</p>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  placeholder="Goal in UGX (e.g. 50000000)"
                  value={form.goal}
                  onChange={set("goal")}
                  className="w-full p-3 border rounded-xl"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Raised so far in UGX"
                  value={form.raised}
                  onChange={set("raised")}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Picture (optional)</label>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full p-3 border rounded-xl"
            />
            {form.imageUrl && !image && (
              <div className="flex items-center gap-3 mt-3">
                <img src={form.imageUrl} alt="" className="h-16 w-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  className="text-red-600 text-sm"
                >
                  Remove picture
                </button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" checked={form.active} onChange={set("active")} className="w-4 h-4" />
            Show on the website
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : editingId ? "Update Cause" : "Add Cause"}
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-lg">Causes ({items.length})</h3>
          {items.length > 0 && missingOriginals.length > 0 && (
            <button
              onClick={addOriginalCauses}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              Put back original causes ({missingOriginals.length})
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <p className="text-gray-700 mb-4">
              No causes saved yet, so the website is showing the three original ones. Add them here so you can
              edit them.
            </p>
            <button
              onClick={addOriginalCauses}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl font-medium"
            >
              Add the 3 original causes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 flex gap-4 ${item.active === false ? "opacity-60" : ""}`}
              >
                <div className="text-3xl shrink-0">{item.emoji || "💛"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-700 mb-1">
                    #{item.order || "-"} · {item.kind === "project" ? "Project" : "Cause"}
                    {item.active === false && " · Hidden"}
                  </p>
                  <h4 className="font-bold text-blue-900 text-lg">{item.title}</h4>
                  <p className="text-gray-600 mt-1 text-sm">
                    {[
                      paymentOptions(item).bank && `🏦 ${item.bank} ${item.accountNumber}`,
                      paymentOptions(item).mobile && `📱 ${paymentOptions(item).mobileNumber}`,
                      paymentOptions(item).cash && "💵 Cash/Cheque",
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                  {item.kind === "project" && item.goal > 0 && (
                    <p className="text-gray-600 mt-1 text-sm">
                      {formatUGX(item.raised)} of {formatUGX(item.goal)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => startEdit(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm"
                    >
                      {item.active === false ? "Show" : "Hide"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm"
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
