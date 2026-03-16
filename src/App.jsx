import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import RequireAuth from "./components/RequireAuth";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import GoalsPage from "./pages/GoalsPage";
import CreateGoalPage from "./pages/CreateGoalPage";
import EditGoalPage from "./pages/EditGoalPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import PodsPage from "./pages/PodsPage";
import CreatePodPage from "./pages/CreatePodPage";
import PodDetailPage from "./pages/PodDetailPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import CreatePodGoalPage from "./pages/CreatePodGoalPage";
import PodGoalDetailPage from "./pages/PodGoalDetailPage";
import EditPodGoalPage from "./pages/EditPodGoalPage";
import EditPodPage from "./pages/EditPodPage";



function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />

        <Route
          path="/connections"
          element={
            <RequireAuth>
              <ConnectionsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/goals"
          element={
            <RequireAuth>
              <GoalsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/goals/new"
          element={
            <RequireAuth>
              <CreateGoalPage />
            </RequireAuth>
          }
        />

        <Route
          path="/goals/:goalId"
          element={
            <RequireAuth>
              <GoalDetailPage />
            </RequireAuth>
          }
        />

        <Route
          path="/goals/:goalId/edit"
          element={
            <RequireAuth>
              <EditGoalPage />
            </RequireAuth>
          }
        />

        <Route
          path="/pods"
          element={
            <RequireAuth>
              <PodsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/pods/new"
          element={
            <RequireAuth>
              <CreatePodPage />
            </RequireAuth>
          }
        />

        <Route
          path="/pods/:podId"
          element={
            <RequireAuth>
              <PodDetailPage />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route
  path="/pods/:podId/goals/new"
  element={
    <RequireAuth>
      <CreatePodGoalPage />
    </RequireAuth>
  }
/>

<Route
  path="/pods/:podId/goals/:podGoalId"
  element={
    <RequireAuth>
      <PodGoalDetailPage />
    </RequireAuth>
  }
/>

<Route
  path="/pods/:podId/goals/:podGoalId/edit"
  element={
    <RequireAuth>
      <EditPodGoalPage />
    </RequireAuth>
  }
/>
<Route
  path="/pods/:podId/edit"
  element={
    <RequireAuth>
      <EditPodPage />
    </RequireAuth>
  }
/>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;