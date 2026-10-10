import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Search, X } from "lucide-react";
import { db } from "../firebase";

const RESULTS_PER_GROUP = 5;

// Each searchable collection: which fields to search, what to show, and where to link.
const SOURCES = [
  {
    collection: "announcements",
    group: "Announcements",
    fields: ["title", "description"],
    // Same rule as the Announcements page: hide ones past their expiry date.
    keep: (d) => !d.expiryDate?.toDate || d.expiryDate.toDate() >= startOfToday(),
    title: (d) => d.title,
    link: (q) => `/announcements?q=${q}`,
  },
  {
    collection: "events",
    group: "Events",
    fields: ["title", "description", "location"],
    // Same rule as the Events page: only upcoming events.
    keep: (d) => d.eventDate?.toDate && d.eventDate.toDate() >= startOfToday(),
    title: (d) => d.title,
    link: (q) => `/events?q=${q}`,
  },
  {
    collection: "gallery",
    group: "Gallery",
    fields: ["title", "description"],
    title: (d) => d.title,
    link: (q) => `/gallery?q=${q}`,
  },
  {
    collection: "homilies",
    group: "Homilies",
    fields: ["title", "description"],
    title: (d) => d.title,
    link: (q) => `/mass-times?tab=homilies&q=${q}`,
  },
  {
    collection: "questionOfTheWeek",
    group: "Question of the Week",
    fields: ["question", "answer"],
    title: (d) => d.question,
    link: (q) => `/mass-times?tab=question&q=${q}`,
  },
  {
    collection: "rciaLessons",
    group: "RCIA Lessons",
    fields: ["title", "summary", "content"],
    title: (d) => (d.lessonNumber ? `Lesson ${d.lessonNumber}: ${d.title}` : d.title),
    link: (q) => `/mass-times?tab=rcia&q=${q}`,
  },
  {
    collection: "faithFormation",
    group: "Faith Formation",
    fields: ["title", "description", "audience"],
    title: (d) => d.title,
    link: (q) => `/mass-times?tab=faith&q=${q}`,
  },
];

// Pages and fixed content, so searches like "confession" or "donate" still find something.
const PAGES = [
  { title: "Mass Times", words: "mass times schedule sunday weekday daily", to: "/mass-times" },
  { title: "Confessions (Mass Times)", words: "confession confessions reconciliation saturday", to: "/mass-times" },
  { title: "Eucharistic Adoration (Mass Times)", words: "adoration eucharistic blessed sacrament thursday", to: "/mass-times" },
  { title: "About Father Patrick", words: "father patrick priest parish priest", to: "/mass-times?tab=about" },
  { title: "About the Parish", words: "about history vision mission parish", to: "/about" },
  { title: "Support the Parish", words: "support donate donation give offering tithe", to: "/support" },
  { title: "Contact Us", words: "contact phone email message location address", to: "/contact" },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function matches(term, doc, fields) {
  return fields.some((f) => typeof doc[f] === "string" && doc[f].toLowerCase().includes(term));
}

export default function SiteSearch({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [data, setData] = useState(null);
  const inputRef = useRef(null);

  // Load everything once, the first time search is opened.
  useEffect(() => {
    if (!open || data) return;
    Promise.allSettled(SOURCES.map((s) => getDocs(collection(db, s.collection)))).then((results) => {
      setData(
        results.map((r) =>
          r.status === "fulfilled" ? r.value.docs.map((d) => ({ id: d.id, ...d.data() })) : []
        )
      );
    });
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    setTerm("");
    onNavigate?.();
  };

  const t = term.trim().toLowerCase();
  const q = encodeURIComponent(term.trim());

  const pageHits = t ? PAGES.filter((p) => p.title.toLowerCase().includes(t) || p.words.includes(t)) : [];
  const groups =
    t && data
      ? SOURCES.map((s, i) => ({
          ...s,
          hits: data[i].filter((d) => (!s.keep || s.keep(d)) && matches(t, d, s.fields)),
        })).filter((g) => g.hits.length > 0)
      : [];
  const nothingFound = t && data && pageHits.length === 0 && groups.length === 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        className="text-white hover:text-yellow-300 p-1"
      >
        <Search size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-blue-950/70 backdrop-blur-sm flex justify-center items-start pt-20 px-4"
          onClick={close}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden text-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <Search size={20} className="text-blue-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search homilies, events, announcements, lessons..."
                className="flex-1 outline-none text-base"
              />
              <button onClick={close} aria-label="Close search" className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5 space-y-6">
              {!t && <p className="text-gray-500 text-sm">Type to search the whole parish website.</p>}
              {t && !data && <p className="text-gray-500 text-sm">Searching...</p>}
              {nothingFound && <p className="text-gray-500 text-sm">Nothing found for “{term.trim()}”.</p>}

              {pageHits.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Pages</p>
                  <div className="space-y-1">
                    {pageHits.map((p) => (
                      <Link
                        key={p.title}
                        to={p.to}
                        onClick={close}
                        className="block px-3 py-2 rounded-xl hover:bg-blue-50 font-medium text-blue-900"
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {groups.map((g) => (
                <div key={g.group}>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                    {g.group} ({g.hits.length})
                  </p>
                  <div className="space-y-1">
                    {g.hits.slice(0, RESULTS_PER_GROUP).map((d) => (
                      <Link
                        key={d.id}
                        to={g.link(q)}
                        onClick={close}
                        className="block px-3 py-2 rounded-xl hover:bg-blue-50 text-blue-900"
                      >
                        {g.title(d) || "Untitled"}
                      </Link>
                    ))}
                    {g.hits.length > RESULTS_PER_GROUP && (
                      <Link
                        to={g.link(q)}
                        onClick={close}
                        className="block px-3 py-2 text-sm text-blue-600 hover:underline"
                      >
                        See all {g.hits.length} in {g.group}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
