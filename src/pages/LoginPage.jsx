import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import "./LoginPage.css";

function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Log in to keep your goals moving.
          </p>
        </header>

        <LoginForm />

        <footer className="login-footer">
          <p className="login-help">
            Need an account? <Link to="register">Sign up</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;