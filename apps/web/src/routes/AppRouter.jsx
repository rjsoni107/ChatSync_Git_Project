import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Chats from "../pages/Chats";
import ProtectedRoute from "../components/ProtectedRoute";
import useAuth from "../hooks/useAuth";
import useUserPresence from "../hooks/useUserPresence";

export default function AppRouter() {
    useAuth();
    useUserPresence();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Chats />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
