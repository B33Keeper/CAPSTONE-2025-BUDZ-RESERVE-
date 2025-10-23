
import { useState, useEffect } from 'react'
import { apiServices, Court, Equipment, TimeSlot } from '@/lib/apiServices'
import { TermsAndConditionsModal } from '@/components/modals/TermsAndConditionsModal'
import { BookingDetailsModal } from '@/components/modals/BookingDetailsModal'
import { RacketDetailsModal } from '@/components/modals/RacketDetailsModal'
import { RacketConfigModal } from '@/components/modals/RacketConfigModal'

interface CourtBooking {
  court: string
  schedule: string
  subtotal: number
}

interface EquipmentBooking {
  equipment: string
  time: string
  quantity: number
  subtotal: number
}

interface CellStatus {
  status: 'available' | 'reserved' | 'maintenance' | 'selected' | 'past'
}

export function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('')
  const [tempSelectedDate, setTempSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()
    return {
      year: today.getFullYear(),
      month: today.getMonth()
    }
  })
  const [activeTab, setActiveTab] = useState('Sheet 1')
  const [currentStep, setCurrentStep] = useState(1)
  const [dateError, setDateError] = useState('')

  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([])
  const [equipmentBookings, setEquipmentBookings] = useState<EquipmentBooking[]>([])
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [, setCellStatuses] = useState<Map<string, CellStatus>>(new Map())
  
  // Dynamic data from database
  const [courts, setCourts] = useState<Court[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [, setTimeSlots] = useState<TimeSlot[]>([])
  
  // Calculate courts per sheet dynamically
  const courtsPerSheet = 6
  const totalSheets = Math.ceil(courts.length / courtsPerSheet)
  
  // Calculate current sheet index based on active tab
  const getCurrentSheetIndex = () => {
    if (activeTab.startsWith('Sheet ')) {
      const sheetNumber = parseInt(activeTab.split(' ')[1])
      return sheetNumber - 1 // Convert to 0-based index
    }
    return 0 // Default to first sheet for non-sheet tabs
  }
  
  const currentSheetIndex = getCurrentSheetIndex()
  const startIndex = currentSheetIndex * courtsPerSheet
  const endIndex = Math.min(startIndex + courtsPerSheet, courts.length)
  const currentSheetCourts = courts.slice(startIndex, endIndex)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilityData, setAvailabilityData] = useState<Map<number, any[]>>(new Map())
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false)
  const [showRacketDetailsModal, setShowRacketDetailsModal] = useState(false)
  const [showRacketConfigModal, setShowRacketConfigModal] = useState(false)
  const [selectedRacket, setSelectedRacket] = useState<Equipment | null>(null)


  // Calculate total amount
  const totalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                     equipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

  const steps = [
    { id: 1, name: 'Select a date', active: currentStep === 1 },
    { id: 2, name: 'Select time & court no.', active: currentStep === 2 },
    { id: 3, name: 'Select payment method.', active: currentStep === 3 },
    { id: 4, name: 'completed', active: currentStep === 4 },
  ]

  // Generate dynamic tabs based on number of courts
  const sheetTabs = Array.from({ length: totalSheets }, (_, index) => `Sheet ${index + 1}`)
  const tabs = [...sheetTabs, 'Rent a racket', 'Booking details']

  // Check if a time slot has passed
  const isTimeSlotPassed = (timeSlot: { start_time: string, end_time: string }) => {
    if (!selectedDate) return false
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDateObj = new Date(selectedDate)
    const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate())
    
    // If selected date is in the future, no time slots are passed
    if (selectedDateOnly > today) return false
    
    // If selected date is today, check if the time slot has passed
    if (selectedDateOnly.getTime() === today.getTime()) {
      const [hours, minutes] = timeSlot.start_time.split(':')
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes))
      return slotTime < now
    }
    
    // If selected date is in the past, all time slots are passed
    return true
  }

  // Generate time slots for display (8 AM to 11 PM)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`
      
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'pm' : 'am'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
      }
      
      const timeSlot = {
        id: hour,
        start_time: startTime,
        end_time: endTime,
        display: `${formatTime(startTime)} - ${formatTime(endTime)}`
      }
      
      // Only include time slots that haven't passed
      if (!isTimeSlotPassed(timeSlot)) {
        slots.push(timeSlot)
      }
    }
    return slots
  }

  // Load data from database
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [courtsData, equipmentData, timeSlotsData] = await Promise.all([
        apiServices.getCourts(),
        apiServices.getEquipment(),
        apiServices.getTimeSlots()
      ])
      
      setCourts(courtsData)
      setEquipment(equipmentData)
      setTimeSlots(timeSlotsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])


  // Load availability data when date is selected
  const loadAvailabilityData = async (date: string) => {
    if (!date) return
    
    try {
      setLoadingAvailability(true)
      const newAvailabilityData = new Map<number, any[]>()
      
      // Fetch availability for each court
      for (const court of courts) {
        try {
          const availability = await apiServices.getAvailability(court.Court_Id, date)
          newAvailabilityData.set(court.Court_Id, availability)
        } catch (err) {
          console.error(`Error loading availability for court ${court.Court_Id}:`, err)
          // Set empty availability if there's an error
          newAvailabilityData.set(court.Court_Id, [])
        }
      }
      
      setAvailabilityData(newAvailabilityData)
    } catch (err) {
      console.error('Error loading availability data:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }

  // Initialize cell statuses with some reserved and maintenance cells
  const initializeCellStatuses = () => {
    const statuses = new Map<string, CellStatus>()
    
    // Add some reserved cells (randomly selected)
    const reservedCells = [
      'COURT 1-8:00 am - 9:00 am',
      'COURT 2-2:00 pm - 3:00 pm',
      'COURT 3-6:00 pm - 7:00 pm',
      'COURT 4-8:00 pm - 9:00 pm',
      'COURT 5-10:00 am - 11:00 am',
      'COURT 6-4:00 pm - 5:00 pm'
    ]
    
    // Add some maintenance cells
    const maintenanceCells = [
      'COURT 1-12:00 pm - 1:00 pm',
      'COURT 3-1:00 pm - 2:00 pm',
      'COURT 5-3:00 pm - 4:00 pm'
    ]
    
    reservedCells.forEach(cell => {
      statuses.set(cell, { status: 'reserved' })
    })
    
    maintenanceCells.forEach(cell => {
      statuses.set(cell, { status: 'maintenance' })
    })
    
    return statuses
  }

  const handleCellClick = (courtId: number, courtName: string, time: string, price: number) => {
    const cellKey = `COURT ${courtId}-${time}`
    const currentStatus = getCellStatus(courtId, time)
    
    // Don't allow clicking on reserved, maintenance, or past time slots
    if (currentStatus.status === 'reserved' || currentStatus.status === 'maintenance' || currentStatus.status === 'past') {
      return
    }
    
    const isSelected = selectedCells.has(cellKey)
    
    if (isSelected) {
      // Deselect the cell
      setSelectedCells(prev => {
        const newSet = new Set(prev)
        newSet.delete(cellKey)
        return newSet
      })
      
      // Remove from bookings
      setCourtBookings(prev => prev.filter(booking => 
        !(booking.court === courtName && booking.schedule === time)
      ))
    } else {
      // Select the cell
      setSelectedCells(prev => new Set(prev).add(cellKey))
      
      // Add to bookings
      const newBooking: CourtBooking = {
        court: courtName,
        schedule: time,
        subtotal: Number(price)
      }
      setCourtBookings(prev => [...prev, newBooking])
    }
  }

  const getCellStatus = (courtId: number, time: string): CellStatus => {
    const cellKey = `COURT ${courtId}-${time}`
    
    // Check if user has selected this cell
    if (selectedCells.has(cellKey)) {
      return { status: 'selected' }
    }
    
    // Check if this time slot has passed
    const timeSlot = {
      start_time: time.split(' - ')[0].replace(/\s+(am|pm)/i, '').replace(/(\d+):(\d+)/, (match, hour, min) => {
        const h = parseInt(hour)
        const isPM = time.toLowerCase().includes('pm')
        const adjustedHour = isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h)
        return `${adjustedHour.toString().padStart(2, '0')}:${min}`
      }) + ':00',
      end_time: time.split(' - ')[1].replace(/\s+(am|pm)/i, '').replace(/(\d+):(\d+)/, (match, hour, min) => {
        const h = parseInt(hour)
        const isPM = time.toLowerCase().includes('pm')
        const adjustedHour = isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h)
        return `${adjustedHour.toString().padStart(2, '0')}:${min}`
      }) + ':00'
    }
    
    if (isTimeSlotPassed(timeSlot)) {
      return { status: 'past' }
    }
    
    // Check real availability data from database
    const courtAvailability = availabilityData.get(courtId)
    if (courtAvailability && courtAvailability.length > 0) {
      // Find the time slot in availability data
      const timeSlot = courtAvailability.find(slot => {
        const formatTime = (time: string) => {
          const [hours, minutes] = time.split(':')
          const hour = parseInt(hours)
          const ampm = hour >= 12 ? 'pm' : 'am'
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          return `${displayHour}:${minutes} ${ampm}`
        }
        const slotTime = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
        return slotTime === time
      })
      
      if (timeSlot) {
        return { status: timeSlot.available ? 'available' : 'reserved' }
      }
    }
    
    // Default to available if no data
    return { status: 'available' }
  }

  

  const handleRacketClick = (racketName: string) => {
    const racket = equipment.find(eq => eq.equipment_name === racketName)
    if (racket) {
      setSelectedRacket(racket)
      setShowRacketDetailsModal(true)
    }
  }



  // Visual state helper for table cells (keeps original colors)
  const getCellClassName = (courtId: number, timeLabel: string, courtStatus?: string) => {
    const key = `COURT ${courtId}-${timeLabel}`
    const isSelected = selectedCells.has(key)
    const cellStatus = getCellStatus(courtId, timeLabel)

    // Debug: Log maintenance status detection
    if (courtStatus === 'Maintenance') {
      console.log(`Court ${courtId} (${timeLabel}) is in Maintenance status - applying yellow styling`)
    }

    // Past time slots take highest precedence
    if (cellStatus.status === 'past') return 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'

    // Maintenance styles take precedence
    if (courtStatus === 'Maintenance') return 'bg-yellow-400 text-black cursor-not-allowed'

    // Selected vs available styles
    if (isSelected) return 'bg-green-300 text-black ring-2 ring-green-500'
    return 'bg-white text-gray-900 hover:bg-blue-50 cursor-pointer'
  }

  const handleDateSelection = (date: string, isAvailable: boolean) => {
    if (!isAvailable) {
      setDateError('Cannot select a past date. Please choose a current or future date.')
      return
    }
    
    setDateError('')
    setTempSelectedDate(date)
    
    // Show terms and conditions modal when date is selected
    setShowTermsModal(true)
  }

  const handleProceedFromDateSelection = async () => {
    if (!tempSelectedDate) {
      setDateError('Please select a date before proceeding.')
      return
    }
    setSelectedDate(tempSelectedDate)
    setCurrentStep(2)
    
    // Load availability data for the selected date
    await loadAvailabilityData(tempSelectedDate)
  }

  const handleBackToStep = (step: number) => {
    setCurrentStep(step)
  }

  // Generate dates for selected month

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    
    setSelectedMonth(prev => {
      let newMonth = prev.month - 1
      let newYear = prev.year
      
      if (newMonth < 0) {
        newMonth = 11
        newYear -= 1
      }
      
      // Don't allow going to past months
      if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
        return prev
      }
      
      return { year: newYear, month: newMonth }
    })
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + 1
      let newYear = prev.year
      
      if (newMonth > 11) {
        newMonth = 0
        newYear += 1
      }
      
      return { year: newYear, month: newMonth }
    })
  }


  const isRacketBooked = (racket: string) => {
    return equipmentBookings.some(booking => booking.equipment === racket)
  }

  // Handle Terms and Conditions
  const handleProceedToPayment = () => {
    if (courtBookings.length === 0 && equipmentBookings.length === 0) {
      alert('Please select at least one court or equipment before proceeding.')
      return
    }
    setShowTermsModal(true)
  }

  const handleAcceptTerms = () => {
    setShowTermsModal(false)
    setSelectedDate(tempSelectedDate)
    setCurrentStep(2) // Move to court selection step
  }

  const handleCloseTerms = () => {
    setShowTermsModal(false)
    setTempSelectedDate('') // Reset the temporary selected date
  }

  // Racket modal handlers
  const handleRacketDetailsClose = () => {
    setShowRacketDetailsModal(false)
    setSelectedRacket(null)
  }

  const handleRacketDetailsSelect = () => {
    setShowRacketDetailsModal(false)
    setShowRacketConfigModal(true)
  }

  const handleRacketConfigClose = () => {
    setShowRacketConfigModal(false)
    setSelectedRacket(null)
  }

  const handleRacketConfigConfirm = (time: number, quantity: number) => {
    if (!selectedRacket) return
    
    const price = Number(selectedRacket.price) || 100
    const newBooking: EquipmentBooking = {
      equipment: selectedRacket.equipment_name,
      time: `${time} hr`,
      quantity: quantity,
      subtotal: price * time * quantity
    }
    
    setEquipmentBookings(prev => {
      const filtered = prev.filter(booking => booking.equipment !== selectedRacket.equipment_name)
      return [...filtered, newBooking]
    })
    
    setShowRacketConfigModal(false)
    setSelectedRacket(null)
  }

  // Initialize cell statuses on component mount
  useEffect(() => {
    setCellStatuses(initializeCellStatuses())
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Add custom CSS for flip animation */}
      <style>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      
      {/* Step Counter - Mobile Responsive */}
      <div className="bg-gray-200 px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                step.active ? 'bg-blue-600 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                {step.id}
                </div>
              <span className={`ml-1 sm:ml-2 text-xs sm:text-sm ${
                step.active ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                    {step.name}
              </span>
                {index < steps.length - 1 && (
                <div className={`w-8 sm:w-12 lg:w-16 h-0.5 mx-2 sm:mx-4 ${
                  step.active ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
                )}
              </div>
            ))}
          </div>
        </div>

      {/* Main Content - Mobile Responsive */}
      <div className="p-2 sm:p-4 lg:p-6">
         <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 mx-auto max-w-7xl">
          {currentStep === 1 && (
             <>
               {/* Date Selection Header - Mobile Responsive */}
               <div className="bg-gray-600 text-white px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-t-lg -mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6 mb-4 sm:mb-6 shadow">
                 <h2 className="text-sm sm:text-base lg:text-lg font-semibold">Select from the available dates below</h2>
                 <p className="text-blue-100 text-xs sm:text-sm mt-1">Choose a date to proceed to time and court selection</p>
               </div>
               
               {/* Month Selector - Mobile Responsive */}
               <div className="flex items-center justify-center mb-4 sm:mb-6">
                 <button
                   onClick={goToPreviousMonth}
                   className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow hover:bg-blue-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={(() => {
                     const today = new Date()
                     const currentYear = today.getFullYear()
                     const currentMonth = today.getMonth()
                     return selectedMonth.year <= currentYear && selectedMonth.month <= currentMonth
                   })()}
                 >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                   </svg>
                 </button>
                 
                 <div className="mx-3 sm:mx-6 text-center">
                   <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                     {new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', { 
                       month: 'long', 
                       year: 'numeric' 
                     })}
                   </h3>
                   <p className="text-xs text-gray-500">Tap a date to continue</p>
                 </div>
                 
                 <button
                   onClick={goToNextMonth}
                   className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow hover:bg-blue-50 text-gray-700"
                 >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </button>
               </div>
               
               {/* Date Selection Grid - Mobile Responsive */}
               <div className="bg-white rounded-lg ring-1 ring-gray-200 overflow-hidden">
                 <div className="grid grid-cols-7 bg-gray-50">
                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                     <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-600">
                       {day}
                     </div>
                   ))}
                 </div>
                 
                 <div className="grid grid-cols-7">
                   {(() => {
                     const firstDayOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1)
                     const lastDayOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0)
                     const firstDayWeekday = firstDayOfMonth.getDay()
                     const daysInMonth = lastDayOfMonth.getDate()
                     const today = new Date()
                     
                     const items: JSX.Element[] = []
                     for (let i = 0; i < firstDayWeekday; i++) {
                       items.push(<div key={`empty-${i}`} className="h-10 sm:h-12 lg:h-16 border-t border-gray-100" />)
                     }
                     for (let day = 1; day <= daysInMonth; day++) {
                       const date = new Date(selectedMonth.year, selectedMonth.month, day)
                       const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                       const isAvailable = !isPast
                       const isToday = date.toDateString() === today.toDateString()
                       const label = new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', { month: 'long' })
                       const dateString = `${label} ${day}, ${selectedMonth.year}`
                       const isSelected = tempSelectedDate === dateString
                       
                       items.push(
                         <button
                           key={day}
                           type="button"
                           className={`relative h-10 sm:h-12 lg:h-14 w-10 sm:w-12 lg:w-14 mx-auto my-1 sm:my-2 border-t border-gray-100 flex items-center justify-center rounded-full transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                             isSelected 
                               ? 'bg-green-600 text-white font-semibold shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] scale-105' 
                               : isAvailable 
                                 ? 'hover:bg-green-50 text-gray-900 hover:scale-105' 
                                 : 'text-gray-600 opacity-70 cursor-not-allowed line-through'
                           }`}
                           aria-selected={isSelected}
                           onClick={() => isAvailable && handleDateSelection(dateString, true)}
                           disabled={!isAvailable}
                         >
                           <span className="text-xs sm:text-sm lg:text-base">{day}</span>
                           {isToday && !isSelected && (
                             <span className="absolute -bottom-1 block w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500" />
                           )}
                         </button>
                       )
                     }
                     return items
                   })()}
                 </div>
               </div>
               
               {/* Selected Date Display - Mobile Responsive */}
               {tempSelectedDate && (
                 <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 ring-1 ring-green-200 rounded-lg text-center">
                   <span className="text-xs sm:text-sm text-green-800 font-medium">Selected date:</span>
                   <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-green-700">{tempSelectedDate}</span>
                 </div>
               )}
               
               {/* Error Message - Mobile Responsive */}
               {dateError && (
                 <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 ring-1 ring-red-200 text-red-700 rounded-lg text-sm">
                   {dateError}
                 </div>
               )}

               {/* Proceed Button for Step 1 - Mobile Responsive */}
               <div className="text-center mt-4 sm:mt-6">
                 <button 
                   onClick={handleProceedFromDateSelection}
                   className="inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                   disabled={!tempSelectedDate}
                 >
                   Proceed
                 </button>
               </div>
             </>
           )}

          {currentStep === 2 && (
            <>
              {/* Section Header with Tabs inside - Mobile Responsive */}
              <div className="bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg -mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-sm sm:text-base lg:text-lg font-medium">Select from the available time and court:</h2>
                  
                  {/* Tabs inside the header container - Mobile Responsive */}
                  <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                          activeTab === tab
                            ? 'bg-white text-gray-900'
                            : 'bg-gray-500 text-gray-100 hover:bg-gray-400'
                        }`}
                        aria-current={activeTab === tab ? 'page' : undefined}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

          {/* Selected Date - Mobile Responsive */}
          <div className="text-center mb-4 sm:mb-6">
            <p className="text-sm sm:text-base lg:text-lg font-semibold">Selected date: {selectedDate}</p>
          </div>

          {/* Content based on active tab */}
          {sheetTabs.includes(activeTab) && (
            <div>
              {/* Legend - Mobile Responsive */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
                <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full ring-1 ring-gray-300 bg-white">
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-white ring-1 ring-gray-300"></span>
                  <span>Available</span>
                </div>
                <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-gray-600 text-white">
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-gray-600"></span>
                  <span>Reserved</span>
                </div>
                <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-yellow-400 text-black">
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-yellow-400"></span>
                  <span>Maintenance</span>
                </div>
                <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-gray-300 text-gray-500">
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-gray-300"></span>
                  <span>Past Time</span>
                </div>
                <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-green-300 text-gray-900">
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-green-300"></span>
                  <span>Selected</span>
                </div>
              </div>

              {/* Mobile-friendly cards (Sheet 1) - Enhanced Mobile Responsive */}
              <div className="sm:hidden space-y-3">
                {generateTimeSlots().map((timeSlot) => (
                  <div key={timeSlot.id} className="rounded-lg ring-1 ring-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs sm:text-sm font-medium">{timeSlot.display}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 sm:p-3">
                      {currentSheetCourts.map((court) => {
                        const key = `COURT ${court.Court_Id}-${timeSlot.display}`
                        const isSelected = selectedCells.has(key)
                        const status = getCellStatus(court.Court_Id, timeSlot.display).status
                        const disabled = status === 'reserved' || status === 'maintenance' || status === 'past' || court.Status === 'Maintenance'
                        return (
                          <button
                            key={`${timeSlot.id}-${court.Court_Id}`}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={disabled}
                            onClick={() => !disabled && handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, typeof court.Price === 'number' ? court.Price : typeof court.Price === 'string' ? parseFloat(court.Price) : 0)}
                            className={`flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left text-xs border transition-colors
                              ${disabled ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed' :
                              isSelected ? 'bg-green-300 text-gray-900 border-green-400 ring-2 ring-green-500' :
                              'bg-white text-gray-900 border-gray-200 hover:bg-blue-50'}`}
                            title={`${court.Court_Name}${disabled ? ' (not available)' : ''}`}
                          >
                            <span className="truncate mr-1 sm:mr-2 text-xs">{court.Court_Name}</span>
                            <span className={`ml-auto inline-block px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] ${disabled ? 'bg-transparent text-gray-500' : 'bg-white/80 text-gray-900'}`}>
                              ₱{typeof court.Price === 'number' ? court.Price.toFixed(2) : typeof court.Price === 'string' ? parseFloat(court.Price).toFixed(2) : '0.00'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Court Selection Table (Tablet/Desktop) - Enhanced Mobile Responsive */}
              <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-gray-200 shadow-sm">
                 {loading ? (
                   <div className="text-center py-6 sm:py-8">
                     <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-2 text-sm sm:text-base text-gray-600">Loading courts...</p>
                   </div>
                 ) : error ? (
                   <div className="text-center py-6 sm:py-8">
                     <p className="text-sm sm:text-base text-red-600">{error}</p>
                     <button 
                       onClick={() => window.location.reload()} 
                       className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                     >
                       Retry
                     </button>
                   </div>
                 ) : loadingAvailability ? (
                   <div className="text-center py-6 sm:py-8">
                     <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-2 text-sm sm:text-base text-gray-600">Loading availability data...</p>
                   </div>
                 ) : (
                  <table className="w-full border-collapse" role="grid">
                     <thead>
                      <tr className="bg-gray-100 sticky top-0 z-10">
                        <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm">TIME</th>
                         {currentSheetCourts.map((court) => (
                          <th key={court.Court_Id} className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-center text-xs sm:text-sm">
                             {court.Court_Name}
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody>
                      {generateTimeSlots().map((timeSlot, idx) => (
                        <tr key={timeSlot.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 font-medium sticky left-0 bg-inherit text-xs sm:text-sm">{timeSlot.display}</td>
                           {currentSheetCourts.map((court) => (
                             <td
                               key={`${timeSlot.display}-${court.Court_Id}`}
                              className={`border border-gray-300 px-1 sm:px-2 lg:px-4 py-1.5 sm:py-2 text-center ${getCellClassName(court.Court_Id, timeSlot.display, court.Status)}`}
                               onClick={() => {
                                 const cellStatus = getCellStatus(court.Court_Id, timeSlot.display)
                                 if (court.Status === 'Available' && cellStatus.status !== 'past') {
                                   handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, typeof court.Price === 'number' ? court.Price : typeof court.Price === 'string' ? parseFloat(court.Price) : 0)
                                 }
                               }}
                            >
                              {(() => {
                                const key = `COURT ${court.Court_Id}-${timeSlot.display}`
                                const isSelected = selectedCells.has(key)
                                const showBadge = court.Status === 'Available' && !isSelected
                                return (
                                  <span className={`inline-block px-1 sm:px-1.5 lg:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] lg:text-xs ${showBadge ? 'bg-white/80 text-gray-900' : 'bg-transparent text-black'}`}>
                                    ₱{typeof court.Price === 'number' ? court.Price.toFixed(2) : typeof court.Price === 'string' ? parseFloat(court.Price).toFixed(2) : '0.00'}
                                  </span>
                                )
                              })()}
                             </td>
                           ))}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 )}
               </div>
            </div>
          )}


          {activeTab === 'Rent a racket' && (
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Equipment rental rates vary by item. Check individual prices below.
              </p>
              {loading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600">Loading equipment...</p>
                </div>
              ) : error ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-red-600">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                  {equipment.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative h-64 sm:h-72 md:h-80 lg:h-84 cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleRacketClick(item.equipment_name)}
                    >
                      <div className={`relative bg-gradient-to-br from-white via-gray-50 to-blue-50 border-2 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 h-full flex flex-col justify-between items-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 group-hover:border-blue-400 group-hover:from-blue-50 group-hover:to-blue-100 ${
                        isRacketBooked(item.equipment_name) ? 'border-green-500 ring-4 ring-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-green-200' : 'border-gray-200 hover:border-blue-400'
                      }`}>
                        
                        {/* Equipment Image Container - Mobile Responsive */}
                        <div className="flex-1 flex items-center justify-center w-full mb-2 sm:mb-4 relative">
                          <div className="relative group/image">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                            <div className="relative w-full h-16 sm:h-20 md:h-24 lg:h-32 bg-white rounded-lg shadow-sm overflow-hidden">
                              <img
                                src={`${item.image_path || "/assets/img/equipments/racket-black-red.png"}?v=${Date.now()}`}
                                alt={item.equipment_name}
                                className="w-full h-full object-contain object-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-2"
                                style={{
                                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                                  background: 'transparent'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Equipment Info - Mobile Responsive */}
                        <div className="w-full text-center space-y-2 sm:space-y-3">
                          <h3 className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-all duration-300 transform group-hover:scale-105">
                            {item.equipment_name}
                          </h3>
                          
                          {/* Stock Status - Mobile Responsive */}
                          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              item.stocks > 0 ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-red-500 shadow-red-200 shadow-lg'
                            }`}></div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {item.stocks > 0 ? `${item.stocks} available` : 'Out of stock'}
                            </p>
                          </div>
                          
                          {/* Enhanced Price Display - Mobile Responsive */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 border border-blue-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <p className="text-xs sm:text-sm md:text-base font-bold text-blue-600 group-hover:text-blue-700">
                              ₱{item.price}/hour
                            </p>
                          </div>
                        </div>
                        
                        {/* Selection Indicator - Mobile Responsive */}
                        {isRacketBooked(item.equipment_name) && (
                          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-green-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
                            Selected
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Booking details' && (
            <div>
              {/* Court Bookings */}
              {courtBookings.length > 0 && (
                <div className="mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Court</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Schedule</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Sub total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courtBookings.map((booking, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{booking.court}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.schedule}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Equipment Bookings */}
              {equipmentBookings.length > 0 && (
                <div className="mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Equipment</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Sub total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipmentBookings.map((booking, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{booking.equipment}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.time}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2">₱{booking.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            </div>
          )}

              {/* Total */}
              <div className="text-right mb-6">
                <span className="text-lg font-bold">TOTAL: ₱{totalAmount.toFixed(2)}</span>
              </div>

              {/* Notes */}
              <div className="p-4 border border-red-300 bg-red-50 rounded-lg mb-4">
                <p className="text-red-600 font-medium mb-2">Note: Payment, Refund & Cancellation</p>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  <li>Pay the given price in order to make reservation.</li>
                  <li>Strictly "No Cancellation and refund policy" once you reserved a court there is no cancellation.</li>
                </ul>
              </div>

              </div>
          )}

               {/* Proceed and Back Buttons */}
               <div className="flex justify-center space-x-4 mt-8">
                <button
                   onClick={() => handleBackToStep(1)}
                   className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                   </svg>
                  Back
                </button>
                <button
                  onClick={() => setShowBookingDetailsModal(true)}
                   className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                   Proceed to Payment
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Payment Method</h2>
              <p className="text-gray-600 mb-8">Choose your preferred payment method</p>
              <div className="text-gray-500 mb-8">
                <p>Payment method selection will be implemented here</p>
              </div>
              
              {/* Back and Proceed Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleBackToStep(2)}
                  className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleProceedToPayment}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Transaction Completed</h2>
              <p className="text-gray-600 mb-8">Your booking has been successfully processed</p>
              <div className="text-gray-500">
                <p>Booking confirmation details will be shown here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={handleCloseTerms}
        onAccept={handleAcceptTerms}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={showBookingDetailsModal}
        onClose={() => setShowBookingDetailsModal(false)}
        onProceedToPayment={() => setCurrentStep(3)}
        courtBookings={courtBookings}
        equipmentBookings={equipmentBookings}
        totalAmount={totalAmount}
        selectedDate={selectedDate}
      />

      {/* Racket Details Modal */}
      <RacketDetailsModal
        isOpen={showRacketDetailsModal}
        onClose={handleRacketDetailsClose}
        onSelect={handleRacketDetailsSelect}
        racket={selectedRacket}
      />

      {/* Racket Configuration Modal */}
      <RacketConfigModal
        isOpen={showRacketConfigModal}
        onClose={handleRacketConfigClose}
        onConfirm={handleRacketConfigConfirm}
        racket={selectedRacket}
      />
    </div>
  )
}


