export default function Footer() {
  return (
    <footer className="bg-blue-950 text-white py-12 mt-16">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Parish Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Our Lady of the Most Holy Rosary Parish</h3>
            <p className="text-blue-200 text-sm">
              Lepanto, Asamuk
            </p>
          </div>

          {/* Diocese */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Soroti Catholic Diocese</h3>
            <p className="text-blue-200 text-sm">
              Under the pastoral care of the Bishop of Soroti
            </p>
          </div>

          {/* Contact / Rights */}
          <div>
            <p className="text-sm md:text-base">
              © {new Date().getFullYear()} Our Lady of the Most Holy Rosary Parish, Lepanto, Asamuk.
            </p>
            <p className="text-xs text-blue-300 mt-2">
              All rights reserved
            </p>
          </div>

        </div>

        <div className="border-t border-blue-800 mt-10 pt-6 text-center text-xs text-blue-300">
          Developed with love for the glory of God
        </div>

      </div>
    </footer>
  );
}