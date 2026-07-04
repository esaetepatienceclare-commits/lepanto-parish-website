import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import Hero from "../components/Hero";

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

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
      const expiry = item.expiryDate.toDate().toISOString().split("T")[0];
      return expiry >= today;
    })
    .slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <Hero />

      {/* WELCOME SECTION */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Welcome to Our Lady of the Most Holy Rosary Parish, Lepanto-Asamuk
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              A vibrant Catholic community in Lepanto committed to faith, worship, 
              service, and fellowship.
            </p>
            <Link
              to="/about"
              className="inline-block mt-6 bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-medium transition"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-blue-900">Latest Announcements</h2>
            <Link to="/announcements" className="text-blue-900 hover:underline font-medium">
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading announcements...</p>
          ) : activeAnnouncements.length === 0 ? (
            <p className="text-gray-500">No current announcements.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {activeAnnouncements.map((item) => {
                const pubDate = item.publishDate?.toDate();
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    {item.imageUrl && (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="font-bold text-xl text-blue-900 leading-tight mb-2">
                        {item.title}
                      </h3>
                      
                      {pubDate && (
                        <p className="text-sm text-gray-500 mb-3">
                          {pubDate.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}

                      <p className="text-gray-600 line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}