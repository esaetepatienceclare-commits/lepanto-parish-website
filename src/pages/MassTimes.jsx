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
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useSearchParams } from "react-router-dom";

// Listens to a Firestore collection and keeps the list up to date.
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
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl border border-white/40 min-h-[280px]">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">{title}</h2>
      {subtitle && <p className="text-gray-600 mb-8">{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyBox({ children }) {
  return (
    <div className="text-center py-14 text-gray-500 border-2 border-dashed border-blue-100 rounded-2xl bg-blue-50/40">
      {children}
    </div>
  );
}

function LoadState({ loading, error, what }) {
  if (loading) return <p className="text-center text-gray-500 py-10">Loading {what}...</p>;
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

  const massSchedule = [
    {
      title: "Sunday Masses",
      icon: <FaChurch className="text-2xl" />,
      accent: "from-blue-600 to-blue-800",
      badge: "bg-blue-100 text-blue-800",
      times: [
        { label: "First Mass", time: "7:00 AM" },
        { label: "Second Mass", time: "9:00 AM" },
        { label: "Third Mass", time: "2:00 PM" },
      ],
      note: "All Sundays",
    },
    {
      title: "Weekday Masses",
      icon: <FaClock className="text-2xl" />,
      accent: "from-emerald-600 to-emerald-800",
      badge: "bg-emerald-100 text-emerald-800",
      times: [{ label: "Monday – Friday", time: "7:00 AM" }],
      note: "Daily Mass",
    },
    {
      title: "Confessions",
      icon: <FaPray className="text-2xl" />,
      accent: "from-purple-600 to-purple-800",
      badge: "bg-purple-100 text-purple-800",
      times: [{ label: "Every Saturday", time: "4:00 PM" }],
      note: "",
    },
    {
      title: "Eucharistic Adoration",
      icon: <FaCross className="text-2xl" />,
      accent: "from-amber-500 to-amber-700",
      badge: "bg-amber-100 text-amber-800",
      times: [{ label: "Every Thursday", time: "After Morning Mass" }],
      note: "Exposition of the Blessed Sacrament",
    },
  ];

  const sections = [
    { key: "homilies", label: "Homilies" },
    { key: "question", label: "Question of the Week" },
    { key: "about", label: "About Father Patrick" },
    { key: "rcia", label: "RCIA Lessons" },
    { key: "faith", label: "Faith Formation" },
  ];

  return (
    <div className="pt-24 min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dxcwgsjvk/image/upload/v1783097003/12_Facebook_1_wbhunw.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/70 via-blue-900/50 to-blue-950/80 z-0" />

      <div className="px-6 md:px-20 max-w-6xl mx-auto pb-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-3">
            Our Lady of the Most Holy Rosary
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Mass Times
          </h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto mb-8">
            Join us in worship as one family in faith
          </p>

          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search homilies, lessons..."
              className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-white/95 shadow-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder:text-gray-400"
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
          </div>
        </div>

        {/* Mass Schedule */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {massSchedule.map((item) => (
            <div
              key={item.title}
              className="bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/40 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`h-1.5 bg-gradient-to-r ${item.accent}`} />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.accent} text-white flex items-center justify-center shadow-md`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-blue-900">{item.title}</h2>
                    {item.note && (
                      <span
                        className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${item.badge}`}
                      >
                        {item.note}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {item.times.map((slot) => (
                    <div
                      key={slot.label}
                      className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-3"
                    >
                      <span className="text-sm font-medium text-gray-600">{slot.label}</span>
                      <span className="text-base font-bold text-blue-900">{slot.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Holy Days */}
        <div className="mb-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-8 text-center shadow-md">
          <h3 className="font-bold text-lg text-amber-900 mb-2">Holy Days &amp; Special Masses</h3>
          <p className="text-amber-800/90 max-w-lg mx-auto text-sm leading-relaxed">
            Schedules for Christmas, Easter, Feast Days, and other special
            celebrations will be announced through the parish bulletin and
            announcements.
          </p>
        </div>

        {/* Sub Navbar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-2.5 mb-8 sticky top-20 z-20">
          <div className="flex flex-wrap justify-center gap-1.5">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeSection === section.key
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-800 hover:bg-blue-50"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeSection === "homilies" && <HomiliesPublic searchTerm={searchTerm} />}
        {activeSection === "question" && <QuestionOfTheWeekPublic searchTerm={searchTerm} />}
        {activeSection === "about" && <AboutFatherPublic />}
        {activeSection === "rcia" && <RciaPublic searchTerm={searchTerm} />}
        {activeSection === "faith" && <FaithFormationPublic searchTerm={searchTerm} />}
      </div>
    </div>
  );
}
