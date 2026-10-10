import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from "firebase/firestore";
import { motion, useReducedMotion, animate } from "framer-motion";
import { FaArrowUp, FaChurch, FaEye, FaBullseye, FaMapMarkerAlt, FaQuoteLeft } from "react-icons/fa";
import { db } from "../firebase";
import { massStarts } from "../data/massSchedule";

import inauguration from "../assets/inaugration.jpg";
import motherMary from "../assets/motherMary.jpg";
import mass from "../assets/mass.jpg";
import bishop from "../assets/bishop.jpg";

const FOUNDED = new Date(2020, 9, 7); // 7 October 2020
const ESTABLISHMENT_PHOTO =
  "https://res.cloudinary.com/dxcwgsjvk/image/upload/v1782196872/REGISTRATION_FOR_COMPANY_DOC20260609_13510570_ktvv5z.jpg";

// Pictures used when the Gallery has no photos yet.
const fallbackPhotos = [
  { id: "inauguration", url: inauguration, title: "Parish inauguration" },
  { id: "mass", url: mass, title: "Holy Mass" },
  { id: "bishop", url: bishop, title: "Our Bishop's visit" },
  { id: "mary", url: motherMary, title: "Our Lady of the Rosary" },
];

const SECTIONS = [
  { label: "Our Parish", id: "parish-info" },
  { label: "Priest's Message", id: "priest-message" },
  { label: "History", id: "parish-history" },
  { label: "Vision & Mission", id: "vision-mission" },
  { label: "Parish Life", id: "parish-life" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <Reveal className="text-center mb-12">
      <p className="text-amber-600 font-semibold tracking-widest uppercase text-sm mb-2">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-bold text-blue-900">{title}</h2>
      <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full" />
    </Reveal>
  );
}

// A number that counts up when it scrolls into view.
function CountUp({ to }) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started || reduceMotion) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [started, to, reduceMotion]);

  return (
    <motion.span onViewportEnter={() => setStarted(true)} viewport={{ once: true }}>
      {value}
    </motion.span>
  );
}

