// src/App.jsx
import "./App.css";
import NavBar from "./components/NavBar/NavBar";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <div className="page home">
      <NavBar />
      <main className="bf-container app-main">
        <h1>Stack Otterflows</h1>
        <p>Here is where we put our content!!!!</p>
      </main>
      <Footer />
    </div>
  );
}

export default App;