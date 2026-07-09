import { useState } from "react";

export default function Support() {
  const [selectedCause, setSelectedCause] = useState(null);

  const paymentDetails = {
    "Support a Child": {
      bank: "Centenary Bank",
      accountName: "Holy Rosary Nursery and Primary School",
      accountNumber: "3205108991",
    },
    "Support School Construction": {
      bank: "Centenary Bank",
      accountName: "Our Lady of the Most Holy Rosary Catholic Parish",
      accountNumber: "3204733369",
    },
    "Building Fund": {
      bank: "Centenary Bank",
      accountName: "Our Lady of the Most Holy Rosary Catholic Parish",
      accountNumber: "3203010627",
    },
  };

  return (
    <div className="pt-24 px-6 md:px-20 pb-20 bg-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Support Our Parish
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Your generous support helps sustain our parish mission, school, and development projects.
          </p>
        </div>

        {/* Cause Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          
          {/* Support a Child */}
          <div 
            onClick={() => setSelectedCause("Support a Child")}
            className="group bg-white border border-gray-200 rounded-3xl p-8 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition">
              <span className="text-3xl">👶</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-3">Support a Child</h3>
            <p className="text-gray-600 leading-relaxed">
              Help sponsor a child’s education, meals, and spiritual growth in our parish school.
            </p>
            <div className="mt-8">
              <span className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-medium group-hover:bg-emerald-700 transition">
                Sponsor a Child →
              </span>
            </div>
          </div>

          {/* Support School Construction */}
          <div 
            onClick={() => setSelectedCause("Support School Construction")}
            className="group bg-white border border-gray-200 rounded-3xl p-8 hover:border-amber-300 hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition">
              <span className="text-3xl">🏫</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-3">Support School Construction</h3>
            <p className="text-gray-600 leading-relaxed">
              Contribute towards building and equipping our parish school for the children of Lepanto.
            </p>
            <div className="mt-8">
              <span className="inline-block bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-medium group-hover:bg-amber-700 transition">
                Support the Project →
              </span>
            </div>
          </div>

          {/* Building Fund */}
          <div 
            onClick={() => setSelectedCause("Building Fund")}
            className="group bg-white border border-gray-200 rounded-3xl p-8 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition">
              <span className="text-3xl">⛪</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-3">Building Fund</h3>
            <p className="text-gray-600 leading-relaxed">
              Support parish construction, renovation, and maintenance projects.
            </p>
            <div className="mt-8">
              <span className="inline-block bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-medium group-hover:bg-blue-800 transition">
                Contribute to the Fund →
              </span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {selectedCause && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-blue-900 mb-2">{selectedCause}</h2>
                <p className="text-gray-500">Choose your preferred way to give</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Bank Transfer */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                  <div className="text-4xl mb-4">🏦</div>
                  <h4 className="font-semibold text-lg mb-4 text-slate-700">Bank Transfer</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Bank:</span><br />
                      <span className="font-semibold text-slate-800">{paymentDetails[selectedCause].bank}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Account Name:</span><br />
                      <span className="font-semibold text-slate-800">{paymentDetails[selectedCause].accountName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Account Number:</span><br />
                      <span className="font-bold text-2xl text-blue-900 tracking-wider">
                        {paymentDetails[selectedCause].accountNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Money */}
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                  <div className="text-4xl mb-4">📱</div>
                  <h4 className="font-semibold text-lg mb-4 text-emerald-700">Mobile Money</h4>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">MTN / Airtel</p>
                    <p className="font-bold text-2xl text-emerald-800">+256 772 473 247</p>
                    <p className="text-xs text-gray-500 mt-3">Send transaction reference after payment.</p>
                  </div>
                </div>

                {/* Cash / Cheque */}
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
                  <div className="text-4xl mb-4">💵</div>
                  <h4 className="font-semibold text-lg mb-4 text-amber-700">Cash or Cheque</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Pay cash or issue a cheque to:
                  </p>
                  <p className="font-semibold text-amber-800 mt-3">
                    Our Lady of the Most Holy Rosary Catholic Parish
                  </p>
                </div>
              </div>

              <div className="text-center mt-8">
                <button 
                  onClick={() => setSelectedCause(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thank You Message */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">Thank you for your kindness and generosity.</p>
          <p className="text-sm text-gray-500 mt-1">May God bless you and your family abundantly.</p>
        </div>

      </div>
    </div>
  );
}