import { Navigate } from "react-router-dom";
import { useAuthStore } from "@chatterapp/store/useAuthStore";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuthStore();
    if (loading) {
        return <div className="text-white p-4">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
