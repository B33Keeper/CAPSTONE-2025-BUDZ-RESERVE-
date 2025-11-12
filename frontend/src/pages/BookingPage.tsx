
import { useState, useEffect } from 'react'
import { apiServices, Court, Equipment, TimeSlot } from '@/lib/apiServices'
import { TermsAndConditionsModal } from '@/components/modals/TermsAndConditionsModal'
import { BookingDetailsModal } from '@/components/modals/BookingDetailsModal'
import { PaymentSummaryStep } from '@/components/PaymentSummaryStep'
import { PaymentService } from '@/lib/paymentService'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface CourtBooking {
  court: string
  schedule: string
  subtotal: number
}

interface EquipmentBooking {
  equipment: string
  time: string
  subtotal: number
    quantity?: number
}

interface CellStatus {
  status: 'available' | 'reserved' | 'maintenance' | 'selected'
}

export function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('')
  const [tempSelectedDate, setTempSelectedDate] = useState('')
  // Default to first sheet, but will be updated when courts are loaded
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
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false)
  const [showEquipmentGuard, setShowEquipmentGuard] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState('')
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  
  const DATE_WINDOW_DAYS = 28
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const selectionWindowEnd = new Date(startOfToday)
  selectionWindowEnd.setDate(selectionWindowEnd.getDate() + (DATE_WINDOW_DAYS - 1))
  const selectionWindowEndLabel = selectionWindowEnd.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const selectionWindowMonthLabel = (() => {
    const startMonth = startOfToday.toLocaleDateString('en-US', { month: 'long' })
    const startYear = startOfToday.getFullYear()
    const endMonth = selectionWindowEnd.toLocaleDateString('en-US', { month: 'long' })
    const endYear = selectionWindowEnd.getFullYear()
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startMonth} ${startYear}`
      }
      return `${startMonth}-${endMonth} ${startYear}`
    }
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`
  })()
  
  const { user } = useAuthStore()

  const resolveApiBaseUrl = () => {
    const explicitBase = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : ''
    if (explicitBase) {
      return explicitBase.replace(/\/api\/?$/, '')
    }
    const envBase = (import.meta.env.VITE_API_URL as string | undefined) || ''
    if (envBase) {
      return envBase.replace(/\/api\/?$/, '')
    }
    return window.location.origin
  }


  // Calculate total amount
  const totalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                     equipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

  const steps = [
    { id: 1, name: 'Select a date', hint: 'Pick your play day' },
    { id: 2, name: 'Select time & court no.', hint: 'Choose slot and court' },
    { id: 3, name: 'Select payment method.', hint: 'Confirm your payment' },
    { id: 4, name: 'Completed', hint: 'Booking finalized' }
  ]

  useEffect(() => {
    if (user?.id) {
      const accepted = localStorage.getItem(`termsAccepted_${user.id}`) === 'true'
      setIsTermsAccepted(accepted)
    } else {
      setIsTermsAccepted(false)
    }
  }, [user?.id])

  const getStepState = (stepId: number): 'completed' | 'current' | 'upcoming' => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  // Calculate number of sheets needed (6 courts per sheet)
  const courtsPerSheet = 6
  const numberOfSheets = Math.ceil(courts.length / courtsPerSheet)
  
  // Generate dynamic sheet tabs
  const sheetTabs = Array.from({ length: numberOfSheets }, (_, i) => `Sheet ${i + 1}`)
  const tabs = [...sheetTabs, 'Rent an racket', 'Booking details']
  
  // Helper function to get courts for a specific sheet
  const getCourtsForSheet = (sheetIndex: number) => {
    const startIndex = sheetIndex * courtsPerSheet
    const endIndex = startIndex + courtsPerSheet
    return courts.slice(startIndex, endIndex)
  }
  
  // Helper function to check if a tab is a sheet tab
  const isSheetTab = (tab: string) => tab.startsWith('Sheet')


  // Generate time slots for display (8 AM to 11 PM)
  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Check if selected date is today
    let isToday = false
    if (selectedDate) {
      const selectedDateObj = parseDateString(selectedDate)
      if (selectedDateObj) {
        const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate())
        isToday = selectedDateOnly.getTime() === today.getTime()
      }
    }
    
    for (let hour = 8; hour < 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`
      
      // If booking for today, filter out past time slots
      if (isToday) {
        // Get the current hour
        const currentHour = now.getHours()
        
        // Calculate the next available hour (always the next hour)
        // If current time is 7:40 PM (hour 19), next slot is 8:00 PM (hour 20)
        // If current time is 8:00 PM (hour 20), next slot is 9:00 PM (hour 21)
        // If current time is 8:01 PM (hour 20), next slot is 9:00 PM (hour 21)
        const nextAvailableHour = currentHour + 1
        
        // Only show slots that start at or after the next available hour
        // This ensures users can only book future time slots, not current or past ones
        if (hour < nextAvailableHour) {
          continue // Skip past time slots
        }
      }
      
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
        
        // Sort courts by ID to ensure proper order
        const sortedCourts = courtsData.sort((a, b) => a.Court_Id - b.Court_Id)
        setCourts(sortedCourts)
        setEquipment(equipmentData)
        setTimeSlots(timeSlotsData)
        
        // Ensure activeTab is valid if it's a sheet tab
        if (activeTab.startsWith('Sheet')) {
          const sheetNumber = parseInt(activeTab.replace('Sheet ', ''))
          const totalSheets = Math.ceil(sortedCourts.length / 6)
          if (sheetNumber > totalSheets || totalSheets === 0) {
            setActiveTab('Sheet 1')
          }
        }
        
        // Debug: Log equipment data to see image_path values
        console.log('Equipment data loaded:', equipmentData)
        equipmentData.forEach((item, index) => {
          console.log(`Equipment ${index + 1}:`, {
            name: item.equipment_name,
            image_path: item.image_path
          })
        })
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
        subtotal: price * racketTime * newQuantity,
        quantity: newQuantity
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
        subtotal: price * newTime * racketQuantity,
        quantity: racketQuantity
      }
      setEquipmentBookings(prev => {
        const filtered = prev.filter(booking => booking.equipment !== racketName)
        return [...filtered, newBooking]
      })
    }
  }


  // Visual state helper for table cells (keeps original colors)
  const formatCurrency = (value: number | string) => {
    const amount = Number(value)
    if (Number.isNaN(amount)) return value
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const parseDateString = (dateString: string): Date | null => {
    if (!dateString) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const parsed = new Date(dateString)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }

    return null
  }

  const getDateDisplayDetails = (dateString: string) => {
    if (!dateString) return null

    const dateObj = parseDateString(dateString)
    if (!dateObj) return null

    return {
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      formattedDate: dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  type CellDisplayState = 'available' | 'selected' | 'reserved' | 'maintenance' | 'unavailable'

  const deriveCellDisplayState = (cellStatus: CellStatus['status'], courtStatus?: string): CellDisplayState => {
    if (courtStatus === 'Maintenance') return 'maintenance'
    if (courtStatus === 'Unavailable') return 'unavailable'
    if (cellStatus === 'maintenance') return 'maintenance'
    if (cellStatus === 'selected') return 'selected'
    if (cellStatus === 'reserved') return 'reserved'
    return 'available'
  }

  const cellDisplayConfig: Record<
    CellDisplayState,
    {
      containerClass: string
      priceClass: string
      helperText: string
      helperClass: string
      badge: { text: string; className: string; icon: JSX.Element }
    }
  > = {
    available: {
      containerClass:
        'border border-slate-200 bg-white text-gray-900 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg cursor-pointer',
      priceClass: 'text-base sm:text-lg font-semibold text-gray-900',
      helperText: 'Per hour rate',
      helperClass: 'text-[10px] sm:text-xs font-medium text-slate-500',
      badge: {
        text: 'Tap to reserve',
        className: 'bg-slate-100 text-slate-700 border border-slate-200 shadow-sm',
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )
      }
    },
    selected: {
      containerClass:
        'border border-emerald-300 bg-emerald-50/80 text-emerald-900 shadow-inner ring-2 ring-emerald-400 cursor-pointer',
      priceClass: 'text-base sm:text-lg font-semibold text-emerald-700',
      helperText: 'Tap again to remove',
      helperClass: 'text-[10px] sm:text-xs font-medium text-emerald-600',
      badge: {
        text: 'Selected slot',
        className: 'bg-emerald-200/90 text-emerald-900 border border-emerald-300 shadow-sm',
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )
      }
    },
    reserved: {
      containerClass:
        'border border-gray-500 bg-gray-700 text-white shadow-inner cursor-not-allowed',
      priceClass: 'text-base sm:text-lg font-semibold text-white',
      helperText: 'Already booked',
      helperClass: 'text-[10px] sm:text-xs text-gray-200',
      badge: {
        text: 'Reserved',
        className: 'bg-gray-600 text-white border border-gray-500 shadow-sm',
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 118 0v4" />
          </svg>
        )
      }
    },
    maintenance: {
      containerClass:
        'border border-amber-200 bg-amber-50/90 text-amber-900 cursor-not-allowed',
      priceClass: 'text-base sm:text-lg font-semibold text-amber-800',
      helperText: 'Temporarily unavailable',
      helperClass: 'text-[10px] sm:text-xs text-amber-700',
      badge: {
        text: 'Under maintenance',
        className: 'bg-amber-200/80 text-amber-900 border border-amber-300',
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L2.82 18a1 1 0 00.86 1.5h16.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
            <path d="M12 9v4m0 4h.01" />
          </svg>
        )
      }
    },
    unavailable: {
      containerClass:
        'border border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed',
      priceClass: 'text-base sm:text-lg font-semibold text-slate-600',
      helperText: 'Not bookable',
      helperClass: 'text-[10px] sm:text-xs text-slate-500',
      badge: {
        text: 'Unavailable',
        className: 'bg-slate-200 text-slate-700 border border-slate-300',
        icon: (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
          </svg>
        )
      }
    }
  }

  const renderStatusBadge = (state: CellDisplayState) => {
    const { badge } = cellDisplayConfig[state]
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium ${badge.className}`}>
        {badge.icon}
        <span className="tracking-tight">{badge.text}</span>
      </span>
    )
  }

  const handleDateSelection = (date: string, isAvailable: boolean) => {
    if (!isAvailable) {
      setDateError(`Selected date is outside the available booking window. Please choose a date on or before ${selectionWindowEndLabel}.`)
      return
    }
    
    setDateError('')
    setTempSelectedDate(date)
    
    // Check if user has accepted terms for current session
    if (user?.id) {
      const termsAccepted = localStorage.getItem(`termsAccepted_${user.id}`) === 'true'
      setIsTermsAccepted(termsAccepted)
      if (!termsAccepted) {
        // Show terms modal if not accepted yet
        setShowTermsModal(true)
      }
    } else {
      setIsTermsAccepted(false)
    }
  }

  const handleProceedFromDateSelection = async () => {
    if (!tempSelectedDate) {
      setDateError('Please select a date before proceeding.')
      return
    }

    if (!isTermsAccepted) {
      setDateError('Please accept the Terms and Conditions to proceed.')
      setShowTermsModal(true)
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

  const formatDateToISODate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const dateOptions = Array.from({ length: DATE_WINDOW_DAYS }, (_, index) => {
    const date = new Date(startOfToday)
    date.setDate(startOfToday.getDate() + index)
    return date
  })

  const isRacketBooked = (racket: string) => {
    return equipmentBookings.some(booking => booking.equipment === racket)
  }

  // Handle Terms and Conditions

  const handleAcceptTerms = () => {
    setShowTermsModal(false)
    // Store acceptance in localStorage with user ID to remember for current login session
    if (user?.id) {
      localStorage.setItem(`termsAccepted_${user.id}`, 'true')
    }
    setIsTermsAccepted(true)
    setDateError('')
  }

  // Helper function to parse schedule string to start and end times (24-hour format)
  const parseScheduleToTimes = (schedule: string): { startTime: string; endTime: string } => {
    // Parse schedule like "9:00 am - 10:00 am" or "9:00 AM - 10:00 AM"
    const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i)
    
    if (!timeMatch) {
      throw new Error('Invalid schedule format')
    }

    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch
    
    const convertTo24Hour = (hour: number, period: string, minute: number): string => {
      let h = parseInt(hour.toString())
      if (period.toUpperCase() === 'PM' && h !== 12) {
        h += 12
      } else if (period.toUpperCase() === 'AM' && h === 12) {
        h = 0
      }
      return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
    }

    return {
      startTime: convertTo24Hour(parseInt(startHour), startPeriod, parseInt(startMin)),
      endTime: convertTo24Hour(parseInt(endHour), endPeriod, parseInt(endMin))
    }
  }

  // Helper function to get court ID from court name
  const getCourtIdFromName = (courtName: string): number | null => {
    const court = courts.find(c => c.Court_Name === courtName)
    return court ? court.Court_Id : null
  }

  // Check for duplicate reservations before proceeding to payment
  const checkForDuplicates = async (): Promise<{ isDuplicate: boolean; message: string }> => {
    if (!user || !user.id) {
      return { isDuplicate: false, message: '' }
    }

    if (courtBookings.length === 0) {
      return { isDuplicate: false, message: '' }
    }

    // Parse selected date to YYYY-MM-DD format
    const dateObj = parseDateString(selectedDate)
    if (!dateObj) {
      console.error('Invalid selected date format', selectedDate)
      return { isDuplicate: false, message: '' }
    }
    const formattedDate = dateObj.toISOString().split('T')[0]

    // Check each court booking for duplicates
    for (const booking of courtBookings) {
      const courtId = getCourtIdFromName(booking.court)
      if (!courtId) {
        continue
      }

      try {
        const { startTime, endTime } = parseScheduleToTimes(booking.schedule)
        
        const response = await api.post('/reservations/check-duplicate', {
          courtId,
          date: formattedDate,
          startTime,
          endTime
        })

        if (response.data.isDuplicate) {
          return {
            isDuplicate: true,
            message: response.data.message || `You have already booked ${booking.court} for ${selectedDate} at ${booking.schedule}.`
          }
        }
      } catch (error: any) {
        console.error('Error checking duplicate:', error)
        // Continue checking other bookings on error
      }
    }

    return { isDuplicate: false, message: '' }
  }

  // Handle actual payment processing from step 3
  const handleProcessPayment = async (userInfo: { name: string; email: string; contactNumber: string }) => {
    try {
      // Check for duplicate reservations first
      const duplicateCheck = await checkForDuplicates()
      if (duplicateCheck.isDuplicate) {
        setDuplicateMessage(duplicateCheck.message)
        setShowDuplicateModal(true)
        return // Stop payment process
      }

      // Generate reference number if not already set
      if (!referenceNumber) {
        const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(refNumber)
      }

      // Calculate total amount
      const courtTotal = courtBookings.reduce((sum, booking) => sum + booking.subtotal, 0)
      const equipmentTotal = equipmentBookings.reduce((sum, booking) => sum + booking.subtotal, 0)
      const calculatedTotalAmount = courtTotal + equipmentTotal

      // Prepare booking data for metadata
      const bookingData = {
        userId: user?.id || 1, // Use user from auth context
        selectedDate,
        courtBookings: courtBookings.map(booking => ({
          court: booking.court,
          schedule: booking.schedule,
          subtotal: booking.subtotal
        })),
        equipmentBookings: equipmentBookings.map(booking => ({
          equipment: booking.equipment,
          time: booking.time,
          subtotal: booking.subtotal,
          quantity: booking.quantity || 1
        })),
        referenceNumber: referenceNumber || Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
      }

      // Create checkout session with PayMongo
      const checkoutResponse = await PaymentService.createCheckout(
        calculatedTotalAmount,
        `Badminton Court Booking - ${selectedDate}`,
        userInfo,
        bookingData
      )

      if (checkoutResponse.success && checkoutResponse.data) {
        // Redirect to Paymongo's hosted checkout page
        if (checkoutResponse.data.checkoutUrl) {
          window.location.href = checkoutResponse.data.checkoutUrl
        } else {
          alert(`Payment setup failed: No checkout URL provided`)
        }
      } else {
        alert(`Payment setup failed: ${checkoutResponse.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment processing failed. Please try again.')
    }
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
      
      {/* Step Counter */}
      <div className="bg-gradient-to-r from-slate-100 via-white to-slate-100 px-4 py-5 sm:px-6">
        <ol className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {steps.map((step, index) => {
            const state = getStepState(step.id)
            const isLast = index === steps.length - 1
            const isCompleted = state === 'completed'
            const isCurrent = state === 'current'

            const stateStyles: Record<typeof state, {
              circle: string
              title: string
              hint: string
              icon?: JSX.Element
            }> = {
              completed: {
                circle: 'bg-emerald-500 text-white shadow-md shadow-emerald-200',
                title: 'text-emerald-600',
                hint: 'text-emerald-500',
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )
              },
              current: {
                circle: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
                title: 'text-blue-700',
                hint: 'text-blue-500'
              },
              upcoming: {
                circle: 'bg-white text-slate-400 border border-slate-200',
                title: 'text-slate-500',
                hint: 'text-slate-400'
              }
            }
            
            const styles = stateStyles[state]

            return (
              <li key={step.id} className="flex flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 sm:h-10 sm:w-10 ${styles.circle}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {styles.icon ?? step.id}
                </div>
                  <div>
                    <p className={`text-sm font-semibold tracking-tight sm:text-base whitespace-nowrap ${styles.title}`}>{step.name}</p>
                    <p className={`text-xs font-medium sm:text-sm whitespace-nowrap ${styles.hint}`}>{step.hint}</p>
              </div>
          </div>

                {!isLast && (
                  <div className="ml-12 hidden flex-1 sm:flex">
                    <div
                      className={`h-1 w-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-300' : isCurrent ? 'bg-blue-400' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                )}

                {/* Mobile connector */}
                {!isLast && (
                  <div
                    className={`ml-4 h-8 w-px self-stretch sm:hidden ${
                      isCompleted ? 'bg-emerald-200' : isCurrent ? 'bg-blue-200' : 'bg-slate-200'
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>
        </div>

      {/* Main Content */}
      <div className="p-6">
         <div className="bg-white rounded-lg shadow-lg p-6 mx-auto" style={{ maxWidth: 'calc(72rem + 400px)' }}>
          {currentStep === 1 && (
             <>
               {/* Date Selection Header */}
               <div className="bg-gray-600 text-white px-6 py-4 rounded-t-lg -mx-6 -mt-6 mb-6 shadow">
                 <h2 className="text-base sm:text-lg font-semibold">Select from the available dates below</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Choose a date to proceed to court and time selection
                </p>
               </div>
               
              {/* Rolling Date Selection */}
              <div className="bg-white rounded-lg ring-1 ring-gray-200 p-4 sm:p-6">
                <div className="mb-4 text-center">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">
                    Upcoming {DATE_WINDOW_DAYS} days
                  </span>
                  <span className="mt-1 block text-lg sm:text-xl font-bold text-gray-800 tracking-tight">
                    {selectionWindowMonthLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
                  {dateOptions.map((date) => {
                    const isoDate = formatDateToISODate(date)
                    const isSelected = tempSelectedDate === isoDate
                    const isToday = date.toDateString() === today.toDateString()
                    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
                    
                    return (
                      <button
                        key={isoDate}
                        type="button"
                        onClick={() => handleDateSelection(isoDate, true)}
                        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-4 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-orange-200 bg-white text-gray-900 shadow-sm hover:border-orange-400 hover:-translate-y-1 hover:shadow-lg'
                        }`}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                          {monthLabel}
                        </span>
                        <span className="text-2xl sm:text-3xl font-bold leading-none mt-1">
                          {date.getDate()}
                        </span>
                        <span className="mt-1 text-xs sm:text-sm font-medium text-gray-500">
                          {dayOfWeek}
                        </span>
                        {isToday && (
                          <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                            Today
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
               
               {/* Error Message */}
               {dateError && (
                 <div className="mt-4 p-4 bg-red-50 ring-1 ring-red-200 text-red-700 rounded-lg">
                   {dateError}
                 </div>
               )}

               {/* Proceed Button for Step 1 */}
               <div className="text-center mt-6">
                 <button 
                   onClick={handleProceedFromDateSelection}
                   className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-medium">Select from the available time and court:</h2>
                  
                  {/* Tabs inside the header container */}
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
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

          {/* Selected Date */}
          <div className="mb-6 flex justify-center">
            {(() => {
              const selectedDateDetails = getDateDisplayDetails(selectedDate)
                    const dayLabel = selectedDateDetails?.dayName ?? null
              const formattedDate = selectedDateDetails?.formattedDate ?? selectedDate
                    const dayInitial = (dayLabel ?? selectedDate).charAt(0) || 'D'

              return (
                <div className="flex max-w-lg flex-col gap-3 rounded-2xl border border-blue-200 bg-white/90 px-5 py-4 text-center shadow-[0_20px_45px_-20px_rgba(37,99,235,0.45)] ring-1 ring-blue-100 backdrop-blur">
                  <div className="flex items-center justify-center gap-3 text-blue-600">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4" />
                        <path d="M8 2v4" />
                        <path d="M3 10h18" />
                        <path d="M9.5 16.5l1.5 1.5 4-4" />
                      </svg>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
                      Selected Date
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">
                    <span className="mr-2 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {dayLabel || dayInitial}
                    </span>
                    {formattedDate}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Content based on active tab */}
          {isSheetTab(activeTab) && (() => {
            const sheetIndex = parseInt(activeTab.replace('Sheet ', '')) - 1
            const sheetCourts = getCourtsForSheet(sheetIndex)
            
            return (
              <div>
                {/* Legend */}
                <div className="mb-6 flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="font-medium text-gray-700">Available</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-500 bg-gray-700 px-3 py-1.5 text-white shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-600 text-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <span className="font-medium">Reserved</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500 bg-yellow-300 px-3 py-1.5 text-black shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-yellow-900">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 3h2l.4 2M5 7h14l1 5H4l1-5z" />
                        <path d="M7 13v6h10v-6" />
                        <path d="M10 17h4" />
                      </svg>
                    </span>
                    <span className="font-medium">Maintenance</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-green-200 px-3 py-1.5 text-gray-900 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 17l5 3-1.9-5.9L19 9l-6-.2L12 3l-1 5.8L5 9l3.9 5.1L7 20z" />
                      </svg>
                    </span>
                    <span className="font-medium">Selected</span>
                  </div>
                </div>

                {/* Mobile-friendly cards */}
                <div className="sm:hidden space-y-4">
                  {generateTimeSlots().map((timeSlot) => (
                    <div key={timeSlot.id} className="rounded-lg ring-1 ring-gray-200 overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 text-sm font-medium text-slate-700">{timeSlot.display}</div>
                      <div className="grid grid-cols-2 gap-2 p-3">
                        {sheetCourts.map((court) => {
                          const slotStatus = getCellStatus(court.Court_Id, timeSlot.display).status
                          const displayState = deriveCellDisplayState(slotStatus, court.Status)
                          const config = cellDisplayConfig[displayState]
                          const canInteract = displayState === 'available' || displayState === 'selected'
                          const ariaLabel = `${court.Court_Name} at ${timeSlot.display} - ${config.badge.text}`

                        return (
                          <button
                            key={`${timeSlot.id}-${court.Court_Id}`}
                            type="button"
                              aria-pressed={displayState === 'selected'}
                              aria-label={ariaLabel}
                              disabled={!canInteract}
                              onClick={() => canInteract && handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, court.Price)}
                              className={`flex flex-col gap-2 rounded-xl px-3 py-3 text-left text-xs transition-all duration-200 ${config.containerClass} disabled:cursor-not-allowed disabled:opacity-85 disabled:shadow-none disabled:transform-none ${
                                canInteract ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 active:scale-[0.99]' : 'opacity-95'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-900">{court.Court_Name}</span>
                                {renderStatusBadge(displayState)}
                              </div>
                              <div className="flex items-end justify-between gap-2">
                                <span className={config.priceClass}>{formatCurrency(court.Price)}</span>
                                <span className={config.helperClass}>{config.helperText}</span>
                              </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Court Selection Table (Tablet/Desktop) */}
              <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-gray-200 shadow-sm">
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
                  <table className="w-full border-collapse" role="grid">
                     <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-blue-50 via-white to-blue-50 text-slate-700">
                        <th className="border border-gray-200 px-4 py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800 sticky left-0 z-10 bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-inner">
                          Time
                        </th>
                         {sheetCourts.map((court) => (
                          <th
                            key={court.Court_Id}
                            className="border border-gray-200 px-3 py-4 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 bg-white/70 backdrop-blur-sm"
                          >
                             {court.Court_Name}
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody>
                      {generateTimeSlots().map((timeSlot) => (
                        <tr key={timeSlot.id} className="transition-colors even:bg-gray-50/80 hover:bg-blue-50/40">
                          <td className="sticky left-0 z-10 border border-gray-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 shadow-inner shadow-blue-100">
                            <div className="flex items-center gap-2 text-blue-900">
                              <svg className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l3 3" />
                              </svg>
                              <span className="tracking-wide">{timeSlot.display}</span>
                            </div>
                          </td>
                          {sheetCourts.map((court) => {
                            const slotStatus = getCellStatus(court.Court_Id, timeSlot.display).status
                            const displayState = deriveCellDisplayState(slotStatus, court.Status)
                            const config = cellDisplayConfig[displayState]
                            const canInteract = displayState === 'available' || displayState === 'selected'
                            const ariaLabel = `${court.Court_Name} at ${timeSlot.display} - ${config.badge.text}`

                            return (
                             <td
                               key={`${timeSlot.display}-${court.Court_Id}`}
                                className="border border-gray-200 px-1 sm:px-2 md:px-3 py-3 text-center align-middle"
                              >
                                <button
                                  type="button"
                                  aria-label={ariaLabel}
                                  aria-pressed={displayState === 'selected'}
                                  disabled={!canInteract}
                                  onClick={() =>
                                    canInteract && handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, court.Price)
                                  }
                                  className={`group flex w-full flex-col items-center gap-2 rounded-xl px-3 py-3 text-[10px] font-medium transition-all duration-200 sm:text-xs ${config.containerClass} disabled:cursor-not-allowed disabled:opacity-85 disabled:shadow-none disabled:transform-none ${
                                    canInteract
                                      ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1'
                                      : 'opacity-95'
                                  }`}
                                >
                                  <span className="sr-only">{court.Court_Name}</span>
                                  <span className={config.priceClass}>{formatCurrency(court.Price)}</span>
                                  <span className={config.helperClass}>{config.helperText}</span>
                                  {renderStatusBadge(displayState)}
                                </button>
                             </td>
                            )
                          })}
                         </tr>
                       ))}
                     </tbody>
                     <tfoot>
                      <tr className="bg-gradient-to-r from-blue-50 via-white to-blue-50 text-slate-700">
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-700">
                          Time
                        </th>
                        {sheetCourts.map((court) => (
                          <th
                            key={`footer-${court.Court_Id}`}
                            className="border border-gray-200 px-3 py-3 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 bg-white/70 backdrop-blur-sm"
                          >
                            {court.Court_Name}
                          </th>
                        ))}
                      </tr>
                    </tfoot>
                   </table>
                 )}
               </div>
              </div>
            )
          })()}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {equipment.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative h-80 sm:h-72 md:h-80 lg:h-84 cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleRacketClick(item.equipment_name)}
                    >
                    {/* Flip Card Container */}
                      <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                        flippedCards.has(item.equipment_name) ? 'rotate-y-180' : ''
                      }`}>
                        {/* Front of Card */}
                        <div className="absolute inset-0 w-full h-full backface-hidden">
                          <div className={`relative bg-gradient-to-br from-white via-gray-50 to-blue-50 border-2 rounded-2xl p-3 sm:p-4 md:p-6 h-full flex flex-col justify-between items-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 group-hover:border-blue-400 group-hover:from-blue-50 group-hover:to-blue-100 ${
                            isRacketBooked(item.equipment_name) ? 'border-green-500 ring-4 ring-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-green-200' : 'border-gray-200 hover:border-blue-400'
                          }`}>
                            {/* Premium Badge */}
                            {item.stocks > 5 && (
                              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                Popular
                              </div>
                            )}
                            
                            {/* Stock Badge */}
                            {item.stocks > 0 && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-bounce">
                                {item.stocks}
                              </div>
                            )}
                            
                            {/* Equipment Image Container */}
                            <div className="flex-1 flex items-center justify-center w-full mb-4 relative">
                              <div className="relative group/image">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                                <div className="relative w-full h-20 sm:h-24 md:h-32 bg-white rounded-lg shadow-sm overflow-hidden">
                            <img
                              src={(() => {
                                const baseUrl = resolveApiBaseUrl()
                                if (item.image_path) {
                                  if (item.image_path.startsWith('http')) {
                                    return item.image_path
                                  }
                                  const normalizedPath = item.image_path.startsWith('/')
                                    ? item.image_path
                                    : `/${item.image_path}`
                                  return `${baseUrl}${normalizedPath}`
                                }
                                return '/assets/img/equipments/racket.png'
                              })()}
                              alt={item.equipment_name}
                                    className="w-full h-full object-contain object-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-2"
                                    style={{
                                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                                      background: 'transparent'
                                    }}
                                  />
                                </div>
                                {/* Floating particles effect */}
                                <div className="absolute inset-0 pointer-events-none">
                                  <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                                  <div className="absolute top-4 right-3 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                                  <div className="absolute bottom-3 left-4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Equipment Info */}
                            <div className="w-full text-center space-y-3">
                              <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-all duration-300 transform group-hover:scale-105">
                                {item.equipment_name}
                              </h3>
                              
                              {/* Stock Status with Animation */}
                              <div className="flex items-center justify-center space-x-2">
                                <div className={`w-3 h-3 rounded-full animate-pulse ${
                                  item.stocks > 0 ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-red-500 shadow-red-200 shadow-lg'
                                }`}></div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                                  {item.stocks > 0 ? `${item.stocks} available` : 'Out of stock'}
                                </p>
                              </div>
                              
                              {/* Enhanced Price Display */}
                              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-2 border border-blue-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                                <p className="text-sm sm:text-base font-bold text-blue-600 group-hover:text-blue-700">
                                  ₱{item.price}/hour
                                </p>
                              </div>
                            </div>
                            
                            {/* Enhanced Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
                                <div className="bg-white rounded-full p-3 shadow-xl border-2 border-blue-200">
                                  <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            
                            {/* Selection Indicator */}
                            {isRacketBooked(item.equipment_name) && (
                              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                Selected
                              </div>
                            )}
                          </div>
                        </div>
                      
                      {/* Back of Card (Configuration) */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 md:p-6 h-full flex flex-col justify-center items-center shadow-lg">
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
                  onClick={() => {
                    if (courtBookings.length === 0 && equipmentBookings.length > 0) {
                      setShowEquipmentGuard(true)
                      return
                    }
                    setShowBookingDetailsModal(true)
                  }}
                   className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                   Proceed to Payment
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <PaymentSummaryStep
              courtBookings={courtBookings.map(booking => ({
                courtName: booking.court,
                timeSlot: booking.schedule,
                subtotal: booking.subtotal
              }))}
              equipmentBookings={equipmentBookings.map(booking => ({
                courtName: booking.equipment,
                timeSlot: booking.time,
                subtotal: booking.subtotal
              }))}
              totalAmount={totalAmount}
              selectedDate={selectedDate}
              referenceNumber={referenceNumber}
              onBack={() => handleBackToStep(2)}
              onProceedToPayment={handleProcessPayment}
            />
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
        initialAccepted={isTermsAccepted}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={showBookingDetailsModal}
        onClose={() => setShowBookingDetailsModal(false)}
        onProceedToPayment={() => {
          if (courtBookings.length === 0 && equipmentBookings.length > 0) {
            setShowEquipmentGuard(true)
            return
          }
          // Generate reference number when proceeding to payment step
          const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
          setReferenceNumber(refNumber)
          setCurrentStep(3)
        }}
        courtBookings={courtBookings}
        equipmentBookings={equipmentBookings}
        totalAmount={totalAmount}
        selectedDate={selectedDate}
      />

      {/* Guard Modal: require court before equipment */}
      {showEquipmentGuard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4 font-semibold">Action needed</div>
            <div className="p-6 space-y-3">
              <p className="text-gray-800 font-medium">Please book a court before renting equipment.</p>
              <p className="text-gray-600 text-sm">Select a date and time slot for a court first, then you can add racket rentals.</p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowEquipmentGuard(false)} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Got it</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Reservation Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-4 font-semibold flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Duplicate Reservation Detected</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">Unable to Process Reservation</p>
                  <p className="text-gray-600 text-sm">
                    {duplicateMessage || 'You have already booked a court for the same date and time. Please choose a different date, time, or court.'}
                  </p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> To avoid duplicate bookings, you cannot book the same court for the same date and time slot again.
                </p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowDuplicateModal(false)} 
                  className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


