export function QueueingLoadingScreen() {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center text-white"
      style={{
        backgroundImage: "url('/assets/img/queueing-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay matching queueing app */}
      <div className="pointer-events-none absolute inset-0 bg-[#0a0308]/85 backdrop-blur-[2px]" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Shuttlecock Icon with animation */}
        <div className="relative">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center animate-bounce">
            {/* Shuttlecock Image */}
            <img
              src="/assets/Queueing/Shuttlefire.png"
              alt="Shuttlecock"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg animate-pulse">
            Loading Queueing System
          </h2>
          <p className="text-white/75 text-sm sm:text-base">
            Preparing your queue management...
          </p>
        </div>

        {/* Loading spinner */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Progress bar */}
        <div className="w-64 sm:w-80 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}

