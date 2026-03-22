import "./HowItWorksPage.css";
import createConnection from "../assets/create-connection.png";
import createPod from "../assets/create-pod.png";
import createGoal from "../assets/create-goal.png";

export default function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <section className="page-shell how-it-works-intro">
        <h1>How It Works</h1>
        <p>
          <span className="how-it-works-accent">Welcome to PodFlow</span>, the
          simplest way for individuals or groups to stay organised, motivated,
          and connected. Whether you’re working on weekly goals, learning
          together, or supporting each other, PodFlow helps your pod move
          forward with clarity and momentum.
        </p>
        <p>
          Your personal or group space is private. Only members can edit goals
          or share updates. Public pages show only what you choose to share, so
          your data stays safe and under your control.
        </p>
      </section>

      <section className="page-shell articles-container" id="projectSection">
        <article className="how-it-works-card">
          <img
            className="icon"
            src={createGoal}
            alt="Illustration representing goal creation"
          />

          <h2>Create your goal</h2>

          <p>Click Create Goal and fill out the form.</p>

          <p>
            You can edit your goal anytime to refine it, and you can add
            check-ins to record and track your progress.
          </p>

          <p>
            If you want to share your journey, simply share your{" "}
            <span className="how-it-works-highlight">QR code</span> with your
            connections.
          </p>
        </article>

        <article className="how-it-works-card">
          <img
            className="icon"
            src={createPod}
            alt="Illustration representing pod creation"
          />

          <h2>Create your Pod</h2>

          <p>
            Click Create a Pod and fill in the pod details. Complete the shared
            goal form and save.
          </p>

          <p>
            Add check-ins to record updates and track your pod’s progress over
            time.
          </p>

          <p>
            Share your pod. Each pod has a{" "}
            <span className="how-it-works-highlight">QR code</span> and public
            link.
          </p>
        </article>

        <article className="how-it-works-card">
          <img
            className="icon"
            src={createConnection}
            alt="Illustration representing adding connections"
          />

          <h2>Add Connections</h2>

          <p>To connect with friends, go to Connections.</p>

          <p>
            You can invite people by sharing your{" "}
            <span className="how-it-works-highlight">QR code</span>, or you can
            search for them by username.
          </p>

          <p>
            Once connected, you can share progress, support each other, and grow
            together.
          </p>
        </article>
      </section>
    </div>
  );
}