import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (backgroundImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      
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
          initial={{ opacity: 0 }}
          animate={{ opacity: index === currentIndex ? 1 : 0 }}
          transition={{ duration: 1.5 }}
        />
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55 z-10"></div>

      {/* Content */}
      <div className="relative z-20 text-center text-white px-6 max-w-4xl">
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

        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl font-semibold mb-4"
        >
          A Community of Faith, Hope and Love
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm md:text-base leading-relaxed mb-10"
        >
          Welcome to our parish family. Join us in worship, fellowship,
          and service as we grow together in Christ.
        </motion.p>

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
    </section>
  );
}