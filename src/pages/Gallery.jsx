import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, Film, FileText, MonitorPlay, Link2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "../firebase";
import usePageSearch, { matchesSearch } from "../hooks/usePageSearch";
import bannerPhoto from "../assets/mass.jpg";

const TAB_ICONS = { images: ImageIcon, videos: Film, documents: FileText, youtube: MonitorPlay, links: Link2 };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Gallery() {
  const reduceMotion = useReducedMotion();
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedUploadedVideo, setSelectedUploadedVideo] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("images");
  const [searchTerm, setSearchTerm] = usePageSearch();

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGallery(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
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

  // Only items matching the search box (all items when it is empty)
  const visible = gallery.filter((item) =>
    matchesSearch(searchTerm, item.title, item.description)
  );

  // Group items
  const sections = {
    images: {
      title: "Images",
      subtitle: "Captured moments of faith and community",
      items: visible.filter(
        (item) =>
          item.mediaType === "image" ||
          (item.mediaUrl && item.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i))
      ),
    },
    videos: {
      title: "Videos",
      subtitle: "Watch parish events and activities",
      items: visible.filter((item) => item.mediaType === "video"),
    },
    documents: {
      title: "Documents",
      subtitle: "Downloadable files and resources",
      items: visible.filter((item) => item.mediaType === "document"),
    },
    youtube: {
      title: "YouTube Videos",
      subtitle: "Watch our YouTube content",
      items: visible.filter(
        (item) => item.mediaType === "youtube" || isYouTubeUrl(item.mediaUrl)
      ),
    },
    links: {
      title: "External Links",
      subtitle: "Useful websites and resources",
      items: visible.filter((item) => item.mediaType === "link"),
    },
  };

  const tabOrder = ["images", "videos", "documents", "youtube", "links"];
  const currentSection = sections[activeTab];
  const photos = sections.images.items;
  const currentPhoto = photoIndex !== null ? photos[photoIndex] : null;

  const showPhoto = (step) =>
    setPhotoIndex((i) => (i === null ? i : (i + step + photos.length) % photos.length));

  // Keyboard: arrows move through photos, Escape closes any open viewer.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPhotoIndex(null);
        setSelectedVideo(null);
        setSelectedUploadedVideo(null);
        setSelectedDocument(null);
      }
      if (photoIndex === null) return;
      if (e.key === "ArrowRight") setPhotoIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoIndex, photos.length]);

  const openItem = (item) => {
    const isYouTube = item.mediaType === "youtube" || isYouTubeUrl(item.mediaUrl);
    const videoId = isYouTube ? getYouTubeId(item.mediaUrl) : null;
    if (isYouTube) {
      if (videoId) setSelectedVideo({ id: videoId, url: item.mediaUrl });
      else window.open(item.mediaUrl, "_blank");
    } else if (item.mediaType === "video") {
      setSelectedUploadedVideo(item.mediaUrl);
    } else if (item.mediaType === "document") {
      setSelectedDocument(item);
    } else if (item.mediaType === "link" && item.mediaUrl) {
      window.open(item.mediaUrl, "_blank");
    }
  };

  const totalVideos = sections.videos.items.length + sections.youtube.items.length;

  return (
    <section className="min-h-screen bg-blue-50">
      {/* ---------- BANNER ---------- */}
      <div className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-6 text-center text-white overflow-hidden">
        <img src={bannerPhoto} alt="" className="absolute inset-0 w-full h-full object-cover contrast-110 saturate-110" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-amber-400 font-semibold tracking-[0.3em] uppercase text-xs md:text-sm mb-3"
          >
            Moments of Faith
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]"
          >
            Parish Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/90 md:text-lg mb-6"
          >
            Worship, celebrations and community life at Our Lady of the Most Holy Rosary, Lepanto.
          </motion.p>

          {!loading && gallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-2 mb-8 text-sm"
            >
              {[
                [photos.length, "photos"],
                [totalVideos, "videos"],
                [sections.documents.items.length, "documents"],
              ]
                .filter(([n]) => n > 0)
                .map(([n, label]) => (
                  <span key={label} className="bg-white/15 backdrop-blur border border-white/25 rounded-full px-4 py-1.5">
                    <strong>{n}</strong> {label}
                  </span>
                ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="max-w-md mx-auto relative"
          >
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search the gallery..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white shadow-xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto pb-20">
        {/* ---------- TABS ---------- */}
        <div className="sticky top-[76px] md:top-[88px] z-20 -mt-7 mb-10">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-blue-100 p-2 flex md:justify-center gap-1.5 overflow-x-auto">
            {tabOrder.map((key) => {
              const Icon = TAB_ICONS[key];
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-blue-800 hover:bg-blue-50"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="gallery-tab"
                      className="absolute inset-0 bg-blue-700 rounded-xl shadow-md"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon size={17} className="relative z-10" />
                  <span className="relative z-10 whitespace-nowrap">{sections[key].title}</span>
                  <span
                    className={`relative z-10 text-xs rounded-full px-2 py-0.5 ${
                      active ? "bg-white/20" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {sections[key].items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900">{currentSection.title}</h2>
          <p className="text-gray-500 text-sm mt-1">{currentSection.subtitle}</p>
          <div className="w-16 h-1 bg-amber-500 mx-auto mt-3 rounded-full" />
        </div>

        {/* ---------- CONTENT ---------- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + searchTerm}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {loading ? (
              <div className="columns-2 lg:columns-3 gap-3 md:gap-5">
                {[260, 340, 220, 300, 240, 320].map((h, i) => (
                  <div key={i} style={{ height: h }} className="mb-3 md:mb-5 rounded-3xl bg-white/70 animate-pulse" />
                ))}
              </div>
            ) : currentSection.items.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-blue-100">
                {(() => {
                  const Icon = TAB_ICONS[activeTab];
                  return <Icon size={40} className="mx-auto text-blue-200 mb-3" />;
                })()}
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? `No ${currentSection.title.toLowerCase()} match your search.`
                    : `No ${currentSection.title.toLowerCase()} available yet.`}
                </p>
              </div>
            ) : activeTab === "images" ? (
              /* Photos: a flowing wall of pictures. Click one to open it big. */
              <div className="columns-2 lg:columns-3 gap-3 md:gap-5">
                {photos.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={fadeUp}
                    onClick={() => setPhotoIndex(index)}
                    className="group relative block w-full mb-3 md:mb-5 break-inside-avoid overflow-hidden rounded-2xl md:rounded-3xl shadow-md hover:shadow-2xl transition-shadow text-left"
                  >
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-auto group-hover:scale-105 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 inset-x-0 p-3 md:p-5 text-white md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all">
                      <p className="font-bold leading-snug text-sm md:text-base">{item.title}</p>
                      {item.description && (
                        <p className="hidden md:block text-sm text-white/80 line-clamp-2 mt-1">{item.description}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSection.items.map((item) => {
                  const isYouTube = item.mediaType === "youtube" || isYouTubeUrl(item.mediaUrl);
                  const videoId = isYouTube ? getYouTubeId(item.mediaUrl) : null;

                  return (
                    <motion.div
                      key={item.id}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.15 }}
                      variants={fadeUp}
                      onClick={() => openItem(item)}
                      className="bg-white rounded-3xl shadow-md border border-blue-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="relative h-56 overflow-hidden">
                        {/* UPLOADED VIDEO */}
                        {activeTab === "videos" && (
                          <div className="relative h-full bg-gray-900">
                            <video
                              src={item.mediaUrl}
                              className="h-56 w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <div className="bg-white/25 backdrop-blur-md text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition border border-white/40">
                                ▶
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DOCUMENTS */}
                        {activeTab === "documents" && (
                          <div className="h-full bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
                            <div className="text-center">
                              <FileText size={56} className="mx-auto text-blue-600 mb-3 group-hover:scale-110 transition" />
                              <p className="text-sm font-medium text-blue-800">Document</p>
                            </div>
                          </div>
                        )}

                        {/* YOUTUBE */}
                        {activeTab === "youtube" && (
                          <div className="relative h-full bg-gray-900">
                            {videoId && (
                              <img
                                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                alt={item.title}
                                className="h-56 w-full object-cover group-hover:scale-110 transition duration-700"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                              <div className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition">
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
                              className="h-56 w-full object-cover object-top group-hover:scale-105 transition duration-700"
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

                      <div className="p-5">
                        <h3 className="font-bold text-blue-900 text-lg mb-1.5 leading-snug">{item.title}</h3>
                        {item.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        {activeTab === "documents" && (
                          <p className="text-blue-600 text-sm mt-3 font-medium">Click to view →</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Photo viewer */}
      <AnimatePresence>
        {currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[999] flex flex-col"
            onClick={() => setPhotoIndex(null)}
          >
            <div className="flex items-center justify-between p-4 text-white/80 text-sm">
              <span>
                {photoIndex + 1} / {photos.length}
              </span>
              <button onClick={() => setPhotoIndex(null)} aria-label="Close" className="p-2 hover:text-white">
                <X size={26} />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center px-4 min-h-0">
              {photos.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showPhoto(-1);
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2 md:left-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={26} />
                </button>
              )}
              <motion.img
                key={currentPhoto.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                src={currentPhoto.mediaUrl}
                alt={currentPhoto.title}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full object-contain rounded-xl"
              />
              {photos.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showPhoto(1);
                  }}
                  aria-label="Next photo"
                  className="absolute right-2 md:right-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center"
                >
                  <ChevronRight size={26} />
                </button>
              )}
            </div>

            <div className="p-5 text-center text-white" onClick={(e) => e.stopPropagation()}>
              <p className="font-semibold text-lg">{currentPhoto.title}</p>
              {currentPhoto.description && (
                <p className="text-white/70 text-sm mt-1 max-w-2xl mx-auto">{currentPhoto.description}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
