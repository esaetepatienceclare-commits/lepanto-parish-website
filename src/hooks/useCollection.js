import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

// Loads every document in a Firestore collection for the admin managers.
// Returns the items, whether they are still loading, and reload() to fetch again after a change.
export default function useCollection(name, { orderField, direction = "desc", errorMessage } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const ref = orderField
      ? query(collection(db, name), orderBy(orderField, direction))
      : collection(db, name);

    getDocs(ref)
      .then((snap) => {
        if (active) setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch((err) => {
        console.error(`Error loading ${name}:`, err);
        if (active && errorMessage) alert(errorMessage);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [name, orderField, direction, errorMessage, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { items, loading, reload };
}
