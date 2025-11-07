import React, { useState } from 'react'
import { MapPin, Phone, Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export function ContactSection() {
  const { ref, controls } = useScrollAnimation()
  const { user, isAuthenticated } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const payload = {
        name: isAuthenticated && user ? user.name : formData.name,
        message: formData.message,
        user_id: isAuthenticated && user ? user.id : undefined,
      }

      await api.post('/suggestions', payload)
      
      toast.success('Thank you for your suggestion! We appreciate your feedback.')
    setFormData({ name: '', message: '' })
    } catch (error: any) {
      console.error('Error submitting suggestion:', error)
      toast.error(error.response?.data?.message || 'Failed to submit suggestion. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section 
      id="contact" 
      className="contact-footer py-0 relative min-h-screen contact-background w-full"
      style={{
        backgroundImage: 'url(/assets/img/home-page/Rectangle 11 (2).png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Enhanced Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
      
      <motion.div 
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="contact-content grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10 items-center px-4 sm:px-6 lg:px-8 w-full"
      >
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="suggestion-form bg-white/95 backdrop-blur-sm p-4 sm:p-6 lg:p-8 relative z-10 border border-gray-200 shadow-2xl rounded-2xl w-full"
        >
          <motion.h3 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-2xl sm:text-3xl font-bold mb-3 text-gray-800"
          >
            Get in Touch
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-base sm:text-lg text-gray-600 mb-6"
          >
            Enter your suggestions here in order for us to improve our services
          </motion.p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isAuthenticated && (
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
                className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl text-sm sm:text-base bg-white transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300"
              />
            </div>
            )}
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Message</label>
              <textarea
                name="message"
                placeholder="Tell us how we can improve our services..."
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl text-sm sm:text-base bg-white transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="send-btn bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 px-6 sm:px-10 rounded-xl cursor-pointer text-base sm:text-lg font-semibold transition-all duration-300 mx-auto hover:from-blue-700 hover:to-blue-800 hover:-translate-y-1 hover:shadow-xl flex items-center space-x-2 sm:space-x-3 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)' }}
            >
              <Send className={`w-6 h-6 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </motion.div>

        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="court-info p-4 sm:p-6 lg:p-8 pt-8 sm:pt-12 text-white relative z-10 w-full"
        >
          <motion.h3 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-2xl sm:text-3xl font-bold mb-4 text-white"
          >
            Contact Information
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-base sm:text-lg text-gray-200 mb-6"
          >
            Get in touch with us for reservations, inquiries, or feedback
          </motion.p>
          
          {/* Social Links */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="social-links mb-6"
          >
            <h4 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Follow Us
            </h4>
            <div className="space-y-4">
              <a
                href="https://www.facebook.com/budzbadmintoncourt"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl text-gray-200 hover:text-white hover:bg-white/20 transition-all duration-300 text-base sm:text-lg border border-white/20"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook Page
                </div>
              </a>
              <a
                href="https://www.facebook.com/budz.court"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl text-gray-200 hover:text-white hover:bg-white/20 transition-all duration-300 text-base sm:text-lg border border-white/20"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook Group
                </div>
              </a>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="location mb-6"
          >
            <h4 className="text-xl font-bold text-white mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-blue-400" />
              Our Location
            </h4>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <p className="text-gray-200 text-lg leading-relaxed">
                <span className="font-semibold text-white">4th Floor RFC Mall Molino 2</span><br />
                Bacoor City, Cavite, Philippines
              </p>
            </div>
          </motion.div>

          {/* Contact Numbers */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="contact-numbers mb-6"
          >
            <h4 className="text-xl font-bold text-white mb-6 flex items-center">
              <Phone className="w-6 h-6 mr-3 text-blue-400" />
              Contact Numbers
            </h4>
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-200 text-lg font-medium">09153730100 (Globe)</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-200 text-lg font-medium">09086688758 (Smart)</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Google Maps Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="map-section py-12 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-center mb-8"
          >
            <h3 className="text-3xl font-bold text-white mb-4">Find Us Here</h3>
            <p className="text-lg text-gray-200">Visit us at our convenient location in RFC Mall Molino 2</p>
          </motion.div>
          <div className="w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20" style={{ height: '400px' }}>
            <div 
              className="embed-map-fixed w-full h-full"
              style={{ position: 'relative', textAlign: 'right', width: '100%', height: '100%' }}
            >
              <div 
                className="embed-map-container w-full h-full"
                style={{ overflow: 'hidden', background: 'none !important', width: '100%', height: '100%' }}
              >
                <iframe 
                  className="embed-map-frame w-full h-full"
                  frameBorder="0" 
                  scrolling="no" 
                  src="https://maps.google.com/maps?width=700&height=400&hl=en&q=4th%20Floor%20RFC%20Mall%20Molino%202%2C%20Bacoor%20City%20Cavite%20%20Budz%20Badminton%20Court%20(BBC)&t=&z=14&ie=UTF8&iwloc=B&output=embed"
                  style={{ width: '100% !important', height: '100% !important' }}
                ></iframe>
                <a 
                  href="https://map-embed.org" 
                  style={{
                    fontSize: '2px !important',
                    color: 'gray !important',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    zIndex: 1,
                    maxHeight: '10px',
                    overflow: 'hidden'
                  }}
                >
                  google maps generator
                </a>
                <a 
                  href="https://cartoongames.io/channel/cartoon-network" 
                  style={{
                    fontSize: '2px !important',
                    color: 'gray !important',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    zIndex: 1,
                    maxHeight: '10px',
                    overflow: 'hidden'
                  }}
                >
                  Cartoon Network Games
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

    </section>
  )
}
