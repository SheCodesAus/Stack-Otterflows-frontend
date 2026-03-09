// src/App.jsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";

function HomePage() {
  return (
    <>
      <h1>Stack Otterflows</h1>
      <p>Welcome page / public landing page</p>
    </>
  );
}

function LoginPage() {
  return <h1>Login</h1>;
}

function RegisterPage() {
  return <h1>Register</h1>;
}

function DashboardPage() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>
        Quick actions, pending connections, buddy approvals, pod invites,
        and recent activity.
      </p>
    </>
  );
}

function ConnectionsPage() {
  return (
    <>
      <h1>Connections</h1>
      <p>Sent invites, received invites, accepted connections, blocked users.</p>
    </>
  );
}

function GoalsPage() {
  return <h1>Goals</h1>;
}

function CreateGoalPage() {
  return <h1>Create Goal</h1>;
}

function GoalDetailPage() {
  return <h1>Goal Detail</h1>;
}

function PodsPage() {
  return <h1>Pods</h1>;
}

function CreatePodPage() {
  return <h1>Create Pod</h1>;
}

function PodDetailPage() {
  return <h1>Pod Detail</h1>;
}

function NotFoundPage() {
  return <h1>404</h1>;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />

        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/new" element={<CreateGoalPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />

        <Route path="/pods" element={<PodsPage />} />
        <Route path="/pods/new" element={<CreatePodPage />} />
        <Route path="/pods/:podId" element={<PodDetailPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;