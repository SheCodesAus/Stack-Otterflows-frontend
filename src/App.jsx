// src/App.jsx
import "./App.css";
import NavBar from "./components/NavBar/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <main className="app-main">
        <h1>Stack Otterflows</h1>
        <p>
          Frontend shell is up and running. NavBar is using useAuthStatus,
          and we can plug the rest of the layout in from here.
        </p>
      </main>
    </>
  );
}

export default App;