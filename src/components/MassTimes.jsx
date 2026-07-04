export default function MassTimes() {
  return (
    <section className="bg-blue-50 text-gray-800 py-16 px-6 md:px-20">
      
      <div className="max-w-5xl mx-auto text-center">
        
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-blue-900">
          Mass Times
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Sunday */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-800">Sunday Mass</h3>
            <p>8:00 AM</p>
            <p>10:30 AM</p>
          </div>

          {/* Weekdays */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-800">Weekday Mass</h3>
            <p>Monday – Friday</p>
            <p>7:00 AM</p>
          </div>

          {/* Confession */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-800">Confession</h3>
            <p>Saturday</p>
            <p>4:00 PM</p>
          </div>

        </div>

      </div>

    </section>
  )
}