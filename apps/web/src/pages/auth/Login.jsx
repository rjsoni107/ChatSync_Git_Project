import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getCurrentUser, logout } from "@chatsync/services/auth.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { IoMailOutline, IoLockClosedOutline, IoArrowForward, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const setUser = useAuthStore((s) => s.setUser);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            // Check verification status
            const user = await getCurrentUser();

            if (!user.emailVerification) {
                await logout();
                setError("Email not verified. Please check your inbox.");
                setLoading(false);
                return;
            }

            setUser(user);
            navigate("/");
        } catch (err) {
            setError(err.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white relative overflow-hidden font-sans">
            {/* Mesh Background Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-lg z-10 p-4"
            >
                <div className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                    {/* Progress Indicator Decorative */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                        <motion.div
                            initial={{ width: "33%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                        />
                    </div>

                    <div className="text-center mb-5">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                            className="w-[10rem] h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-3"
                        >
                            <span className="text-2xl font-black italic tracking-tighter text-white">ChatSync</span>
                        </motion.div>
                        <motion.h1 variants={itemVariants} className="text-3xl font-black text-white mb-3 tracking-tight">Welcome back</motion.h1>
                        <motion.p variants={itemVariants} className="text-gray-300 font-medium text-sm">Continue your journey with ChatSync</motion.p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3"
                            >
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-300 ml-1">Email Address</label>
                            <div className="relative group/input">
                                <IoMailOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-12 pr-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all duration-300 text-white placeholder-gray-500 font-medium"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-300 ml-1">Password</label>
                            <div className="relative group/input">
                                <IoLockClosedOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-2 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all duration-300 text-white placeholder-gray-500 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                                >
                                    {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                                </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <Link to="/forgot-password" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide">
                                    Forgot Password?
                                </Link>
                            </div>
                        </motion.div>

                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#3b82f6' }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Log In <IoArrowForward size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="pt-8 border-t border-white/5 text-center">
                        <p className="text-gray-400 font-bold text-sm">
                            Don’t have an account?{" "}
                            <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors ml-1">
                                Create Account
                            </Link>
                        </p>
                    </motion.div>
                </div>

                {/* Bottom Branding */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 1 }}
                    className="mt-6 text-center"
                >
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60">Secure & Encrypted • Powered by ChatSync</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
