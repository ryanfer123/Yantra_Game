import { Link } from "react-router-dom";

export default function Index() {
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
        <h1 className="font-tiny text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-pixel-cream text-center leading-tight">
          THE LAST
          <br />
          OF O.S
        </h1>

        {/* Start Game Button */}
        <Link
          to="/game"
          className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 inline-block font-pixel text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 border-4 border-white bg-transparent hover:bg-white/10 transition-all duration-200 active:scale-95 cursor-pointer text-center whitespace-nowrap"
        >
          START
          <br />
          GAME
        </Link>
      </div>
    </div>
  );
}
