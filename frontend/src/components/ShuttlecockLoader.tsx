interface ShuttlecockLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showProgressBar?: boolean
  className?: string
}

export function ShuttlecockLoader({ 
  size = 'md', 
  showProgressBar = true,
  className = '' 
}: ShuttlecockLoaderProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-16 h-16',
    md: 'w-24 h-24 sm:w-32 sm:h-32',
    lg: 'w-32 h-32 sm:w-40 sm:h-40'
  }

  const progressBarWidth = {
    xs: 'w-16',
    sm: 'w-32',
    md: 'w-48 sm:w-64',
    lg: 'w-64 sm:w-80'
  }

  const glowSize = {
    xs: 'w-6 h-6',
    sm: 'w-20 h-20',
    md: 'w-28 h-28 sm:w-36 sm:h-36',
    lg: 'w-36 h-36 sm:w-44 sm:h-44'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Shuttlecock Icon with enhanced floating animation */}
      <div className="relative">
        {/* Outer flame glow ring */}
        <div className={`absolute inset-0 ${glowSize[size]} -m-2 mx-auto my-auto rounded-full bg-gradient-to-r from-red-500/30 via-orange-500/25 to-yellow-500/20 animate-[pulse-glow_2s_ease-in-out_infinite] blur-xl`} />
        
        {/* Middle flame glow ring */}
        <div className={`absolute inset-0 ${glowSize[size]} -m-1 mx-auto my-auto rounded-full bg-gradient-to-r from-red-400/40 via-orange-400/35 to-yellow-400/30 animate-[pulse-glow_1.5s_ease-in-out_infinite] blur-md`} />
        
        {/* Inner flame glow ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} mx-auto my-auto rounded-full bg-gradient-radial from-red-500/20 via-orange-500/15 to-transparent animate-[flame-flicker_1s_ease-in-out_infinite]`} />
        
        {/* Particle effects - orbiting flame sparkles */}
        {[...Array(6)].map((_, i) => {
          const distance = size === 'xs' ? 8 : size === 'sm' ? 12 : size === 'md' ? 16 : 20
          const rotation = i * 60
          return (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-red-400/80 via-orange-400/70 to-yellow-400/60"
              style={{
                width: `${size === 'xs' ? 2 : size === 'sm' ? 3 : 4}px`,
                height: `${size === 'xs' ? 2 : size === 'sm' ? 3 : 4}px`,
                left: '50%',
                top: '50%',
                '--rotation': `${rotation}deg`,
                '--distance': `-${distance}px`,
                animation: 'particle-orbit 3s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                boxShadow: '0 0 6px rgba(239, 68, 68, 0.8), 0 0 12px rgba(251, 146, 60, 0.6)',
              } as React.CSSProperties & { '--rotation': string; '--distance': string }}
            />
          )
        })}

        {/* Main shuttlecock container with enhanced animations */}
        <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
          {/* Shadow effect */}
          <div 
            className="absolute inset-0 bg-black/20 rounded-full blur-md animate-[shadow-pulse_2s_ease-in-out_infinite]"
            style={{
              transform: 'translateY(10%) scale(0.8)',
            }}
          />
          
          {/* Shuttlecock Image with rotation and floating */}
          <div className="relative z-10 animate-[shuttlecock-float_2s_ease-in-out_infinite]">
            <img
              src="/assets/Queueing/Shuttlefire.png"
              alt="Shuttlecock"
              className="w-full h-full object-contain drop-shadow-2xl animate-[shuttlecock-rotate_3s_linear_infinite]"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.7)) drop-shadow(0 0 20px rgba(251, 146, 60, 0.5)) drop-shadow(0 0 30px rgba(234, 179, 8, 0.3))',
              }}
            />
          </div>

          {/* Inner flame glow highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-red-400/30 via-orange-400/20 to-transparent pointer-events-none animate-[inner-glow_2s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Enhanced Progress bar with flame theme */}
      {showProgressBar && (
        <div className={`${progressBarWidth[size]} h-2 bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-red-500/20`}>
          <div className="relative h-full">
            {/* Animated flame gradient bar */}
            <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite] shadow-lg" 
              style={{
                backgroundSize: '200% 100%',
                backgroundPosition: '0% 0%',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(251, 146, 60, 0.4)',
              }}
            />
            {/* Flame shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/40 to-transparent animate-[shimmer_2s_ease-in-out_infinite] rounded-full" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
            width: 0%;
          }
          50% {
            transform: translateX(0%);
            width: 100%;
          }
          100% {
            transform: translateX(100%);
            width: 0%;
          }
        }

        @keyframes shuttlecock-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          25% {
            transform: translateY(-8px) scale(1.05);
          }
          50% {
            transform: translateY(-12px) scale(1.08);
          }
          75% {
            transform: translateY(-8px) scale(1.05);
          }
        }

        @keyframes shuttlecock-rotate {
          0% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(5deg);
          }
          50% {
            transform: rotate(0deg);
          }
          75% {
            transform: rotate(-5deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes shadow-pulse {
          0%, 100% {
            opacity: 0.2;
            transform: translateY(10%) scale(0.8);
          }
          50% {
            opacity: 0.4;
            transform: translateY(12%) scale(0.85);
          }
        }

        @keyframes inner-glow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }

        @keyframes flame-flicker {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          25% {
            opacity: 0.5;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.98);
          }
          75% {
            opacity: 0.5;
            transform: scale(1.02);
          }
        }

        @keyframes particle-orbit {
          0%, 100% {
            opacity: 0.6;
            transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(var(--distance)) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(calc(var(--rotation) + 180deg)) translateY(calc(var(--distance) * 1.2)) scale(1.3);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}

