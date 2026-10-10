import { useState } from "react";
import { useSearchParams } from "react-router-dom";

// Search text for a page. Starts from ?q= in the link, so site search results
// open the page already filtered.
export default function usePageSearch() {
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get("q") || "");
  const [lastQ, setLastQ] = useState(params.get("q") || "");
  if ((params.get("q") || "") !== lastQ) {
    setLastQ(params.get("q") || "");
    setTerm(params.get("q") || "");
  }
  return [term, setTerm];
}

// True when any of the given text fields contains the search term.
export function matchesSearch(term, ...fields) {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return fields.some((f) => typeof f === "string" && f.toLowerCase().includes(t));
}
