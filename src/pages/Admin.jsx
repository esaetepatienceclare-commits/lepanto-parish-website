import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getCountFromServer } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Megaphone,
  Image,
  Calendar,
  FileText,
  MessageCircle,
  LogOut,
  GraduationCap,
  BookOpen,
  Heart,
  HelpCircle,
  User,
  Mic,
  Globe,
} from "lucide-react";

import { auth, db } from "../firebase";

import AnnouncementManager from "../components/admin/AnnouncementManager";
import GalleryManager from "../components/admin/GalleryManager";
import EventRulesManager from "../components/admin/EventRulesManager";
import EventsManager from "../components/admin/EventsManager";
import DonorMessagesManager from "../components/admin/DonorMessagesManager";
import HomiliesManager from "../components/admin/HomiliesManager";
import QuestionOfTheWeekManager from "../components/admin/QuestionOfTheWeekManager";
import AboutFatherManager from "../components/admin/AboutFatherManager";
import RciaLessonsManager from "../components/admin/RciaLessonsManager";
import FaithFormationManager from "../components/admin/FaithFormationManager";
import SupportCausesManager from "../components/admin/SupportCausesManager";

// The sidebar, grouped so related things sit together.
// To add a new tab, add a line to one of the groups and a line in MANAGERS below.
const GROUPS = [
  {
    title: "Parish News",
    tabs: [
      { key: "announcements", label: "Announcements", icon: Megaphone, hint: "News and notices for the parish" },
      { key: "events", label: "Events", icon: Calendar, hint: "Upcoming parish events" },
      { key: "eventRules", label: "Event Rules", icon: FileText, hint: "Guidelines shown with events" },
      { key: "gallery", label: "Gallery", icon: Image, hint: "Photos and videos of parish life" },
    ],
  },
  {
    title: "Faith Corner",
    tabs: [
      { key: "homilies", label: "Homilies", icon: Mic, hint: "Audio, video and notes of homilies" },
      { key: "question", label: "Question of the Week", icon: HelpCircle, hint: "This week's question and answer" },
      { key: "aboutFather", label: "About Father", icon: User, hint: "Father Patrick's profile" },
      { key: "rciaLessons", label: "RCIA Lessons", icon: BookOpen, hint: "Lessons for those joining the Church" },
      { key: "faithFormation", label: "Faith Formation", icon: GraduationCap, hint: "Programmes to grow in faith" },
    ],
  },
  {
    title: "Giving",
    tabs: [
      { key: "supportCauses", label: "Support Causes", icon: Heart, hint: "Causes, projects and ways to give" },
      { key: "donorMessages", label: "Donor Messages", icon: MessageCircle, hint: "Thank-you messages to donors" },
    ],
  },
];

const MANAGERS = {
  announcements: AnnouncementManager,
  gallery: GalleryManager,
  events: EventsManager,
  eventRules: EventRulesManager,
  donorMessages: DonorMessagesManager,
  homilies: HomiliesManager,
  question: QuestionOfTheWeekManager,
  aboutFather: AboutFatherManager,
  rciaLessons: RciaLessonsManager,
  faithFormation: FaithFormationManager,
  supportCauses: SupportCausesManager,
};

// The counts shown at the top. Click one to open its tab.
const STATS = [
  { tab: "announcements", collection: "announcements", label: "Announcements", icon: Megaphone, color: "from-blue-500 to-blue-700" },
  { tab: "events", collection: "events", label: "Events", icon: Calendar, color: "from-emerald-500 to-emerald-700" },
  { tab: "homilies", collection: "homilies", label: "Homilies", icon: Mic, color: "from-purple-500 to-purple-700" },
  { tab: "gallery", collection: "gallery", label: "Gallery items", icon: Image, color: "from-pink-500 to-rose-600" },
  { tab: "supportCauses", collection: "supportCauses", label: "Saved causes", icon: Heart, color: "from-amber-500 to-orange-600" },
];

const ALL_TABS = GROUPS.flatMap((g) => g.tabs);
const LAST_TAB_KEY = "admin-last-tab";

function greeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function savedTab() {
  try {
    const t = localStorage.getItem(LAST_TAB_KEY);
    return MANAGERS[t] ? t : "announcements";
  } catch {
    return "announcements";
  }
}

export default function Admin() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState(savedTab);
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [navigate]);

  // Count what is saved in each collection, once the admin is signed in.
  useEffect(() => {
    if (!user) return;
    STATS.forEach((s) => {
      getCountFromServer(collection(db, s.collection))
        .then((snap) => setCounts((c) => ({ ...c, [s.collection]: snap.data().count })))
        .catch(() => setCounts((c) => ({ ...c, [s.collection]: "–" })));
    });
  }, [user]);

  // Remember the last tab, so a refresh opens the same place.
  useEffect(() => {
    try {
      localStorage.setItem(LAST_TAB_KEY, tab);
    } catch {
      // Storage can be blocked; the panel still works without it.
    }
  }, [tab]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const openTab = (key) => {
    setTab(key);
    document.getElementById("admin-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const now = new Date();
  const current = ALL_TABS.find((t) => t.key === tab) || ALL_TABS[0];
  const Manager = MANAGERS[current.key];
  const name = user?.displayName || user?.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-blue-50 pt-28 md:pt-32 pb-16">
      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        {/* ---------- WELCOME HEADER ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white p-6 md:p-8 shadow-xl mb-6"
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-400/10" />
          <div className="absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-amber-300 text-xs font-semibold tracking-widest uppercase mb-2">
                Parish Admin
              </p>
              <h1 className="text-2xl md:text-3xl font-bold">
                {greeting(now.getHours())}
                {name ? `, ${name}` : ""} 👋
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                {now.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · What would you like to update today?
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl font-medium text-sm transition"
              >
                <Globe size={18} />
                View website
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </motion.div>

        {/* ---------- AT A GLANCE ---------- */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
          className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mb-8"
        >
          {STATS.map((s) => {
            const Icon = s.icon;
            const value = counts[s.collection];
            return (
              <motion.button
                key={s.collection}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                onClick={() => openTab(s.tab)}
                className="group bg-white rounded-2xl p-3 sm:p-4 text-left shadow-sm border border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-sm mb-3`}
                >
                  <Icon size={20} />
                </span>
                <p className="text-2xl font-bold text-blue-900">
                  {value === undefined ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 group-hover:text-blue-700 truncate">{s.label}</p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ---------- SIDEBAR + WORKSPACE ---------- */}
        <div id="admin-workspace" className="scroll-mt-28 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 lg:items-start">
          <aside className="sticky top-[76px] md:top-[88px] lg:top-[104px] z-20 mb-6 lg:mb-0">
            <nav className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-blue-100 p-2 lg:p-3">
              <div className="flex lg:flex-col gap-1 overflow-x-auto">
                {GROUPS.map((group) => (
                  <div key={group.title} className="flex lg:flex-col gap-1 lg:mb-3 last:mb-0 shrink-0">
                    <p className="hidden lg:block px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      {group.title}
                    </p>
                    {group.tabs.map((item) => {
                      const Icon = item.icon;
                      const isActive = tab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setTab(item.key)}
                          title={item.hint}
                          className={`relative shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
                            isActive ? "text-white" : "text-blue-800 hover:bg-blue-50"
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="admin-tab"
                              className="absolute inset-0 bg-blue-700 rounded-xl shadow-md"
                              transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            />
                          )}
                          <Icon size={18} className="relative z-10 shrink-0" />
                          <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </nav>
          </aside>

          {/* Workspace */}
          <div className="min-w-0 bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.key}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-4 md:p-8 min-h-[400px]"
              >
                <Manager />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
