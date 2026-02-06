import { Link } from "react-router-dom";

export default function Game() {
  return (
    <div className="min-h-screen w-full bg-pixel-navy flex items-center justify-center overflow-hidden relative">
      {/* Background image - pixel art cityscape */}
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/37dd726e68a0725cf6d40157a803bb41645d6400?width=2880"
        alt="Cyberpunk pixel art cityscape"
        className="absolute inset-0 w-full h-full object-cover pixelated"
      />

      {/* Content container - centered overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h1 className="font-tiny text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-pixel-cream text-center leading-tight mb-8">
          GAME
        </h1>

        {/* Placeholder message */}
        <div className="font-pixel text-sm sm:text-base md:text-lg text-white text-center max-w-xl mb-12 bg-black/40 p-6 border-2 border-pixel-cyan">
          <p className="mb-4">Game content coming soon!</p>
          <p className="text-xs sm:text-sm text-pixel-cyan">
            Continue prompting to add game functionality here
          </p>
        </div>

        {/* Back to Menu Button */}
        <Link
          to="/"
          className="font-pixel text-xl sm:text-2xl md:text-3xl text-white px-4 sm:px-6 py-3 border-4 border-white bg-transparent hover:bg-white/10 transition-all duration-200 active:scale-95 cursor-pointer text-center whitespace-nowrap"
        >
          BACK TO MENU
        </Link>
      </div>
    </div>
  );
}
