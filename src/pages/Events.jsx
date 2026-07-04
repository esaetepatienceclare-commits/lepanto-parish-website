import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const snap = await getDocs(collection(db, "events"));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const sorted = data.sort((a, b) => 
        (a.eventDate?.seconds || 0) - (b.eventDate?.seconds || 0)
      );

      setEvents(sorted);
    };

    fetchEvents();
  }, []);

  // Hide events that have already occurred by midnight
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingEvents = events
    .filter(event => {
      if (!event.eventDate) return false;
      const eventDate = event.eventDate.toDate();
      return eventDate >= todayMidnight;
    })
    .slice(0, 7); // First 7 upcoming events

  return (
    <div className="pt-24 px-6 md:px-20 max-w-7xl mx-auto space-y-10 bg-blue-50 min-h-screen">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-900 text-center">
        Parish Events
      </h1>

      <p className="text-center text-gray-600 max-w-3xl mx-auto">
        Stay informed about upcoming celebrations, meetings, conferences, 
        pilgrimages, and other activities taking place in our parish community.
      </p>

      {upcomingEvents.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center shadow">
          <h2 className="text-xl font-bold text-gray-700 mb-2">No Upcoming Events</h2>
          <p className="text-gray-500">Please check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingEvents.map(event => (
            <div key={event.id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              {event.imageUrl && (
                <div className="relative">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title}
                    className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 text-xs font-medium px-3 py-1 rounded-full text-blue-900">
                    {event.eventDate?.toDate().toDateString()}
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-blue-900 mb-3 line-clamp-2">
                  {event.title}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4">
                  📅 {event.eventDate?.toDate().toDateString()}
                </p>

                <p className="text-gray-700 leading-relaxed line-clamp-4">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}