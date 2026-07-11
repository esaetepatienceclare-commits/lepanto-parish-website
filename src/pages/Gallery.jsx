import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGallery(data);
    });

    return () => unsubscribe();
  }, []);

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="pt-24 px-6 md:px-20">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-blue-900 text-center mb-4">
          Parish Gallery
        </h1>

        <p className="text-center text-gray-600 mb-12">
          Moments of faith, worship, and community life at
          Our Lady of the Most Holy Rosary, Lepanto.
        </p>

        {gallery.length === 0 && (
          <p className="text-center text-gray-500">
            No items in the gallery yet.
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-6">

          {gallery.map(item => {
            const isYouTube = item.mediaType === "youtube" || 
                             (item.mediaUrl && item.mediaUrl.includes("youtube"));
            const isLink = item.mediaType === "link";

            // === ORIGINAL IMAGE STYLE (unchanged) ===
            if (!isYouTube && !isLink && item.imageUrl) {
              return (
                <div key={item.id} className="bg-white rounded-xl shadow border overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-64 w-full object-cover"
                  />
                  <div className="p-4">
                    <h2 className="font-bold text-blue-900">{item.title}</h2>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            }

            // === YOUTUBE ===
            if (isYouTube) {
              return (
                <div 
                  key={item.id} 
                  onClick={() => {
                    const videoId = getYouTubeId(item.mediaUrl);
                    if (videoId) setSelectedVideo(videoId);
                  }}
                  className="bg-white rounded-xl shadow border overflow-hidden cursor-pointer hover:shadow-lg transition"
                >
                  <div className="relative h-64">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(item.mediaUrl)}/hqdefault.jpg`}
                      alt={item.title}
                      className="h-64 w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600 text-white rounded-full p-3 text-xl">▶</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-blue-900">{item.title}</h2>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            }

            // === EXTERNAL LINK ===
            if (isLink) {
              return (
                <div 
                  key={item.id} 
                  onClick={() => window.open(item.mediaUrl, "_blank")}
                  className="bg-white rounded-xl shadow border overflow-hidden cursor-pointer hover:shadow-lg transition"
                >
                  <div className="h-64 bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-5xl mb-2">🔗</div>
                      <p className="font-semibold">Visit Website</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-blue-900">{item.title}</h2>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}

        </div>

      </div>

      {/* YouTube Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVideo(null)}>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="relative pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                src={`https://www.youtube.com/embed/${selectedVideo}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <button 
              onClick={() => setSelectedVideo(null)}
              className="mt-4 text-white hover:text-gray-300 block mx-auto text-sm"
            >
              Close Video
            </button>
          </div>
        </div>
      )}

    </div>
  );
}