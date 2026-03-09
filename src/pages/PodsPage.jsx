import { Link } from "react-router-dom";

export default function PodsPage() {
  return (
    <section className="page-shell">
      <h1>Pods</h1>
      <p>Your accountability pods will appear here.</p>

      <Link to="/pods/new" className="btn primary">
        Create Pod
      </Link>
    </section>
  );
}