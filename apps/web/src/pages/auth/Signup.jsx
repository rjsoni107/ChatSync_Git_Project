import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, login, getCurrentUser } from "@chatsync/services/auth.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
// import { createUserProfile } from "@chatsync/services/user.service";


export default function Signup() {
    const navigate = useNavigate();
    const setUser = useAuthStore((s) => s.setUser);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1️⃣ Create account
            await signup(email, password, name);

            // 2️⃣ Auto login
            await login(email, password);

            // 3️⃣ Get user
            const user = await getCurrentUser();
            setUser(user);
            console.log("Signup user", user);

            // 4️⃣ Create user profile
            // await createUserProfile(user);

            // 5️⃣ Redirect
            navigate("/");
        } catch (err) {
            console.log("Signup error", err);
            setError(err.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800">
                <h1 className="text-2xl font-bold mb-2">Create account 🚀</h1>
                <p className="text-gray-400 mb-6">Sign up to get started</p>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-gray-400">Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-400">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-400">Password</label>
                        <input
                            type="password"
                            required
                            // autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded font-medium disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-6 text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-400 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
