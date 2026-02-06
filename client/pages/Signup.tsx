import { Link } from "react-router-dom";

export default function Signup() {
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

        {/* Signup Container */}
        <div className="w-full max-w-md bg-black/60 border-2 sm:border-3 border-pixel-cyan p-6 sm:p-8 md:p-10 text-center">
          <h2 className="font-pixel text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 uppercase">
            Google Signup
          </h2>

          <p className="font-pixel text-xs sm:text-sm text-gray-300 mb-6">
            Google OAuth integration coming soon
          </p>

          <p className="font-pixel text-xs text-pixel-cyan mb-8">
            Backend not implemented yet
          </p>

          <Link
            to="/game"
            className="inline-block py-2 sm:py-3 px-4 sm:px-6 bg-transparent border-2 border-pixel-cyan text-pixel-cyan font-pixel text-xs sm:text-sm hover:bg-pixel-cyan/20 transition-colors uppercase"
          >
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
