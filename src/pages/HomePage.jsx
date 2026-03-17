import HeroCarousel from "../components/HeroCarousel";
import "./HomePage.css";

export default function Home() {
  return (
    <main className="home-page">
      <div className="home-page__hero-wrap">
        <HeroCarousel />
      </div>

      <div className="home-page__inner">
        <section className="home-page__intro">
          <h1 className="home-page__title">Podflow Content</h1>
          <p className="home-page__lead">
            Here is where we put our content.
          </p>
        </section>
      </div>
    </main>
  );
}