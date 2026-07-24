export default function AnnouncementCard({ item }) {
  const pubDate = item.publishDate?.toDate();

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full border-t-4 border-blue-600">
      
      {/* Image Section */}
      {item.imageUrl && (
        <div className="w-full bg-blue-50 flex items-center justify-center p-4">
          <img 
            src={item.imageUrl} 
            alt={item.title}
            className="max-h-[280px] w-auto max-w-full object-contain rounded-2xl"
          />
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1">
        {/* Date Badge */}
        {pubDate && (
          <div className="mb-3">
            <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {pubDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl font-bold text-blue-900 mb-3 leading-tight">
          {item.title}
        </h2>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed flex-1">
          {item.description}
        </p>

        {/* Audio Player + Download */}
        {item.audioUrl && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-xl">🎙️</span>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
                Voice Announcement
              </p>
            </div>
            
            <audio 
              src={item.audioUrl} 
              controls 
              className="w-full accent-blue-600 mb-3"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>

            {/* Download Button */}
            <a
              href={item.audioUrl}
              download
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-xl transition"
            >
              ⬇️ Download Audio
            </a>
          </div>
        )}
      </div>
    </div>
  );
}