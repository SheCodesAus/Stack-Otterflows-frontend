import "./HeroCarousel.css";
import "./ContentMeet.css";
import choose_path_1 from "../assets/choose_path_1.png";
import invite_people_1 from "../assets/invite_people_1.png";
import chek_in_1 from "../assets/check_in_1.png";
import keep_moving_2 from "../assets/keep_moving_2.png";
import people_using_app_1 from "../assets/people_using_app_1.png";
import goals_1 from "../assets/goals_1.png";

export default function ContentMeet() {
  return (
    <section>
     <h1 className="home-page__title">Choose your path</h1>
        <p className="home-page__lead">
            Set a personal goal, create a private Pod, or invite your people.
        </p>
      <div className="row">
         <div className="column">
            <div className="card">
            <img src={goals_1} alt="Jane" style={{ width: "100%" }} />
            <div className="container">
                <h2>Set a personal goal</h2>
                <p className="title">Check in & Achieve</p>
                <p>This is where your journey begins.</p>
                <p>Define the change you want to make and turn it into a clear, achievable goal.</p>
            </div>
            </div>
         </div>
         <div className="column">
            <div className="card">
            <img src={goals_1} alt="Jane" style={{ width: "100%" }} />
            <div className="container">
                <h2>Create a private Pod</h2>
                <p className="title">goals & groups</p>
                <p>Your private pod is your safe space.</p>
                <p>Build a small, trusted circle where you can grow together.</p>
            </div>
            </div>
         </div>
         <div className="column">
            <div className="card">
            <img src={goals_1} alt="Jane" style={{ width: "100%" }} />
            <div className="container">
                <h2>Invite your people</h2>
                <p className="title">family & friends</p>
                <p>Bring in the people who lift you up.</p>
                <p>Invite friends, family, or teammates who inspire you, keep you accountable.</p>
            </div>
            </div>
         </div>
      </div>
       <h1 className="home-page__title">Why it helps</h1>
        <p className="home-page__lead">
            Gentle guidance and support.
        </p>
        <div className="row_why"> 
            <div className="column_why">
               <img src={choose_path_1} style={{ width: "100%", height: "212px", objectFit: "cover" }} /> 
            </div>
            <div className="column_why">
               <img src={invite_people_1} style={{ width: "100%", height: "212px", objectFit: "cover" }} /> 
            </div>
            <div className="column_why">
               <img src={chek_in_1} style={{ width: "100%", height: "212px", objectFit: "cover" }} /> 
            </div>
             <div className="column_why">
               <img src={keep_moving_2} style={{ width: "100%", height: "212px", objectFit: "cover" }} />
            </div>
        </div>
        <h1 className="home-page__title">A calmer way to keep your goals on track</h1>
        <p className="home-page__lead">
            A private space for your own goals, or share motivation.
        </p>
         <div> 
           <img
            id="peopleUsingApp"
            src={people_using_app_1}
            alt="Nature"
            className="responsive_image"
            />
         </div>
    </section>
  );
}