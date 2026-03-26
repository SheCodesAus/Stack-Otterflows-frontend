import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <section className="page-shell not-found-page">
      <div className="not-found-card">
        <div className="not-found-layout">
          <div className="not-found-copy">
            <p className="not-found-eyebrow">404</p>
            <h1>Looks like this page wandered off</h1>
            <p className="not-found-text">
              The path broke, not your progress. Let’s get you back to your pod.
            </p>
          </div>

          <div className="not-found-illustration" aria-hidden="true">
            <div className="not-found-glow not-found-glow--one" />
            <div className="not-found-glow not-found-glow--two" />

            <div className="not-found-route">
              <span className="not-found-route__dot not-found-route__dot--1" />
              <span className="not-found-route__dot not-found-route__dot--2" />
              <span className="not-found-route__dot not-found-route__dot--3" />
              <span className="not-found-route__dot not-found-route__dot--4" />
              <span className="not-found-route__dot not-found-route__dot--5" />
            </div>

            <div className="not-found-code">
              <span className="not-found-code__digit">4</span>

              <span className="not-found-code__zero">
                <span className="not-found-code__zeroCore" />
              </span>

              <span className="not-found-code__digit">4</span>
            </div>

            <div className="not-found-pods">
              <span className="not-found-pod not-found-pod--1" />
              <span className="not-found-pod not-found-pod--2" />
              <span className="not-found-pod not-found-pod--3" />
            </div>
          </div>

          <div className="not-found-actions">
            <Link to="/" className="btn primary">
              Back Home
            </Link>

            <Link to="/pods" className="btn secondary">
              View My Pods
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}