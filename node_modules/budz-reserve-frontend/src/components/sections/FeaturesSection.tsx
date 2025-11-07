import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export function FeaturesSection() {
  const { ref, controls } = useScrollAnimation()
  
  const features = [
    {
      number: '500',
      text: 'Guests have already experienced what we offer.',
    },
    {
      number: '14',
      text: 'Available Courts that are clean and well-maintained!',
    },
    {
      number: '135,000',
      text: 'Countless hours dedicated to serving our valued clients.',
    },
  ]

  return (
    <section className="features-stats py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 relative overflow-hidden w-full">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"
          animate={{
            y: [0, 25, 0],
            x: [0, -10, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div 
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={controls}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="features-content grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center bg-white/40 backdrop-blur-sm rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-700 w-full"
        >
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-2 lg:order-1"
          >
            <div className="relative group">
              {/* Main Image Container */}
              <div className="relative z-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-500">
                <motion.img 
                  src="/assets/img/home-page/a man spiking img.png" 
                  alt="Badminton Player" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                  whileHover={{ scale: 1.02 }}
                />
                
                {/* Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Floating Badminton Elements */}
                <motion.div
                  className="absolute top-3 right-3 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 8, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img src="/assets/img/home-page/shuttle cock.png" alt="Shuttle" className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="order-1 lg:order-2"
          >
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={controls}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Achievements</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Numbers that speak for our commitment to excellence
              </p>
            </motion.div>
            
            <div className="stats-content flex flex-col gap-3 sm:gap-4 relative">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={controls}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.2 }}
                  className="stat-item group relative"
                >
                  {/* Card Container */}
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-md hover:shadow-lg transition-all duration-500 hover:scale-102 hover:-translate-y-1">
                    {/* Animated Icon */}
                    <motion.div 
                      className="stat-icon flex-shrink-0 relative"
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                        <img src="/assets/icons/racket icon.png" alt="Racket" className="w-5 h-5 sm:w-6 sm:h-6 filter brightness-0 invert" />
                      </div>
                      
                      {/* Floating Badge */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {index + 1}
                      </motion.div>
                    </motion.div>
                    
                    {/* Content */}
                    <div className="stat-info flex flex-col flex-1">
                      <motion.div 
                        className="stat-number text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1"
                        animate={{
                          scale: [1, 1.02, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.5
                        }}
                      >
                        {feature.number}
                      </motion.div>
                      <div className="stat-text text-xs sm:text-sm text-gray-600 font-medium leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                        {feature.text}
                      </div>
                    </div>
                    
                    {/* Animated Arrow */}
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      animate={{
                        x: [0, 3, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
