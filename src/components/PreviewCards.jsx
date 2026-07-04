import { Link } from "react-router-dom"
import { BookOpen, Church, CalendarDays, Images, HeartHandshake } from "lucide-react"

export default function PreviewCards() {
  const cards = [
    {
      title: "About Parish",
      desc: "Learn about our mission, history, and leadership.",
      icon: <Church size={28} />,
      path: "/about"
    },
    {
      title: "Mass Times",
      desc: "View weekly and special liturgical schedules.",
      icon: <BookOpen size={28} />,
      path: "/mass-times"
    },
    {
      title: "Events",
      desc: "Stay updated on parish activities and gatherings.",
      icon: <CalendarDays size={28} />,
      path: "/events"
    },
    {
      title: "Gallery",
      desc: "Explore moments of worship and community life.",
      icon: <Images size={28} />,
      path: "/gallery"
    },
    {
      title: "Support Parish",
      desc: "Help sustain parish activities and development.",
      icon: <HeartHandshake size={28} />,
      path: "/support"
    }
  ]

  return (
    <section className="py-20 px-6 md:px-20 bg-white">

      <div className="max-w-6xl mx-auto">

        <h2 className="text-4xl font-bold text-center text-blue-900 mb-4">
          Explore Our Parish
        </h2>

        <p className="text-center text-gray-600 mb-12">
          Navigate through the key areas of parish life.
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          {cards.map((card, index) => (
            <Link
              key={index}
              to={card.path}
              className="group bg-blue-50 p-6 rounded-xl shadow hover:shadow-xl transition transform hover:-translate-y-1"
            >

              <div className="text-blue-900 mb-4 group-hover:scale-110 transition">
                {card.icon}
              </div>

              <h3 className="text-xl font-bold text-blue-900 mb-2">
                {card.title}
              </h3>

              <p className="text-gray-600">
                {card.desc}
              </p>

            </Link>
          ))}

        </div>

      </div>

    </section>
  )
}