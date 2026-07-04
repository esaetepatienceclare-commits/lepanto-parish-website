import PageContainer from "../components/PageContainer"

export default function Announcements() {

  const announcements = [
    {
      title: "Parish Feast Day Preparation",
      date: "October 2026",
      message:
        "All parishioners are invited to participate in preparations for our parish feast celebrations."
    },
    {
      title: "Youth Prayer Night",
      date: "Every Friday",
      message:
        "Join us every Friday evening for prayer, worship, and fellowship."
    },
    {
      title: "Catechism Registration",
      date: "Ongoing",
      message:
        "Registration for catechism classes is open at the parish office."
    },
    {
      title: "Choir Practice",
      date: "Every Saturday",
      message:
        "Choir members are reminded that practice begins at 4:00 PM."
    }
  ]

  return (
    <PageContainer>

      <h1 className="text-4xl font-bold text-blue-900 text-center mb-4">
        Parish Announcements
      </h1>

      <p className="text-center text-gray-600 mb-12">
        Stay informed about parish activities and important updates.
      </p>

      <div className="space-y-6">

        {announcements.map((item, index) => (
          <div
            key={index}
            className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition"
          >
            <p className="text-yellow-600 font-semibold mb-2">
              {item.date}
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mb-3">
              {item.title}
            </h2>

            <p className="text-gray-700 leading-relaxed">
              {item.message}
            </p>

          </div>
        ))}

      </div>

    </PageContainer>
  )
}