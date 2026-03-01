// src/hooks/useFundraiserAutocomplete.js
import { useEffect, useMemo, useRef, useState } from "react";
import getFundraisers from "../api/get-fundraisers";

/**
 * Handles navbar search state + fetching + suggestions filtering.
 * Keeps NavBar.jsx lean and makes it easy to swap "fundraisers" to "pods" later.
 */
export function useFundraiserAutocomplete() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const [allFundraisers, setAllFundraisers] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  // Focus input when opening search
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  // Load fundraisers once for autocomplete suggestions
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getFundraisers();
        if (isMounted) setAllFundraisers(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setAllFundraisers([]);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allFundraisers
      .filter((f) => {
        const haystack = [f.title, f.description, f.location, f.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .slice(0, 7);
  }, [query, allFundraisers]);

  const openSearch = () => {
    setSearchOpen(true);
    setSuggestionsOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSuggestionsOpen(false);
    setQuery("");
  };

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        setQuery("");
        setSuggestionsOpen(false);
      } else {
        setSuggestionsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return next;
    });
  };

  return {
    searchOpen,
    openSearch,
    closeSearch,
    toggleSearch,

    query,
    setQuery,

    inputRef,

    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
  };
}