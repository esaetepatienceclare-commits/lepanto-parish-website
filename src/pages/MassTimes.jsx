import { FaChurch, FaClock, FaPray, FaCross } from "react-icons/fa";

export default function MassTimes() {
  const massSchedule = [
    {
      title: "Sunday Masses",
      icon: <FaChurch className="text-3xl" />,
      color: "blue",
      times: [
        { label: "First Mass", time: "7:00 AM" },
        { label: "Second Mass", time: "9:00 AM" },
        { label: "Third Mass", time: "2:00 PM" },
      ],
      note: "All Sundays"
    },
    {
      title: "Weekday Masses",
      icon: <FaClock className="text-3xl" />,
      color: "emerald",
      times: [
        { label: "Monday – Friday", time: "7:00 AM" },
      ],
      note: "Daily Mass"
    },
    {
      title: "Confessions",
      icon: <FaPray className="text-3xl" />,
      color: "purple",
      times: [
        { label: "Every Saturday", time: "4:00 PM" },
      ],
      note: ""
    },
    {
      title: "Eucharistic Adoration",
      icon: <FaCross className="text-3xl" />,
      color: "amber",
      times: [
        { label: "Every Thursday", time: "After Morning Mass" },
      ],
      note: "Exposition of the Blessed Sacrament"
    },
  ];

  const colorClasses = {
    blue: "border-blue-600 hover:border-blue-700 bg-gradient-to-br from-blue-50 to-white",
    emerald: "border-emerald-600 hover:border-emerald-700 bg-gradient-to-br from-emerald-50 to-white",
    purple: "border-purple-600 hover:border-purple-700 bg-gradient-to-br from-purple-50 to-white",
    amber: "border-amber-600 hover:border-amber-700 bg-gradient-to-br from-amber-50 to-white",
  };

  return (
    <div className="pt-24 min-h-screen relative overflow-hidden">
      {/* Full Page Holy Eucharist Background */}
      <div 
        className="absolute inset-0 opacity-100 pointer-events-none z-0"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dxcwgsjvk/image/upload/v1783097003/12_Facebook_1_wbhunw.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="px-6 md:px-20 max-w-6xl mx-auto pb-20 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Mass Times</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join us in worship as one family in faith
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {massSchedule.map((item, index) => (
            <div
              key={index}
              className={`group p-6 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl ${colorClasses[item.color]}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-blue-700 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h2 className="text-xl font-bold text-blue-900">{item.title}</h2>
              </div>

              <div className="space-y-4">
                {item.times.map((slot, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-none">
                    <span className="font-medium text-gray-700 text-sm">{slot.label}</span>
                    <span className="text-lg font-semibold text-blue-900">{slot.time}</span>
                  </div>
                ))}
              </div>

              {item.note && (
                <p className="mt-6 text-xs text-gray-500 font-medium italic">
                  {item.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white/95 backdrop-blur-sm border border-amber-200 rounded-3xl p-10 text-center">
          <h3 className="font-semibold text-2xl text-amber-900 mb-3">Holy Days & Special Masses</h3>
          <p className="text-amber-800 max-w-md mx-auto">
            Schedules for Christmas, Easter, Feast Days, and other special celebrations 
            will be announced through the parish bulletin and announcements.
          </p>
        </div>
      </div>
    </div>
  );
}