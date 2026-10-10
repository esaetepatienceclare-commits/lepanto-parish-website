# Our Lady of the Most Holy Rosary Parish, Lepanto

The website of Our Lady of the Most Holy Rosary Parish, Lepanto, Asamuk (Soroti Catholic Diocese, Amuria District).

Visitors can find Mass times, events, announcements, the photo gallery, homilies and lessons, ways to support the parish, and contact details. Parish staff sign in at `/login` to update everything from the Admin panel.

## Running it on your computer

You need [Node.js](https://nodejs.org) installed.

```
npm install      # first time only
npm run dev      # opens the site at http://localhost:5173
```

Other commands:

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run lint`    | Checks the code for mistakes                     |
| `npm run build`   | Builds the finished site into the `dist` folder  |
| `npm run preview` | Shows the built site, to check it before going live |

## Pages

| Address          | Page                                                        |
| ---------------- | ----------------------------------------------------------- |
| `/`              | Home: welcome slides, next Mass, latest news and events     |
| `/about`         | About the parish                                            |
| `/mass-times`    | Mass schedule and the Faith Corner (homilies, Question of the Week, About Father, RCIA, Faith Formation) |
| `/events`        | Upcoming events                                             |
| `/announcements` | Parish announcements, with voice notes and videos           |
| `/gallery`       | Photos, videos and documents                                |
| `/support`       | Causes and projects to support, and how to give             |
| `/contact`       | Phone, WhatsApp, email, office hours and a message form     |
| `/login`, `/admin` | Sign-in and the Admin panel for parish staff              |

## How it is built

- **React + Vite**, styled with **Tailwind CSS**, animations with **framer-motion**.
- **Firebase**: Firestore stores the content and Firebase Auth handles admin sign-in (`src/firebase.js`).
- **Cloudinary** stores uploaded photos, audio, video and documents. All uploads go through `src/utils/cloudinary.js`, which also shrinks large photos before sending them.

## Where things live

```
src/
  pages/              one file per page (Home, MassTimes, Events, Admin, ...)
  components/         shared pieces (Navbar, Footer, Hero, cards)
  components/admin/   one manager per Admin tab
  hooks/              shared helpers (useCollection loads a Firestore list for the Admin tabs)
  utils/cloudinary.js uploads to Cloudinary
  data/               fixed content, such as the Mass schedule and default support causes
  assets/             photos used on the pages
public/               the site icon (favicon.svg)
```

## Adding a new Admin tab

1. Create a manager in `src/components/admin/`. To load its list, use `useCollection("yourCollection")`.
2. In `src/pages/Admin.jsx`, add a line for it to one of the `GROUPS` and to `MANAGERS`.
