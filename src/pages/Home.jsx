import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import Hero from "../components/Hero";

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeAnnouncements = announcements
    .filter(item => {
      if (!item.expiryDate) return true;
      const expiry = item.expiryDate.toDate?.() || new Date(item.expiryDate);
      return expiry.toISOString().split("T")[0] >= today;
    })
    .slice(0, 3);

  return (
    <div>
      {/* HERO SECTION */}
      <Hero />

      {/* WELCOME SECTION */}
      <section className="bg-white py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto px-6 md:px-20 text-center"
        >
          <h2 className="text-4xl font-bold text-blue-900 mb-4">
            Welcome to Our Lady of the Most Holy Rosary Parish
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A vibrant Catholic community in Lepanto committed to faith, worship, 
            service, and fellowship.
          </p>
          <Link
            to="/about"
            className="inline-block mt-8 bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-2xl font-medium transition"
          >
            Learn More About Us
          </Link>
        </motion.div>
      </section>

      {/* QUICK LINKS */}
      <section className="bg-blue-50 py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { to: "/mass-times", emoji: "🕒", label: "Mass Times" },
              { to: "/announcements", emoji: "📢", label: "Announcements" },
              { to: "/support", emoji: "❤️", label: "Support Us" },
              { to: "/contact", emoji: "✉️", label: "Contact Us" },
            ].map((link, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Link
                  to={link.to}
                  className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center border border-gray-100 block h-full"
                >
                  <div className="text-3xl mb-3">{link.emoji}</div>
                  <h4 className="font-semibold text-blue-900">{link.label}</h4>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
          <div className="flex justify-between items-end mb-8">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-blue-900"
            >
              Latest Announcements
            </motion.h2>
            <Link to="/announcements" className="text-blue-700 hover:underline font-medium">
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading announcements...</p>
          ) : activeAnnouncements.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center">
              <p className="text-gray-500">No current announcements at the moment.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6"
            >
              {activeAnnouncements.map((item) => {
                const pubDate = item.publishDate?.toDate?.();
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
                  >
                    {item.imageUrl && (
                      <div className="relative overflow-hidden">
                        <motion.img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-52 object-cover"
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.5 }}
                        />
                        {pubDate && (
                          <div className="absolute top-4 right-4 bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                            {pubDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="font-bold text-xl text-blue-900 mb-3 leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-3 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}