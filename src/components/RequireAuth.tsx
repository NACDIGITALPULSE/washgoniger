import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
};
