import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export default function Gallery() {
  const [gallery, setGallery] = useState([])

  useEffect(() => {
    const fetchGallery = async () => {
      const snap = await getDocs(collection(db, "gallery"))

      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setGallery(data)
    }

    fetchGallery()
  }, [])

  return (
    <div className="pt-24 px-6 md:px-20">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-blue-900 text-center mb-4">
          Parish Gallery
        </h1>

        <p className="text-center text-gray-600 mb-12">
          Moments of faith, worship, and community life at
          Our Lady of the Most Holy Rosary, Lepanto.
        </p>

        {gallery.length === 0 && (
          <p className="text-center text-gray-500">
            No images uploaded yet.
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-6">

          {gallery.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow border overflow-hidden"
            >

              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-64 w-full object-cover"
                />
              )}

              <div className="p-4">

                <h2 className="font-bold text-blue-900">
                  {item.title}
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  {item.description}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}