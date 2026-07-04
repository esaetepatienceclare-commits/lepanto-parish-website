import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowUp } from "react-icons/fa";

export default function About() {
  const [priestMessage, setPriestMessage] = useState(null);
  const [history, setHistory] = useState(null);
  const [visionMission, setVisionMission] = useState(null);
  const [parishInfo, setParishInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [priestSnap, historySnap, vmSnap, infoSnap] = await Promise.all([
          getDoc(doc(db, "priestMessage", "current")),
          getDocs(collection(db, "parishHistory")),
          getDocs(collection(db, "visionMission")),
          getDocs(collection(db, "parishInfo")),
        ]);

        setPriestMessage(priestSnap.exists() ? priestSnap.data() : null);
        setHistory(historySnap.docs[0]?.data() ?? null);
        setVisionMission(vmSnap.docs[0]?.data() ?? null);
        setParishInfo(infoSnap.docs[0]?.data() ?? null);
      } catch (err) {
        console.error("Error loading About page data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="pt-24 px-6 md:px-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading parish information...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 md:px-20 max-w-6xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-blue-900 mb-10">About Our Parish</h1>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-3 mb-12">
        {[
          { label: "Parish Info", id: "parish-info" },
          { label: "Priest Message", id: "priest-message" },
          { label: "History", id: "parish-history" },
          { label: "Vision & Mission", id: "vision-mission" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
            className="px-5 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm font-medium transition"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* PARISH INFO */}
      {parishInfo && (
        <div id="parish-info" className="bg-blue-50 border-l-4 border-blue-700 p-8 rounded-2xl mb-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">{parishInfo.parishName}</h2>
          
          <p className="text-xl text-blue-800 italic mb-6">"{parishInfo.motto}"</p>
          
          <div className="grid md:grid-cols-2 gap-y-4 text-gray-700">
            <p><strong>Diocese:</strong> {parishInfo.diocese}</p>
            <p><strong>District:</strong> Amuria District (Uganda)</p>
            <p><strong>Established:</strong> 7th October 2020</p>
            {parishInfo.location && <p><strong>Location:</strong> {parishInfo.location}</p>}
          </div>
        </div>
      )}

      {/* PRIEST MESSAGE */}
      {priestMessage && (
        <div id="priest-message" className="mb-16">
          <h2 className="text-3xl font-bold text-blue-900 mb-8">Message from the Parish Priest</h2>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {priestMessage.imageUrl && (
              <div className="md:w-1/3">
                <img
                  src={priestMessage.imageUrl}
                  alt={priestMessage.name}
                  className="w-full rounded-2xl shadow-xl"
                />
              </div>
            )}
            <div className="md:w-2/3">
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {priestMessage.message}
              </p>
              <div className="mt-8">
                <p className="font-bold text-xl text-blue-900">{priestMessage.name}</p>
                <p className="text-gray-600">{priestMessage.title}</p>
                {priestMessage.motto && <p className="italic mt-4 text-gray-500">"{priestMessage.motto}"</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARISH HISTORY */}
      {history && (
        <div id="parish-history" className="mb-16">
          <h2 className="text-3xl font-bold text-blue-900 mb-8">Our Parish History</h2>

          <div className="relative border-l-4 border-blue-200 pl-8 ml-4 space-y-12">

            {/* Inauguration Highlight */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-lg">2020</div>
                <h3 className="text-2xl font-bold text-blue-900">Official Establishment</h3>
              </div>
              <img
                src="https://res.cloudinary.com/dxcwgsjvk/image/upload/v1782196872/REGISTRATION_FOR_COMPANY_DOC20260609_13510570_ktvv5z.jpg"
                alt="Parish Inauguration"
                className="w-full rounded-2xl shadow-xl mb-4"
              />
              <p className="text-gray-600 italic">7 October 2020 — Feast of Our Lady of the Rosary</p>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              {showFullHistory ? (
                <div className="whitespace-pre-line">
                  {history.content}
                </div>
              ) : (
                <div className="whitespace-pre-line">
                  {history.content?.slice(0, 750) + "..."}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="px-8 py-3.5 bg-blue-700 text-white font-medium rounded-2xl hover:bg-blue-800 transition shadow-md"
            >
              {showFullHistory ? "Show Less" : "Read Full History"}
            </button>
          </div>
        </div>
      )}

      {/* VISION & MISSION */}
      {visionMission && (
        <div id="vision-mission" className="grid md:grid-cols-2 gap-8">
          <div className="bg-green-50 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-green-800 mb-4">Our Vision</h3>
            <p className="text-gray-700 leading-relaxed">{visionMission.vision}</p>
          </div>

          <div className="bg-amber-50 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-amber-800 mb-4">Our Mission</h3>
            <p className="text-gray-700 leading-relaxed">{visionMission.mission}</p>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-blue-700 text-white p-4 rounded-full shadow-xl hover:bg-blue-800 transition-all hover:scale-110"
      >
        <FaArrowUp size={20} />
      </button>
    </div>
  );
}