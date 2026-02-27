import "./App.css";
import NavBar from "./components/NavBar/NavBar";

function App() {
  return (
    <div className="page home">
      <NavBar />
      <main className="bf-container app-main">
        <h1>Stack Otterflows</h1>
        <p>
          Here is where we put our content!!!!
        </p>
      </main>
    </div>
  );
}

export default App;