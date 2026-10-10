import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaXTwitter } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";

// ==================== IMAGE IMPORTS ====================
import motherMary from "../assets/motherMary.jpg";
import inauguration from "../assets/inaugration.jpg";
import mass from "../assets/mass.jpg";
import bishop from "../assets/bishop.jpg";
// ======================================================

const backgroundImages = [
  motherMary,
  inauguration,
  mass,
  bishop,
];

// The words that change with each background picture (same order as the pictures).
const heroMessages = [
  {
    heading: "A Community of Faith, Hope and Love",
    text: "Welcome to our parish family. Join us in worship, fellowship, and service as we grow together in Christ.",
  },
  {
    heading: "Growing Together in Christ",
    text: "From our school to our outstations, we are building a parish where every family belongs.",
  },
  {
    heading: "Come, Let Us Worship",
    text: "Join us at Holy Mass every Sunday and weekday, and bring your family to the Lord’s table.",
  },
  {
    heading: "United with Our Diocese",
    text: "One family with the Catholic Diocese of Soroti, walking together in faith and service.",
  },
];

// A soft ease used for all the hero fades.
const GENTLE = [0.25, 0.1, 0.25, 1];

// Shows a line of words that drift in one after another.
function AnimatedWords({ text, className, reduceMotion }) {
  return (
    <motion.h2
      key={text}
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12 } },
        exit: { opacity: 0, transition: { duration: 0.8, ease: GENTLE } },
      }}
    >
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          variants={{
            hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, ease: GENTLE } },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
}

// `cards` are the live updates (Next Mass, announcements, events, causes)
// that take turns with the welcome messages.
export default function Hero({ cards = [] }) {
  const reduceMotion = useReducedMotion();
  // Counts up every 8 seconds. Drives both the background picture and the words.
  const [step, setStep] = useState(0);
  const currentIndex = step % backgroundImages.length;

  useEffect(() => {
    const interval = setInterval(() => setStep((prev) => prev + 1), 8000);
    return () => clearInterval(interval);
  }, []);

  // Live updates from the cards (Next Mass, announcements, events, causes),
  // taking turns: first of each card, then second of each, and so on.
  const updates = [];
  const longest = Math.max(0, ...cards.map((c) => c.items.length));
  for (let i = 0; i < longest; i++) {
    cards.forEach((c) => c.items[i] && updates.push({ ...c.items[i], badge: c.badge }));
  }

  // Alternate: welcome words, then a live update, then welcome words again...
  const showUpdate = updates.length > 0 && step % 2 === 1;
  const message = showUpdate
    ? updates[Math.floor(step / 2) % updates.length]
    : heroMessages[Math.floor(step / 2) % heroMessages.length];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      {/* Background Images */}
      {backgroundImages.map((image, index) => (
        <motion.img
          key={index}
          src={image}
          alt={`Hero background ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: index === 0 ? "center 18%" : "center 30%",
          }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={
            index === currentIndex
              ? { opacity: 1, scale: reduceMotion ? 1 : 1.0 }
              : { opacity: 0, scale: reduceMotion ? 1 : 1.08 }
          }
          // A slow cross-fade, with the picture drifting gently while it shows.
          transition={{
            opacity: { duration: 2.5, ease: "easeInOut" },
            scale: { duration: index === currentIndex ? 9 : 2.5, ease: "easeOut" },
          }}
        />
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55 z-10"></div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-4xl px-6 py-24 flex flex-col items-center">
      <div className="text-center text-white">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-bold mb-2"
        >
          Our Lady of the Most Holy Rosary Parish, Lepanto
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-blue-200 mb-6"
        >
          Soroti Catholic Diocese
        </motion.p>

        {/* Changing words: welcome messages alternating with live updates */}
        <div className="min-h-[10rem] md:min-h-[9rem] mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.8, ease: GENTLE } }}
            >
              {message.badge && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: GENTLE } }}
                  className="inline-block text-xs font-bold uppercase tracking-widest bg-yellow-500 text-blue-950 px-3 py-1 rounded-full mb-3"
                >
                  {message.badge}
                </motion.span>
              )}
              <AnimatedWords
                text={message.heading || message.title}
                reduceMotion={reduceMotion}
                className="text-xl md:text-2xl font-semibold mb-3 text-yellow-300"
              />
              {message.text && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.7, duration: 1, ease: GENTLE } }}
                  className="text-sm md:text-base leading-relaxed line-clamp-3"
                >
                  {message.text}
                </motion.p>
              )}
              {message.to && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 1.1, duration: 0.9, ease: GENTLE } }}
                  className="mt-3"
                >
                  <Link to={message.to} className="text-yellow-300 hover:text-yellow-200 font-semibold underline-offset-4 hover:underline">
                    Find out more →
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Main Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col md:flex-row justify-center gap-4 mb-10"
        >
          <Link to="/mass-times" className="bg-blue-900 hover:bg-blue-800 px-8 py-3.5 rounded-lg text-sm font-semibold transition">
            Mass Times
          </Link>
          <Link to="/contact" className="border border-white hover:bg-white hover:text-blue-900 px-8 py-3.5 rounded-lg text-sm font-semibold transition">
            Contact Us
          </Link>
          <Link to="/support" className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-3.5 rounded-lg text-sm font-bold transition shadow-md">
            💛 Donate Now
          </Link>
        </motion.div>

        {/* Social Media Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col items-center"
        >
          <p className="text-white/80 text-sm uppercase tracking-widest mb-4">
            Follow us on
          </p>

          <div className="flex justify-center gap-10">
            {/* X / Twitter */}
            <a
              href="https://x.com/mostholyrosario"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group"
            >
              <FaXTwitter className="text-4xl text-[#1DA1F2] group-hover:scale-110 transition-all" />
              <span className="text-xs text-white/70 mt-2">X</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/mostholyrosarioasamuk/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group"
            >
              <FaInstagram className="text-4xl text-[#E1306C] group-hover:scale-110 transition-all" />
              <span className="text-xs text-white/70 mt-2">Instagram</span>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com/@holyrosarylepantoasamuk?si=wAhWtIb1j-MMgBmt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group"
            >
              <FaYoutube className="text-4xl text-[#FF0000] group-hover:scale-110 transition-all" />
              <span className="text-xs text-white/70 mt-2">YouTube</span>
            </a>
          </div>
        </motion.div>
      </div>

      </div>
    </section>
  );
}