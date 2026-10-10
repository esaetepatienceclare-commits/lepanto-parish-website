import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Megaphone, Calendar, Download, Star } from "lucide-react";
import { db } from "../firebase";
import AnnouncementCard from "../components/AnnouncementCard";
import usePageSearch, { matchesSearch } from "../hooks/usePageSearch";
import bannerPhoto from "../assets/inaugration.jpg";

const WEEK = 7 * 86400000;

// "New" when published (or added) in the last 7 days.
function isNew(item) {
  const date = item.publishDate?.toDate?.() || item.createdAt?.toDate?.();
  return date ? Date.now() - date.getTime() < WEEK : false;
}

function formatDate(date) {
  return date?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = usePageSearch();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  // Escape closes the full announcement.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeAnnouncements = announcements.filter((item) => {
    if (!item.expiryDate) return true;
    const expiry = item.expiryDate.toDate().toISOString().split("T")[0];
    return expiry >= today;
  });

  const shown = activeAnnouncements.filter((item) => matchesSearch(searchTerm, item.title, item.description));

  // The top one sits on the photo: a "featured" announcement if there is one, else the newest.
  const highlight = searchTerm ? null : shown.find((a) => a.featured) || shown[0];
  const rest = highlight ? shown.filter((a) => a.id !== highlight.id) : shown;
  const newCount = activeAnnouncements.filter(isNew).length;

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ---------- BANNER WITH THE TOP ANNOUNCEMENT ---------- */}
      <div className="relative pt-28 md:pt-36 pb-10 md:pb-12 px-4 md:px-8 text-white overflow-hidden">
        <img
          src={bannerPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] contrast-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 items-end mb-8 text-center lg:text-left">
            <div className="[text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-amber-400 font-semibold tracking-[0.25em] uppercase text-xs md:text-sm mb-3"
              >
                Parish Notices
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold mb-3"
              >
                Announcements
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/90"
              >
                News and notices for our parish family.
                {!loading && activeAnnouncements.length > 0 && (
                  <span className="block mt-2 text-sm">
                    <strong>{activeAnnouncements.length}</strong> current
                    {newCount > 0 && (
                      <>
                        {" "}· <strong className="text-amber-300">{newCount}</strong> new this week
                      </>
                    )}
                  </span>
                )}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0"
            >
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search announcements..."
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white shadow-xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              )}
            </motion.div>
          </div>

          {/* The top announcement, sitting on the photo */}
          {loading ? (
            <div className="h-52 rounded-3xl bg-white/20 animate-pulse" />
          ) : (
            highlight && (
              <motion.button
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                onClick={() => setSelected(highlight)}
                className={`group w-full text-left bg-white text-gray-800 rounded-3xl shadow-2xl overflow-hidden grid ${
                  highlight.imageUrl ? "md:grid-cols-[2fr_3fr]" : ""
                }`}
              >
                {highlight.imageUrl && (
                  <div className="relative h-52 md:h-full min-h-[210px] overflow-hidden bg-blue-50">
                    <img
                      src={highlight.imageUrl}
                      alt={highlight.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 bg-amber-400 text-blue-950 font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                      <Star size={13} /> {highlight.featured ? "Featured" : "Latest"}
                    </span>
                    {highlight.publishDate && (
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 font-semibold px-3 py-1 rounded-full">
                        <Calendar size={13} /> {formatDate(highlight.publishDate.toDate())}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2 group-hover:text-blue-700 transition">
                    {highlight.title}
                  </h2>
                  {highlight.description && (
                    <p className="text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-line">
                      {highlight.description}
                    </p>
                  )}
                  <span className="mt-3 text-blue-700 font-semibold text-sm">Read the full announcement →</span>
                </div>
              </motion.button>
            )
          )}
        </div>
      </div>

      {/* ---------- ALL ANNOUNCEMENTS ---------- */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-12 pb-20">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-white/70 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-blue-100 rounded-3xl p-12 text-center">
            <Megaphone size={44} className="mx-auto text-blue-200 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? "No announcements match your search." : "No active announcements at the moment."}
            </p>
          </div>
        ) : (
          rest.length > 0 && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-blue-900 whitespace-nowrap">
                  {searchTerm ? `${shown.length} found` : "More Announcements"}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-400 to-transparent" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {rest.map((item) => (
                  <motion.div
                    key={item.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={fadeUp}
                  >
                    <AnnouncementCard item={item} onOpen={() => setSelected(item)} />
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}
      </div>

      {/* ---------- FULL ANNOUNCEMENT ---------- */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>

              {selected.imageUrl && (
                <div className="bg-blue-50 flex justify-center">
                  <img src={selected.imageUrl} alt={selected.title} className="max-h-[50vh] w-auto max-w-full object-contain" />
                </div>
              )}

              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  {selected.publishDate && (
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 font-semibold px-3 py-1 rounded-full">
                      <Calendar size={13} /> {formatDate(selected.publishDate.toDate())}
                    </span>
                  )}
                  {isNew(selected) && (
                    <span className="bg-amber-400 text-blue-950 font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-4 pr-8">{selected.title}</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selected.description}</p>

                {selected.videoUrl && (
                  <video src={selected.videoUrl} controls preload="metadata" className="w-full rounded-2xl bg-black mt-6" />
                )}

                {selected.audioUrl && (
                  <div className="mt-6 bg-purple-50/60 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-purple-800 mb-2">🎙️ Voice announcement</p>
                    <audio src={selected.audioUrl} controls className="w-full" preload="metadata" />
                    <a
                      href={selected.audioUrl}
                      download
                      className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 text-sm font-medium mt-3"
                    >
                      <Download size={15} /> Download audio
                    </a>
                  </div>
                )}

                {selected.expiryDate && (
                  <p className="text-xs text-gray-400 mt-6">Showing until {formatDate(selected.expiryDate.toDate())}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
