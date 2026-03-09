import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-shell">
      <h1>404</h1>
      <p>We couldn’t find that page.</p>

      <Link to="/" className="btn primary">
        Back Home
      </Link>
    </section>
  );
}