import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./HeroCarousel.css";
import podflowLogo from "../assets/PodFlow.png";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;

    const onChange = () => setReduced(Boolean(mql.matches));
    onChange();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return reduced;
}

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.(`(max-width: ${breakpointPx}px)`);
    if (!mql) return;

    const onChange = () => setIsMobile(Boolean(mql.matches));
    onChange();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}

function clampIndex(i, len) {
  return (i + len) % len;
}

function resolveText(value, isMobile) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (isMobile ? value.mobile : value.desktop) ?? value.desktop ?? "";
}

export default function HeroCarousel() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile(640);

  const slides = useMemo(
    () => [
      {
        key: "momentum",
        image: "/hero/podflow-hero-1.png",
        logo: podflowLogo,
        title: {
          desktop: "Keep your goals moving\nwith people who care.",
          mobile: "Keep your goals moving\nwith people who care.",
        },
        subtitle:
          "Stay connected to your progress, and turn intention into action.",
        primaryLabel: "Create a pod",
        primaryTo: "/pods/create",
        secondaryLabel: "How it works",
        secondaryTo: "/how-it-works",
      },
      {
        key: "support",
        image: "/hero/podflow-hero-2.png",
        title: {
          desktop: "Small steps.\nReal follow-through.",
          mobile: "Small steps.\nReal follow-through.",
        },
        subtitle:
          "Check in regularly, celebrate wins, and get gentle support when life tries to throw your plans into the sea.",
        primaryLabel: "Browse pods",
        primaryTo: "/pods",
        secondaryLabel: "Connections",
        secondaryTo: "/connections",
      },
      {
        key: "trust",
        image: "/hero/podflow-hero-3.jpg",
        title: {
          desktop: "Make shared goals\neasier to reach.",
          mobile: "Make shared goals\neasier to reach.",
        },
        subtitle:
          "Whether you are building habits, finishing projects, or staying on track together, PodFlow keeps your momentum visible.",
        primaryLabel: "View goals",
        primaryTo: "/goals",
        secondaryLabel: "My dashboard",
        secondaryTo: "/dashboard",
      },
      {
        key: "flow",
        image: "/hero/podflow-hero-4.jpg",
        title: {
          desktop: "Less pressure.\nMore progress.",
          mobile: "Less pressure.\nMore progress.",
        },
        subtitle:
          "Stay accountable, with pods, goals, check-ins, and the little nudges that help people keep going.",
        primaryLabel: "Get started",
        primaryTo: "/pods/create",
        secondaryLabel: "Learn more",
        secondaryTo: "/how-it-works",
      },
    ],
    []
  );

  const AUTO_MS = 7000;
  const FADE_MS = 220;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  const jumpTo = (nextIndex) => setIndex(clampIndex(nextIndex, slides.length));

  const goTo = (next) => {
    const nextIndex = clampIndex(next, slides.length);

    if (!isMobile || prefersReducedMotion) {
      jumpTo(nextIndex);
      return;
    }

    setIsFading(true);

    window.setTimeout(() => {
      jumpTo(nextIndex);

      window.setTimeout(() => {
        setIsFading(false);
      }, FADE_MS);
    }, FADE_MS);
  };

  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") goPrev();
    if (event.key === "ArrowRight") goNext();
  };

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const id = window.setInterval(() => {
      setIndex((current) => clampIndex(current + 1, slides.length));
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [prefersReducedMotion, isPaused, slides.length]);

  const active = slides[index];

  return (
    <section
      className={`hero-carousel ${
        prefersReducedMotion ? "hero-carousel--reduced" : ""
      }`}
      aria-label="PodFlow hero carousel"
      tabIndex={0}
      data-slide={active.key}
      onKeyDown={handleKeyDown}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div className="hero-carousel__bg-stack" aria-hidden="true">
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.key}
            className={`hero-carousel__bg ${
              slideIndex === index ? "is-active" : ""
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
      </div>

      <div className="hero-carousel__overlay" aria-hidden="true" />
      <div className="hero-carousel__tone" aria-hidden="true" />
      <div
        className={`hero-carousel__fade ${isFading ? "is-on" : ""}`}
        aria-hidden="true"
      />

      <div className="hero-carousel__inner">
        <div className="hero-carousel__content">
          {active.logo ? (
            <img
              src={active.logo}
              alt="PodFlow"
              className="hero-carousel__logo"
            />
          ) : null}

          <h1 className="hero-carousel__title">
            {resolveText(active.title, isMobile)}
          </h1>

          <p className="hero-carousel__subtitle">{active.subtitle}</p>

          <div className="hero-carousel__actions">
            <div className="hero-carousel__cta-row">
              <Link
                to={active.primaryTo}
                className="hero-carousel__cta hero-carousel__cta--primary"
              >
                {active.primaryLabel}
              </Link>

              <Link
                to={active.secondaryTo}
                className="hero-carousel__cta hero-carousel__cta--secondary"
              >
                {active.secondaryLabel}
              </Link>
            </div>

            <div className="hero-carousel__nav-row">
              <div className="hero-carousel__arrow-group">
                <button
                  type="button"
                  className="hero-carousel__arrow"
                  onClick={goPrev}
                  aria-label="Previous slide"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="hero-carousel__arrow"
                  onClick={goNext}
                  aria-label="Next slide"
                >
                  ›
                </button>
              </div>

              <div
                className="hero-carousel__dots"
                role="tablist"
                aria-label="Select hero slide"
              >
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.key}
                    type="button"
                    className={`hero-carousel__dot ${
                      slideIndex === index ? "is-active" : ""
                    }`}
                    onClick={() => goTo(slideIndex)}
                    aria-label={`Go to slide ${slideIndex + 1}`}
                    aria-current={slideIndex === index ? "true" : "false"}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}