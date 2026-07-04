import { useState } from "react";

export default function Support() {
  const [selectedCause, setSelectedCause] = useState(null);

  const paymentDetails = {
    "Support a Child": {
      mobile: "MTN / Airtel: +256 772 473 247",
      bank: "Stanbic Bank - Account: 1234567890",
      cheque: "Pay to: Our Lady of the Most Holy Rosary Parish"
    },
    "Support School Construction": {
      mobile: "MTN / Airtel: +256 772 473 247",
      bank: "Centenary Bank - Account: 0987654321",
      cheque: "Pay to: Our Lady of the Most Holy Rosary Parish - School Project"
    },
    "Building Fund": {
      mobile: "MTN / Airtel: +256 772 473 247",
      bank: "Stanbic Bank - Account: 1234567890",
      cheque: "Pay to: Our Lady of the Most Holy Rosary Parish - Building Fund"
    }
  };

  return (
    <div className="pt-24 px-6 md:px-20">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold text-center text-blue-900 mb-4">
          Support Our Parish
        </h1>

        <p className="text-center text-gray-600 mb-12">
          Your generosity helps sustain the mission and activities of
          Our Lady of the Most Holy Rosary, Lepanto.
        </p>

        <div className="grid md:grid-cols-3 gap-8">

          <div 
            onClick={() => setSelectedCause("Support a Child")}
            className="bg-white p-8 rounded-3xl shadow hover:shadow-2xl transition cursor-pointer group border border-transparent hover:border-green-200"
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-4 group-hover:text-green-700 transition">
              Support a Child
            </h2>
            <p className="text-gray-700">
              Help sponsor a child's education, meals, and spiritual growth in our parish school and programs.
            </p>
            <button className="mt-6 w-full bg-green-600 text-white py-3.5 rounded-2xl font-medium hover:bg-green-700 transition shadow-md">
              Sponsor a Child
            </button>
          </div>

          <div 
            onClick={() => setSelectedCause("Support School Construction")}
            className="bg-white p-8 rounded-3xl shadow hover:shadow-2xl transition cursor-pointer group border border-transparent hover:border-amber-200"
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-4 group-hover:text-amber-700 transition">
              Support School Construction
            </h2>
            <p className="text-gray-700">
              Contribute towards building and equipping our new parish school for the children of Lepanto.
            </p>
            <button className="mt-6 w-full bg-amber-600 text-white py-3.5 rounded-2xl font-medium hover:bg-amber-700 transition shadow-md">
              Support School Project
            </button>
          </div>

          <div 
            onClick={() => setSelectedCause("Building Fund")}
            className="bg-white p-8 rounded-3xl shadow hover:shadow-2xl transition cursor-pointer group border border-transparent hover:border-blue-200"
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-4 group-hover:text-blue-700 transition">
              Building Fund
            </h2>
            <p className="text-gray-700">
              Support parish construction and maintenance projects.
            </p>
            <button className="mt-6 w-full bg-blue-700 text-white py-3.5 rounded-2xl font-medium hover:bg-blue-800 transition shadow-md">
              Contribute to Building Fund
            </button>
          </div>

        </div>

        {/* Payment Details */}
        {selectedCause && (
          <div className="mt-16 bg-white p-10 rounded-3xl shadow">
            <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">
              Payment Details for {selectedCause}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Mobile Money */}
              <div className="bg-blue-50 p-6 rounded-2xl text-center">
                <div className="text-5xl mb-4">📱</div>
                <h3 className="font-semibold text-lg mb-3">Mobile Money</h3>
                <p className="text-gray-700 font-medium">{paymentDetails[selectedCause].mobile}</p>
              </div>

              {/* Bank Transfer */}
              <div className="bg-amber-50 p-6 rounded-2xl text-center">
                <div className="text-5xl mb-4">🏦</div>
                <h3 className="font-semibold text-lg mb-3">Bank Transfer</h3>
                <p className="text-gray-700 font-medium">{paymentDetails[selectedCause].bank}</p>
              </div>

              {/* Cash / Cheque */}
              <div className="bg-green-50 p-6 rounded-2xl text-center">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="font-semibold text-lg mb-3">Cash / Cheque</h3>
                <p className="text-gray-700 font-medium">{paymentDetails[selectedCause].cheque}</p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedCause(null)}
              className="mt-8 mx-auto block text-gray-500 hover:text-gray-700"
            >
              Close Payment Details
            </button>
          </div>
        )}

        <div className="mt-12 text-center text-gray-700">
          <p>Thank you for your generosity and support.</p>
          <p className="text-sm mt-2">May God bless you abundantly.</p>
        </div>

      </div>

    </div>
  )
}