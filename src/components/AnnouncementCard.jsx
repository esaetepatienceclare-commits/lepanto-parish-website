import { Calendar, Mic, PlayCircle, Download } from "lucide-react";

const WEEK = 7 * 86400000;

// "New" when published (or added) in the last 7 days.
function isNew(item) {
  const date = item.publishDate?.toDate?.() || item.createdAt?.toDate?.();
  return date ? Date.now() - date.getTime() < WEEK : false;
}

function formatDate(date) {
  return date?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AnnouncementCard({ item, onOpen }) {
  const pubDate = item.publishDate?.toDate();
  const expiry = item.expiryDate?.toDate();
  const long = (item.description || "").length > 220;

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-blue-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full group">
      {/* Image */}
      {item.imageUrl && (
        <button onClick={onOpen} className="relative w-full h-52 overflow-hidden bg-blue-50">
          <img
            src={item.imageUrl}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
          />
        </button>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Date and badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          {pubDate && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 font-semibold px-3 py-1 rounded-full">
              <Calendar size={13} /> {formatDate(pubDate)}
            </span>
          )}
          {isNew(item) && (
            <span className="bg-amber-400 text-blue-950 font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
              New
            </span>
          )}
          {item.audioUrl && (
            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 font-medium px-2.5 py-1 rounded-full">
              <Mic size={13} /> Voice
            </span>
          )}
          {item.videoUrl && (
            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 font-medium px-2.5 py-1 rounded-full">
              <PlayCircle size={13} /> Video
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2 leading-tight">{item.title}</h2>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed flex-1 line-clamp-4 whitespace-pre-line">{item.description}</p>

        {/* Audio Player + Download */}
        {item.audioUrl && (
          <div className="mt-5 bg-purple-50/60 rounded-2xl p-3">
            <audio src={item.audioUrl} controls className="w-full" preload="metadata">
              Your browser does not support the audio element.
            </audio>
            <a
              href={item.audioUrl}
              download
              className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 text-xs font-medium mt-2 ml-1"
            >
              <Download size={14} /> Download audio
            </a>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-blue-50">
          <span className="text-xs text-gray-400">{expiry ? `Until ${formatDate(expiry)}` : ""}</span>
          {(long || item.videoUrl || item.imageUrl) && (
            <button onClick={onOpen} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              {item.videoUrl ? "Watch & read more →" : "Read more →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
