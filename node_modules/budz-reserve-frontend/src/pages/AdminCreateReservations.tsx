import { useState, useEffect, useMemo, useRef, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { apiServices, Court, Equipment, TimeSlot } from '@/lib/apiServices'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'
import toast from 'react-hot-toast'

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

type CellDisplayState = 'available' | 'selected' | 'reserved' | 'maintenance' | 'unavailable'

export default function AdminCreateReservations() {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Create Reservations')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  
  const [selectedDate, setSelectedDate] = useState('')
  const [tempSelectedDate, setTempSelectedDate] = useState('')
  const [activeTab, setActiveTab] = useState('Sheet 1')
  const [racketQuantity, setRacketQuantity] = useState(0)
  const [racketTime, setRacketTime] = useState(1)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState(0) // Step 0: User selection
  const [dateError, setDateError] = useState('')

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

  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([])
  const [equipmentBookings, setEquipmentBookings] = useState<EquipmentBooking[]>([])
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  
  const [courts, setCourts] = useState<Court[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilityData, setAvailabilityData] = useState<Map<number, any[]>>(new Map())
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [showEquipmentGuard, setShowEquipmentGuard] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [isConfirmingQrPayment, setIsConfirmingQrPayment] = useState(false)
  const [qrPaymentConfirmed, setQrPaymentConfirmed] = useState(false)
  const [qrNotes, setQrNotes] = useState('')
  const [recentPaymentMethod, setRecentPaymentMethod] = useState<'cash' | 'qrph' | null>(null)
  const [qrPaymentData, setQrPaymentData] = useState<{
    id: string
    type?: string
    attributes?: {
      qr_image?: string
      notes?: string
      kind?: string
      mobile_number?: string
      [key: string]: any
    }
  } | null>(null)
  
  const navigate = useNavigate()
  const { user: adminUser, logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const totalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                     equipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const normalizedContactNumber = customerContact.replace(/\D/g, '')
  const paymongoMobileNumber = useMemo(() => {
    if (!normalizedContactNumber) return ''
    if (normalizedContactNumber.startsWith('63')) {
      return `+${normalizedContactNumber}`
    }
    if (normalizedContactNumber.startsWith('0')) {
      return `+63${normalizedContactNumber.slice(1)}`
    }
    if (normalizedContactNumber.startsWith('9')) {
      return `+63${normalizedContactNumber}`
    }
    return `+${normalizedContactNumber}`
  }, [normalizedContactNumber])
  const isCustomerDetailsValid =
    customerName.trim().length > 0 &&
    emailRegex.test(customerEmail.trim()) &&
    normalizedContactNumber.length >= 7
  const displayCustomerName = customerName.trim() || 'Walk-in Customer'

  const resetReservationFlow = () => {
    setCustomerName('')
    setCustomerEmail('')
    setCustomerContact('')
    setSelectedDate('')
    setTempSelectedDate('')
    setActiveTab('Sheet 1')
    setCourtBookings([])
    setEquipmentBookings([])
    setSelectedCells(new Set())
    setFlippedCards(new Set())
    setRacketQuantity(0)
    setRacketTime(1)
    setReferenceNumber('')
    setQrNotes('')
    setQrPaymentData(null)
    setQrPaymentConfirmed(false)
    setRecentPaymentMethod(null)
    setCurrentStep(0)
    setDateError('')
    setShowEquipmentGuard(false)
    setIsGeneratingQr(false)
    setIsProcessingPayment(false)
    setIsConfirmingQrPayment(false)
    setLoadingAvailability(false)
    setAvailabilityData(new Map())
  }

  const isQrFlow = recentPaymentMethod === 'qrph'
  const isQrAwaitingConfirmation = isQrFlow && !qrPaymentConfirmed
  const statusBadgeClass = isQrFlow
    ? isQrAwaitingConfirmation
      ? 'bg-white/20 text-yellow-200'
      : 'bg-white/20 text-emerald-200'
    : 'bg-white/20 text-emerald-200'
  const statusBadgeLabel = isQrFlow
    ? isQrAwaitingConfirmation
      ? 'Status: Pending Payment'
      : 'Status: Paid'
    : 'Status: Paid'
  const headerTitle = isQrFlow
    ? isQrAwaitingConfirmation
      ? 'QR Payment Generated!'
      : 'QR Payment Confirmed!'
    : 'Cash Payment Recorded!'
  const headerSubtitle = isQrFlow
    ? isQrAwaitingConfirmation
      ? `The booking for ${displayCustomerName} is pending payment via PayMongo QR Ph. Share the code below with the customer to complete the transaction.`
      : `The booking for ${displayCustomerName} has been recorded. Payment has been confirmed via QR Ph.`
    : `The booking for ${displayCustomerName} has been successfully processed with cash payment.`

  const steps = [
    { id: 0, name: 'Customer details', hint: 'Identify and contact the guest' },
    { id: 1, name: 'Select a date', hint: 'Pick their play day' },
    { id: 2, name: 'Select time & court no.', hint: 'Reserve the slot' },
    { id: 3, name: 'Payment', hint: 'Confirm cash payment' },
    { id: 4, name: 'Completed', hint: 'Reservation recorded' }
  ]

  const getStepState = (stepId: number): 'completed' | 'current' | 'upcoming' => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  const handleGenerateQrPayment = async () => {
    if (!customerName || customerName.trim() === '') {
      toast.error('Please enter customer name first')
      return
    }

    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      toast.error('Please enter a valid customer email address')
      return
    }

    if (!customerContact || normalizedContactNumber.length < 7) {
      toast.error('Please enter a valid customer phone number')
      return
    }

    if (courtBookings.length === 0) {
      toast.error('Please select at least one court booking')
      return
    }

    if (totalAmount === 0) {
      toast.error('Total amount must be greater than zero to generate a QR code')
      return
    }

    try {
      setIsGeneratingQr(true)

      let effectiveReferenceNumber = referenceNumber
      if (!effectiveReferenceNumber) {
        effectiveReferenceNumber =
          Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(effectiveReferenceNumber)
      }

      const effectiveNotes =
        qrNotes.trim() ||
        `Reservation ${effectiveReferenceNumber} - ${customerName.trim() || 'Walk-in Customer'}`

      const response = await api.post('/reservations/admin/qrph/preview', {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerContact: customerContact.trim(),
        qrDetails: {
          notes: effectiveNotes,
          kind: 'instore',
          ...(paymongoMobileNumber ? { mobileNumber: paymongoMobileNumber } : {})
        }
      })

      if (response.data?.qrData) {
        toast.success('QR Ph code generated. Await customer payment.')
        setRecentPaymentMethod('qrph')
        setQrPaymentData(response.data.qrData)
        setQrPaymentConfirmed(false)
        setCurrentStep(4)
      } else {
        toast.error('Failed to generate QR code preview. Please try again.')
      }
    } catch (error: any) {
      console.error('Error generating QR Ph code:', error)
      toast.error(error.response?.data?.message || 'Failed to generate QR code. Please try again.')
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const handleConfirmQrPayment = async () => {
    if (!qrPaymentData?.id) {
      toast.error('Generate a QR code first before confirming payment.')
      return
    }

    if (courtBookings.length === 0) {
      toast.error('Please select at least one court booking')
      return
    }

    try {
      setIsConfirmingQrPayment(true)

      let effectiveReferenceNumber = referenceNumber
      if (!effectiveReferenceNumber) {
        effectiveReferenceNumber =
          Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(effectiveReferenceNumber)
      }

      const bookingData = {
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
        referenceNumber: effectiveReferenceNumber
      }

      const existingNotes =
        qrPaymentData.attributes?.notes ||
        qrNotes.trim() ||
        `Reservation ${effectiveReferenceNumber} - ${displayCustomerName}`

      const response = await api.post('/reservations/admin/qrph', {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerContact: customerContact.trim(),
        bookingData,
        qrDetails: {
          notes: existingNotes,
          kind: qrPaymentData.attributes?.kind || 'instore',
          ...(paymongoMobileNumber ? { mobileNumber: paymongoMobileNumber } : {})
        },
        existingQrData: qrPaymentData
      })

      if (response.data) {
        toast.success('Payment confirmed and reservation saved!')
        setRecentPaymentMethod('qrph')
        setQrPaymentData(response.data.qrData || qrPaymentData)
        setReferenceNumber(
          response.data.payment?.reference_number || effectiveReferenceNumber
        )
        setQrPaymentConfirmed(true)
        setCurrentStep(4)
      }
    } catch (error: any) {
      console.error('Error confirming QR Ph payment:', error)
      toast.error(error.response?.data?.message || 'Failed to confirm payment. Please try again.')
    } finally {
      setIsConfirmingQrPayment(false)
    }
  }

  const handleCancelQrPayment = () => {
    toast('QR payment cancelled. Starting a new reservation.')
    resetReservationFlow()
  }

  const courtsPerSheet = 6
  const numberOfSheets = Math.ceil(courts.length / courtsPerSheet)
  const sheetTabs = Array.from({ length: numberOfSheets }, (_, i) => `Sheet ${i + 1}`)
  const tabs = [...sheetTabs, 'Rent an racket', 'Booking details']
  
  const getCourtsForSheet = (sheetIndex: number) => {
    const startIndex = sheetIndex * courtsPerSheet
    const endIndex = startIndex + courtsPerSheet
    return courts.slice(startIndex, endIndex)
  }
  
  const isSheetTab = (tab: string) => tab.startsWith('Sheet')

  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        
        const sortedCourts = courtsData.sort((a, b) => a.Court_Id - b.Court_Id)
        setCourts(sortedCourts)
        setEquipment(equipmentData)
        setTimeSlots(timeSlotsData)
        
        if (activeTab.startsWith('Sheet')) {
          const sheetNumber = parseInt(activeTab.replace('Sheet ', ''))
          const totalSheets = Math.ceil(sortedCourts.length / 6)
          if (sheetNumber > totalSheets || totalSheets === 0) {
            setActiveTab('Sheet 1')
          }
        }
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
      
      for (const court of courts) {
        try {
          const availability = await apiServices.getAvailability(court.Court_Id, date)
          newAvailabilityData.set(court.Court_Id, availability)
        } catch (err) {
          console.error(`Error loading availability for court ${court.Court_Id}:`, err)
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

  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
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
      
      if (isToday) {
        const currentHour = now.getHours()
        const nextAvailableHour = currentHour + 1
        if (hour < nextAvailableHour) {
          continue
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

  const handleCellClick = (courtId: number, courtName: string, time: string, price: number) => {
    const cellKey = `COURT ${courtId}-${time}`
    const currentStatus = getCellStatus(courtId, time)
    
    if (currentStatus.status === 'reserved' || currentStatus.status === 'maintenance') {
      return
    }
    
    const isSelected = selectedCells.has(cellKey)
    
    if (isSelected) {
      setSelectedCells(prev => {
        const newSet = new Set(prev)
        newSet.delete(cellKey)
        return newSet
      })
      
      setCourtBookings(prev => prev.filter(booking => 
        !(booking.court === courtName && booking.schedule === time)
      ))
    } else {
      setSelectedCells(prev => new Set(prev).add(cellKey))
      
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
    
    if (selectedCells.has(cellKey)) {
      return { status: 'selected' }
    }
    
    const courtAvailability = availabilityData.get(courtId)
    if (courtAvailability && courtAvailability.length > 0) {
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
    
    const equipmentItem = equipment.find(eq => eq.equipment_name === racketName)
    const price = Number(equipmentItem?.price) || 100
    
    if (newQuantity === 0) {
      setEquipmentBookings(prev => prev.filter(booking => booking.equipment !== racketName))
      setFlippedCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(racketName)
        return newSet
      })
    } else {
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
    
    const equipmentItem = equipment.find(eq => eq.equipment_name === racketName)
    const price = Number(equipmentItem?.price) || 100
    
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
  }

  const handleProceedFromDateSelection = async () => {
    if (!tempSelectedDate) {
      setDateError('Please select a date before proceeding.')
      return
    }
    setSelectedDate(tempSelectedDate)
    setCurrentStep(2)
    
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

  const handleProcessCashPayment = async () => {
    if (!customerName || customerName.trim() === '') {
      toast.error('Please enter customer name first')
      return
    }

    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      toast.error('Please enter a valid customer email address')
      return
    }

    if (!customerContact || normalizedContactNumber.length < 7) {
      toast.error('Please enter a valid customer phone number')
      return
    }

    if (courtBookings.length === 0) {
      toast.error('Please select at least one court booking')
      return
    }

    try {
      setIsProcessingPayment(true)

      let effectiveReferenceNumber = referenceNumber
      if (!effectiveReferenceNumber) {
        effectiveReferenceNumber =
          Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(effectiveReferenceNumber)
      }

      const bookingData = {
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
        referenceNumber: effectiveReferenceNumber
      }

      const response = await api.post('/reservations/admin/cash', {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerContact: customerContact.trim(),
        bookingData
      })

      if (response.data) {
        toast.success('Reservation created successfully with cash payment!')
        setRecentPaymentMethod('cash')
        setQrPaymentData(null)
        setQrPaymentConfirmed(true)
        setCurrentStep(4)
      }
    } catch (error: any) {
      console.error('Error processing cash payment:', error)
      toast.error(error.response?.data?.message || 'Failed to create reservation. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 scroll-smooth">
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        ::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
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
      ` }} />
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 overflow-visible backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-visible">
          <div className="flex justify-between items-center h-14 sm:h-16 relative">
            <div className="flex items-center">
              <img 
                src="/assets/icons/BBC ICON.png" 
                alt="BBC Logo" 
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 object-contain hover:scale-105 transition-transform duration-200" 
              />
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={adminUser?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                    alt="Profile"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{adminUser?.name || adminUser?.username || 'User'}</div>
                    <div className="text-xs text-gray-500">{formatRole(adminUser?.role)}</div>
                  </div>
                  <svg 
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ${showUserDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar activeItem={activeSidebarItem} onItemChange={setActiveSidebarItem} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn">
          <div className="bg-white rounded-lg shadow-lg p-6 mx-auto" style={{ maxWidth: 'calc(72rem + 400px)' }}>
            <div className="bg-gradient-to-r from-slate-100 via-white to-slate-100 px-4 py-5 sm:px-6 rounded-t-lg -mx-6 -mt-6 mb-6">
              <ol className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
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
                          {styles.icon ?? step.id + 1}
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

            {currentStep === 0 && (
              <div>
                <div className="bg-gray-600 text-white px-6 py-4 rounded-t-lg -mx-6 -mt-6 mb-6 shadow">
                  <h2 className="text-base sm:text-lg font-semibold">Enter Customer Details</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Provide the guest&apos;s contact information for confirmation and follow-up.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter customer name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    autoFocus
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    This reservation is for a walk-in customer who may not have an account.
                  </p>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      customerEmail && !emailRegex.test(customerEmail.trim())
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    We&apos;ll send the reference details to this email for the guest&apos;s record.
                  </p>
                  {customerEmail && !emailRegex.test(customerEmail.trim()) && (
                    <p className="mt-2 text-sm text-red-600">Please enter a valid email address.</p>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXXX"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      customerContact && normalizedContactNumber.length < 7
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Enter a reachable number so we can confirm or update the booking.
                  </p>
                  {customerContact && normalizedContactNumber.length < 7 && (
                    <p className="mt-2 text-sm text-red-600">Please enter a valid phone number.</p>
                  )}
                </div>

                {isCustomerDetailsValid && (
                  <div className="mt-4 p-4 bg-green-50 ring-1 ring-green-200 rounded-lg space-y-1">
                    <div className="font-medium text-green-800">Customer Summary:</div>
                    <div className="text-green-700 font-medium">{customerName.trim()}</div>
                    <div className="text-green-700">{customerEmail.trim()}</div>
                    <div className="text-green-700">{customerContact.trim()}</div>
                  </div>
                )}

                <div className="text-center mt-6">
                  <button 
                    onClick={() => {
                      if (!customerName || customerName.trim() === '') {
                        toast.error('Please enter customer name')
                        return
                      }
                      if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
                        toast.error('Please enter a valid customer email address')
                        return
                      }
                      if (!customerContact || normalizedContactNumber.length < 7) {
                        toast.error('Please enter a valid customer phone number')
                        return
                      }
                      setCurrentStep(1)
                    }}
                    className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isCustomerDetailsValid}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <>
                <div className="bg-gray-600 text-white px-6 py-4 rounded-t-lg -mx-6 -mt-6 mb-6 shadow">
                  <h2 className="text-base sm:text-lg font-semibold">Select from the available dates below</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Choose a date to proceed to court and time selection
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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
                       const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
                       const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
                       const isoDate = formatDateToISODate(date)
                       const isSelected = tempSelectedDate === isoDate
                       const isToday = date.toDateString() === today.toDateString()
                       
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

                  {dateError && (
                    <div className="mt-4 p-4 bg-red-50 ring-1 ring-red-200 text-red-700 rounded-lg">
                      {dateError}
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-4 mt-6">
                  <button 
                    onClick={() => setCurrentStep(0)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleProceedFromDateSelection}
                    className="px-8 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!tempSelectedDate}
                  >
                    Proceed
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="bg-gray-600 text-white px-4 py-2 rounded-t-lg -mx-6 -mt-6 mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-medium">Select from the available time and court:</h2>
                    
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
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

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
                  {(customerName || customerEmail || customerContact) && (
                          <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-blue-500 space-y-1">
                            {customerName && (
                              <p>
                                For:{' '}
                                <span className="text-blue-700 normal-case tracking-normal ml-1 font-semibold">
                                  {customerName.trim()}
                                </span>
                              </p>
                            )}
                            {customerEmail && (
                              <p className="text-blue-700 normal-case tracking-normal">
                                Email: <span className="font-semibold">{customerEmail.trim()}</span>
                              </p>
                            )}
                            {customerContact && (
                              <p className="text-blue-700 normal-case tracking-normal">
                                Phone: <span className="font-semibold">{customerContact.trim()}</span>
                              </p>
                            )}
                          </div>
                  )}
                      </div>
                    )
                  })()}
                </div>

                {isSheetTab(activeTab) && (() => {
                  const sheetIndex = parseInt(activeTab.replace('Sheet ', '')) - 1
                  const sheetCourts = getCourtsForSheet(sheetIndex)
                  
                  return (
                    <div>
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

                      <div className="sm:hidden space-y-4">
                        {generateTimeSlots().map((timeSlot) => (
                          <div key={timeSlot.id} className="rounded-xl ring-1 ring-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-100 px-4 py-3 text-sm font-semibold text-slate-700">{timeSlot.display}</div>
                            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 p-4">
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
                                    onClick={() =>
                                      canInteract && handleCellClick(court.Court_Id, court.Court_Name, timeSlot.display, court.Price)
                                    }
                                    className={`flex flex-col gap-2 rounded-xl px-3 py-3 text-left text-xs transition-all duration-200 ${config.containerClass} disabled:cursor-not-allowed disabled:opacity-85 disabled:shadow-none disabled:transform-none ${
                                      canInteract
                                        ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 active:scale-[0.99]'
                                        : 'opacity-95'
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
                            <thead>
                              <tr className="bg-gray-100 sticky top-0 z-10">
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs sm:text-sm">TIME</th>
                                {sheetCourts.map((court) => (
                                  <th key={court.Court_Id} className="border border-gray-300 px-4 py-2 text-center text-xs sm:text-sm">
                                    {court.Court_Name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {generateTimeSlots().map((timeSlot, idx) => (
                                <tr key={timeSlot.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border border-gray-300 px-4 py-2 font-medium sticky left-0 bg-inherit text-xs sm:text-sm">{timeSlot.display}</td>
                                  {sheetCourts.map((court) => {
                                    const slotStatus = getCellStatus(court.Court_Id, timeSlot.display).status
                                    const displayState = deriveCellDisplayState(slotStatus, court.Status)
                                    const config = cellDisplayConfig[displayState]
                                    const canInteract = displayState === 'available' || displayState === 'selected'
                                    const ariaLabel = `${court.Court_Name} at ${timeSlot.display} - ${config.badge.text}`

                                    return (
                                    <td
                                      key={`${timeSlot.display}-${court.Court_Id}`}
                                        className="border border-gray-300 px-1 sm:px-2 md:px-3 py-3 text-center align-middle"
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
                            <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                              flippedCards.has(item.equipment_name) ? 'rotate-y-180' : ''
                            }`}>
                              <div className="absolute inset-0 w-full h-full backface-hidden">
                                <div className={`relative bg-gradient-to-br from-white via-gray-50 to-blue-50 border-2 rounded-2xl p-3 sm:p-4 md:p-6 h-full flex flex-col justify-between items-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 group-hover:border-blue-400 group-hover:from-blue-50 group-hover:to-blue-100 ${
                              isRacketBooked(item.equipment_name) ? 'border-green-500 ring-4 ring-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-green-200' : 'border-gray-200 hover:border-blue-400'
                            }`}>
                                  {item.stocks > 5 && (
                                    <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                      Popular
                                    </div>
                                  )}
                                  
                                  {item.stocks > 0 && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-bounce">
                                      {item.stocks}
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 flex items-center justify-center w-full mb-4 relative">
                                    <div className="relative group/image">
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                                      <div className="relative w-full h-20 sm:h-24 md:h-32 bg-white rounded-lg shadow-sm overflow-hidden">
                                        <img
                                          src={`${item.image_path || "/assets/img/equipments/racket.png"}?v=${Date.now()}`}
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
                                  
                                  <div className="w-full text-center space-y-3">
                                    <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-all duration-300 transform group-hover:scale-105">
                                      {item.equipment_name}
                                    </h3>
                                    
                                    <div className="flex items-center justify-center space-x-2">
                                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                                        item.stocks > 0 ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-red-500 shadow-red-200 shadow-lg'
                                      }`}></div>
                                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                                        {item.stocks > 0 ? `${item.stocks} available` : 'Out of stock'}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-2 border border-blue-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                                      <p className="text-sm sm:text-base font-bold text-blue-600 group-hover:text-blue-700">
                                        ₱{item.price}/hour
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
                                      <div className="bg-white rounded-full p-3 shadow-xl border-2 border-blue-200">
                                        <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isRacketBooked(item.equipment_name) && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                      Selected
                                    </div>
                                  )}
                                </div>
                              </div>
                              
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

                    <div className="text-right mb-6">
                      <span className="text-lg font-bold">TOTAL: {totalAmount}</span>
                    </div>

                    <div className="p-4 border border-red-300 bg-red-50 rounded-lg mb-4">
                      <p className="text-red-600 font-medium mb-2">Note: Payment, Refund & Cancellation</p>
                      <ul className="list-disc list-inside text-red-600 space-y-1">
                        <li>Pay the given price in order to make reservation.</li>
                        <li>Strictly "No Cancellation and refund policy" once you reserved a court there is no cancellation.</li>
                      </ul>
                    </div>
                  </div>
                )}

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
                      const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
                      setReferenceNumber(refNumber)
                      setCurrentStep(3)
                    }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-600 text-white px-6 py-4 rounded-t-lg -mx-6 -mt-6 mb-6 shadow">
                  <h2 className="text-base sm:text-lg font-semibold">Payment Method</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">Confirm booking and process cash payment</p>
                </div>

                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Booking Summary</h3>
                  <p className="text-sm text-gray-600">Date: <span className="font-medium">{selectedDate}</span></p>
                  {(customerName || customerEmail || customerContact) && (
                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                      {customerName && (
                        <p>
                          For: <span className="font-medium">{customerName.trim()}</span>
                        </p>
                      )}
                      {customerEmail && (
                        <p>
                          Email: <span className="font-medium">{customerEmail.trim()}</span>
                        </p>
                      )}
                      {customerContact && (
                        <p>
                          Phone: <span className="font-medium">{customerContact.trim()}</span>
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700">Court Bookings:</h4>
                    {courtBookings.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {courtBookings.map((booking, index) => (
                          <li key={index}>{booking.court} - {booking.schedule} (₱{booking.subtotal.toFixed(2)})</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No court bookings.</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <h4 className="font-medium text-gray-700">Equipment Rentals:</h4>
                    {equipmentBookings.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {equipmentBookings.map((booking, index) => (
                          <li key={index}>{booking.equipment} x {booking.quantity} for {booking.time} (₱{booking.subtotal.toFixed(2)})</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No equipment rentals.</p>
                    )}
                  </div>
                  <div className="text-right mt-4">
                    <p className="text-xl font-bold text-gray-900">Total Amount: ₱{totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-6 p-4 sm:p-5 border border-blue-200 bg-blue-50/60 rounded-xl shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-blue-900">PayMongo QR Ph Payment</h3>
                    <p className="text-sm text-blue-700">
                      Generate a QR Ph code for the customer to scan. The reservation will be saved with a pending payment status until PayMongo confirms the transaction.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        QR Notes
                      </label>
                      <input
                        type="text"
                        value={qrNotes}
                        onChange={(e) => setQrNotes(e.target.value)}
                        placeholder="Reservation reference and customer name"
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                      />
                      <p className="mt-2 text-xs text-blue-700">
                        Leave blank to auto-fill with the reservation reference and customer name.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        Mobile Number Used For QR
                      </label>
                      <input
                        type="text"
                        value={paymongoMobileNumber}
                        readOnly
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg bg-blue-100/70 text-blue-900 font-medium cursor-not-allowed"
                        placeholder="+63XXXXXXXXXX"
                      />
                      <p className="mt-2 text-xs text-blue-700">
                        Update the customer phone number above if this needs to change. PayMongo requires the mobile number in international format.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-stretch gap-3 mt-8">
                  <button
                    onClick={() => handleBackToStep(2)}
                    className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={handleProcessCashPayment}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    disabled={isProcessingPayment || totalAmount === 0}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Payment Received (Cash)</span>
                    )}
                  </button>
                  <button
                    onClick={handleGenerateQrPayment}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 justify-center"
                    disabled={isGeneratingQr || totalAmount === 0}
                  >
                    {isGeneratingQr ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Generating QR...</span>
                      </>
                    ) : (
                      <span>Generate QR Payment</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                    <div className="relative px-6 pt-10 pb-6 sm:px-10 sm:pt-12">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
                        <div>
                          <p className="text-sm uppercase tracking-[0.35em] text-white/70 font-semibold">
                            Reservation {isQrFlow ? (isQrAwaitingConfirmation ? 'Pending' : 'Completed') : 'Completed'}
                          </p>
                          <h2 className="text-3xl sm:text-4xl font-bold mt-2">
                            {headerTitle}
                          </h2>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${statusBadgeClass}`}>
                          {statusBadgeLabel}
                        </div>
                      </div>

                      <div className="mt-8 rounded-2xl border border-slate-200 bg-white text-left shadow-lg">
                        <div className="px-6 py-5 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                            Booking Summary
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">
                            {displayCustomerName}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {headerSubtitle}
                          </p>
                        </div>

                        <div className="px-6 py-6">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Reference Number
                              </p>
                              <p className="mt-1 text-sm font-semibold text-blue-600 break-all">
                                {referenceNumber}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Total Amount
                              </p>
                              <p className="mt-1 text-lg font-bold text-emerald-600">
                                ₱{totalAmount.toFixed(2)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Payment Method
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {isQrFlow ? 'QR Ph (PayMongo)' : 'Cash'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-100 px-4 py-3 bg-white">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Contact Email
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {customerEmail.trim() || '—'}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-100 px-4 py-3 bg-white">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Contact Number
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {customerContact.trim() || '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isQrFlow && (
                        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-6 py-5">
                            <h4 className="text-lg font-semibold text-blue-900">PayMongo QR Code</h4>
                            <p className="mt-2 text-sm text-blue-800">
                              Ask the customer to scan this code using their QR Ph capable banking app. Payment will automatically reflect in PayMongo once completed.
                            </p>
                            {(qrPaymentData?.attributes?.notes || qrNotes) && (
                              <div className="mt-4 rounded-lg border border-blue-200 bg-white/80 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                                  Notes
                                </p>
                                <p className="mt-1 text-sm text-blue-900">
                                  {qrPaymentData?.attributes?.notes || qrNotes}
                                </p>
                              </div>
                            )}
                            {qrPaymentData?.id && (
                              <p className="mt-4 text-xs text-blue-700">
                                QR Code ID: <span className="font-medium">{qrPaymentData.id}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex justify-center">
                            {qrPaymentData?.attributes?.qr_image ? (
                              <div className="rounded-[2rem] border-4 border-white shadow-2xl bg-white/95 p-6">
                                <img
                                  src={qrPaymentData.attributes.qr_image}
                                  alt="PayMongo QR Ph Code"
                                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-dashed border-blue-300 bg-white/80 px-6 py-8 text-center text-blue-600">
                                <p className="text-sm font-medium">
                                  QR image unavailable. Please check the PayMongo dashboard for details.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isQrAwaitingConfirmation && (
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={handleConfirmQrPayment}
                            className="flex-1 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isConfirmingQrPayment}
                          >
                            {isConfirmingQrPayment ? 'Recording Payment...' : 'Payment Received'}
                          </button>
                          <button
                            onClick={handleCancelQrPayment}
                            className="flex-1 inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                          >
                            Cancel & Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => navigate('/admin')}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300 transition-transform hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

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
                    You have already booked a court for the same date and time. Please choose a different date, time, or court.
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
      <AdminFooter />
    </div>
  )
}
