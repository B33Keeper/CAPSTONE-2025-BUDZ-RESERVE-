import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { BookOpen, CreditCard, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import toast from 'react-hot-toast'

export function WhyChooseSection() {
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

  const steps = [
    {
      number: '01',
      icon: BookOpen,
      title: 'Book',
      description: 'Experience our new 3 minute Booking System and be amazed!',
      numberColor: 'bg-blue-500',
      iconColor: 'bg-blue-500',
    },
    {
      number: '02',
      icon: CreditCard,
      title: 'Pay',
      description: 'Pay anytime, anywhere with your GCash e-wallet.',
      numberColor: 'bg-green-500',
      iconColor: 'bg-green-500',
    },
    {
      number: '03',
      icon: Users,
      title: 'Play',
      description: 'Play with your friends in our clean and well-maintained courts!',
      numberColor: 'bg-purple-500',
      iconColor: 'bg-purple-500',
    },
  ]

  return (
    <section id="about" className="why-choose py-12 sm:py-16 lg:py-20 pb-16 sm:pb-20 lg:pb-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden w-full">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, 25, 0],
            x: [0, -15, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, -35, 0],
            x: [0, 25, 0],
            scale: [1, 1.1, 1],
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
          className="text-center mb-12"
        >
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="section-title text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-800"
          >
            Why choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Budz Badminton Court?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="section-description text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            Budz Badminton Court is dedicated to your wellness—and we genuinely value our amazing clients! 
            Nestled in the lively center of the city, we offer the perfect space to relieve stress and 
            unleash your energy by smashing shuttlecocks with us!
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="process-steps grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={controls}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
              className="step-card group relative"
            >
              {/* Card Container */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl text-center shadow-2xl transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 hover:scale-105 min-h-[400px] flex flex-col justify-between border border-white/40 relative overflow-hidden">
                
                {/* Animated Background Glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Step Number - Top Left */}
                <motion.div 
                  className="text-6xl font-bold text-gray-300 text-left mb-4 relative z-10"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                >
                  {step.number}
                </motion.div>
                
                {/* Icon Container */}
                <motion.div 
                  className="flex items-center justify-center mb-6 relative z-10"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    {/* Icon Background Glow */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Icon */}
                    <div className="relative z-10">
                      {index === 0 && <img src="/assets/icons/book icon.png" alt="Book" className="w-24 h-24" />}
                      {index === 1 && <img src="/assets/icons/g-cash icon.png" alt="Payment" className="w-24 h-24" />}
                      {index === 2 && <img src="/assets/icons/playing badminton icon.png" alt="Play" className="w-24 h-24" />}
                    </div>
                  </div>
                </motion.div>
                
                {/* Title */}
                <motion.h3 
                  className="text-3xl font-bold text-gray-900 mb-4 relative z-10"
                  animate={{
                    y: [0, -2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3
                  }}
                >
                  {step.title}
                </motion.h3>
                
                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-6 relative z-10 group-hover:text-gray-800 transition-colors duration-300">
                  {step.description}
                </p>
                
                {/* Button */}
                <div className="mt-auto relative z-10 pt-2">
                  <motion.button
                    onClick={handleBookNowClick}
                    className="step-button bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-10 py-4 rounded-2xl cursor-pointer font-semibold transition-all duration-300 hover:from-blue-600 hover:to-indigo-600 text-lg w-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: [
                        "0 10px 25px rgba(59, 130, 246, 0.3)",
                        "0 15px 35px rgba(99, 102, 241, 0.4)",
                        "0 10px 25px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{
                      boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    Book now
                  </motion.button>
                </div>
                
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
