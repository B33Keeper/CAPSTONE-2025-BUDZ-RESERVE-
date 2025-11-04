import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useResponsive } from '@/hooks/useResponsive'
import { galleryApiService, GalleryItem, getImageUrl } from '@/lib/galleryApiService'

export function GallerySection() {
  const { ref, controls } = useScrollAnimation()
  const { isMobile, isTablet } = useResponsive()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch gallery images from API
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true)
        const images = await galleryApiService.getAll()
        setGalleryImages(images)
      } catch (error) {
        console.error('Error fetching gallery images:', error)
        // Fallback to static images if API fails
        setGalleryImages([
          { id: 1, title: 'Client Group Photo 1', image_path: '/assets/img/home-page/GALLERY/IMAGE 1.jpg', description: '', status: 'active', sort_order: 1, created_at: '', updated_at: '' },
          { id: 2, title: 'Client Group Photo 2', image_path: '/assets/img/home-page/GALLERY/IMAGE 2.jpg', description: '', status: 'active', sort_order: 2, created_at: '', updated_at: '' },
          { id: 3, title: 'Client Group Photo 3', image_path: '/assets/img/home-page/GALLERY/IMAGE 3.jpg', description: '', status: 'active', sort_order: 3, created_at: '', updated_at: '' },
          { id: 4, title: 'Client Group Photo 4', image_path: '/assets/img/home-page/GALLERY/IMAGE 4.jpg', description: '', status: 'active', sort_order: 4, created_at: '', updated_at: '' },
          { id: 5, title: 'Client Group Photo 5', image_path: '/assets/img/home-page/GALLERY/IMAGE 5.jpg', description: '', status: 'active', sort_order: 5, created_at: '', updated_at: '' },
          { id: 6, title: 'Client Group Photo 6', image_path: '/assets/img/home-page/GALLERY/IMAGE 6.jpg', description: '', status: 'active', sort_order: 6, created_at: '', updated_at: '' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchGalleryImages()
  }, [])

  // Responsive images per view
  const imagesPerView = isMobile ? 1 : 2
  const totalSets = Math.ceil(galleryImages.length / imagesPerView)

  const nextSet = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSets)
  }

  const prevSet = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSets) % totalSets)
  }

  const startIndex = currentIndex * imagesPerView
  const displayedImages = galleryImages.slice(startIndex, startIndex + imagesPerView)

  const handleImageClick = (image: GalleryItem) => {
    setSelectedImage({ src: getImageUrl(image.image_path), alt: image.title })
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  return (
    <section id="gallery" className="py-12 sm:py-16 lg:py-20 pb-20 sm:pb-24 lg:pb-32 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden w-full">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-8 w-full">
        <motion.div 
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={controls}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6"
          >
            Some Court And Client <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Photos</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Happiness and fun is with us! Take a look at some photos taken with our clients
          </motion.p>
        </motion.div>

        {/* Gallery Carousel Container */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative w-full overflow-hidden bg-white/30 backdrop-blur-sm rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-700 hover:scale-[1.02]"
        >
          {/* Mobile Layout */}
          {isMobile ? (
            <div className="flex flex-col items-center space-y-6">
              {displayedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 w-full max-w-sm cursor-pointer transform hover:-translate-y-2"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                    <img 
                      src={getImageUrl(image.image_path)} 
                      alt={image.title} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to original path if constructed URL fails
                        if (e.currentTarget.src !== image.image_path) {
                          e.currentTarget.src = image.image_path;
                        }
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <h3 className="text-lg font-semibold mb-1">{image.title}</h3>
                    <p className="text-sm text-gray-200">Click to view full size</p>
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <motion.svg 
                      className="w-4 h-4 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      whileHover={{ scale: 1.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </motion.svg>
                  </div>
                  
                  {/* Animated Border Effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 animate-pulse"></div>
                  </div>
                </motion.div>
              ))}
              
              {/* Mobile Navigation */}
              <div className="flex gap-4 mt-8">
                <motion.button 
                  onClick={prevSet}
                  className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
                  aria-label="Previous images"
                  title="Previous images"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ x: [0, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </motion.div>
                </motion.button>
                <motion.button 
                  onClick={nextSet}
                  className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1"
                  aria-label="Next images"
                  title="Next images"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="w-7 h-7" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          ) : (
            /* Desktop/Tablet Layout */
            <div className="flex justify-center items-center gap-4 lg:gap-8">
              {/* Images Container */}
              <div className="flex flex-col gap-4 lg:gap-6 w-full max-w-3xl">
                {displayedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className={`group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 ${
                    isTablet 
                      ? 'w-full' 
                      : `w-1/2 ${index === 0 ? 'ml-8 lg:ml-16' : 'ml-32 lg:ml-64'}`
                  }`}
                  onClick={() => handleImageClick(image)}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                    <img 
                      src={getImageUrl(image.image_path)} 
                      alt={image.title} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to original path if constructed URL fails
                        if (e.currentTarget.src !== image.image_path) {
                          e.currentTarget.src = image.image_path;
                        }
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <h3 className="text-lg font-semibold mb-1">{image.title}</h3>
                    <p className="text-sm text-gray-200">Click to view full size</p>
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <motion.svg 
                      className="w-4 h-4 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      whileHover={{ scale: 1.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </motion.svg>
                  </div>
                  
                  {/* Animated Border Effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 animate-pulse"></div>
                  </div>
                </motion.div>
                ))}
              </div>

              {/* Navigation Buttons - Only show on desktop */}
              {!isTablet && (
                <div className="flex flex-col gap-4 items-center justify-center">
                  <motion.button 
                    onClick={nextSet}
                    className="w-18 h-18 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:-translate-y-1 -ml-48 -mt-20"
                    aria-label="Next images"
                    title="Next images"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      boxShadow: [
                        "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
                        "0 25px 50px -12px rgba(99, 102, 241, 0.4)",
                        "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
                      ]
                    }}
                    transition={{ 
                      boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-9 h-9" />
                    </motion.div>
                  </motion.button>
                  <motion.button 
                    onClick={prevSet}
                    className="w-18 h-18 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-3xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 -ml-16 mt-16"
                    aria-label="Previous images"
                    title="Previous images"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      boxShadow: [
                        "0 25px 50px -12px rgba(99, 102, 241, 0.25)",
                        "0 25px 50px -12px rgba(59, 130, 246, 0.4)",
                        "0 25px 50px -12px rgba(99, 102, 241, 0.25)"
                      ]
                    }}
                    transition={{ 
                      boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <motion.div
                      animate={{ x: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronLeft className="w-9 h-9" />
                    </motion.div>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Tablet Navigation - Bottom */}
          {isTablet && (
            <div className="flex justify-center gap-6 mt-12">
              <motion.button 
                onClick={prevSet}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
                aria-label="Previous images"
                title="Previous images"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ x: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </motion.div>
              </motion.button>
              <motion.button 
                onClick={nextSet}
                className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1"
                aria-label="Next images"
                title="Next images"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-8 h-8" />
                </motion.div>
              </motion.button>
            </div>
          )}
        </motion.div>
        
        {/* Progress Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex justify-center mt-12 mb-8 space-x-3"
        >
          {[...Array(totalSets)].map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 scale-125 shadow-lg' 
                  : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
              }`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </motion.div>

      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute -top-16 right-0 text-white hover:text-gray-300 transition-colors z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/20">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedImage.alt}</h3>
                <p className="text-gray-300">Click outside to close</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
