import { Link } from "react-router-dom";
import heroImage from "../assets/motherMary.jpg";

export default function Hero() {
  return (
    <section
      className="relative h-screen flex items-center justify-center bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center 15%",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl">

        <h1 className="text-4xl md:text-6xl font-bold mb-2">
          Our Lady of the Most Holy Rosary Parish, Lepanto
        </h1>

        <p className="text-xl md:text-2xl text-blue-200 mb-6">
          Soroti Catholic Diocese
        </p>

        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          A Community of Faith, Hope and Love
        </h2>

        <p className="text-sm md:text-base leading-relaxed mb-8">
          Welcome to our parish family. Join us in worship, fellowship,
          and service as we grow together in Christ.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">

          <Link
            to="/mass-times"
            className="bg-blue-900 hover:bg-blue-800 px-6 py-3 rounded-lg text-sm font-semibold transition"
          >
            Mass Times
          </Link>

          <Link
            to="/contact"
            className="border border-white hover:bg-white hover:text-blue-900 px-6 py-3 rounded-lg text-sm font-semibold transition"
          >
            Contact Us
          </Link>

          <Link
            to="/support"
            className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg text-sm font-bold transition shadow-md"
          >
            💛 Donate Now
          </Link>

        </div>

      </div>
    </section>
  );
}