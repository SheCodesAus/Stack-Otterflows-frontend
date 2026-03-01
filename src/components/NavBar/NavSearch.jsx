// src/components/NavBar/NavSearch.jsx
function NavSearch({
  searchOpen,
  toggleSearch,
  openSearch,
  closeSearch,
  query,
  setQuery,
  suggestions,
  suggestionsOpen,
  setSuggestionsOpen,
  inputRef,
  onSubmitSearch,
  onPickSuggestion,
  placeholder = "Search pods…",
}) {
  return (
    <form className={`search ${searchOpen ? "open" : ""}`} onSubmit={onSubmitSearch}>
      <button
        type="button"
        className="icon-btn search-btn"
        onClick={toggleSearch}
        aria-label={searchOpen ? "Close search" : "Open search"}
        aria-expanded={searchOpen}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
          <path d="M10 18a8 8 0 1 1 5.293-14.293A8 8 0 0 1 10 18Zm0-2a6 6 0 1 0-4.243-1.757A5.78 5.78 0 0 0 10 16Zm8.707 5.293-4.11-4.11 1.414-1.414 4.11 4.11-1.414 1.414Z" />
        </svg>
      </button>

      <input
        ref={inputRef}
        className="search-input"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSuggestionsOpen(true);
        }}
        onFocus={() => {
          openSearch();
          setSuggestionsOpen(true);
        }}
        onBlur={() => {
          // allow click on suggestion before blur closes it
          setTimeout(() => setSuggestionsOpen(false), 120);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
      />

      {searchOpen && suggestionsOpen && suggestions.length > 0 && (
        <div className="search-suggest" role="listbox" aria-label="Search suggestions">
          {suggestions.map((f) => (
            <button
              key={f.id}
              type="button"
              className="search-suggest__item"
              role="option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPickSuggestion(f.id)}
            >
              <div className="search-suggest__title">{f.title}</div>
              {f.location && <div className="search-suggest__meta">{f.location}</div>}
            </button>
          ))}
        </div>
      )}

      {searchOpen && (
        <button
          type="button"
          className="icon-btn search-close"
          onClick={closeSearch}
          aria-label="Close search"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
            <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z" />
          </svg>
        </button>
      )}
    </form>
  );
}

export default NavSearch;