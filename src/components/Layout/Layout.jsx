import { Outlet } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";

export default function Layout() {
  return (
    <div className="page">
      <NavBar />
      <main className="bf-container app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}