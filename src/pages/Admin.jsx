import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";

import AnnouncementManager from "../components/admin/AnnouncementManager";
import GalleryManager from "../components/admin/GalleryManager";
import EventRulesManager from "../components/admin/EventRulesManager";
import EventsManager from "../components/admin/EventsManager";


export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("announcements");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="pt-24 px-6 md:px-20 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-900">CMS Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-medium"
        >
          Logout
        </button>
      </div>

            {/* NAV */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { key: "announcements", label: "ANNOUNCEMENTS" },
          { key: "gallery", label: "GALLERY" },
          { key: "events", label: "EVENTS" },
          { key: "eventRules", label: "EVENT RULES" },
          
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              tab === item.key
                ? "bg-blue-700 text-white shadow"
                : "bg-blue-100 hover:bg-blue-200 text-blue-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {/* MANAGERS */}
      {tab === "announcements" && <AnnouncementManager />}
      {tab === "gallery" && <GalleryManager />}
     {tab === "events" && <EventsManager />}
      {tab === "eventRules" && <EventRulesManager />}
      
    </div>
  );
}