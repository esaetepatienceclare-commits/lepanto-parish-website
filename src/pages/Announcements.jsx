import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import AnnouncementCard from "../components/AnnouncementCard";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));

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

  const activeAnnouncements = announcements.filter(item => {
    if (!item.expiryDate) return true;
    const expiry = item.expiryDate.toDate().toISOString().split("T")[0];
    return expiry >= today;
  });

  if (loading) {
    return <div className="pt-24 px-6 text-center">Loading announcements...</div>;
  }

  return (
    <div className="pt-24 px-6 md:px-20 max-w-6xl mx-auto pb-16">
      <h1 className="text-4xl font-bold text-blue-900 mb-10 text-center">Announcements</h1>

      {activeAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow">
          <p className="text-gray-500 text-lg">No active announcements at the moment.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {activeAnnouncements.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}