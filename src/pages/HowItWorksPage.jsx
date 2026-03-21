import "./HowItWorksPage.css";
import createConnection from "../assets/create-connection.png";
import createPod from "../assets/create-pod.png";
import createGoal from "../assets/create-goal.png";

export default function HowItWorksPage() {
  return (
  <div>
    <section className="page-shell">
      <h1>How It Works</h1>
      <p>
        <span style={{ color: '#2ECC9F' }}>Welcome to Podflow</span>, the simplest way for individuals or groups to stay organised, motivated, and connected. Whether you’re working on weekly goals, learning together, or supporting each other, Podflow helps your pod move forward with clarity and momentum.
      </p>
      <p>Your personal or group space is private. Only members can edit goals or share updates. Public pages show only what you choose to share, so your data stays safe and under your control.</p>
    </section>

   <section class="articles-container" id="projectSection">
       <article>
         <img class="icon" src={createGoal}
               alt="A wrench and a screwdriver, lying crossed over one another diagonally" />
           
           <h2 style={{ color: '#2ECC9F' }}>Create your goal</h2>
           <p>
            Click Create Goal and fill out the form.
           </p>

           <p>
            You can edit your goal anytime to refine it, and you can add check‑ins to record and track your progress.
           </p>

           <p>
            If you want to share your journey, simply share your <span style={{ color: '#6C63FF' }}>QR code</span> with your connections
           </p>
          
       </article>
       <article>
        <img class="icon" src={createPod}
               alt="A wrench and a screwdriver, lying crossed over one another diagonally" />
          
           <h2 style={{ color: '#2ECC9F' }}>Create your Pod</h2>
           <p>
            Click Create a Pod and fill in the pod details. Complete the shared goal form and save
           </p>
           <p>
            Add Check‑ins to record updates and track your pod’s progress over time.
           </p>
           <p>
            Share Your Pod each pod has a <span style={{ color: '#6C63FF' }}>QR code</span> and public link.
           </p>
          
       </article>
       <article>
        <img class="icon" src={createConnection}
               alt="A wrench and a screwdriver, lying crossed over one another diagonally" />
         
           <h2 style={{ color: '#2ECC9F' }}>Add Connections</h2>
            <p>
            To connect with friends, go to Connections.
           </p>
           <p>
            You can invite people by sharing your <span style={{ color: '#6C63FF' }}>QR code</span>, or you can search for them by username.
           </p>
           <p>
            Once connected, you can share progress, support each other, and grow together.
           </p>
          
       </article>
   </section>
  </div>
 );
}