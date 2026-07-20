import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGallery(data);
    });
    return () => unsubscribe();
  }, []);

  const getYouTubeId = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url.trim());
      if (u.hostname === "youtu.be") {
        const id = u.pathname.slice(1).split("/")[0];
        return id.length === 11 ? id : null;
      }
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v && v.length === 11) return v;
        const pathMatch = u.pathname.match(/\/(shorts|live|embed|v)\/([^/?#]{11})/);
        if (pathMatch) return pathMatch[2];
      }
    } catch {
      // invalid URL
    }
    return null;
  };

  const isYouTubeUrl = (url) =>
    !!url && (url.trim().includes("youtube.com") || url.trim().includes("youtu.be"));

  const getLinkPreview = (url) =>
    `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
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
            const isYouTube = item.mediaType === "youtube" || isYouTubeUrl(item.mediaUrl);
            const isLink = !isYouTube && item.mediaUrl && !item.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i);
            const videoId = isYouTube ? getYouTubeId(item.mediaUrl) : null;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isYouTube) {
                    if (videoId) {
                      setSelectedVideo({ id: videoId, url: item.mediaUrl });
                    } else {
                      window.open(item.mediaUrl, "_blank");
                    }
                  } else if (item.mediaUrl) {
                    window.open(item.mediaUrl, "_blank");
                  }
                }}
                className="bg-white rounded-xl shadow border overflow-hidden cursor-pointer hover:shadow-lg transition group"
              >
                <div className="relative h-72 overflow-hidden">

                  {item.mediaUrl && item.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    // IMAGE
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="h-72 w-full object-cover group-hover:scale-105 transition duration-500"
                    />

                  ) : isYouTube && videoId ? (
                    // YOUTUBE
                    <div className="relative h-full">
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                        alt={item.title}
                        className="h-72 w-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600/90 text-white rounded-full p-4 text-2xl shadow-lg group-hover:scale-110 transition">▶</div>
                      </div>
                    </div>

                  ) : isLink ? (
                    // EXTERNAL LINK — live website screenshot
                    <div className="relative h-full bg-gray-100">
                      <img
                        src={getLinkPreview(item.mediaUrl)}
                        alt={item.title}
                        className="h-72 w-full object-cover object-top group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          e.target.parentElement.innerHTML = `
                            <div class="h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                              <div class="text-center text-white">
                                <div class="text-5xl mb-2">🔗</div>
                                <p class="font-semibold text-sm">${getDomain(item.mediaUrl)}</p>
                              </div>
                            </div>`;
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        🔗 {getDomain(item.mediaUrl)}
                      </div>
                    </div>

                  ) : (
                    // FALLBACK
                    <div className="h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-2">🔗</div>
                        <p className="font-semibold">Visit Website</p>
                      </div>
                    </div>
                  )}
                </div>

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

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <div className="relative pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-2xl"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?origin=${encodeURIComponent(window.location.origin)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline text-sm hover:text-red-400"
                onClick={e => e.stopPropagation()}
              >
                Video not playing? Watch on YouTube ↗
              </a>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-white hover:text-gray-300 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}