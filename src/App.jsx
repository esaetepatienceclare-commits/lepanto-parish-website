import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import About from "./pages/About"
import MassTimes from "./pages/MassTimes"
import Events from "./pages/Events"
import Contact from "./pages/Contact"
import Gallery from "./pages/Gallery"
import Announcements from "./pages/Announcements"
import Support from "./pages/Support"
import Admin from "./pages/Admin"
import Login from "./pages/Login"

export default function App() {
  return (
    <div className="font-sans">

      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/mass-times" element={<MassTimes />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/announcements"element={<Announcements />}/>
        <Route path="/support" element={<Support />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      <Footer />

    </div>
  )
}