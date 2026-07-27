import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedUploadedVideo, setSelectedUploadedVideo] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState("images");

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

  // Group items
  const sections = {
    images: {
      title: "Images",
      subtitle: "Captured moments of faith and community",
      items: gallery.filter(
        (item) =>
          item.mediaType === "image" ||
          (item.mediaUrl && item.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i))
      ),
    },
    videos: {
      title: "Videos",
      subtitle: "Watch parish events and activities",
      items: gallery.filter((item) => item.mediaType === "video"),
    },
    documents: {
      title: "Documents",
      subtitle: "Downloadable files and resources",
      items: gallery.filter((item) => item.mediaType === "document"),
    },
    youtube: {
      title: "YouTube Videos",
      subtitle: "Watch our YouTube content",
      items: gallery.filter(
        (item) => item.mediaType === "youtube" || isYouTubeUrl(item.mediaUrl)
      ),
    },
    links: {
      title: "External Links",
      subtitle: "Useful websites and resources",
      items: gallery.filter((item) => item.mediaType === "link"),
    },
  };

  const tabOrder = ["images", "videos", "documents", "youtube", "links"];
  const currentSection = sections[activeTab];

  return (
    <section className="py-20 px-6 md:px-20 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-3">
            Parish Gallery
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Explore moments of faith, worship, and community life at Our Lady of
            the Most Holy Rosary, Lepanto.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabOrder.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                activeTab === key
                  ? "bg-blue-700 text-white shadow-lg scale-105"
                  : "bg-white text-blue-800 border border-blue-100 hover:bg-blue-50 hover:shadow-md"
              }`}
            >
              {sections[key].title}
              <span className="ml-2 text-xs opacity-80">
                ({sections[key].items.length})
              </span>
            </button>
          ))}
        </div>

        {/* Section Title */}
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-blue-900">
            {currentSection.title}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {currentSection.subtitle}
          </p>
        </div>

        {/* Content */}
        {currentSection.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-lg">
              No {currentSection.title.toLowerCase()} available yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-7">
            {currentSection.items.map((item) => {
              const isYouTube =
                item.mediaType === "youtube" || isYouTubeUrl(item.mediaUrl);
              const isUploadedVideo = item.mediaType === "video";
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
                    } else if (isUploadedVideo) {
                      setSelectedUploadedVideo(item.mediaUrl);
                    } else if (item.mediaType === "document") {
                      setSelectedDocument(item);
                    } else if (item.mediaType === "link" && item.mediaUrl) {
                      window.open(item.mediaUrl, "_blank");
                    }
                  }}
                  className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="relative h-64 overflow-hidden">
                    {/* IMAGE */}
                    {activeTab === "images" && (
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className="h-64 w-full object-cover group-hover:scale-110 transition duration-700"
                      />
                    )}

                    {/* UPLOADED VIDEO */}
                    {activeTab === "videos" && (
                      <div className="relative h-full bg-gray-900">
                        <video
                          src={item.mediaUrl}
                          className="h-64 w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/25 backdrop-blur-md text-white rounded-full p-5 text-2xl shadow-lg group-hover:scale-110 transition border border-white/40">
                            ▶
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DOCUMENTS */}
                    {activeTab === "documents" && (
                      <div className="h-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-3">📄</div>
                          <p className="text-sm font-medium text-blue-800">Document</p>
                        </div>
                      </div>
                    )}

                    {/* YOUTUBE */}
                    {activeTab === "youtube" && videoId && (
                      <div className="relative h-full">
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt={item.title}
                          className="h-64 w-full object-cover group-hover:scale-110 transition duration-700"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <div className="bg-red-600 text-white rounded-full p-5 text-2xl shadow-xl group-hover:scale-110 transition">
                            ▶
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EXTERNAL LINK */}
                    {activeTab === "links" && (
                      <div className="relative h-full bg-gray-100">
                        <img
                          src={getLinkPreview(item.mediaUrl)}
                          alt={item.title}
                          className="h-64 w-full object-cover object-top group-hover:scale-105 transition duration-700"
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
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                          🔗 {getDomain(item.mediaUrl)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-blue-900 text-lg mb-2 leading-snug">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {activeTab === "documents" && (
                      <p className="text-blue-600 text-sm mt-3 font-medium">
                        Click to view →
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* YouTube Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-2xl"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?origin=${encodeURIComponent(
                  window.location.origin
                )}`}
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
                onClick={(e) => e.stopPropagation()}
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

      {/* Uploaded Video Modal */}
      {selectedUploadedVideo && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] p-4"
          onClick={() => setSelectedUploadedVideo(null)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <video
              src={selectedUploadedVideo}
              controls
              autoPlay
              className="w-full rounded-2xl max-h-[80vh]"
            />
            <button
              onClick={() => setSelectedUploadedVideo(null)}
              className="mt-4 text-white hover:text-gray-300 block mx-auto text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Document Modal - View + Download */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-xl text-blue-900">
                  {selectedDocument.title}
                </h3>
                {selectedDocument.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDocument.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-600 mb-6">
                Click below to view or download this document.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* View in new tab */}
                <a
                  href={selectedDocument.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
                >
                  👁️ View Document
                </a>

                {/* Download */}
                <a
                  href={selectedDocument.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="border border-blue-700 text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl text-sm font-medium transition"
                >
                  ⬇️ Download
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t text-center">
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
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