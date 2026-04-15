import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Algorithms } from "./pages/Algorithms";
import { AITrader } from "./pages/AITrader";
import { TradeHistory } from "./pages/TradeHistory";
import { ConnectDelta } from "./pages/ConnectDelta";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", Component: Dashboard },
      { path: "algorithms", Component: Algorithms },
      { path: "ai-trader", Component: AITrader },
      { path: "trade-history", Component: TradeHistory },
      { path: "connect-delta", Component: ConnectDelta },
    ],
  },
]);
