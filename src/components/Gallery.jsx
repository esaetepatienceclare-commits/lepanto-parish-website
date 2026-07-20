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
    <section className="py-20 px-6 md:px-20 bg-white">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-4xl font-bold text-center text-blue-900 mb-4">
          Parish Gallery
        </h2>

        <p className="text-center text-gray-600 mb-12">
          Explore moments of faith, worship, and community life at Our Lady of the Most Holy Rosary, Lepanto.
        </p>

        {gallery.length === 0 && (
          <p className="text-center text-gray-500">No items in the gallery yet.</p>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {gallery.map((item) => {
            const isYouTube = item.mediaType === "youtube" || 
                             (item.mediaUrl && item.mediaUrl.includes("youtube"));
            const isLink = item.mediaType === "link";

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isYouTube) {
                    const videoId = getYouTubeId(item.mediaUrl);
                    if (videoId) setSelectedVideo(videoId);
                  } else if (isLink && item.mediaUrl) {
                    window.open(item.mediaUrl, "_blank");
                  }
                }}
                className="bg-white rounded-xl shadow border overflow-hidden cursor-pointer hover:shadow-lg transition group"
              >
                {/* Preview Area */}
                <div className="relative h-72">
                  {item.mediaUrl && item.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    // IMAGE
                    <img 
                      src={item.mediaUrl} 
                      alt={item.title} 
                      className="h-72 w-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                  ) : isYouTube ? (
                    // YOUTUBE
                    <div className="relative h-full">
                      <img 
                        src={`https://img.youtube.com/vi/${getYouTubeId(item.mediaUrl)}/hqdefault.jpg`} 
                        alt={item.title} 
                        className="h-72 w-full object-cover" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 text-white rounded-full p-4 text-2xl group-hover:scale-110 transition">▶</div>
                      </div>
                    </div>
                  ) : (
                    // EXTERNAL LINK
                    <div className="h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-2">🔗</div>
                        <p className="font-semibold">Visit Website</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="p-5">
                  <h3 className="font-bold text-blue-900 text-lg mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* YouTube Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <div className="relative pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-2xl"
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

    </section>
  );
}