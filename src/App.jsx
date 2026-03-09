// src/App.jsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import GoalsPage from "./pages/GoalsPage";
import CreateGoalPage from "./pages/CreateGoalPage";
import CreatePodPage from "./pages/CreatePodPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import PodsPage from "./pages/PodsPage";
import PodDetailPage from "./pages/PodDetailPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />

        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/new" element={<CreateGoalPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />

        <Route path="/pods" element={<PodsPage />} />
        <Route path="/pods/new" element={<CreatePodPage />} />
        <Route path="/pods/:podId" element={<PodDetailPage />} />

        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;