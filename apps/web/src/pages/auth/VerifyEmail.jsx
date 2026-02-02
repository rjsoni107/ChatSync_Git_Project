import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "@chatsync/services/auth.service";
import { motion } from "framer-motion";
import { IoCheckmarkCircleOutline, IoAlertCircleOutline } from "react-icons/io5";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, error

    useEffect(() => {
        const userId = searchParams.get("userId");
        const secret = searchParams.get("secret");

        if (!userId || !secret) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                await verifyEmail(userId, secret);
                setStatus("success");
                setTimeout(() => {
                    navigate("/");
                }, 3000);
            } catch (error) {
                console.error("Verification failed:", {
                    message: error.message,
                    code: error.code,
                    type: error.type
                });
                setStatus("error");
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-sans p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111b21] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full text-center"
            >
                {status === "verifying" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <h2 className="text-xl font-bold">Verifying Email...</h2>
                        <p className="text-gray-400 text-sm">Please wait while we confirm your email address.</p>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: 3, ease: "linear" }}
                                className="w-full h-full bg-green-500"
                            />
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                            <IoCheckmarkCircleOutline size={32} />
                        </div>
                        <h2 className="text-xl font-bold">Email Verified!</h2>
                        <p className="text-gray-400 text-sm">Your account has been successfully verified. Redirecting...</p>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: 3, ease: "linear" }}
                                className="w-full h-full bg-green-500"
                            />
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                            <IoAlertCircleOutline size={32} />
                        </div>
                        <h2 className="text-xl font-bold">Verification Failed</h2>
                        <p className="text-gray-400 text-sm">The link may be invalid or expired. Please try again or contact support.</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
