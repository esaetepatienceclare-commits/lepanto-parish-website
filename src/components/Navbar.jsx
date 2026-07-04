import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const baseLink = "text-sm font-medium transition px-2 py-1 rounded";
  const activeLink = "text-yellow-400";
  const inactiveLink = "text-white hover:text-yellow-300";

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-blue-950 text-white">

      <div className="flex items-center justify-between px-6 py-4">

        {/* Logo - Full Parish Name */}
        <div className="font-bold text-lg leading-tight">
          Our Lady of the Most Holy Rosary Parish<br />
          <span className="text-sm font-normal text-blue-300">Lepanto, Asamuk</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-4 items-center">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            About
          </NavLink>

          <NavLink
            to="/mass-times"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Mass Times
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Events
          </NavLink>

          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Gallery
          </NavLink>

          <NavLink
            to="/announcements"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Announcements
          </NavLink>

          <NavLink
            to="/support"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Support
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Contact
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "text-yellow-400" : "text-white hover:text-yellow-300"
            }
          >
            Admin
          </NavLink>

        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col px-6 pb-4 gap-3 bg-blue-900">

          {[
            ["/", "Home"],
            ["/about", "About"],
            ["/mass-times", "Mass Times"],
            ["/events", "Events"],
            ["/gallery", "Gallery"],
            ["/announcements", "Announcements"],
            ["/support", "Support"],
            ["/contact", "Contact"],
          ].map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm py-1 ${isActive ? "text-yellow-400" : "text-white"}`
              }
            >
              {label}
            </NavLink>
          ))}

        </div>
      )}
    </nav>
  );
}