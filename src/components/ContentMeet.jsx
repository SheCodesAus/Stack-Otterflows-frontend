import "./ContentMeet.css";

import goalScreen from "../assets/home/path-goal-screen.png";
import podScreen from "../assets/home/path-pod-screen.png";
import inviteScreen from "../assets/home/path-invite-screen.png";
import wideShowcase from "../assets/home/podflow-wide.png";

export default function ContentMeet() {
  return (
    <div className="home-sections">
      <section className="home-section home-section--paths">
        <div className="section-heading">
          <h2 className="section-heading__title">Choose your path</h2>
          <p className="section-heading__text">
            Set a personal goal, create a private pod, then invite your people.
          </p>
        </div>

        <div className="path-grid">
          <article className="panel panel--path">
            <div className="device-frame device-frame--phone">
              <img
                src={goalScreen}
                alt="PodFlow screen showing a personal goal"
                className="device-frame__image"
              />
            </div>

            <div className="panel__body">
              <p className="panel__eyebrow">Check in &amp; achieve</p>
              <h3 className="panel__title">Set a personal goal</h3>
              <p className="panel__text">
                Define a clear goal, track your progress, and build momentum one
                step at a time.
              </p>
            </div>
          </article>

          <article className="panel panel--path">
            <div className="device-frame device-frame--phone">
              <img
                src={podScreen}
                alt="PodFlow screen showing a private pod"
                className="device-frame__image"
              />
            </div>

            <div className="panel__body">
              <p className="panel__eyebrow">Goals &amp; groups</p>
              <h3 className="panel__title">Create a private pod</h3>
              <p className="panel__text">
                Build a small trusted space where you can grow together with
                shared support and accountability.
              </p>
            </div>
          </article>

          <article className="panel panel--path">
            <div className="device-frame device-frame--phone">
              <img
                src={inviteScreen}
                alt="PodFlow screen showing invites or connections"
                className="device-frame__image"
              />
            </div>

            <div className="panel__body">
              <p className="panel__eyebrow">Family &amp; friends</p>
              <h3 className="panel__title">Invite your people</h3>
              <p className="panel__text">
                Bring in the people who lift you up, keep you accountable, and
                celebrate your progress.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-section home-section--features">
        <div className="section-heading">
          <h2 className="section-heading__title">Why it works</h2>
          <p className="section-heading__text">
            Gentle structure, trusted support, and visible momentum.
          </p>
        </div>

        <div className="feature-grid">
          <article className="panel panel--feature">
            <div className="feature-icon" aria-hidden="true">
              🔒
            </div>
            <h3 className="panel__title panel__title--feature">Private by choice</h3>
            <p className="panel__text">
              Your goals stay with the people you choose, not the whole world.
            </p>
          </article>

          <article className="panel panel--feature">
            <div className="feature-icon" aria-hidden="true">
              🫶
            </div>
            <h3 className="panel__title panel__title--feature">Real support</h3>
            <p className="panel__text">
              Invite friends, family, or teammates who genuinely want to see you do well.
            </p>
          </article>

          <article className="panel panel--feature">
            <div className="feature-icon" aria-hidden="true">
              ✅
            </div>
            <h3 className="panel__title panel__title--feature">Regular check-ins</h3>
            <p className="panel__text">
              Share wins, blocks, and progress without losing your rhythm.
            </p>
          </article>

          <article className="panel panel--feature">
            <div className="feature-icon" aria-hidden="true">
              🌱
            </div>
            <h3 className="panel__title panel__title--feature">Momentum over pressure</h3>
            <p className="panel__text">
              Stay moving with encouragement, visibility, and steady follow-through.
            </p>
          </article>
        </div>
      </section>

      <section className="home-section home-section--closing">
        <div className="section-heading">
          <h2 className="section-heading__title">
            A better way to keep your goals on track
          </h2>
          <p className="section-heading__text">
            A private space for your own goals, or shared motivation with people
            who want to see you thrive.
          </p>
        </div>

        <div className="closing-showcase">
          <div className="device-frame device-frame--landscape">
            <img
              src={wideShowcase}
              alt="PodFlow wide showcase image"
              className="device-frame__image"
            />
          </div>
        </div>
      </section>
    </div>
  );
}