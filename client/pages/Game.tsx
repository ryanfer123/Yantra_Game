import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "@/lib/firebase";

export default function Game() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate("/play");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message ?? "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-pixel-navy flex items-center justify-center overflow-hidden relative">
      {/* Background image - pixel art cityscape */}
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/37dd726e68a0725cf6d40157a803bb41645d6400?width=2880"
        alt="Cyberpunk pixel art cityscape"
        className="absolute inset-0 w-full h-full object-cover pixelated"
      />

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h1 className="font-tiny text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-pixel-cream text-center leading-tight mb-8 sm:mb-12 md:mb-16">
          THE LAST
          <br />
          OF O.S
        </h1>

        {/* Login Form Container */}
        <div className="w-full max-w-md bg-black/60 border-2 sm:border-3 border-pixel-cyan p-6 sm:p-8 md:p-10">
          {/* Heading */}
          <h2 className="font-pixel text-base sm:text-lg md:text-xl text-white text-center mb-6 sm:mb-8">
            PLAYER
            <br />
            LOGIN
          </h2>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-transparent border-2 border-pixel-cyan text-pixel-cyan font-pixel text-xs sm:text-sm hover:bg-pixel-cyan/20 transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "SIGNING IN..." : "LOGIN WITH\nGOOGLE"}
          </button>

          {error && (
            <p className="mt-3 font-pixel text-[10px] sm:text-xs text-red-400 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="mt-8 sm:mt-12 font-pixel text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
