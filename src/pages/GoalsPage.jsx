import { Link } from "react-router-dom";

export default function GoalsPage() {
  return (
    <section className="page-shell">
      <h1>Goals</h1>
      <p>Your individual goals will appear here.</p>

      <Link to="/goals/new" className="btn primary">
        Create Goal
      </Link>
    </section>
  );
}