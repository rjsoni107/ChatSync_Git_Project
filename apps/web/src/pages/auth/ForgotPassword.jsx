import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IoMailOutline, IoArrowBack } from "react-icons/io5";
import { sendPasswordRecoveryEmail } from "@chatterapp/services/auth.service";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setError("");

        try {
            await sendPasswordRecoveryEmail(email, `${window.location.origin}/reset-password`);
            setStatus("success");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to send recovery email. Please try again.");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b141a] p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10"
            >
                <Link to="/login" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                    <IoArrowBack size={20} className="mr-2" />
                    Back to Login
                </Link>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Forgot Password?</h2>
                    <p className="text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {status === "success" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
                    >
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IoMailOutline size={24} className="text-green-500" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Check your email</h3>
                        <p className="text-green-200/80 text-sm">
                            We have sent a password reset link to <strong>{email}</strong>.
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <IoMailOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === "loading" ? "Sending..." : "Send Reset Link"}
                        </motion.button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
