import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
  Megaphone, 
  Image, 
  Calendar, 
  FileText, 
  LogOut 
} from "lucide-react";

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

  const tabs = [
    { key: "announcements", label: "Announcements", icon: Megaphone },
    { key: "gallery", label: "Gallery", icon: Image },
    { key: "events", label: "Events", icon: Calendar },
    { key: "eventRules", label: "Event Rules", icon: FileText },
  ];

  return (
    <div className="pt-24 px-6 md:px-20 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">CMS Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Manage parish content</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-3 mb-8 flex-wrap border-b pb-4">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                isActive
                  ? "bg-blue-700 text-white shadow-md"
                  : "bg-white hover:bg-blue-50 text-blue-700 border border-gray-200"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* MANAGER CONTENT */}
      <div className="min-h-[400px]">
        {tab === "announcements" && <AnnouncementManager />}
        {tab === "gallery" && <GalleryManager />}
        {tab === "events" && <EventsManager />}
        {tab === "eventRules" && <EventRulesManager />}
      </div>
    </div>
  );
}