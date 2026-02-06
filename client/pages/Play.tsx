import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Play() {
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    setPlayerName(storedName);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("playerName");
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
        <h1 className="font-tiny text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-pixel-cream text-center leading-tight mb-8 sm:mb-12">
          THE LAST
          <br />
          OF O.S
        </h1>

        {/* Welcome message */}
        {playerName && (
          <div className="mb-8 sm:mb-12 text-center">
            <p className="font-pixel text-base sm:text-lg md:text-xl text-pixel-cyan mb-2">
              WELCOME, {playerName.toUpperCase()}
            </p>
            <p className="font-pixel text-xs sm:text-sm text-gray-400">
              Ready to play?
            </p>
          </div>
        )}

        {/* Game Content Placeholder */}
        <div className="w-full max-w-2xl bg-black/60 border-2 sm:border-3 border-pixel-cyan p-6 sm:p-8 md:p-10 mb-8 sm:mb-12">
          <h2 className="font-pixel text-base sm:text-lg md:text-xl text-white text-center mb-4 sm:mb-6 uppercase">
            Game
          </h2>

          <div className="text-center">
            <p className="font-pixel text-xs sm:text-sm text-gray-300 mb-4">
              Game mechanics coming soon!
            </p>
            <p className="font-pixel text-xs text-gray-500">
              Continue prompting to add gameplay here
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Link
            to="/"
            onClick={handleLogout}
            className="font-pixel text-xs sm:text-sm text-white px-4 sm:px-6 py-2 sm:py-3 border-2 border-white bg-transparent hover:bg-white/10 transition-colors"
          >
            LOGOUT
          </Link>

          <button className="font-pixel text-xs sm:text-sm text-pixel-cyan px-4 sm:px-6 py-2 sm:py-3 border-2 border-pixel-cyan bg-transparent hover:bg-pixel-cyan/20 transition-colors">
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
