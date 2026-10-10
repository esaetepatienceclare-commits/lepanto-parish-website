import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { motion, useReducedMotion } from "framer-motion";
import Hero from "../components/Hero";
import { massSchedule, getNextMass } from "../data/massSchedule";
import { visibleCauses, withOriginals } from "../data/supportCauses";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Live list from Firestore, newest first.
function useLatest(name, max, orderField = "createdAt") {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, name), orderBy(orderField, "desc"), limit(max));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`${name} error:`, err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [name, max, orderField]);

  return { items, loading };
}

// The next upcoming events, soonest first (the same ones the Events page shows first).
function useUpcomingEvents(max) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "events"),
      where("eventDate", ">=", Timestamp.fromDate(midnight)),
      orderBy("eventDate", "asc"),
      limit(max)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("events error:", err)
    );
    return () => unsubscribe();
  }, [max]);

  return items;
}

// Re-renders every `ms` so countdowns stay current.
function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function timeUntil(date, now) {
  const mins = Math.max(0, Math.round((date - now) / 60000));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ${hours} hr`;
  if (hours > 0) return `${hours} hr ${rest} min`;
  return `${rest} min`;
}

function SectionTitle({ children, to, linkLabel = "View All →" }) {
  return (
    <div className="flex flex-wrap justify-between items-end mb-8 gap-x-4 gap-y-2">
      <motion.h2
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold text-blue-900"
      >
        {children}
      </motion.h2>
      {to && (
        <Link to={to} className="text-blue-700 hover:underline font-medium shrink-0">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

// A strip that scrolls sideways forever. Stays still for visitors whose
// device asks for reduced motion.
function Marquee({ children, seconds = 30, className = "" }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={`flex flex-wrap justify-center gap-8 ${className}`}>{children}</div>;
  }
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex w-max gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: seconds, ease: "linear", repeat: Infinity }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- Weekly Mass schedule ---------- */
function MassTimesSection() {
  return (
    <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 py-16 text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-10"
        >
          Mass Times
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {massSchedule.map((item) => (
            <motion.div
              key={item.key}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-3xl overflow-hidden"
            >
              <div className={`h-1.5 bg-gradient-to-r ${item.accent}`} />
              <div className="p-5">
                <h3 className="font-bold text-lg mb-3">{item.title}</h3>
                <div className="space-y-2">
                  {item.times.map((slot) => (
                    <div key={slot.label} className="flex justify-between gap-3 text-sm">
                      <span className="text-blue-100">{slot.label}</span>
                      <span className="font-semibold text-right">{slot.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-10">
          <Link
            to="/mass-times"
            className="inline-block border border-white/70 hover:bg-white hover:text-blue-900 px-8 py-3 rounded-2xl font-medium transition"
          >
            Full Mass Times, Homilies & More
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- What's happening: announcements + events side by side ---------- */
function WhatsHappening({ announcements, events, loading }) {
  if (!loading && announcements.length === 0 && events.length === 0) return null;
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-6xl mx-auto px-6 md:px-20">
        <SectionTitle>What&apos;s Happening</SectionTitle>
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Announcements */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-900">📢 Announcements</h3>
              <Link to="/announcements" className="text-blue-700 hover:underline text-sm font-medium">
                View all →
              </Link>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : announcements.length === 0 ? (
              <p className="text-gray-500 bg-white rounded-2xl p-6">No current announcements.</p>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {announcements.map((item) => (
                  <motion.div key={item.id} variants={itemVariants} whileHover={{ x: 6 }}>
                    <Link
                      to="/announcements"
                      className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition"
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center text-3xl shrink-0">
                          📢
                        </div>
                      )}
                      <div className="min-w-0">
                        {item.publishDate?.toDate && (
                          <p className="text-xs text-blue-700 font-semibold">
                            {item.publishDate.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </p>
                        )}
                        <h4 className="font-bold text-blue-900 leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Events */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-900">📅 Upcoming Events</h3>
              <Link to="/events" className="text-blue-700 hover:underline text-sm font-medium">
                View all →
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-500 bg-white rounded-2xl p-6">No upcoming events yet.</p>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {events.map((event) => {
                  const date = event.eventDate.toDate();
                  return (
                    <motion.div key={event.id} variants={itemVariants} whileHover={{ x: 6 }}>
                      <Link
                        to="/events"
                        className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition"
                      >
                        <div className="shrink-0 w-20 h-20 rounded-xl bg-blue-700 text-white flex flex-col items-center justify-center">
                          <span className="text-xs uppercase font-semibold">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-blue-900 leading-tight line-clamp-1">{event.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {[event.time, event.location].filter(Boolean).join(" · ")}
                          </p>
                          {event.description && (
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{event.description}</p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Latest homily + Question of the Week ---------- */
function FaithTeasers({ homily, question }) {
  if (!homily && !question) return null;
  const cards = [
    homily && {
      key: "homily",
      emoji: "🎙️",
      label: "Latest Homily",
      title: homily.title,
      text: homily.description,
      to: "/mass-times?tab=homilies",
      cta: homily.videoUrl ? "Watch now →" : homily.audioUrl ? "Listen now →" : "Read now →",
    },
    question && {
      key: "question",
      emoji: "❓",
      label: question.weekLabel || "Question of the Week",
      title: question.question,
      text: question.answer,
      to: "/mass-times?tab=question",
      cta: "Read the reflection →",
    },
  ].filter(Boolean);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-20">
        <SectionTitle>Grow in Faith</SectionTitle>
        <div className={`grid gap-6 ${cards.length > 1 ? "md:grid-cols-2" : ""}`}>
          {cards.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, x: i === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Link
                to={card.to}
                className="block h-full rounded-3xl p-8 bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-xl transition"
              >
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  {card.emoji} {card.label}
                </p>
                <h3 className="text-2xl font-bold text-blue-900 mt-3 line-clamp-2">{card.title}</h3>
                {card.text && <p className="text-gray-600 mt-3 line-clamp-3">{card.text}</p>}
                <p className="text-blue-700 font-semibold mt-5">{card.cta}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Support the parish + donor thank-yous ---------- */
function SupportSection({ thanks, causes }) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-400 text-blue-950">
      {/* Slowly drifting hearts in the background */}
      {!reduceMotion &&
        [10, 30, 55, 75, 90].map((left, i) => (
          <motion.span
            key={left}
            className="absolute text-4xl opacity-20 pointer-events-none select-none"
            style={{ left: `${left}%`, bottom: -40 }}
            animate={{ y: [0, -520], opacity: [0, 0.3, 0] }}
            transition={{ duration: 12 + i * 2, repeat: Infinity, delay: i * 2.5, ease: "easeOut" }}
          >
            💛
          </motion.span>
        ))}

      <div className="relative max-w-5xl mx-auto px-6 md:px-20 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Support Your Parish
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg max-w-2xl mx-auto mb-8 text-blue-950/80"
        >
          Your gifts keep our church open, support the poor, and help our parish family grow in faith.
        </motion.p>

        {causes.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 text-left"
          >
            {causes.slice(0, 6).map((cause) => (
              <motion.div key={cause.id} variants={itemVariants} whileHover={{ y: -6 }}>
                <Link
                  to={`/support?cause=${cause.id}`}
                  className="flex flex-col h-full bg-white/85 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:bg-white transition"
                >
                  <span className="text-3xl mb-2">{cause.emoji || "💛"}</span>
                  <h3 className="font-bold text-lg text-blue-900 leading-tight">{cause.title}</h3>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{cause.description}</p>
                  <span className="mt-auto pt-3 text-sm font-semibold text-amber-700">
                    {cause.buttonLabel || "Give now"} →
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
        >
          <motion.span
            className="inline-block"
            animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Link
              to="/support"
              className="inline-block bg-blue-950 hover:bg-blue-900 text-yellow-400 px-10 py-4 rounded-2xl text-lg font-bold shadow-xl transition"
            >
              💛 See All Ways to Give
            </Link>
          </motion.span>
        </motion.div>

        {thanks.length > 0 && (
          <div className="mt-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-blue-950/70">
              Thank you to our generous donors
            </p>
            <Marquee seconds={Math.max(25, thanks.length * 9)}>
              {thanks.map((t) => (
                <div
                  key={t.id}
                  className="w-72 shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-left shadow-md"
                >
                  <p className="font-bold text-blue-900">{t.name || "Anonymous"}</p>
                  {t.cause && <p className="text-xs text-amber-700 font-medium">{t.cause}</p>}
                  {t.message && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-3 italic">“{t.message}”</p>
                  )}
                </div>
              ))}
            </Marquee>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { items: announcements, loading } = useLatest("announcements", 10);
  const upcomingEvents = useUpcomingEvents(3);
  const { items: homilies } = useLatest("homilies", 1);
  const { items: questions } = useLatest("questionOfTheWeek", 1);
  const { items: thanks } = useLatest("donorThanks", 20);
  const { items: savedCauses } = useLatest("supportCauses", 10);
  const causes = visibleCauses(withOriginals(savedCauses || []));

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const activeAnnouncements = announcements.filter((item) => {
    if (!item.expiryDate) return true;
    const expiry = item.expiryDate.toDate?.() || new Date(item.expiryDate);
    return expiry.toISOString().split("T")[0] >= today;
  });

  const now = useNow();
  const nextMass = getNextMass(now);

  // Live updates that take turns with the welcome words on the hero.
  const heroCards = [
    nextMass && {
      key: "mass",
      badge: "🕒 Next Mass",
      items: [
        {
          id: "next",
          title: `${nextMass.label} · ${
            nextMass.date.toDateString() === now.toDateString()
              ? "Today"
              : nextMass.date.toLocaleDateString("en-GB", { weekday: "long" })
          } ${nextMass.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
          text: `Starts in ${timeUntil(nextMass.date, now)}`,
          to: "/mass-times",
        },
      ],
    },
    {
      key: "announcements",
      badge: "📢 Announcement",
      items: activeAnnouncements.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        text: a.description,
        to: "/announcements",
      })),
    },
    {
      key: "events",
      badge: "📅 Upcoming Event",
      items: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        text: [
          e.eventDate.toDate().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
          e.time,
          e.location,
        ]
          .filter(Boolean)
          .join(" · "),
        to: "/events",
      })),
    },
    {
      key: "causes",
      badge: "💛 Support a Cause",
      highlight: true,
      items: causes.map((c) => ({
        id: c.id,
        title: `${c.emoji || "💛"} ${c.title}`,
        text: c.description,
        to: `/support?cause=${c.id}`,
      })),
    },
  ].filter((card) => card && card.items.length > 0);

  return (
    <div>
      {/* HERO SECTION */}
      <Hero cards={heroCards} />

      {/* WEEKLY MASS SCHEDULE */}
      <MassTimesSection />

      {/* ANNOUNCEMENTS + EVENTS */}
      <WhatsHappening
        announcements={activeAnnouncements.slice(0, 3)}
        events={upcomingEvents}
        loading={loading}
      />

      {/* LATEST HOMILY + QUESTION OF THE WEEK */}
      <FaithTeasers homily={homilies[0]} question={questions[0]} />

      {/* DONATIONS */}
      <SupportSection thanks={thanks} causes={causes} />
    </div>
  );
}
