import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import "./LoginPage.css";

function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Log in to manage your goals, pods, check-ins, and accountability flow.
          </p>
        </header>

        <LoginForm />

        <footer className="login-footer">
          <p className="login-help">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;