export default function Gallery() {
  return (
    <section className="py-20 px-6 md:px-20 bg-white">

      <div className="max-w-6xl mx-auto">

        <h2 className="text-4xl font-bold text-center text-blue-900 mb-4">
          Parish Gallery
        </h2>

        <p className="text-center text-gray-600 mb-12">
          Explore moments of faith, worship, and community life at Our Lady of the Most Holy Rosary, Lepanto.
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-gray-100 rounded-xl h-72 flex items-center justify-center shadow">
            <p className="text-gray-500">
              Future Parish Photo
            </p>
          </div>

          <div className="bg-gray-100 rounded-xl h-72 flex items-center justify-center shadow">
            <p className="text-gray-500">
              Future Parish Photo
            </p>
          </div>

          <div className="bg-gray-100 rounded-xl h-72 flex items-center justify-center shadow">
            <p className="text-gray-500">
              Future Parish Photo
            </p>
          </div>

        </div>

      </div>

    </section>
  )
}