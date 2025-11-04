import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import toast from 'react-hot-toast'

export function HeroSection() {
  const { isAuthenticated } = useAuthStore()
  const { ref, controls } = useScrollAnimation()
  const navigate = useNavigate()

  const handleBookNowClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      navigate('/booking')
    } else {
      toast.error('Please login to proceed on booking')
      navigate('/login?returnUrl=/booking')
    }
  }

  return (
    <section id="home" className="hero relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
      {/* Background Image with Animation */}
      <div className="hero-background absolute inset-0 w-full h-full -z-10">
        <motion.img 
          src="/assets/img/home-page/header-background.png" 
          alt="Badminton Court" 
          className="w-full h-full object-cover"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Animated Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60"
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Animated Court Lines Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
          animate={{
            x: ['100%', '-100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
      
      {/* Spotlight Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)'
        }}
      />
      
      <motion.div 
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hero-content relative z-10 max-w-5xl mx-auto px-5"
      >
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{
            ...controls,
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            scale: { 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          }}
          className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white" 
          style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.1)' }}
        >
          <motion.span
            animate={{
              textShadow: [
                '2px 2px 4px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.1)',
                '2px 2px 6px rgba(255,255,255,0.4), 0 0 30px rgba(255,255,255,0.2)',
                '2px 2px 4px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.1)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Budz Badminton Court
          </motion.span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="hero-subtitle text-base md:text-lg lg:text-xl mb-10 text-white font-light" 
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}
        >
          <motion.span
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Where dedication takes flight and champions are made
          </motion.span>
        </motion.p>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="hero-description text-sm md:text-base lg:text-lg mb-16 leading-relaxed text-white/90 max-w-4xl mx-auto" 
          style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
        >
          <motion.span
            animate={{
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Budz Badminton Court is open daily, with court hours from 8:00 AM to 12 Midnight. For reservations, kindly click the "Book Now" and accomplish our online booking facility. Thank you, and we look forward to see you in the court!
          </motion.span>
        </motion.p>
          
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex justify-center"
        >
          {isAuthenticated ? (
            <motion.button
              onClick={handleBookNowClick}
              className="cta-button bg-blue-500 text-white px-10 py-4 text-lg font-bold rounded-lg cursor-pointer relative overflow-hidden group"
              whileHover={{ 
                scale: 1.05,
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 8px 25px rgba(59, 130, 246, 0.4)',
                  '0 12px 35px rgba(59, 130, 246, 0.6)',
                  '0 8px 25px rgba(59, 130, 246, 0.4)'
                ]
              }}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Button Content */}
              <span className="relative z-10 flex items-center space-x-2">
                <motion.span
                  animate={{
                    x: [0, 3, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Book Now
                </motion.span>
                <motion.span
                  animate={{
                    x: [0, 5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="cta-button bg-blue-500 text-white px-10 py-4 text-lg font-bold rounded-lg cursor-pointer relative overflow-hidden group block"
                style={{ boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)' }}
              >
                {/* Animated Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Button Content */}
                <span className="relative z-10 flex items-center space-x-2">
                  <motion.span
                    animate={{
                      x: [0, 3, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Get Started
                  </motion.span>
                  <motion.span
                    animate={{
                      x: [0, 5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                  >
                    →
                  </motion.span>
                </span>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}
