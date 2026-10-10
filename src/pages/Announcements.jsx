import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import AnnouncementCard from "../components/AnnouncementCard";
import PageSearch from "../components/PageSearch";
import usePageSearch, { matchesSearch } from "../hooks/usePageSearch";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = usePageSearch();

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

  const shown = activeAnnouncements.filter((item) =>
    matchesSearch(searchTerm, item.title, item.description)
  );

  if (loading) {
    return <div className="pt-24 px-6 text-center">Loading announcements...</div>;
  }

  return (
    <div className="pt-24 px-6 md:px-20 max-w-6xl mx-auto pb-16">
      <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">Announcements</h1>

      <PageSearch value={searchTerm} onChange={setSearchTerm} placeholder="Search announcements..." />

      {shown.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow">
          <p className="text-gray-500 text-lg">
            {searchTerm ? "No announcements match your search." : "No active announcements at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {shown.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}