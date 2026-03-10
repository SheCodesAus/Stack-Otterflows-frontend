import { useEffect, useMemo, useRef, useState } from "react";
import "./FormDropdown.css";

function FormDropdown({
  value,
  options = [],
  onChange,
  disabled = false,
  placeholder = "Select an option",
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const current = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleOpen() {
    if (disabled) return;
    setOpen((currentOpen) => !currentOpen);
  }

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={`formdrop ${disabled ? "is-disabled" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="formdrop__button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={`formdrop__label ${!current ? "is-placeholder" : ""}`}>
          {current ? (
            <span className="formdrop__labelInner">
              {current.icon ? (
                <span className="formdrop__icon" aria-hidden="true">
                  {current.icon}
                </span>
              ) : null}
              <span>{current.label}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>

        <span className="formdrop__chev" aria-hidden="true" />
      </button>

      {open ? (
        <div className="formdrop__menu" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`formdrop__item ${
                option.value === value ? "is-selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              <span className="formdrop__itemInner">
                {option.icon ? (
                  <span className="formdrop__icon" aria-hidden="true">
                    {option.icon}
                  </span>
                ) : null}
                <span>{option.label}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default FormDropdown;