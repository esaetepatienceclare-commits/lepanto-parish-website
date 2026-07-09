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
      {/* HERO SECTION */}
      <Hero />

      {/* WELCOME SECTION */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-20 text-center">
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
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="bg-blue-50 py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/mass-times" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center border border-gray-100">
              <div className="text-3xl mb-3">🕒</div>
              <h4 className="font-semibold text-blue-900">Mass Times</h4>
            </Link>
            <Link to="/announcements" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center border border-gray-100">
              <div className="text-3xl mb-3">📢</div>
              <h4 className="font-semibold text-blue-900">Announcements</h4>
            </Link>
            <Link to="/support" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center border border-gray-100">
              <div className="text-3xl mb-3">❤️</div>
              <h4 className="font-semibold text-blue-900">Support Us</h4>
            </Link>
            <Link to="/contact" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center border border-gray-100">
              <div className="text-3xl mb-3">✉️</div>
              <h4 className="font-semibold text-blue-900">Contact Us</h4>
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-blue-900">Latest Announcements</h2>
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
            <div className="grid md:grid-cols-3 gap-6">
              {activeAnnouncements.map((item) => {
                const pubDate = item.publishDate?.toDate();
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
                  >
                    {item.imageUrl && (
                      <div className="relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
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