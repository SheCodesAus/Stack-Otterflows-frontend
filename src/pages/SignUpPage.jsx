import { Link } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import "./LoginPage.css";

function SignUpPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">Create your account</h1>
          <p className="login-subtitle">
            Sign up to create goals, join pods, and build accountability with others.
          </p>
        </header>

        <SignUpForm />

        <footer className="login-footer">
          <p className="login-help">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default SignUpPage;