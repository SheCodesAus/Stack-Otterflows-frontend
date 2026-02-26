// src/App.jsx
import "./index.css";
import "./App.css";
import NavBar from "./components/NavBar/NavBar";

function App() {
  return (
    <div className="page home">
      <NavBar />

      <main className="bf-container app-main">
        <h1>Stack Otterflows</h1>
        <p>
          Frontend shell is up and running. NavBar is using useAuthStatus, and we
          can plug the rest of the layout in from here.
        </p>
      </main>
    </div>
  );
}

export default App;