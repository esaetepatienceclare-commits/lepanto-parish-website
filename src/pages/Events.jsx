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

  // Hide past events
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingEvents = events
    .filter(event => {
      if (!event.eventDate) return false;
      const eventDate = event.eventDate.toDate();
      return eventDate >= todayMidnight;
    })
    .slice(0, 9);

  return (
    <div className="pt-24 px-6 md:px-20 pb-20 bg-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Parish Events
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Stay informed about upcoming celebrations, meetings, conferences, 
            pilgrimages, and other activities in our parish community.
          </p>
        </div>

        {/* Events Grid */}
        {upcomingEvents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-gray-700 mb-3">No Upcoming Events</h2>
            <p className="text-gray-500">Please check back later for new parish events.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Image + Date Badge */}
                {event.imageUrl && (
                  <div className="relative">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                      {event.eventDate?.toDate().toDateString()}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-blue-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition">
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span>📅</span>
                    <span>{event.eventDate?.toDate().toDateString()}</span>
                    {event.time && <span className="text-gray-400">• {event.time}</span>}
                  </div>

                  <p className="text-gray-700 leading-relaxed line-clamp-4">
                    {event.description}
                  </p>

                  {event.location && (
                    <div className="mt-4 text-sm text-gray-600">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}