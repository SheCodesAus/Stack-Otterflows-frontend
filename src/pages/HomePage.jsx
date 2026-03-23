import HeroCarousel from "../components/HeroCarousel";
import ContentMeet from "../components/ContentMeet";
import "./HomePage.css";

export default function Home() {
  return (
    <main className="home-page">
      <div className="home-page__hero-wrap">
        <HeroCarousel />
      </div>

      <div className="home-page__inner">
        <section className="home-page__intro">
          <ContentMeet />
        </section>
      </div>
    </main>
  );
}