export default function About() {
  const reduceMotion = useReducedMotion();
  const [priestMessage, setPriestMessage] = useState(null);
  const [history, setHistory] = useState(null);
  const [visionMission, setVisionMission] = useState(null);
  const [parishInfo, setParishInfo] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [priestSnap, historySnap, vmSnap, infoSnap, gallerySnap] = await Promise.all([
          getDoc(doc(db, "priestMessage", "current")),
          getDocs(collection(db, "parishHistory")),
          getDocs(collection(db, "visionMission")),
          getDocs(collection(db, "parishInfo")),
          getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(24))).catch(() => null),
        ]);

        setPriestMessage(priestSnap.exists() ? priestSnap.data() : null);
        setHistory(historySnap.docs[0]?.data() ?? null);
        setVisionMission(vmSnap.docs[0]?.data() ?? null);
        setParishInfo(infoSnap.docs[0]?.data() ?? null);
        setPhotos(
          (gallerySnap?.docs ?? [])
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((g) => g.mediaType === "image" || /\.(jpe?g|png|gif|webp)$/i.test(g.mediaUrl || ""))
            .slice(0, 8)
            .map((g) => ({ id: g.id, url: g.mediaUrl, title: g.title }))
        );
      } catch (err) {
        console.error("Error loading About page data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Show the "back to top" button only after scrolling down a bit.
  useEffect(() => {
    const onScroll = () => setShowTopButton(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const yearsServing = Math.max(1, new Date().getFullYear() - FOUNDED.getFullYear());
  const sundayMasses = massStarts.filter((m) => m.day === 0).length;
  const weeklyMasses = massStarts.length;
  const galleryPhotos = photos.length > 0 ? photos : fallbackPhotos;
  // The first photo is shown big only when there are enough others to fill the grid around it.
  const bigFirst = galleryPhotos.length >= 5;

  // History split into paragraphs so each one can fade in.
  const paragraphs = (history?.content || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Short version: the first two paragraphs, or the first 750 letters if it is one long block.
  const firstTwo = paragraphs.slice(0, 2);
  const shortVersion =
    firstTwo.join(" ").length > 900 ? [firstTwo.join("\n\n").slice(0, 750).trimEnd() + "..."] : firstTwo;
  const hasMore = shortVersion.join("").length < paragraphs.join("").length;
  const shownParagraphs = showFullHistory ? paragraphs : shortVersion;

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-white">
      {/* ---------- BANNER ---------- */}
      <section className="relative h-[70vh] min-h-[420px] flex items-center justify-center overflow-hidden">
        <motion.img
          src={inauguration}
          alt="Our parish community"
          className="absolute inset-0 w-full h-full object-cover contrast-110 saturate-110"
          style={{ objectPosition: "center 35%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />
        {/* Light, neutral shade so the photo keeps its true colours but the words stay readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />

        <div className="relative z-10 text-center text-white px-6 max-w-4xl pt-16 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-amber-400 font-semibold tracking-[0.3em] uppercase text-sm mb-4"
          >
            About Us
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            {parishInfo?.parishName || "Our Lady of the Most Holy Rosary Parish"}
          </motion.h1>
          {parishInfo?.motto && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="text-xl md:text-2xl italic text-blue-100"
            >
              “{parishInfo.motto}”
            </motion.p>
          )}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-blue-200 flex items-center justify-center gap-2"
          >
            <FaMapMarkerAlt /> Lepanto, Asamuk · Amuria District, Uganda
          </motion.p>
        </div>

        {/* Scroll hint */}
        {!reduceMotion && (
          <motion.button
            onClick={() => scrollTo("parish-info")}
            aria-label="Scroll down"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-8 h-12 border-2 border-white/60 rounded-full flex justify-center pt-2"
          >
            <motion.span
              className="w-1.5 h-3 bg-white rounded-full"
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          </motion.button>
        )}
      </section>

      {/* ---------- SECTION LINKS ---------- */}
      <nav className="sticky top-[76px] md:top-[88px] z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-800 rounded-full text-sm font-medium transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {loading ? (
        <p className="text-center text-gray-500 py-24">Loading parish information...</p>
      ) : (
        <>
          {/* ---------- PARISH AT A GLANCE ---------- */}
          <section id="parish-info" className="scroll-mt-36 py-20 px-6 md:px-20">
            <div className="max-w-6xl mx-auto">
              <SectionHeading eyebrow="Welcome" title="Our Parish at a Glance" />

              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-14"
              >
                {[
                  { value: FOUNDED.getFullYear(), label: "Year Founded", plain: true },
                  { value: yearsServing, label: yearsServing === 1 ? "Year of Service" : "Years of Service" },
                  { value: sundayMasses, label: "Sunday Masses" },
                  { value: weeklyMasses, label: "Masses Every Week" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-3xl p-6 text-center shadow-lg"
                  >
                    <p className="text-4xl md:text-5xl font-bold text-amber-400">
                      {stat.plain ? stat.value : <CountUp to={stat.value} />}
                    </p>
                    <p className="mt-2 text-blue-100 text-sm font-medium">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              <Reveal className="grid md:grid-cols-2 gap-10 items-center">
                <div className="relative">
                  <img
                    src={ESTABLISHMENT_PHOTO}
                    onError={(e) => {
                      // Use the inauguration picture if the online photo can't load.
                      if (e.currentTarget.src !== inauguration) e.currentTarget.src = inauguration;
                    }}
                    alt="Parish establishment"
                    className="w-full h-80 object-cover rounded-3xl shadow-2xl"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-5 -right-3 md:-right-5 bg-amber-500 text-blue-950 rounded-2xl px-5 py-3 shadow-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide">Established</p>
                    <p className="font-bold">7 October 2020</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4 text-blue-700">
                    <FaChurch size={28} />
                    <h3 className="text-2xl font-bold text-blue-900">
                      {parishInfo?.parishName || "Our Lady of the Most Holy Rosary Parish"}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Established on the Feast of Our Lady of the Rosary, our parish is a growing Catholic family
                    gathered around the Eucharist, the Word of God and service to one another.
                  </p>
                  <dl className="grid sm:grid-cols-2 gap-4">
                    {[
                      ["Diocese", parishInfo?.diocese || "Soroti Catholic Diocese"],
                      ["District", "Amuria District (Uganda)"],
                      ["Patroness", "Our Lady of the Most Holy Rosary"],
                      parishInfo?.location && ["Location", parishInfo.location],
                    ]
                      .filter(Boolean)
                      .map(([label, value]) => (
                        <div key={label} className="bg-blue-50 rounded-2xl p-4">
                          <dt className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{label}</dt>
                          <dd className="text-gray-800 font-medium mt-1">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------- PRIEST'S MESSAGE ---------- */}
          {priestMessage && (
            <section
              id="priest-message"
              className="scroll-mt-36 py-20 px-6 md:px-20 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white"
            >
              <div className="max-w-6xl mx-auto">
                <Reveal className="text-center mb-12">
                  <p className="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-2">A Word from</p>
                  <h2 className="text-3xl md:text-4xl font-bold">Our Parish Priest</h2>
                </Reveal>

                <div className="flex flex-col md:flex-row gap-12 items-center">
                  {priestMessage.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      className="md:w-1/3 relative"
                    >
                      <div className="absolute -inset-3 bg-amber-500/30 rounded-[2rem] rotate-3" />
                      <img
                        src={priestMessage.imageUrl}
                        alt={priestMessage.name}
                        className="relative w-full rounded-3xl shadow-2xl object-cover"
                        loading="lazy"
                      />
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={priestMessage.imageUrl ? "md:w-2/3" : "max-w-3xl mx-auto"}
                  >
                    <FaQuoteLeft className="text-amber-400 text-4xl mb-4" />
                    <p className="text-blue-50 leading-relaxed text-lg whitespace-pre-line">{priestMessage.message}</p>
                    <div className="mt-8 border-t border-white/20 pt-6">
                      <p className="font-bold text-xl">{priestMessage.name}</p>
                      <p className="text-blue-200">{priestMessage.title}</p>
                      {priestMessage.motto && (
                        <p className="italic mt-3 text-amber-300">“{priestMessage.motto}”</p>
                      )}
                    </div>
                    <Link
                      to="/mass-times?tab=about"
                      className="inline-block mt-6 bg-amber-500 hover:bg-amber-400 text-blue-950 px-6 py-3 rounded-2xl font-semibold transition"
                    >
                      Meet Father →
                    </Link>
                  </motion.div>
                </div>
              </div>
            </section>
          )}

          {/* ---------- HISTORY ---------- */}
          {history && (
            <section id="parish-history" className="scroll-mt-36 py-20 px-6 md:px-20 bg-amber-50/50">
              <div className="max-w-4xl mx-auto">
                <SectionHeading eyebrow="Our Story" title="Parish History" />

                <div className="relative pl-10 md:pl-14">
                  {/* Timeline line grows as you scroll */}
                  <motion.div
                    className="absolute left-3 md:left-5 top-2 bottom-2 w-1 bg-gradient-to-b from-amber-500 to-blue-700 rounded-full origin-top"
                    initial={{ scaleY: reduceMotion ? 1 : 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />

                  <Reveal className="relative mb-12">
                    <span className="absolute -left-10 md:-left-14 top-0 w-7 h-7 md:w-11 md:h-11 bg-amber-500 rounded-full ring-4 ring-white flex items-center justify-center text-blue-950 text-[10px] md:text-xs font-bold">
                      2020
                    </span>
                    <h3 className="text-2xl font-bold text-blue-900">Official Establishment</h3>
                    <p className="text-gray-600 italic mt-1">7 October 2020 · Feast of Our Lady of the Rosary</p>
                  </Reveal>

                  {shownParagraphs.map((text, i) => (
                    <Reveal key={i} className="relative mb-8">
                      <span className="absolute -left-[2.15rem] md:-left-[2.9rem] top-2 w-3 h-3 bg-blue-700 rounded-full ring-4 ring-white" />
                      <p className="text-gray-700 leading-relaxed text-lg bg-white rounded-2xl p-6 shadow-sm whitespace-pre-line">
                        {text}
                      </p>
                    </Reveal>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowFullHistory(!showFullHistory)}
                      className="px-8 py-3.5 bg-blue-700 text-white font-medium rounded-2xl hover:bg-blue-800 transition shadow-md"
                    >
                      {showFullHistory ? "Show Less" : "Read Full History"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---------- VISION & MISSION ---------- */}
          {visionMission && (
            <section id="vision-mission" className="scroll-mt-36 py-20 px-6 md:px-20">
              <div className="max-w-6xl mx-auto">
                <SectionHeading eyebrow="What Guides Us" title="Vision & Mission" />
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid md:grid-cols-2 gap-8"
                >
                  {[
                    {
                      key: "vision",
                      icon: <FaEye />,
                      title: "Our Vision",
                      text: visionMission.vision,
                      style: "from-emerald-600 to-emerald-800",
                    },
                    {
                      key: "mission",
                      icon: <FaBullseye />,
                      title: "Our Mission",
                      text: visionMission.mission,
                      style: "from-amber-500 to-amber-700",
                    },
                  ].map((card) => (
                    <motion.div
                      key={card.key}
                      variants={fadeUp}
                      whileHover={{ y: -8 }}
                      className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-8 shadow-lg"
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.style} text-white text-2xl flex items-center justify-center mb-5 shadow-md`}
                      >
                        {card.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-blue-900 mb-3">{card.title}</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{card.text}</p>
                      <div
                        className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-br ${card.style} opacity-10`}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>
          )}

          {/* ---------- PARISH LIFE (photos) ---------- */}
          <section id="parish-life" className="scroll-mt-36 py-20 px-6 md:px-20 bg-blue-50">
            <div className="max-w-6xl mx-auto">
              <SectionHeading eyebrow="Moments" title="Life in Our Parish" />
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {galleryPhotos.map((photo, i) => (
                  <motion.div
                    key={photo.id}
                    variants={fadeUp}
                    className={`relative overflow-hidden rounded-2xl shadow-md group ${
                      bigFirst && i === 0 ? "md:col-span-2 md:row-span-2" : ""
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title || "Parish life"}
                      className={`w-full object-cover transition duration-700 group-hover:scale-110 ${
                        bigFirst && i === 0 ? "h-48 md:h-full" : "h-48"
                      }`}
                      loading="lazy"
                    />
                    {photo.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                        {photo.title}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
              <div className="text-center mt-10">
                <Link
                  to="/gallery"
                  className="inline-block bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-2xl font-medium transition"
                >
                  View the Gallery
                </Link>
              </div>
            </div>
          </section>

          {/* ---------- INVITATION ---------- */}
          <section className="relative py-20 px-6 overflow-hidden">
            <img src={mass} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-blue-950/80" />
            <Reveal className="relative text-center text-white max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Come and Be Part of Our Family</h2>
              <p className="text-blue-100 text-lg mb-8">
                Whether you are new to Lepanto or returning to the faith, there is a place for you here.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/mass-times"
                  className="bg-amber-500 hover:bg-amber-400 text-blue-950 px-8 py-3.5 rounded-2xl font-bold transition"
                >
                  Join Us at Mass
                </Link>
                <Link
                  to="/contact"
                  className="border border-white hover:bg-white hover:text-blue-900 px-8 py-3.5 rounded-2xl font-semibold transition"
                >
                  Contact the Parish
                </Link>
              </div>
            </Reveal>
          </section>
        </>
      )}

      {/* Back to Top Button */}
      {showTopButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-40 bg-blue-700 text-white p-4 rounded-full shadow-xl hover:bg-blue-800 transition-all hover:scale-110"
        >
          <FaArrowUp size={20} />
        </motion.button>
      )}
    </div>
  );
}
