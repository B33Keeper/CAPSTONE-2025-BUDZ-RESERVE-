
import { useState, useEffect } from 'react'
import { apiServices, Court, Equipment, TimeSlot } from '@/lib/apiServices'
import { TermsAndConditionsModal } from '@/components/modals/TermsAndConditionsModal'

interface CourtBooking {
  court: string
  schedule: string
  subtotal: number
}

interface EquipmentBooking {
  equipment: string
  time: string
  subtotal: number
}

interface CellStatus {
  status: 'available' | 'reserved' | 'maintenance' | 'selected'
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
  const [racketQuantity, setRacketQuantity] = useState(0)
  const [racketTime, setRacketTime] = useState(1)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilityData, setAvailabilityData] = useState<Map<number, any[]>>(new Map())
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)


  // Calculate total amount
  const totalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                     equipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

  const steps = [
    { id: 1, name: 'Select a date', active: currentStep === 1 },
    { id: 2, name: 'Select time & court no.', active: currentStep === 2 },
    { id: 3, name: 'Select payment method.', active: currentStep === 3 },
    { id: 4, name: 'completed', active: currentStep === 4 },
  ]

  const tabs = ['Sheet 1', 'Sheet 2', 'Rent an racket', 'Booking details']


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
      
      slots.push({
        id: hour,
        start_time: startTime,
        end_time: endTime,
        display: `${formatTime(startTime)} - ${formatTime(endTime)}`
      })
    }
    return slots
  }

  // Load data from database
  useEffect(() => {
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
    
    // Don't allow clicking on reserved or maintenance cells
    if (currentStatus.status === 'reserved' || currentStatus.status === 'maintenance') {
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

  const getCellClassName = (courtId: number, time: string, courtStatus?: string): string => {
    const status = getCellStatus(courtId, time)
    
    // Check if court is unavailable or under maintenance from database
    if (courtStatus === 'Unavailable' || courtStatus === 'Maintenance') {
      return courtStatus === 'Maintenance' 
        ? 'bg-yellow-400 text-black cursor-not-allowed'
        : 'bg-gray-400 text-white cursor-not-allowed'
    }
    
    switch (status.status) {
      case 'reserved':
        return 'bg-gray-800 text-white cursor-not-allowed'
      case 'maintenance':
        return 'bg-yellow-400 text-black cursor-not-allowed'
      case 'selected':
        return 'bg-green-300 text-black cursor-pointer'
      case 'available':
      default:
        return 'bg-white text-black cursor-pointer hover:bg-green-100'
    }
  }

  const handleRacketClick = (racketName: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(racketName)) {
        newSet.delete(racketName)
      } else {
        newSet.add(racketName)
      }
      return newSet
    })
  }

  const handleRacketQuantityChange = (racketName: string, newQuantity: number) => {
    setRacketQuantity(newQuantity)
    
    // Find the equipment to get its price
    const equipmentItem = equipment.find(eq => eq.equipment_name === racketName)
    const price = Number(equipmentItem?.price) || 100 // Default to 100 if not found
    
    if (newQuantity === 0) {
      // Remove from bookings if quantity is 0
      setEquipmentBookings(prev => prev.filter(booking => booking.equipment !== racketName))
      setFlippedCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(racketName)
        return newSet
      })
    } else {
      // Add or update booking
      const newBooking: EquipmentBooking = {
        equipment: racketName,
        time: `${racketTime} hr`,
        subtotal: price * racketTime * newQuantity
      }
      setEquipmentBookings(prev => {
        const filtered = prev.filter(booking => booking.equipment !== racketName)
        return [...filtered, newBooking]
      })
    }
  }

  const handleRacketTimeChange = (racketName: string, newTime: number) => {
    setRacketTime(newTime)
    
    // Find the equipment to get its price
    const equipmentItem = equipment.find(eq => eq.equipment_name === racketName)
    const price = Number(equipmentItem?.price) || 100 // Default to 100 if not found
    
    // Update existing booking with new time
    if (racketQuantity > 0) {
      const newBooking: EquipmentBooking = {
        equipment: racketName,
        time: `${newTime} hr`,
        subtotal: price * newTime * racketQuantity
      }
      setEquipmentBookings(prev => {
        const filtered = prev.filter(booking => booking.equipment !== racketName)
        return [...filtered, newBooking]
      })
    }
  }

  const handleDateSelection = (date: string, isAvailable: boolean) => {
    if (!isAvailable) {
      setDateError('Cannot select a past date. Please choose a current or future date.')
      return
    }
    
    setDateError('')
    setTempSelectedDate(date)
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
    setCurrentStep(3) // Move to payment step
  }

  const handleCloseTerms = () => {
    setShowTermsModal(false)
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
      `}</style>
      
      {/* Step Counter */}
      <div className="bg-gray-200 px-6 py-4">
        <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.active ? 'bg-blue-600 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                {step.id}
                </div>
              <span className={`ml-2 text-sm ${
                step.active ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                    {step.name}
              </span>
                {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.active ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
                )}
              </div>
            ))}
          </div>
        </div>

      {/* Main Content */}
      <div className="p-6">
         <div className="bg-white rounded-lg shadow-lg p-6 mx-auto" style={{ maxWidth: 'calc(72rem + 400px)' }}>
          {currentStep === 1 && (
             <>
               {/* Date Selection Header */}
               <div className="bg-gray-600 text-white px-4 py-2 rounded-t-lg -mx-6 -mt-6 mb-6">
                 <h2 className="text-lg font-medium">Select from the available dates below:</h2>
               </div>
               
               {/* Month Selector */}
               <div className="flex items-center justify-center mb-6">
                 <button
                   onClick={goToPreviousMonth}
                   className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={(() => {
                     const today = new Date()
                     const currentYear = today.getFullYear()
                     const currentMonth = today.getMonth()
                     return selectedMonth.year <= currentYear && selectedMonth.month <= currentMonth
                   })()}
                 >
                   <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                   </svg>
                 </button>
                 
                 <div className="mx-6 text-center">
                   <h3 className="text-xl font-semibold text-gray-900">
                     {new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', { 
                       month: 'long', 
                       year: 'numeric' 
                     })}
                   </h3>
                 </div>
                 
                 <button
                   onClick={goToNextMonth}
                   className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                 >
                   <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </button>
               </div>
               
               {/* Date Selection Grid - Clean Layout */}
               <div className="grid grid-cols-7 gap-2 mb-6">
                 {/* Day Headers */}
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                   <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                     {day}
                   </div>
                 ))}
                 
                 {/* Calendar Days */}
                 {(() => {
                   const firstDayOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1)
                   const lastDayOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0)
                   const firstDayWeekday = firstDayOfMonth.getDay()
                   const daysInMonth = lastDayOfMonth.getDate()
                   
                   const calendarDays = []
                   
                   // Add empty cells for days before the first day of the month
                   for (let i = 0; i < firstDayWeekday; i++) {
                     calendarDays.push(
                       <div key={`empty-${i}`} className="p-2"></div>
                     )
                   }
                   
                   // Add days of the month
                   for (let day = 1; day <= daysInMonth; day++) {
                     const date = new Date(selectedMonth.year, selectedMonth.month, day)
                     const today = new Date()
                     const isPast = date < today
                     const isAvailable = !isPast
                     
                     const monthName = new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', { month: 'long' })
                     const dateString = `${monthName} ${day}, ${selectedMonth.year}`
                     const isSelected = tempSelectedDate === dateString
                     
                     calendarDays.push(
                       <div
                         key={day}
                         className={`p-2 text-center cursor-pointer rounded-lg transition-colors ${
                           isSelected
                             ? 'bg-green-500 text-white font-semibold'
                             : isAvailable
                             ? 'hover:bg-blue-100 text-gray-900'
                             : 'text-gray-400 cursor-not-allowed'
                         }`}
                         onClick={() => {
                           if (isAvailable) {
                             handleDateSelection(dateString, true)
                           }
                         }}
                       >
                         <div className="text-sm">{day}</div>
                       </div>
                     )
                   }
                   
                   return calendarDays
                 })()}
               </div>
               
               {/* Error Message */}
               {dateError && (
                 <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                   <div className="flex items-center">
                     <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                     </svg>
                     {dateError}
                   </div>
               </div>
               )}

               {/* Proceed Button for Step 1 */}
               <div className="text-center mt-8">
                 <button 
                   onClick={handleProceedFromDateSelection}
                   className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={!tempSelectedDate}
                 >
                   Proceed
                 </button>
               </div>
             </>
           )}

          {currentStep === 2 && (
            <>
              {/* Section Header with Tabs inside */}
              <div className="bg-gray-600 text-white px-4 py-2 rounded-t-lg -mx-6 -mt-6 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Select from the available time and court:</h2>
                  
                  {/* Tabs inside the header container */}
                  <div className="flex space-x-1">
                    {tabs.map((tab) => (
                 <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
                          activeTab === tab
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tab}
                 </button>
                    ))}
                  </div>
                </div>
              </div>

          {/* Selected Date */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold">Selected date: {selectedDate}</p>
        </div>

          {/* Content based on active tab */}
          {activeTab === 'Sheet 1' && (
            <div>
              {/* Legend */}
              <div className="flex justify-center space-x-6 mb-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-600 mr-2"></div>
                  <span>Reserved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-300 mr-2"></div>
                  <span>Selected</span>
                </div>
              </div>

               {/* Court Selection Table */}
               <div className="overflow-x-auto">
                 {loading ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-2 text-gray-600">Loading courts...</p>
                   </div>
                 ) : error ? (
                   <div className="text-center py-8">
                     <p className="text-red-600">{error}</p>
                     <button 
                       onClick={() => window.location.reload()} 
                       className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                     >
                       Retry
                     </button>
                   </div>
                 ) : loadingAvailability ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-2 text-gray-600">Loading availability data...</p>
                   </div>
                 ) : (
                   <table className="w-full border-collapse">
                     <thead>
                       <tr className="bg-gray-100">
                         <th className="border border-gray-300 px-4 py-2 text-left">TIME</th>
                         {courts.slice(0, 6).map((court) => (
                           <th key={court.Court_Id} className="border border-gray-300 px-4 py-2 text-center">
                             {court.Court_Name}
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody>
                       {generateTimeSlots().map((timeSlot) => (
                         <tr key={timeSlot.id}>
                           <td className="border border-gray-300 px-4 py-2 font-medium">{timeSlot.display}</td>
                           {courts.slice(0, 6).map((court) => (
                             <td
                               key={`${timeSlot.display}-${court.Court_Id}`}
                               className={`border border-gray-300 px-4 py-2 text-center ${getCellClassName(court.Court_Id, timeSlot.display, court.Status)}`}
                               onClick={() => court.Status === 'Available' ? handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, court.Price) : undefined}
                             >
                               {court.Price}.00 php
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

          {activeTab === 'Sheet 2' && (
            <div>
              {/* Legend */}
              <div className="flex justify-center space-x-6 mb-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-600 mr-2"></div>
                  <span>Reserved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-300 mr-2"></div>
                  <span>Selected</span>
                </div>
              </div>

              {/* Court Selection Table - Courts 7-12 */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading courts...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : loadingAvailability ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading availability data...</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">TIME</th>
                        {courts.slice(6, 12).map((court) => (
                          <th key={court.Court_Id} className="border border-gray-300 px-4 py-2 text-center">
                            {court.Court_Name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                     <tbody>
                       {generateTimeSlots().map((timeSlot) => (
                         <tr key={timeSlot.id}>
                           <td className="border border-gray-300 px-4 py-2 font-medium">{timeSlot.display}</td>
                           {courts.slice(6, 12).map((court) => (
                             <td
                               key={`${timeSlot.display}-${court.Court_Id}`}
                               className={`border border-gray-300 px-4 py-2 text-center ${getCellClassName(court.Court_Id, timeSlot.display, court.Status)}`}
                               onClick={() => court.Status === 'Available' ? handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, court.Price) : undefined}
                             >
                              {court.Price}.00 php
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

          {activeTab === 'Rent an racket' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Equipment rental rates vary by item. Check individual prices below.
              </p>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading equipment...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {equipment.map((item) => (
                    <div
                      key={item.id}
                      className="relative h-64 cursor-pointer"
                      onClick={() => handleRacketClick(item.equipment_name)}
                    >
                    {/* Flip Card Container */}
                      <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                        flippedCards.has(item.equipment_name) ? 'rotate-y-180' : ''
                      }`}>
                        {/* Front of Card */}
                        <div className="absolute inset-0 w-full h-full backface-hidden">
                          <div className={`bg-white border-2 rounded-lg p-6 h-full flex flex-col justify-center items-center hover:shadow-md transition-shadow ${
                            isRacketBooked(item.equipment_name) ? 'border-green-500' : 'border-gray-300'
                          }`}>
                            <img
                              src={item.image_path || "/assets/img/equipments/racket.png"}
                              alt={item.equipment_name}
                              className="w-full h-28 object-contain mb-3 animate-pulse"
                            />
                            <h3 className="font-medium text-sm mb-2 text-center">{item.equipment_name}</h3>
                            <p className="text-xs text-gray-600">Available stock: {item.stocks}</p>
                            <p className="text-xs text-blue-600 font-medium">₱{item.price}/hour</p>
                          </div>
                        </div>
                      
                      {/* Back of Card (Configuration) */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                        <div className="bg-white border border-gray-300 rounded-lg p-6 h-full flex flex-col justify-center items-center">
                          <div className="space-y-6 w-full">
                            <div className="text-center">
                              <label className="block text-sm font-medium mb-3">Time:</label>
                              <div className="flex items-center justify-center">
                <input
                                  type="number"
                                  value={racketTime}
                                  onChange={(e) => handleRacketTimeChange(item.equipment_name, Number(e.target.value))}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded text-sm text-center"
                                />
                                <span className="ml-2 text-sm">/hr</span>
                              </div>
              </div>
                            <div className="text-center">
                              <label className="block text-sm font-medium mb-3">Quantity:</label>
                              <div className="flex items-center justify-center space-x-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const newQuantity = Math.max(0, racketQuantity - 1)
                                    handleRacketQuantityChange(item.equipment_name, newQuantity)
                                  }}
                                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-12 text-center text-lg font-medium">{racketQuantity}</span>
                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const newQuantity = Math.min(item.stocks, racketQuantity + 1)
                                    handleRacketQuantityChange(item.equipment_name, newQuantity)
                                  }}
                                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                >
                                  +
                </button>
              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
                        <th className="border border-gray-300 px-4 py-2 text-left">Time:</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Sub total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipmentBookings.map((booking, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{booking.equipment}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.time}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            </div>
          )}

              {/* Total */}
              <div className="text-right mb-6">
                <span className="text-lg font-bold">TOTAL: {totalAmount}</span>
              </div>

              {/* Notes */}
              <div className="p-4 border border-red-300 bg-red-50 rounded-lg mb-4">
                <p className="text-red-600 font-medium mb-2">Note: Payment, Refund & Cancellation</p>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  <li>Pay the given price in order to make reservation.</li>
                  <li>Strictly "No Cancellation and refund policy" once you reserved a court there is no cancellation.</li>
                </ul>
              </div>

              {/* Terms and Conditions Link */}
              <div className="text-center mb-4">
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  View Terms and Conditions
                </button>
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
                  onClick={() => setCurrentStep(3)}
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
    </div>
  )
}


