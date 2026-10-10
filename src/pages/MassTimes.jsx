import {
  FaChurch,
  FaClock,
  FaPray,
  FaCross,
  FaSearch,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaMicrophone,
  FaQuestionCircle,
  FaBookOpen,
  FaSeedling,
  FaStar,
  FaBell,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { db } from "../firebase";
import { massSchedule, getNextMass } from "../data/massSchedule";
import { Link, useSearchParams } from "react-router-dom";

const BANNER_IMAGE =
  "https://res.cloudinary.com/dxcwgsjvk/image/upload/f_auto,q_auto/v1783097003/12_Facebook_1_wbhunw.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function useLiveCollection(name, orderField, direction = "desc", max) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const parts = [orderBy(orderField, direction)];
    if (max) parts.push(limit(max));
    const q = query(collection(db, name), ...parts);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error(`${name} error:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [name, orderField, direction, max]);

  return { items, loading, error };
}

function matches(term, ...fields) {
  if (!term) return true;
  const t = term.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(t));
}

function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id.length === 11 ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && v.length === 11) return v;
      const m = u.pathname.match(/\/(shorts|live|embed|v)\/([^/?#]{11})/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}


function Panel({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100 min-h-[280px]">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">{title}</h2>
      <div className="w-16 h-1 bg-amber-500 rounded-full mt-3 mb-3" />
      {subtitle && <p className="text-gray-600 mb-8">{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyBox({ children }) {
  return (
    <div className="text-center py-14 text-gray-500 border-2 border-dashed border-blue-100 rounded-2xl bg-blue-50/40">
      <FaChurch className="mx-auto text-3xl text-blue-200 mb-3" />
      {children}
    </div>
  );
}

function LoadState({ loading, error, what }) {
  if (loading)
    return (
      <div className="space-y-4 py-4" aria-label={`Loading ${what}`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Error loading {what}: {error}</p>
        <p className="text-sm text-gray-500 mt-2">
          Check Firebase rules and that documents have the field used for sorting.
        </p>
      </div>
    );
  return null;
}

const scheduleIcons = {
  sunday: <FaChurch className="text-2xl" />,
  weekday: <FaClock className="text-2xl" />,
  confession: <FaPray className="text-2xl" />,
  adoration: <FaCross className="text-2xl" />,
};

function TodayBadge() {
  return (
    <span className="shrink-0 text-xs font-bold uppercase tracking-wide bg-amber-400 text-blue-950 px-3 py-1 rounded-full">
      Today
    </span>
  );
}

// Which schedule card is happening today (0 = Sunday ... 6 = Saturday).
function isToday(key, day) {
  if (key === "sunday") return day === 0;
  if (key === "weekday") return day >= 1 && day <= 5;
  if (key === "confession") return day === 6;
  if (key === "adoration") return day === 4;
  return false;
}

// "in 2 days 3 hrs", "in 3 hrs 20 min", "in 15 min"
function timeUntil(date, now) {
  const mins = Math.max(0, Math.round((date - now) / 60000));
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const min = mins % 60;
  if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}${hrs ? ` ${hrs} hr${hrs > 1 ? "s" : ""}` : ""}`;
  if (hrs > 0) return `in ${hrs} hr${hrs > 1 ? "s" : ""}${min ? ` ${min} min` : ""}`;
  return min > 0 ? `in ${min} min` : "starting now";
}

/* ---------- Homilies ---------- */
function HomiliesPublic({ searchTerm = "" }) {
  const { items, loading, error } = useLiveCollection("homilies", "createdAt");
  const filtered = items.filter((item) => matches(searchTerm, item.title, item.description));

  return (
    <Panel title="Homilies" subtitle="Listen to or download recent homilies from our parish.">
      {loading || error ? (
        <LoadState loading={loading} error={error} what="homilies" />
      ) : filtered.length === 0 ? (
        <EmptyBox>
          {searchTerm
            ? "No homilies match your search."
            : "Homilies will appear here once uploaded by the priest."}
        </EmptyBox>
      ) : (
        <div className="space-y-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-lg text-blue-900">{item.title}</h3>
                {item.date && (
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {item.date}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              )}

              {item.audioUrl && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🎙️ Audio</p>
                  <audio src={item.audioUrl} controls className="w-full" />
                </div>
              )}

              {item.videoUrl && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🎥 Video</p>
                  <video src={item.videoUrl} controls className="w-full max-w-lg rounded-xl" />
                </div>
              )}

              {item.documentUrl && (
                <a
                  href={item.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 mt-1"
                >
                  📄 View / Download document
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ---------- Question of the Week ---------- */
function QuestionOfTheWeekPublic({ searchTerm = "" }) {
  const { items, loading, error } = useLiveCollection("questionOfTheWeek", "createdAt");
  const filtered = items.filter((item) => matches(searchTerm, item.question, item.answer));

  // Show the latest question first
  const latest = filtered[0];

  return (
    <Panel title="Question of the Week" subtitle="A weekly question and reflection from the parish.">
      {loading || error ? (
        <LoadState loading={loading} error={error} what="questions" />
      ) : !latest ? (
        <EmptyBox>
          {searchTerm
            ? "No questions match your search."
            : "This week’s question will appear here once posted."}
        </EmptyBox>
      ) : (
        <div className="space-y-6">
          <div className="border border-blue-100 rounded-2xl p-6 bg-blue-50/50">
            {latest.weekLabel && (
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">
                {latest.weekLabel}
              </p>
            )}
            <h3 className="text-xl font-bold text-blue-900 mb-4">{latest.question}</h3>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-sm font-semibold text-gray-500 mb-2">Answer / Reflection</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{latest.answer}</p>
            </div>
          </div>

          {/* Older questions */}
          {filtered.length > 1 && (
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Previous questions</h4>
              <div className="space-y-3">
                {filtered.slice(1).map((item) => (
                  <details key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <summary className="font-medium text-blue-900 cursor-pointer">
                      {item.question}
                      {item.weekLabel && (
                        <span className="text-xs text-gray-500 ml-2">({item.weekLabel})</span>
                      )}
                    </summary>
                    <p className="text-gray-600 mt-3 whitespace-pre-wrap text-sm">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ---------- About Father Patrick ---------- */
function AboutFatherPublic() {
  const { items, loading, error } = useLiveCollection("aboutFather", "updatedAt", "desc", 1);
  const father = items[0];

  return (
    <Panel title="About Father Patrick" subtitle="Learn more about our parish priest.">
      {loading || error ? (
        <LoadState loading={loading} error={error} what="Father's profile" />
      ) : !father ? (
        <EmptyBox>Father Patrick’s profile will appear here once added.</EmptyBox>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {father.photoUrl ? (
              <img
                src={father.photoUrl}
                alt={father.name}
                className="w-44 h-44 md:w-56 md:h-56 object-cover rounded-3xl shadow-md shrink-0"
              />
            ) : (
              <div className="w-44 h-44 rounded-3xl bg-blue-100 text-blue-400 flex items-center justify-center shrink-0">
                <FaUser className="text-6xl" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-900">{father.name}</h3>
              {father.title && <p className="text-blue-700 font-medium mt-1">{father.title}</p>}

              {father.bio && (
                <p className="text-gray-700 mt-4 leading-relaxed whitespace-pre-line">{father.bio}</p>
              )}

              {(father.phone || father.email) && (
                <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                  {father.phone && (
                    <a
                      href={`tel:${father.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-medium"
                    >
                      <FaPhone /> {father.phone}
                    </a>
                  )}
                  {father.email && (
                    <a
                      href={`mailto:${father.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-medium"
                    >
                      <FaEnvelope /> {father.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {father.videoUrl && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-2">🎥 Watch Father</p>
              <video
                src={father.videoUrl}
                controls
                preload="metadata"
                className="w-full rounded-2xl bg-black"
              />
            </div>
          )}

          {father.audioUrl && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-2">🎙️ Listen to Father</p>
              <audio src={father.audioUrl} controls preload="none" className="w-full" />
            </div>
          )}

          {father.message && (
            <blockquote className="border-l-4 border-amber-500 bg-amber-50 rounded-r-2xl p-6">
              <p className="text-sm font-semibold text-amber-900 mb-2">A message from Father</p>
              <p className="text-gray-800 italic leading-relaxed whitespace-pre-line">
                {father.message}
              </p>
            </blockquote>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ---------- RCIA Lessons ---------- */
function RciaPublic({ searchTerm = "" }) {
  const { items, loading, error } = useLiveCollection("rciaLessons", "lessonNumber", "asc");
  const filtered = items.filter((item) =>
    matches(searchTerm, item.title, item.summary, item.content)
  );

  return (
    <Panel title="RCIA Lessons" subtitle="Lessons for those preparing to join the Catholic Church.">
      {loading || error ? (
        <LoadState loading={loading} error={error} what="lessons" />
      ) : filtered.length === 0 ? (
        <EmptyBox>
          {searchTerm ? "No lessons match your search." : "RCIA lessons will appear here once uploaded."}
        </EmptyBox>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const youTubeId = getYouTubeId(lesson.videoUrl);
            return (
              <details
                key={lesson.id}
                className="group border border-gray-200 rounded-2xl bg-white shadow-sm open:shadow-md"
              >
                <summary className="flex items-center gap-4 p-5 cursor-pointer list-none">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center">
                    {lesson.lessonNumber}
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-blue-900">{lesson.title}</span>
                    {lesson.summary && (
                      <span className="block text-sm text-gray-500 mt-0.5">{lesson.summary}</span>
                    )}
                  </span>
                  <span className="text-blue-700 text-sm group-open:rotate-180 transition-transform">▾</span>
                </summary>

                <div className="px-5 pb-6">
                  {lesson.content && (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
                  )}

                  {youTubeId ? (
                    <div className="mt-4 aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${youTubeId}`}
                        title={lesson.title}
                        allowFullScreen
                        className="w-full h-full rounded-2xl"
                      />
                    </div>
                  ) : (
                    lesson.videoUrl && (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 mt-4"
                      >
                        🎥 Watch the lesson video
                      </a>
                    )
                  )}

                  {lesson.documentUrl && (
                    <a
                      href={lesson.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 mt-4"
                    >
                      📄 View / Download lesson notes
                    </a>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* ---------- Faith Formation ---------- */
function FaithFormationPublic({ searchTerm = "" }) {
  const { items, loading, error } = useLiveCollection("faithFormation", "createdAt");
  const filtered = items.filter((item) =>
    matches(searchTerm, item.title, item.description, item.audience)
  );

  return (
    <Panel title="Faith Formation" subtitle="Resources to grow deeper in the Catholic faith.">
      {loading || error ? (
        <LoadState loading={loading} error={error} what="programmes" />
      ) : filtered.length === 0 ? (
        <EmptyBox>
          {searchTerm
            ? "No programmes match your search."
            : "Faith formation programmes will appear here once added."}
        </EmptyBox>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((program) => (
            <div
              key={program.id}
              className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition flex flex-col"
            >
              {program.audience && (
                <span className="self-start text-xs font-medium bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  {program.audience}
                </span>
              )}
              <h3 className="font-bold text-lg text-blue-900 mt-3">{program.title}</h3>
              {program.description && (
                <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                  {program.description}
                </p>
              )}

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {program.schedule && (
                  <p className="flex items-start gap-2">
                    <FaCalendarAlt className="shrink-0 mt-0.5 text-blue-600" /> {program.schedule}
                  </p>
                )}
                {program.venue && (
                  <p className="flex items-start gap-2">
                    <FaMapMarkerAlt className="shrink-0 mt-0.5 text-blue-600" /> {program.venue}
                  </p>
                )}
                {program.contact && (
                  <p className="flex items-start gap-2">
                    <FaPhone className="shrink-0 mt-0.5 text-blue-600" /> {program.contact}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}


export default function MassTimes() {
  const reduceMotion = useReducedMotion();
  const tabsRef = useRef(null);
  const [now, setNow] = useState(() => new Date());

  // Keep the "Next Mass" countdown fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Links like /mass-times?tab=rcia&q=baptism (used by the site search) open a tab
  // with the search box already filled in.
  const [params] = useSearchParams();
  const [activeSection, setActiveSection] = useState(params.get("tab") || "homilies");
  const [searchTerm, setSearchTerm] = useState(params.get("q") || "");
  const [lastParams, setLastParams] = useState(params.toString());
  if (params.toString() !== lastParams) {
    setLastParams(params.toString());
    if (params.get("tab")) setActiveSection(params.get("tab"));
    setSearchTerm(params.get("q") || "");
  }

  const sections = [
    { key: "homilies", hint: "Sunday reflections", label: "Homilies", icon: FaMicrophone },
    { key: "question", hint: "This week's reflection", label: "Question of the Week", icon: FaQuestionCircle },
    { key: "about", hint: "Meet our parish priest", label: "About Father Patrick", icon: FaUser },
    { key: "rcia", hint: "Becoming Catholic", label: "RCIA Lessons", icon: FaBookOpen },
    { key: "faith", hint: "Grow deeper in faith", label: "Faith Formation", icon: FaSeedling },
  ];

  const nextMass = getNextMass(now);
  const today = now.getDay();

  // Pressing Enter in the search box jumps down to the results.
  const showResults = () => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40">
      {/* ---------- BANNER WITH THE WEEKLY SCHEDULE ---------- */}
      <section className="relative pt-28 md:pt-36 pb-10 md:pb-14 px-4 md:px-8 text-white overflow-hidden">
        <img
          src={BANNER_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover contrast-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Title on the left, Next Mass and search on the right */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-end mb-8 text-center lg:text-left">
            <div className="[text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-amber-400 font-semibold tracking-[0.25em] uppercase text-xs md:text-sm mb-3"
              >
                Our Lady of the Most Holy Rosary
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold mb-3"
              >
                Mass Times
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-base md:text-lg text-white/90"
              >
                Join us in worship as one family in faith
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-3 w-full max-w-md mx-auto lg:ml-auto lg:mr-0"
            >
              {nextMass && (
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl px-5 py-3 text-left">
                  <span className="relative flex w-3 h-3 shrink-0">
                    {!reduceMotion && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                    )}
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-amber-400" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-amber-300 font-semibold">
                      Next Mass
                    </span>
                    <span className="block font-semibold">
                      {nextMass.label} ·{" "}
                      {nextMass.date.toLocaleDateString(undefined, { weekday: "long" })}{" "}
                      {nextMass.date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      <span className="text-white/75 font-normal"> ({timeUntil(nextMass.date, now)})</span>
                    </span>
                  </span>
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && showResults()}
                  placeholder="Search homilies, lessons..."
                  className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-white shadow-xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 placeholder:text-gray-400"
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
              </div>
            </motion.div>
          </div>

          {/* The weekly schedule, sitting on the photo */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {massSchedule.map((item) => {
              const happeningToday = isToday(item.key, today);
              const isSunday = item.key === "sunday";
              return (
                <motion.div
                  key={item.key}
                  variants={fadeUp}
                  className={`relative rounded-2xl p-4 md:p-5 shadow-xl flex flex-col ${isSunday ? "col-span-2 lg:col-span-1" : ""} ${
                    isSunday
                      ? "bg-gradient-to-br from-blue-700 to-blue-950 text-white border border-white/20"
                      : "bg-white/95 backdrop-blur text-gray-800"
                  } ${happeningToday ? "ring-4 ring-amber-400" : ""}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 [&>svg]:text-lg ${
                        isSunday ? "bg-white/15" : `bg-gradient-to-br ${item.accent} text-white`
                      }`}
                    >
                      {scheduleIcons[item.key]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className={`font-bold leading-tight text-sm md:text-base ${isSunday ? "" : "text-blue-900"}`}>
                        {item.title}
                      </h2>
                      {item.note && (
                        <p className={`text-xs mt-0.5 ${isSunday ? "text-blue-200" : "text-gray-500"}`}>
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                  {happeningToday && (
                    <span className="absolute -top-3 right-3">
                      <TodayBadge />
                    </span>
                  )}
                  <div className="mt-auto space-y-1.5">
                    {item.times.map((slot) =>
                      isSunday ? (
                        <div
                          key={slot.label}
                          className="flex justify-between items-baseline gap-3 rounded-lg px-3 py-2 bg-white/10"
                        >
                          <span className="text-sm text-blue-100">{slot.label}</span>
                          <span className="font-bold whitespace-nowrap">{slot.time}</span>
                        </div>
                      ) : (
                        <div key={slot.label} className="rounded-lg px-3 py-2 bg-slate-100/80">
                          <p className="font-bold text-blue-900 leading-snug">{slot.time}</p>
                          <p className="text-xs text-gray-500">{slot.label}</p>
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Holy days */}
          <p className="mt-6 text-center text-sm text-white/85 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <FaStar className="text-amber-400" />
            <span>
              <span className="font-semibold text-white">Holy Days &amp; Special Masses</span> are
              shared in the parish announcements.
            </span>
            <Link to="/announcements" className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200">
              <FaBell /> See Announcements
            </Link>
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-14 pb-24">
        {/* ---------- FAITH CORNER ---------- */}
        <div ref={tabsRef} className="scroll-mt-28 md:scroll-mt-32 text-center mb-10">
          <p className="text-amber-600 font-semibold tracking-widest uppercase text-sm mb-2">
            Grow in Faith
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900">Faith Corner</h2>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            Homilies, reflections and lessons from our parish, all in one place.
          </p>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full" />
        </div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 lg:items-start">
          {/* Sidebar: a swipeable strip on phones, a menu on the left on big screens */}
          <aside className="sticky top-[76px] md:top-[88px] lg:top-[112px] z-20 mb-8 lg:mb-0 space-y-4">
            <nav className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 p-2 lg:p-3">
              <p className="hidden lg:block px-3 pt-1 pb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Explore
              </p>
              <div className="flex lg:flex-col gap-1.5 overflow-x-auto">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.key;
                  return (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`relative shrink-0 flex items-center gap-3 px-4 py-2.5 lg:py-3 rounded-xl text-sm font-semibold text-left transition-colors duration-200 ${
                        active ? "text-white" : "text-blue-800 hover:bg-blue-50"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="mass-times-tab"
                          className="absolute inset-0 bg-blue-700 rounded-xl shadow-md"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span
                        className={`relative z-10 lg:w-9 lg:h-9 lg:rounded-lg flex items-center justify-center ${
                          active ? "lg:bg-white/15" : "lg:bg-blue-50"
                        }`}
                      >
                        <Icon />
                      </span>
                      <span className="relative z-10">
                        <span className="block whitespace-nowrap">{section.label}</span>
                        <span
                          className={`hidden lg:block text-xs font-normal ${
                            active ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {section.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

          </aside>

          {/* Content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeSection === "homilies" && <HomiliesPublic searchTerm={searchTerm} />}
                {activeSection === "question" && <QuestionOfTheWeekPublic searchTerm={searchTerm} />}
                {activeSection === "about" && <AboutFatherPublic />}
                {activeSection === "rcia" && <RciaPublic searchTerm={searchTerm} />}
                {activeSection === "faith" && <FaithFormationPublic searchTerm={searchTerm} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
