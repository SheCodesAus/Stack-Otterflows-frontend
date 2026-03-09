import { Link } from "react-router-dom";

export default function PodDetailPage() {
  return (
    <section className="page-shell">
      <h1>Pod Detail</h1>
      <p>
        This page will show pod members, shared goals, check-ins, and pod
        comments.
      </p>

      <div className="page-actions">
        <Link to="/pods" className="btn link">
          Back to Pods
        </Link>
      </div>
    </section>
  );
}