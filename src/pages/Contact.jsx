import { useState } from "react";
import { Link } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Mail, MapPin, Clock, Send, CheckCircle2, Church } from "lucide-react";
import { db } from "../firebase";
import bannerPhoto from "../assets/motherMary.jpg";

const PHONE = "+256 772 473 247";
const WHATSAPP = "256772473247";
const EMAIL = "mostholyrosarioasamuk@gmail.com";

// Office hours. day: 0 = Sunday ... 6 = Saturday, times are 24-hour.
const OFFICE_HOURS = [
  { label: "Monday – Friday", days: [1, 2, 3, 4, 5], open: 8, close: 17, text: "8:00 AM – 5:00 PM" },
  { label: "Saturday", days: [6], open: 8, close: 13, text: "8:00 AM – 1:00 PM" },
  { label: "Sunday", days: [0], text: "Closed (except during Mass)" },
];

const SUBJECTS = ["General Inquiry", "Mass Schedule", "Event Information", "Prayer Request", "Other"];

function officeOpenNow(now) {
  const today = OFFICE_HOURS.find((h) => h.days.includes(now.getDay()));
  const hour = now.getHours() + now.getMinutes() / 60;
  return Boolean(today?.open && hour >= today.open && hour < today.close);
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const isOpen = officeOpenNow(now);
  const todayRow = OFFICE_HOURS.find((h) => h.days.includes(now.getDay()));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, "contactMessages"), {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        timestamp: Timestamp.now(),
        status: "new",
      });

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Hide success message after 6 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 6000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const quickActions = [
    {
      icon: Phone,
      title: "Call the Parish",
      detail: PHONE,
      href: `tel:${PHONE.replace(/\s+/g, "")}`,
      color: "bg-blue-600",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      detail: "Message us anytime",
      href: `https://wa.me/${WHATSAPP}`,
      color: "bg-green-600",
      external: true,
    },
    {
      icon: Mail,
      title: "Email",
      detail: EMAIL,
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`,
      color: "bg-amber-500",
      external: true,
    },
  ];

  const inputClass =
    "w-full border border-blue-100 bg-blue-50/40 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition";

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ---------- BANNER WITH QUICK WAYS TO REACH US ---------- */}
      <div className="relative pt-28 md:pt-36 pb-10 md:pb-12 px-4 md:px-8 text-white overflow-hidden">
        <img
          src={bannerPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_25%] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-8 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-amber-400 font-semibold tracking-[0.25em] uppercase text-xs md:text-sm mb-3"
            >
              We would love to hear from you
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-3"
            >
              Contact Us
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/90 max-w-xl mx-auto"
            >
              Call, send a WhatsApp message, email us, or write to us using the form below.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } } }}
            className="grid sm:grid-cols-3 gap-3 md:gap-4"
          >
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <motion.a
                  key={a.title}
                  variants={fadeUp}
                  href={a.href}
                  target={a.external ? "_blank" : undefined}
                  rel={a.external ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-4 bg-white text-gray-800 rounded-2xl p-4 md:p-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all"
                >
                  <span
                    className={`w-12 h-12 rounded-xl ${a.color} text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition`}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-blue-900">{a.title}</span>
                    <span className="block text-sm text-gray-500 truncate">{a.detail}</span>
                  </span>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ---------- FORM + PARISH DETAILS ---------- */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-12 pb-20 grid lg:grid-cols-[3fr_2fr] gap-8 items-start">
        {/* Contact Form */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeUp}
          className="bg-white p-6 md:p-8 rounded-3xl border border-blue-100 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-blue-900">Send Us a Message</h2>
          <div className="w-14 h-1 bg-amber-500 rounded-full mt-3 mb-6" />

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl mb-6"
              >
                <CheckCircle2 className="shrink-0 text-green-600" />
                Thank you! Your message has been sent. We will respond soon.
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-center">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  name="name"
                  className={inputClass}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className={inputClass}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What is it about? *</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setFormData({ ...formData, subject: s })}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      formData.subject === s
                        ? "bg-blue-700 border-blue-700 text-white shadow-md"
                        : "bg-white border-blue-100 text-blue-800 hover:bg-blue-50"
                    }`}
                  >
                    {s === "Prayer Request" ? "🙏 " : ""}
                    {s}
                  </button>
                ))}
              </div>
              {/* Keeps the browser's "please choose" check working */}
              <input
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                name="subject"
                value={formData.subject}
                onChange={() => {}}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                name="message"
                className={`${inputClass} h-40`}
                placeholder={
                  formData.subject === "Prayer Request"
                    ? "Share your intention. Father and the parish will pray for you."
                    : "Write your message here..."
                }
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <Send size={18} />
              {submitting ? "Sending Message..." : "Send Message"}
            </button>
          </form>
        </motion.div>

        {/* Parish details */}
        <div className="space-y-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" /> Office Hours
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                  isOpen ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-400"}`} />
                {isOpen ? "Open now" : "Closed now"}
              </span>
            </div>
            <div className="space-y-2">
              {OFFICE_HOURS.map((h) => (
                <div
                  key={h.label}
                  className={`flex justify-between gap-3 text-sm rounded-xl px-3 py-2 ${
                    h === todayRow ? "bg-amber-50 border border-amber-200" : ""
                  }`}
                >
                  <span className="font-medium text-gray-700">{h.label}</span>
                  <span className="text-gray-600 text-right">{h.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden"
          >
            <iframe
              title="Map to the parish"
              src="https://maps.google.com/maps?q=Asamuk%2C%20Amuria%2C%20Uganda&z=12&output=embed"
              className="w-full h-56 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-2">
                <MapPin size={20} className="text-blue-600" /> Find Us
              </h2>
              <p className="text-gray-700 font-medium">Our Lady of the Most Holy Rosary Parish</p>
              <p className="text-gray-600 text-sm">Lepanto, Asamuk · Amuria District, Uganda</p>
              <p className="text-gray-500 text-sm mt-1">Soroti Catholic Diocese</p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="bg-gradient-to-br from-blue-800 to-blue-950 text-white rounded-3xl p-6 shadow-lg"
          >
            <Church className="text-amber-400 mb-3" size={28} />
            <h2 className="text-lg font-bold mb-1">Coming to Mass?</h2>
            <p className="text-blue-100 text-sm mb-4">See Sunday and weekday Mass times, confessions and adoration.</p>
            <Link
              to="/mass-times"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
            >
              View Mass Times →
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
