import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Calendar, Clock, MapPin, Search, X, CalendarPlus, Sparkles } from "lucide-react";
import { db } from "../firebase";
import usePageSearch, { matchesSearch } from "../hooks/usePageSearch";
import bannerPhoto from "../assets/bishop.jpg";

const PAGE_SIZE = 9;

const FILTERS = [
  { key: "all", label: "All upcoming" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// "Today", "Tomorrow", "In 5 days"
function daysAway(date, today) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((start - today) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// A Google Calendar link with the event filled in.
function calendarLink(event, date) {
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const nextDay = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Parish event",
    dates: `${day}/${nextDay}`,
    details: [event.time && `Time: ${event.time}`, event.description].filter(Boolean).join("\n\n"),
    location: event.location || "Our Lady of the Most Holy Rosary Parish, Lepanto",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// The little calendar page showing the day and month.
function DateLeaf({ date, large = false }) {
  return (
    <div
      className={`shrink-0 rounded-2xl bg-white text-center shadow-md overflow-hidden border border-blue-100 ${
        large ? "w-24" : "w-16"
      }`}
    >
      <div className={`bg-blue-700 text-white font-semibold uppercase ${large ? "text-sm py-1.5" : "text-[11px] py-1"}`}>
        {date.toLocaleDateString(undefined, { month: "short" })}
      </div>
      <div className={`font-bold text-blue-900 leading-none ${large ? "text-4xl pt-3" : "text-2xl pt-2"}`}>
        {date.getDate()}
      </div>
      <div className={`text-gray-500 ${large ? "text-sm pb-3 pt-1" : "text-[11px] pb-2 pt-0.5"}`}>
        {date.toLocaleDateString(undefined, { weekday: "short" })}
      </div>
    </div>
  );
}

export default function Events() {
  const reduceMotion = useReducedMotion();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = usePageSearch();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snap = await getDocs(collection(db, "events"));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sorted = data.sort((a, b) => (a.eventDate?.seconds || 0) - (b.eventDate?.seconds || 0));

        setEvents(sorted);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Escape closes the event details.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hide past events
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(todayMidnight);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const upcoming = events
    .filter((event) => event.eventDate && event.eventDate.toDate() >= todayMidnight)
    .map((event) => ({ ...event, date: event.eventDate.toDate() }));

  const matching = upcoming
    .filter((event) => {
      if (filter === "week") return event.date < weekEnd;
      if (filter === "month")
        return event.date.getMonth() === now.getMonth() && event.date.getFullYear() === now.getFullYear();
      return true;
    })
    .filter((event) => matchesSearch(searchTerm, event.title, event.description, event.location));

  // The very next event gets the big card (only when not searching or filtering).
  const featured = !searchTerm && filter === "all" ? matching[0] : null;
  const rest = featured ? matching.slice(1) : matching;
  // Show a page at a time, or every match when searching.
  const visible = searchTerm ? rest : rest.slice(0, shown);

  // Group by month: "October 2026", "November 2026" ...
  const months = [];
  visible.forEach((event) => {
    const label = event.date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const group = months.find((m) => m.label === label);
    if (group) group.events.push(event);
    else months.push({ label, events: [event] });
  });

  const thisWeekCount = upcoming.filter((e) => e.date < weekEnd).length;

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ---------- BANNER WITH THE NEXT EVENT ---------- */}
      <div className="relative pt-28 md:pt-36 pb-10 md:pb-12 px-4 md:px-8 text-white overflow-hidden">
        <img
          src={bannerPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_30%] contrast-110 saturate-110"
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
                Life of the Parish
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold mb-3"
              >
                Parish Events
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/90"
              >
                Celebrations, meetings, conferences and pilgrimages in our parish community.
                {!loading && upcoming.length > 0 && (
                  <span className="block mt-2 text-sm">
                    <strong>{upcoming.length}</strong> upcoming
                    {thisWeekCount > 0 && (
                      <>
                        {" "}· <strong className="text-amber-300">{thisWeekCount}</strong> this week
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
              className="space-y-3 w-full max-w-md mx-auto lg:ml-auto lg:mr-0"
            >
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
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
              </div>
            <div className="flex justify-center lg:justify-end">
              <div className="inline-flex bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 p-1.5 gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setFilter(f.key);
                      setShown(PAGE_SIZE);
                    }}
                    className={`relative px-3 md:px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      filter === f.key ? "text-blue-950" : "text-white hover:bg-white/15"
                    }`}
                  >
                    {filter === f.key && (
                      <motion.span
                        layoutId="events-filter"
                        className="absolute inset-0 bg-amber-400 rounded-xl shadow-md"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 whitespace-nowrap">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
            </motion.div>
          </div>

          {/* The very next event, sitting on the photo */}
                {featured && (
                  <motion.button
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    onClick={() => setSelected(featured)}
                    className="group w-full text-left bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-[2fr_3fr] hover:shadow-black/40 transition-shadow"
                  >
                    <div className="relative h-48 md:h-full min-h-[200px] overflow-hidden bg-gradient-to-br from-blue-700 to-blue-950">
                      {featured.imageUrl ? (
                        <img
                          src={featured.imageUrl}
                          alt={featured.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="hidden md:block">
                              <DateLeaf date={featured.date} large />
                            </span>
                            <span className="md:hidden pt-6">
                              <DateLeaf date={featured.date} />
                            </span>
                        </div>
                      )}
                      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-amber-400 text-blue-950 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow">
                        <Sparkles size={14} /> Next up · {daysAway(featured.date, todayMidnight)}
                      </span>
                    </div>
                    <div className="p-5 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-4 mb-4">
                        {featured.imageUrl && <DateLeaf date={featured.date} />}
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            {featured.date.toLocaleDateString(undefined, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          {featured.time && (
                            <p className="flex items-center gap-2">
                              <Clock size={16} className="text-blue-600" /> {featured.time}
                            </p>
                          )}
                          {featured.location && (
                            <p className="flex items-center gap-2">
                              <MapPin size={16} className="text-blue-600" /> {featured.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2 group-hover:text-blue-700 transition">
                        {featured.title}
                      </h2>
                      {featured.description && (
                        <p className="text-gray-600 leading-relaxed line-clamp-2">{featured.description}</p>
                      )}
                      <span className="mt-3 text-blue-700 font-semibold text-sm">See details →</span>
                    </div>
                  </motion.button>
                )}
        </div>
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-12 pb-20">
        {loading ? (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-3xl bg-white/70 animate-pulse" />
              ))}
            </div>
          </div>
        ) : matching.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-blue-100 rounded-3xl p-12 text-center">
            <Calendar size={44} className="mx-auto text-blue-200 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              {searchTerm ? "No Matching Events" : "No Upcoming Events"}
            </h2>
            <p className="text-gray-500">
              {searchTerm
                ? "Try a different word, or clear the search."
                : filter !== "all"
                  ? "Nothing planned for this time yet. Try “All upcoming”."
                  : "Please check back later for new parish events."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter + searchTerm}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* ---------- BY MONTH ---------- */}
              {months.map((month) => (
                <section key={month.label} className="mb-12">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-blue-900 whitespace-nowrap">{month.label}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-400 to-transparent" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {month.events.map((event) => (
                      <motion.button
                        key={event.id}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={fadeUp}
                        onClick={() => setSelected(event)}
                        className="group text-left bg-white rounded-3xl shadow-sm border border-blue-100 p-4 md:p-5 flex gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <DateLeaf date={event.date} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-lg text-blue-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition">
                              {event.title}
                            </h3>
                            {event.date < weekEnd && (
                              <span className="shrink-0 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                {daysAway(event.date, todayMidnight)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1.5">
                            {event.time && (
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} /> {event.time}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1.5 min-w-0">
                                <MapPin size={14} className="shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mt-2">{event.description}</p>
                          )}
                        </div>
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt=""
                            loading="lazy"
                            className="hidden sm:block w-24 h-24 rounded-2xl object-cover shrink-0"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </section>
              ))}

              {!searchTerm && rest.length > shown && (
                <div className="text-center">
                  <button
                    onClick={() => setShown((n) => n + PAGE_SIZE)}
                    className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-md transition"
                  >
                    Show more events ({rest.length - shown} more)
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ---------- EVENT DETAILS ---------- */}
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
              className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {selected.imageUrl && (
                <img src={selected.imageUrl} alt={selected.title} className="w-full max-h-72 object-cover" />
              )}
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-5">
                  <DateLeaf date={selected.date} />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-blue-900 leading-snug">{selected.title}</h2>
                    <p className="text-amber-700 text-sm font-semibold mt-1">
                      {daysAway(selected.date, todayMidnight)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-gray-700 bg-blue-50 rounded-2xl p-4 mb-5">
                  <p className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    {selected.date.toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {selected.time && (
                    <p className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" /> {selected.time}
                    </p>
                  )}
                  {selected.location && (
                    <p className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-600" /> {selected.location}
                    </p>
                  )}
                </div>

                {selected.description && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">{selected.description}</p>
                )}

                <a
                  href={calendarLink(selected, selected.date)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition"
                >
                  <CalendarPlus size={18} /> Add to my calendar
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
