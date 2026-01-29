import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getCurrentUser } from "@chatsync/services/auth.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";



export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const setUser = useAuthStore((s) => s.setUser);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);          // Appwrite login
            const user = await getCurrentUser();  // fetch current user
            setUser(user);                        // store in Zustand
            navigate("/");
        } catch (err) {
            setError(err.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800">
                <h1 className="text-2xl font-bold mb-2">Welcome back 👋</h1>
                <p className="text-gray-400 mb-6">Login to your account</p>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-gray-400">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-400">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded font-medium disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-6 text-center">
                    Don’t have an account?{" "}
                    <Link to="/signup" className="text-indigo-400 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
