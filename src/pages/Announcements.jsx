import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

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
    return <div className="pt-24 px-6 text-center">Loading...</div>;
  }

  return (
    <div className="pt-24 px-6 md:px-20 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Announcements</h1>

      {activeAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-gray-500">No active announcements at the moment.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {activeAnnouncements.map((item) => {
            const pubDate = item.publishDate?.toDate();

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow overflow-hidden border">
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-56 object-cover"
                  />
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-bold text-blue-900">{item.title}</h2>
                  
                  {pubDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      {pubDate.toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  )}

                  <p className="mt-4 text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}