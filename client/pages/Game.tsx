import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Game() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem("playerName", username);
      navigate("/play");
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder for Google OAuth - will redirect to signup page later
    // For now, just navigate to signup placeholder
    navigate("/signup");
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

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {/* Username Label */}
            <div>
              <label className="block font-pixel text-xs sm:text-sm text-gray-400 mb-2 uppercase">
                Username
              </label>

              {/* Input Field */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER NAME"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900 border-2 border-gray-600 text-white placeholder-gray-500 font-pixel text-xs sm:text-sm focus:outline-none focus:border-pixel-cyan transition-colors"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-transparent border-2 border-pixel-cyan text-pixel-cyan font-pixel text-xs sm:text-sm hover:bg-pixel-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              Login
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4 sm:my-6">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-2 text-gray-500 font-pixel text-xs">OR</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-transparent border-2 border-pixel-cyan text-pixel-cyan font-pixel text-xs sm:text-sm hover:bg-pixel-cyan/20 transition-colors uppercase"
          >
            LOGIN WITH
            <br />
            GOOGLE
          </button>
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
