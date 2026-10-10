// The parish schedule, shared by the Mass Times page and the home page.
// Change a time here and both pages update.

export const massSchedule = [
  {
    key: "sunday",
    title: "Sunday Masses",
    accent: "from-blue-600 to-blue-800",
    badge: "bg-blue-100 text-blue-800",
    times: [
      { label: "First Mass", time: "7:00 AM" },
      { label: "Second Mass", time: "9:00 AM" },
      { label: "Third Mass", time: "2:00 PM" },
    ],
    note: "All Sundays",
  },
  {
    key: "weekday",
    title: "Weekday Masses",
    accent: "from-emerald-600 to-emerald-800",
    badge: "bg-emerald-100 text-emerald-800",
    times: [{ label: "Monday – Friday", time: "7:00 AM" }],
    note: "Daily Mass",
  },
  {
    key: "confession",
    title: "Confessions",
    accent: "from-purple-600 to-purple-800",
    badge: "bg-purple-100 text-purple-800",
    times: [{ label: "Every Saturday", time: "4:00 PM" }],
    note: "",
  },
  {
    key: "adoration",
    title: "Eucharistic Adoration",
    accent: "from-amber-500 to-amber-700",
    badge: "bg-amber-100 text-amber-800",
    times: [{ label: "Every Thursday", time: "After Morning Mass" }],
    note: "Exposition of the Blessed Sacrament",
  },
];

// Mass start times used for the "Next Mass" countdown on the home page.
// day: 0 = Sunday, 1 = Monday ... 6 = Saturday. time is 24-hour.
export const massStarts = [
  { day: 0, time: "07:00", label: "First Mass" },
  { day: 0, time: "09:00", label: "Second Mass" },
  { day: 0, time: "14:00", label: "Third Mass" },
  { day: 1, time: "07:00", label: "Morning Mass" },
  { day: 2, time: "07:00", label: "Morning Mass" },
  { day: 3, time: "07:00", label: "Morning Mass" },
  { day: 4, time: "07:00", label: "Morning Mass" },
  { day: 5, time: "07:00", label: "Morning Mass" },
];

// The next Mass after `now`, as { label, date }.
export function getNextMass(now = new Date()) {
  let best = null;
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    for (const m of massStarts) {
      if (m.day !== day.getDay()) continue;
      const [h, min] = m.time.split(":").map(Number);
      const start = new Date(day);
      start.setHours(h, min, 0, 0);
      if (start > now && (!best || start < best.date)) best = { label: m.label, date: start };
    }
    if (best) return best;
  }
  return best;
}
