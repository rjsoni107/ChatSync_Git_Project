import { Navigate } from "react-router-dom";
import { useAuthStore } from "@chatsync/store/useAuthStore";

export default function PublicRoute({ children }) {
    const { user, loading } = useAuthStore();

    if (loading) {
        return <div className="min-h-screen bg-[#0b141a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
}
