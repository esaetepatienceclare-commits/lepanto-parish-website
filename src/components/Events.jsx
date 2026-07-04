export default function Events() {
  return (
    <section className="bg-white text-gray-800 py-16 px-6 md:px-20">
      
      <div className="max-w-5xl mx-auto text-center">
        
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-blue-900">
          Upcoming Events
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Event 1 */}
          <div className="bg-blue-50 p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-800">
              Youth Prayer Night
            </h3>
            <p className="mb-2">Every Friday</p>
            <p>6:00 PM - Parish Hall</p>
          </div>

          {/* Event 2 */}
          <div className="bg-blue-50 p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-800">
              Rosary Devotion
            </h3>
            <p className="mb-2">Daily</p>
            <p>6:30 PM - Church</p>
          </div>

          {/* Event 3 */}
          <div className="bg-blue-50 p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-800">
              Parish Feast Preparation
            </h3>
            <p className="mb-2">Monthly Meeting</p>
            <p>After Sunday Mass</p>
          </div>

        </div>

      </div>

    </section>
  )
}