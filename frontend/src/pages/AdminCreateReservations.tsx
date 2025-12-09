
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiServices, Court, Equipment, TimeSlot } from '@/lib/apiServices'
import { RacketConfigurationModal } from '@/components/modals/RacketConfigurationModal'
import { useAuthStore } from '@/store/authStore'
import { resolveImageUrl } from '@/lib/imageUtils'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ShuttlecockLoader } from '@/components/ShuttlecockLoader'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminHeader } from '@/components/AdminHeader'
import { formatPHPhoneNumber } from '@/lib/validation'

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
  selectedCourtSchedules?: string[] // Array of "court-schedule" keys to associate with
}

interface CellStatus {
  status: 'available' | 'reserved' | 'maintenance' | 'selected'
}

export default function AdminCreateReservations() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState('')
  const [tempSelectedDate, setTempSelectedDate] = useState('')
  // Default to first sheet, but will be updated when courts are loaded
  const [activeTab, setActiveTab] = useState('Sheet 1')
  const [racketQuantities, setRacketQuantities] = useState<Map<string, number>>(new Map())
  const [racketTimes, setRacketTimes] = useState<Map<string, number>>(new Map())
  const [selectedRacketForModal, setSelectedRacketForModal] = useState<Equipment | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [dateError, setDateError] = useState('')
  const [activeSidebarItem, setActiveSidebarItem] = useState('Create Reservations')
  
  // Customer info for admin-created reservations
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  
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
  const [equipmentAvailability, setEquipmentAvailability] = useState<Map<number, number>>(new Map()) // equipmentId -> available stock
  const [, setLoadingEquipmentAvailability] = useState(false)
  const [showEquipmentGuard, setShowEquipmentGuard] = useState(false)
  const [showCourtTimeRequiredModal, setShowCourtTimeRequiredModal] = useState(false)
  const [showCourtScheduleSelectionModal, setShowCourtScheduleSelectionModal] = useState(false)
  const [pendingRacketForScheduleSelection, setPendingRacketForScheduleSelection] = useState<Equipment | null>(null)
  const [selectedCourtSchedulesForRacket, setSelectedCourtSchedulesForRacket] = useState<Set<string>>(new Set())
  const [referenceNumber, setReferenceNumber] = useState('')
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateMessage] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'qrph' | null>(null)
  const [selectedQrProvider, setSelectedQrProvider] = useState<'gcash' | 'paymaya' | 'grab_pay' | null>(null)
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; sourceId: string } | null>(null)
  const [showQrProviderModal, setShowQrProviderModal] = useState(false)
  const [showSampleQrModal, setShowSampleQrModal] = useState(false)
  const [selectedProviderForPreview, setSelectedProviderForPreview] = useState<'gcash' | 'paymaya' | 'grab_pay' | null>(null)

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



  // Calculate total amount
  const totalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                     equipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)


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
          apiServices.getAvailableEquipment(), // Only get equipment with status = 'Available'
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

  // Refresh availability data when selectedDate changes or when returning to booking page
  useEffect(() => {
    if (selectedDate && courts.length > 0 && currentStep === 3) {
      // Reload availability data to reflect latest reservations (including newly created ones)
      // Only refresh when on step 3 (time & court selection) to avoid unnecessary calls
      console.log('[AdminCreateReservations] Refreshing availability data for date:', selectedDate)
      loadAvailabilityData(selectedDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentStep])

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
    
    // Batch state updates using React's automatic batching, then defer API calls
    // to prevent blocking the main thread and causing forced reflows
    if (isSelected) {
      // Deselect the cell
      setSelectedCells(prev => {
        const newSet = new Set(prev)
        newSet.delete(cellKey)
        return newSet
      })
      
      // Remove from bookings
      setCourtBookings(prev => {
        const filtered = prev.filter(booking => 
        !(booking.court === courtName && booking.schedule === time)
        )
        console.log('[BookingPage] Removing booking:', { court: courtName, schedule: time })
        console.log('[BookingPage] Total bookings after remove:', filtered.length, filtered)
        return filtered
      })
      
      // Defer API call to prevent blocking click handler and causing forced reflow
      // Only reload availability if there are still selected cells
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (selectedCells.size > 0) {
            loadEquipmentAvailabilityForSchedules()
    } else {
            // Clear availability when all cells are deselected
            setEquipmentAvailability(new Map())
          }
        }, 0)
      })
    } else {
      // Select the cell
      setSelectedCells(prev => new Set(prev).add(cellKey))
      
      // Add to bookings
      const newBooking: CourtBooking = {
        court: courtName,
        schedule: time,
        subtotal: Number(price)
      }
      console.log('[BookingPage] Adding new booking:', newBooking)
      setCourtBookings(prev => {
        const updated = [...prev, newBooking]
        console.log('[BookingPage] Total bookings after add:', updated.length, updated)
        return updated
      })
      
      // Defer API call to prevent blocking click handler and causing forced reflow
      // Load availability for the newly selected schedule
      requestAnimationFrame(() => {
        setTimeout(() => {
          loadEquipmentAvailabilityForSchedule(courtName, time)
        }, 0)
      })
    }
  }

  // Parse schedule string to get start time and hours
  const parseScheduleToStartTimeAndHours = (schedule: string): { startTime: string; hours: number } | null => {
    // Parse schedule like "9:00 am - 10:00 am" or "9:00 AM - 10:00 AM"
    const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i)
    
    if (!timeMatch) {
      return null
    }

    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch
    
    const convertTo24Hour = (hour: number, period: string, minute: number): number => {
      let h = parseInt(hour.toString())
      if (period.toUpperCase() === 'PM' && h !== 12) {
        h += 12
      } else if (period.toUpperCase() === 'AM' && h === 12) {
        h = 0
      }
      return h * 60 + parseInt(minute.toString()) // Return minutes from midnight
    }

    const startMinutes = convertTo24Hour(parseInt(startHour), startPeriod, parseInt(startMin))
    const endMinutes = convertTo24Hour(parseInt(endHour), endPeriod, parseInt(endMin))
    const hours = (endMinutes - startMinutes) / 60

    const startHour24 = Math.floor(startMinutes / 60)
    const startMin24 = startMinutes % 60
    const startTime = `${startHour24.toString().padStart(2, '0')}:${startMin24.toString().padStart(2, '0')}:00`

    return { startTime, hours }
  }

  // Load equipment availability for a specific schedule
  const loadEquipmentAvailabilityForSchedule = async (_courtName: string, schedule: string) => {
    if (!selectedDate) return

    try {
      setLoadingEquipmentAvailability(true)
      const timeInfo = parseScheduleToStartTimeAndHours(schedule)
      
      if (!timeInfo) {
        console.error('Failed to parse schedule:', schedule)
        return
      }

      const availability = await apiServices.getEquipmentAvailability(
        selectedDate,
        timeInfo.startTime,
        timeInfo.hours
      )

      // Update equipment availability map
      const newAvailability = new Map<number, number>()
      availability.forEach((item: any) => {
        const equipmentItem = equipment.find(eq => eq.equipment_name === item.equipment_name)
        if (equipmentItem) {
          newAvailability.set(equipmentItem.id, item.available || 0)
        }
      })
      
      setEquipmentAvailability(newAvailability)
    } catch (error) {
      console.error('Error loading equipment availability:', error)
    } finally {
      setLoadingEquipmentAvailability(false)
    }
  }

  // Load equipment availability for all selected schedules (for multiple schedules)
  // Only reduces stock when specific schedule cells are selected
  const loadEquipmentAvailabilityForSchedules = async () => {
    if (!selectedDate || courtBookings.length === 0 || selectedCells.size === 0) {
      // If no schedule cells selected, clear availability map to show full stock
      setEquipmentAvailability(new Map())
      return
    }

    try {
      setLoadingEquipmentAvailability(true)
      
      // IMPORTANT: When multiple schedules are selected, we need to check availability for EACH schedule
      // because rentals spanning multiple schedules should reduce stock in ALL schedule cells
      if (courtBookings.length === 1) {
        // Single schedule - just load for that schedule
        await loadEquipmentAvailabilityForSchedule(courtBookings[0].court, courtBookings[0].schedule)
      } else {
        // Multiple schedules - load availability for each schedule separately
        // This ensures rentals spanning multiple schedules are counted in each schedule's availability
        const availabilityMap = new Map<number, number>()
        
        for (const booking of courtBookings) {
          try {
            const timeInfo = parseScheduleToStartTimeAndHours(booking.schedule)
            if (timeInfo) {
              const availability = await apiServices.getEquipmentAvailability(
                selectedDate,
                timeInfo.startTime,
                timeInfo.hours
              )
              
              // Merge availability - use the minimum available stock across all schedules
              // (since a rental spanning multiple schedules affects all of them)
              availability.forEach((item: any) => {
                const equipmentItem = equipment.find(eq => eq.equipment_name === item.equipment_name)
                if (equipmentItem) {
                  const currentAvailable = availabilityMap.get(equipmentItem.id) ?? equipmentItem.stocks ?? 0
                  const scheduleAvailable = item.available || 0
                  // Use the minimum - if one schedule shows less availability, use that
                  availabilityMap.set(equipmentItem.id, Math.min(currentAvailable, scheduleAvailable))
                }
              })
            }
          } catch (error) {
            console.error(`Error loading availability for schedule ${booking.schedule}:`, error)
          }
        }
        
        setEquipmentAvailability(availabilityMap)
      }
    } catch (error) {
      console.error('Error loading equipment availability for schedules:', error)
    } finally {
      setLoadingEquipmentAvailability(false)
    }
  }

  // Update equipment availability when court bookings change
  // Only calculate reduced availability when schedule cells are actually selected
  useEffect(() => {
    if (selectedDate && courtBookings.length > 0 && selectedCells.size > 0) {
      loadEquipmentAvailabilityForSchedules()
    } else {
      // Clear availability map when no schedule cells are selected
      // This ensures full stock is shown when no cells are selected
      setEquipmentAvailability(new Map())
    }
  }, [courtBookings, selectedDate, selectedCells.size])

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
          // Handle both "10:00:00" and "10:00" formats
          const timeParts = time.split(':')
          const hour = parseInt(timeParts[0], 10)
          const minutes = timeParts[1] || '00'
          const ampm = hour >= 12 ? 'pm' : 'am'
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          // Format minutes to always show 2 digits (remove seconds if present)
          const displayMinutes = minutes.padStart(2, '0').substring(0, 2)
          return `${displayHour}:${displayMinutes} ${ampm}`
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
    // Check if user has selected a date and at least one court booking
    if (!selectedDate || courtBookings.length === 0) {
      setShowCourtTimeRequiredModal(true)
      return
    }
    
    const selectedEquipment = equipment.find(eq => eq.equipment_name === racketName)
    if (selectedEquipment) {
      // Find ALL bookings for this racket (since multiple schedules create separate bookings)
      const existingBookings = equipmentBookings.filter(b => b.equipment === racketName)
      
      // Collect all selected court schedules from all bookings for this racket
      const allSelectedSchedules = new Set<string>()
      existingBookings.forEach(booking => {
        if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 0) {
          booking.selectedCourtSchedules.forEach(schedule => {
            allSelectedSchedules.add(schedule)
          })
        }
      })
      
      // Calculate schedule duration for initial time
      let initialTime = 1
      if (allSelectedSchedules.size > 0) {
        initialTime = getMinScheduleDuration(Array.from(allSelectedSchedules))
      } else if (courtBookings.length === 1) {
        initialTime = calculateScheduleDuration(courtBookings[0].schedule)
      } else if (courtBookings.length > 1) {
        // For multiple schedules, use the minimum duration
        const allDurations = courtBookings.map(cb => calculateScheduleDuration(cb.schedule))
        initialTime = Math.min(...allDurations)
      }
      
      // Set the initial time to match schedule duration
      setRacketTimes(prev => {
        const newMap = new Map(prev)
        newMap.set(racketName, initialTime)
        return newMap
      })
      
      // If multiple court bookings exist, show schedule selection modal first
      if (courtBookings.length > 1) {
        setPendingRacketForScheduleSelection(selectedEquipment)
        // Pre-select all schedules that were previously selected for this racket
        if (allSelectedSchedules.size > 0) {
          setSelectedCourtSchedulesForRacket(allSelectedSchedules)
        } else {
          setSelectedCourtSchedulesForRacket(new Set())
        }
        setShowCourtScheduleSelectionModal(true)
      } else {
        // Single court booking, proceed directly to racket configuration
      setSelectedRacketForModal(selectedEquipment)
      }
    }
  }

  const handleRacketModalConfirm = (racketName: string, quantity: number, time: number) => {
    // If quantity is 0, unselect the racket completely
    if (quantity === 0) {
      handleRacketQuantityChange(racketName, 0)
      return
    }
    
    // Get selected court schedules for this racket
    const selectedSchedules = selectedCourtSchedulesForRacket.size > 0 
      ? Array.from(selectedCourtSchedulesForRacket)
      : courtBookings.length === 1 
        ? [`${courtBookings[0].court}-${courtBookings[0].schedule}`]
        : []
    
    // When multiple schedules are selected, quantity per schedule is 1 (one racket per schedule)
    // The total number of rackets will equal the number of selected schedules
    if (selectedSchedules.length > 1) {
      // Multiple schedules: create separate bookings, each with quantity 1
      handleRacketQuantityChange(racketName, 1, selectedSchedules)
      handleRacketTimeChange(racketName, time, selectedSchedules)
    } else {
      // Single schedule: use the quantity from modal
      handleRacketQuantityChange(racketName, quantity, selectedSchedules)
      handleRacketTimeChange(racketName, time, selectedSchedules)
    }
  }

  const handleCourtScheduleSelectionConfirm = () => {
    if (selectedCourtSchedulesForRacket.size === 0) {
      toast.error('Please select at least one court schedule')
      return
    }
    
    if (pendingRacketForScheduleSelection) {
      // Calculate schedule duration based on selected schedules
      const selectedSchedules = Array.from(selectedCourtSchedulesForRacket)
      const scheduleDuration = getMinScheduleDuration(selectedSchedules)
      
      // Set the racket time to match the schedule duration
      if (pendingRacketForScheduleSelection) {
        setRacketTimes(prev => {
          const newMap = new Map(prev)
          newMap.set(pendingRacketForScheduleSelection.equipment_name, scheduleDuration)
          return newMap
        })
      }
      
      setShowCourtScheduleSelectionModal(false)
      setSelectedRacketForModal(pendingRacketForScheduleSelection)
      setPendingRacketForScheduleSelection(null)
    }
  }

  const handleRacketQuantityChange = (racketName: string, newQuantity: number, selectedSchedules?: string[]) => {
    // Update quantity for this specific racket
    setRacketQuantities(prev => {
      const newMap = new Map(prev)
      if (newQuantity === 0) {
        newMap.delete(racketName)
      } else {
        newMap.set(racketName, newQuantity)
      }
      return newMap
    })
    
    // Find the equipment to get its price
    const equipmentItem = equipment.find(eq => eq.equipment_name === racketName)
    const price = Number(equipmentItem?.price) || 0 // Use 0 if not found to avoid incorrect calculations
    
    // Get the time for this specific racket (default to 1 if not set)
    const racketTime = racketTimes.get(racketName) || 1
    
    // Get existing booking to preserve selected schedules if they exist
    const existingBooking = equipmentBookings.find(b => b.equipment === racketName)
    const schedulesToUse = selectedSchedules || existingBooking?.selectedCourtSchedules || 
      (courtBookings.length === 1 ? [`${courtBookings[0].court}-${courtBookings[0].schedule}`] : [])
    
    if (newQuantity === 0) {
      // Remove all bookings for this racket
      setEquipmentBookings(prev => prev.filter(booking => booking.equipment !== racketName))
      // Also remove from racketTimes to ensure complete unselection
      setRacketTimes(prev => {
        const newMap = new Map(prev)
        newMap.delete(racketName)
        return newMap
      })
    } else {
      // CRITICAL: If multiple schedules are selected, create separate bookings - one per schedule
      // Each schedule represents a separate racket rental
      if (schedulesToUse.length > 1) {
        // Remove all existing bookings for this racket first
        setEquipmentBookings(prev => {
          const filtered = prev.filter(booking => booking.equipment !== racketName)
          
          // Create separate booking for each selected schedule
          // Each booking has quantity 1, representing one racket per schedule
          const newBookings: EquipmentBooking[] = schedulesToUse.map(scheduleKey => ({
            equipment: racketName,
            time: `${racketTime} hr`,
            subtotal: price * racketTime * 1, // Each schedule gets full price (1 racket per schedule)
            quantity: 1, // One racket per schedule
            selectedCourtSchedules: [scheduleKey] // Single schedule per booking
          }))
          
          return [...filtered, ...newBookings]
        })
      } else {
        // Single schedule - create one booking
        const newBooking: EquipmentBooking = {
          equipment: racketName,
          time: `${racketTime} hr`,
          subtotal: price * racketTime * newQuantity,
          quantity: newQuantity,
          selectedCourtSchedules: schedulesToUse.length > 0 ? schedulesToUse : undefined
        }
        setEquipmentBookings(prev => {
          const filtered = prev.filter(booking => booking.equipment !== racketName)
          return [...filtered, newBooking]
        })
      }
    }
  }

  const handleRacketTimeChange = (racketName: string, newTime: number, selectedSchedules?: string[]) => {
    // Get existing booking to preserve selected schedules if they exist
    const existingBooking = equipmentBookings.find(b => b.equipment === racketName)
    const schedulesToUse = selectedSchedules || existingBooking?.selectedCourtSchedules || 
      (courtBookings.length === 1 ? [`${courtBookings[0].court}-${courtBookings[0].schedule}`] : [])
    
    // Calculate maximum allowed time based on selected schedules
    let maxTime = 1
    if (schedulesToUse.length > 0) {
      maxTime = getMinScheduleDuration(schedulesToUse)
    } else if (courtBookings.length === 1) {
      maxTime = calculateScheduleDuration(courtBookings[0].schedule)
    } else if (courtBookings.length > 1) {
      const allDurations = courtBookings.map(cb => calculateScheduleDuration(cb.schedule))
      maxTime = Math.min(...allDurations)
    }
    
    // Clamp the time to not exceed the schedule duration
    const clampedTime = Math.min(newTime, maxTime)
    
    // Update time for this specific racket
    setRacketTimes(prev => {
      const newMap = new Map(prev)
      newMap.set(racketName, clampedTime)
      return newMap
    })
    
    // Find the equipment to get its price
    const equipmentItem = equipment.find(eq => eq.equipment_name === racketName)
    const price = Number(equipmentItem?.price) || 0 // Use 0 if not found to avoid incorrect calculations
    
    // Get the quantity for this specific racket
    const racketQuantity = racketQuantities.get(racketName) || 0
    
    // Update existing booking with clamped time
    if (racketQuantity > 0) {
      // CRITICAL: If multiple schedules are selected, create separate bookings - one per schedule
      if (schedulesToUse.length > 1) {
        setEquipmentBookings(prev => {
          const filtered = prev.filter(booking => booking.equipment !== racketName)
          
          // Create separate booking for each selected schedule
          const newBookings: EquipmentBooking[] = schedulesToUse.map(scheduleKey => ({
            equipment: racketName,
            time: `${clampedTime} hr`,
            subtotal: price * clampedTime * 1, // Each schedule gets full price (1 racket per schedule)
            quantity: 1, // One racket per schedule
            selectedCourtSchedules: [scheduleKey] // Single schedule per booking
          }))
          
          return [...filtered, ...newBookings]
        })
      } else {
        // Single schedule - update one booking
        const newBooking: EquipmentBooking = {
          equipment: racketName,
          time: `${clampedTime} hr`,
          subtotal: price * clampedTime * racketQuantity,
          quantity: racketQuantity,
          selectedCourtSchedules: schedulesToUse.length > 0 ? schedulesToUse : undefined
        }
        setEquipmentBookings(prev => {
          const filtered = prev.filter(booking => booking.equipment !== racketName)
          return [...filtered, newBooking]
        })
      }
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
  }

  const proceedToTimeAndCourtSelection = async () => {
    if (!tempSelectedDate) {
      setDateError('Please select a date before proceeding.')
      return
    }

    setDateError('')
    setSelectedDate(tempSelectedDate)
    setCurrentStep(3)
    
    // Load availability data for the selected date
    await loadAvailabilityData(tempSelectedDate)
  }

  const handleProceedFromDateSelection = async () => {
    if (!tempSelectedDate) {
      setDateError('Please select a date before proceeding.')
      return
    }

    await proceedToTimeAndCourtSelection()
  }

  const handleProceedFromCustomerInfo = async () => {
    // Validate required fields
    let hasError = false
    
    // Clear previous errors
    setNameError('')
    setEmailError('')
    
    // Validate name (required)
    if (!customerName.trim()) {
      setNameError('Customer name is required')
      hasError = true
    }
    
    // Validate email (required)
    if (!customerEmail.trim()) {
      setEmailError('Customer email is required')
      hasError = true
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customerEmail.trim())) {
        setEmailError('Please enter a valid email address')
        hasError = true
      }
    }
    
    if (hasError) {
      return
    }
    
    // Contact number is optional - proceed to date selection
    setCurrentStep(2)
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

  // Calculate schedule duration in hours
  const calculateScheduleDuration = (schedule: string): number => {
    try {
      const { startTime, endTime } = parseScheduleToTimes(schedule)
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const durationMinutes = endMinutes - startMinutes
      
      // Convert to hours (round to 1 decimal place)
      const hours = Math.round((durationMinutes / 60) * 10) / 10
      return Math.max(1, hours) // Minimum 1 hour
    } catch (error) {
      console.error('Error calculating schedule duration:', error)
      return 1 // Default to 1 hour if parsing fails
    }
  }

  // Get the minimum duration from selected schedules (for multiple schedules, use the shortest)
  const getMinScheduleDuration = (scheduleKeys: string[]): number => {
    if (scheduleKeys.length === 0) {
      // If no schedules selected, use the first court booking's duration
      if (courtBookings.length > 0) {
        return calculateScheduleDuration(courtBookings[0].schedule)
      }
      return 1
    }
    
    const durations = scheduleKeys.map(key => {
      const [courtName, schedule] = key.split('-')
      const courtBooking = courtBookings.find(cb => cb.court === courtName && cb.schedule === schedule)
      if (courtBooking) {
        return calculateScheduleDuration(courtBooking.schedule)
      }
      return 1
    })
    
    // Return the minimum duration (shortest schedule)
    return Math.min(...durations)
  }

  // Calculate reservation duration from court bookings (for initial time in modal)
  const calculateReservationDuration = (): number => {
    if (courtBookings.length === 0) {
      return 1 // Default to 1 hour if no bookings
    }

    // If there are selected court schedules for the racket, use those
    if (selectedCourtSchedulesForRacket.size > 0) {
      const scheduleKeys = Array.from(selectedCourtSchedulesForRacket)
      return getMinScheduleDuration(scheduleKeys)
    }

    // For single court booking, use its duration
    if (courtBookings.length === 1) {
      return calculateScheduleDuration(courtBookings[0].schedule)
    }

    // For multiple court bookings, use the minimum duration
    const durations = courtBookings.map(booking => calculateScheduleDuration(booking.schedule))
    return durations.length > 0 ? Math.min(...durations) : 1
  }

  // Handle admin cash payment
  const handleProcessCashPayment = async () => {
    if (!selectedPaymentMethod || selectedPaymentMethod !== 'cash') {
      toast.error('Please select Cash as payment method')
      return
    }

      setIsProcessingPayment(true)
    try {
      // Use customer info from admin input or default to 'admin' for name
      const finalUserInfo = {
        name: customerName.trim() || 'admin',
        email: customerEmail.trim() || user?.email || '',
        contactNumber: customerContact.trim() || user?.contact_number || ''
      }

      // Generate reference number if not already set
      if (!referenceNumber) {
        const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(refNumber)
      }

      // Prepare reservation data
      // Split equipment bookings with multiple schedules into separate bookings (one per schedule)
      // Each schedule should be a separate rental with its own price and stock reduction
      const expandedEquipmentBookings: any[] = []
      equipmentBookings.forEach(booking => {
        if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 1) {
          // Split into separate bookings for each schedule
          // Each schedule is a separate rental, so each should have the full price
          booking.selectedCourtSchedules.forEach(scheduleKey => {
            const [courtName, schedule] = scheduleKey.split('-')
            const courtBooking = courtBookings.find(cb => cb.court === courtName && cb.schedule === schedule)
            
            let startTime: string | undefined
            if (courtBooking) {
              try {
                const { startTime: st } = parseScheduleToTimes(courtBooking.schedule)
                startTime = st
              } catch (e) {
                console.error('Error parsing schedule:', e)
              }
            }
            
            // Calculate the price per schedule based on equipment price and time
            // Each schedule is a separate rental, so each should have the full price
            const equipmentItem = equipment.find(eq => eq.equipment_name === booking.equipment)
            const price = Number(equipmentItem?.price) || 100
            const timeMatch = booking.time.match(/(\d+(?:\.\d+)?)\s*hr/i)
            const hours = timeMatch ? parseFloat(timeMatch[1]) : 1
            const quantity = booking.quantity || 1
            // Each schedule gets the full price (price * hours * quantity) since it's a separate rental
            const subtotalPerSchedule = price * hours * quantity
            
            expandedEquipmentBookings.push({
              equipment: booking.equipment,
              time: booking.time,
              subtotal: subtotalPerSchedule,
              quantity: quantity,
              startTime: startTime,
              selectedCourtSchedules: [scheduleKey] // Single schedule per booking
            })
          })
        } else {
          // Single schedule or no schedules - keep as is
          let startTime: string | undefined
          if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 0) {
            const selectedBookings = courtBookings.filter(cb => 
              booking.selectedCourtSchedules?.includes(`${cb.court}-${cb.schedule}`)
            )
            if (selectedBookings.length > 0) {
              try {
                const { startTime: st } = parseScheduleToTimes(selectedBookings[0].schedule)
                startTime = st
              } catch (e) {
                console.error('Error parsing schedule:', e)
              }
            }
          } else if (courtBookings.length === 1) {
            try {
              const { startTime: st } = parseScheduleToTimes(courtBookings[0].schedule)
              startTime = st
            } catch (e) {
              console.error('Error parsing schedule:', e)
            }
          }
          
          expandedEquipmentBookings.push({
          equipment: booking.equipment,
          time: booking.time,
          subtotal: booking.subtotal,
            quantity: booking.quantity || 1,
            startTime: startTime,
            selectedCourtSchedules: booking.selectedCourtSchedules
          })
        }
      })

      const reservationData = {
        userId: user?.id || 1,
        selectedDate,
        courtBookings: courtBookings.map(booking => ({
          court: booking.court,
          schedule: booking.schedule,
          subtotal: booking.subtotal
        })),
        equipmentBookings: expandedEquipmentBookings,
        referenceNumber: referenceNumber,
        customerName: finalUserInfo.name,
        customerEmail: finalUserInfo.email,
        customerContact: finalUserInfo.contactNumber,
        paymentMethod: 'Cash',
        isAdminCreated: true
      }

      // Recalculate total amount from expanded equipment bookings
      // This ensures the total reflects the split bookings (each schedule gets full price)
      const recalculatedTotalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                                      expandedEquipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

      // Create reservations using createFromPayment endpoint with admin cash payment
      const paymentData = {
        bookingData: reservationData,
        paymentId: `admin_cash_${Date.now()}`,
        amount: recalculatedTotalAmount,
        paymentMethod: 'Cash'
      }

      const response = await api.post('/reservations/from-payment', paymentData)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        toast.success('Reservation created successfully with Cash payment!')
        setCurrentStep(5)
      } else {
        toast.error('Failed to create reservation')
      }
    } catch (error: any) {
      console.error('Cash payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to process cash payment. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Generate QR code for selected provider (sample QR code - not actual PayMongo QR)
  // TODO: Implement QR code generation in UI when needed
  // Commented out to avoid unused variable warning - uncomment when implementing QR code feature
  /*
  const handleGenerateQrCode = async (provider: 'gcash' | 'paymaya' | 'grab_pay') => {
    if (!selectedDate || courtBookings.length === 0) {
      toast.error('Please select a date and court schedule first')
      return
    }

    try {
      // Calculate total amount for QR code display
      const courtTotal = courtBookings.reduce((sum, booking) => sum + booking.subtotal, 0)
      const equipmentTotal = equipmentBookings.reduce((sum, booking) => sum + booking.subtotal, 0)
      const calculatedTotalAmount = courtTotal + equipmentTotal

      // Generate reference number if not already set
      if (!referenceNumber) {
        const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(refNumber)
      }

      // Generate a sample QR code (not actual PayMongo QR - just for display)
      // When "Payment Received" is clicked, payment will be processed directly
      const qrCodeDataString = `${provider.toUpperCase()}_${referenceNumber}_${calculatedTotalAmount}`
      const sampleQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCodeDataString)}`

      setQrCodeData({
        qrCode: sampleQrCode,
        sourceId: `sample_${Date.now()}` // Sample ID, not actual PayMongo source
      })

      setSelectedQrProvider(provider)
    } catch (error: any) {
      console.error('QR code generation error:', error)
      toast.error('Failed to generate QR code. Please try again.')
    }
  }
  */

  // Handle QR Ph payment directly with provider (from sample QR modal)
  const handleProcessQrPhPaymentWithProvider = async (provider: 'gcash' | 'paymaya' | 'grab_pay') => {
    setIsProcessingPayment(true)
    try {
      // Use customer info from admin input or default to 'admin' for name
      const finalUserInfo = {
        name: customerName.trim() || 'admin',
        email: customerEmail.trim() || user?.email || '',
        contactNumber: customerContact.trim() || user?.contact_number || ''
      }

      // Generate reference number if not already set
      if (!referenceNumber) {
        const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(refNumber)
      }

      // Prepare reservation data
      // Split equipment bookings with multiple schedules into separate bookings (one per schedule)
      const expandedEquipmentBookings: any[] = []
      equipmentBookings.forEach(booking => {
        if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 1) {
          booking.selectedCourtSchedules.forEach(scheduleKey => {
            const [courtName, schedule] = scheduleKey.split('-')
            const courtBooking = courtBookings.find(cb => cb.court === courtName && cb.schedule === schedule)
            
            let startTime: string | undefined
            if (courtBooking) {
              try {
                const { startTime: st } = parseScheduleToTimes(courtBooking.schedule)
                startTime = st
              } catch (e) {
                console.error('Error parsing schedule:', e)
              }
            }
            
            const equipmentItem = equipment.find(eq => eq.equipment_name === booking.equipment)
            const price = Number(equipmentItem?.price) || 100
            const timeMatch = booking.time.match(/(\d+(?:\.\d+)?)\s*hr/i)
            const hours = timeMatch ? parseFloat(timeMatch[1]) : 1
            const quantity = booking.quantity || 1
            const subtotalPerSchedule = price * hours * quantity
            
            expandedEquipmentBookings.push({
              equipment: booking.equipment,
              time: booking.time,
              subtotal: subtotalPerSchedule,
              quantity: quantity,
              startTime: startTime,
              selectedCourtSchedules: [scheduleKey]
            })
          })
        } else {
          let startTime: string | undefined
          if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 0) {
            const selectedBookings = courtBookings.filter(cb => 
              booking.selectedCourtSchedules?.includes(`${cb.court}-${cb.schedule}`)
            )
            if (selectedBookings.length > 0) {
              try {
                const { startTime: st } = parseScheduleToTimes(selectedBookings[0].schedule)
                startTime = st
              } catch (e) {
                console.error('Error parsing schedule:', e)
              }
            }
          } else if (courtBookings.length === 1) {
            try {
              const { startTime: st } = parseScheduleToTimes(courtBookings[0].schedule)
              startTime = st
            } catch (e) {
              console.error('Error parsing schedule:', e)
            }
          }
          
          expandedEquipmentBookings.push({
            equipment: booking.equipment,
            time: booking.time,
            subtotal: booking.subtotal,
            quantity: booking.quantity || 1,
            startTime: startTime,
            selectedCourtSchedules: booking.selectedCourtSchedules
          })
        }
      })

      const reservationData = {
        userId: user?.id || 1,
        selectedDate,
        courtBookings: courtBookings.map(booking => ({
          court: booking.court,
          schedule: booking.schedule,
          subtotal: booking.subtotal
        })),
        equipmentBookings: expandedEquipmentBookings,
        referenceNumber: referenceNumber,
        customerName: finalUserInfo.name,
        customerEmail: finalUserInfo.email,
        customerContact: finalUserInfo.contactNumber,
        paymentMethod: provider === 'gcash' ? 'GCash' : provider === 'paymaya' ? 'Maya' : 'GrabPay',
        isAdminCreated: true
      }

      const recalculatedTotalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                                      expandedEquipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

      const paymentData = {
        bookingData: reservationData,
        paymentId: `admin_qrph_${Date.now()}`,
        amount: recalculatedTotalAmount,
        paymentMethod: provider === 'gcash' ? 'GCash' : provider === 'paymaya' ? 'Maya' : 'GrabPay'
      }

      const response = await api.post('/reservations/from-payment', paymentData)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        toast.success(`Reservation created successfully with ${provider === 'gcash' ? 'GCash' : provider === 'paymaya' ? 'PayMaya' : 'GrabPay'} payment!`)
        setSelectedQrProvider(provider)
        setCurrentStep(5) // Redirect to booking summary
      } else {
        toast.error('Failed to create reservation')
      }
    } catch (error: any) {
      console.error('QR Ph payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to process payment. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle admin QR Ph payment (after QR code is scanned/paid)
  const handleProcessQrPhPayment = async () => {
    if (!selectedPaymentMethod || selectedPaymentMethod !== 'qrph') {
      toast.error('Please select QR Ph as payment method')
      return
    }

    if (!selectedQrProvider || !qrCodeData) {
      toast.error('Please generate a QR code first')
      return
    }

    setIsProcessingPayment(true)
    try {
      // Use customer info from admin input or default to 'admin' for name
      const finalUserInfo = {
        name: customerName.trim() || 'admin',
        email: customerEmail.trim() || user?.email || '',
        contactNumber: customerContact.trim() || user?.contact_number || ''
      }

      // Generate reference number if not already set
      if (!referenceNumber) {
        const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
        setReferenceNumber(refNumber)
      }

      // Prepare reservation data
      // Split equipment bookings with multiple schedules into separate bookings (one per schedule)
      // Each schedule should be a separate rental with its own price and stock reduction
      const expandedEquipmentBookings: any[] = []
      equipmentBookings.forEach(booking => {
        if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 1) {
          // Split into separate bookings for each schedule
          // Each schedule is a separate rental, so each should have the full price
          booking.selectedCourtSchedules.forEach(scheduleKey => {
            const [courtName, schedule] = scheduleKey.split('-')
            const courtBooking = courtBookings.find(cb => cb.court === courtName && cb.schedule === schedule)
            
            let startTime: string | undefined
            if (courtBooking) {
              try {
                const { startTime: st } = parseScheduleToTimes(courtBooking.schedule)
                startTime = st
              } catch (e) {
                console.error('Error parsing schedule:', e)
              }
            }
            
            // Calculate the price per schedule based on equipment price and time
            // Each schedule is a separate rental, so each should have the full price
            const equipmentItem = equipment.find(eq => eq.equipment_name === booking.equipment)
            const price = Number(equipmentItem?.price) || 100
            const timeMatch = booking.time.match(/(\d+(?:\.\d+)?)\s*hr/i)
            const hours = timeMatch ? parseFloat(timeMatch[1]) : 1
            const quantity = booking.quantity || 1
            // Each schedule gets the full price (price * hours * quantity) since it's a separate rental
            const subtotalPerSchedule = price * hours * quantity
            
            expandedEquipmentBookings.push({
              equipment: booking.equipment,
              time: booking.time,
              subtotal: subtotalPerSchedule,
              quantity: quantity,
              startTime: startTime,
              selectedCourtSchedules: [scheduleKey] // Single schedule per booking
            })
          })
        } else {
          // Single schedule or no schedules - keep as is
          let startTime: string | undefined
          if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 0) {
            const selectedBookings = courtBookings.filter(cb => 
              booking.selectedCourtSchedules?.includes(`${cb.court}-${cb.schedule}`)
            )
            if (selectedBookings.length > 0) {
              try {
                const { startTime: st } = parseScheduleToTimes(selectedBookings[0].schedule)
                startTime = st
              } catch (e) {
                console.error('Error parsing schedule:', e)
              }
            }
          } else if (courtBookings.length === 1) {
            try {
              const { startTime: st } = parseScheduleToTimes(courtBookings[0].schedule)
              startTime = st
            } catch (e) {
              console.error('Error parsing schedule:', e)
            }
          }
          
          expandedEquipmentBookings.push({
            equipment: booking.equipment,
            time: booking.time,
            subtotal: booking.subtotal,
            quantity: booking.quantity || 1,
            startTime: startTime,
            selectedCourtSchedules: booking.selectedCourtSchedules
          })
        }
      })

      const reservationData = {
        userId: user?.id || 1,
        selectedDate,
        courtBookings: courtBookings.map(booking => ({
          court: booking.court,
          schedule: booking.schedule,
          subtotal: booking.subtotal
        })),
        equipmentBookings: expandedEquipmentBookings,
        referenceNumber: referenceNumber,
        customerName: finalUserInfo.name,
        customerEmail: finalUserInfo.email,
        customerContact: finalUserInfo.contactNumber,
        paymentMethod: selectedQrProvider === 'gcash' ? 'GCash' : selectedQrProvider === 'paymaya' ? 'Maya' : 'GrabPay',
        isAdminCreated: true
      }

      // Recalculate total amount from expanded equipment bookings
      // This ensures the total reflects the split bookings (each schedule gets full price)
      const recalculatedTotalAmount = courtBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0) + 
                                      expandedEquipmentBookings.reduce((sum, booking) => sum + Number(booking.subtotal), 0)

      // Create reservations using createFromPayment endpoint with admin QR Ph payment
      // Use the source ID from the QR code generation
      const paymentData = {
        bookingData: reservationData,
        paymentId: qrCodeData.sourceId || `admin_qrph_${Date.now()}`,
        amount: recalculatedTotalAmount,
        paymentMethod: selectedQrProvider === 'gcash' ? 'GCash' : selectedQrProvider === 'paymaya' ? 'Maya' : 'GrabPay'
      }

      const response = await api.post('/reservations/from-payment', paymentData)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        toast.success('Reservation created successfully with QR Ph payment!')
        setCurrentStep(5)
      } else {
        toast.error('Failed to create reservation')
      }
    } catch (error: any) {
      console.error('QR Ph payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to process QR Ph payment. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Initialize cell statuses on component mount
  useEffect(() => {
    setCellStatuses(initializeCellStatuses())
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 scroll-smooth">
      {/* Add custom CSS for animations */}
      <style>{`
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
      
      {/* Admin Header */}
      <AdminHeader />
      
      {/* Main Content with Sidebar */}
      <div className="pt-16 sm:pt-18">
        <AdminSidebar 
          activeItem={activeSidebarItem} 
          onItemChange={setActiveSidebarItem}
        />

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn transition-all duration-300 md:ml-64">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl shadow-2xl border border-gray-200/60 p-8 sm:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                  </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-2">
                        Create Reservation
                      </h1>
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        Book a court for a customer and manage their reservation details
                      </p>
              </div>
            </div>
          </div>
        </div>
                  </div>
              </div>

          {/* Main Content */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 mx-auto" style={{ maxWidth: 'calc(72rem + 400px)' }}>
              {/* Step 1: Customer Info */}
              {currentStep === 1 && (
                <>
                  <div className="bg-gray-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 mb-4 sm:mb-6 shadow">
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold">Enter Customer Information</h2>
                    <p className="text-blue-100 text-[10px] sm:text-xs md:text-sm mt-1">
                      Customer name and email are required. Contact number is optional.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded">
                  <p className="text-sm text-blue-700">
                      Customer name and email are required. Contact number is optional.
                  </p>
                </div>

                  <div className="space-y-4">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      if (nameError) setNameError('')
                    }}
                    required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          nameError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter customer name"
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-600">{nameError}</p>
                  )}
                </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          emailError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter customer email"
                      />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Contact Number <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={customerContact}
                    onChange={(e) => {
                      // Only allow numbers and + sign
                      const input = e.target.value.replace(/[^\d+]/g, '')
                      // Format the phone number
                      const formatted = formatPHPhoneNumber(input)
                      setCustomerContact(formatted)
                    }}
                    maxLength={17} // +63 9XX XXX XXXX = 17 characters
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+63 9XX XXX XXXX"
                      />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
                  <button 
                    onClick={handleProceedFromCustomerInfo}
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    Proceed to Date Selection
                  </button>
                </div>
              </div>
                </>
              )}

              {/* Step 2: Date Selection */}
              {currentStep === 2 && (
                <>
                  <div className="bg-gray-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 mb-4 sm:mb-6 shadow">
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold">Select from the available dates below</h2>
                    <p className="text-blue-100 text-[10px] sm:text-xs md:text-sm mt-1">
                    Choose a date to proceed to court and time selection
                  </p>
                </div>
                
              {/* Rolling Date Selection */}
              <div className="bg-white rounded-lg ring-1 ring-gray-200 p-3 sm:p-4 md:p-6">
                <div className="mb-3 sm:mb-4 text-center">
                  <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">
                      Upcoming {DATE_WINDOW_DAYS} days
                    </span>
                  <span className="mt-1 block text-base sm:text-lg md:text-xl font-bold text-gray-800 tracking-tight">
                      {selectionWindowMonthLabel}
                    </span>
                  </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                     {dateOptions.map((date) => {
                       const isoDate = formatDateToISODate(date)
                       const isSelected = tempSelectedDate === isoDate
                       const isToday = date.toDateString() === today.toDateString()
                    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
                       
                       return (
                         <button
                           key={isoDate}
                           type="button"
                           onClick={() => handleDateSelection(isoDate, true)}
                        className={`relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 px-2 py-3 sm:px-4 sm:py-4 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                             isSelected
                               ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                               : 'border-orange-200 bg-white text-gray-900 shadow-sm hover:border-orange-400 hover:-translate-y-1 hover:shadow-lg'
                           }`}
                         >
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-orange-500">
                             {monthLabel}
                           </span>
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold leading-none mt-0.5 sm:mt-1">
                             {date.getDate()}
                           </span>
                        <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 line-clamp-1">
                             {dayOfWeek}
                           </span>
                           {isToday && (
                          <span className="mt-1 sm:mt-2 inline-flex items-center rounded-full bg-green-100 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-green-700">
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

               {/* Proceed Button for Step 2 */}
               <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <button 
                    onClick={() => handleBackToStep(1)}
                    className="flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-semibold w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button 
                    onClick={handleProceedFromDateSelection}
                   className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto max-w-xs sm:max-w-none"
                    disabled={!tempSelectedDate}
                  >
                    Proceed
                  </button>
                </div>
              </>
            )}

              {/* Step 3: Time & Court Selection */}
              {currentStep === 3 && (
                <>
                  {/* Section Header with Tabs inside */}
                  <div className="bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg -mx-6 -mt-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-base sm:text-lg font-medium">Select from the available time and court:</h2>
                  
                  {/* Tabs inside the header container */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
                      {tabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                        className={`px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
          <div className="mb-4 sm:mb-6 flex justify-center px-2">
                  {(() => {
                    const selectedDateDetails = getDateDisplayDetails(selectedDate)
                    const dayLabel = selectedDateDetails?.dayName ?? null
                    const formattedDate = selectedDateDetails?.formattedDate ?? selectedDate
                    const dayInitial = (dayLabel ?? selectedDate).charAt(0) || 'D'

                    return (
                <div className="flex w-full sm:max-w-lg flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-blue-200 bg-white/90 px-3 sm:px-5 py-3 sm:py-4 text-center shadow-[0_20px_45px_-20px_rgba(37,99,235,0.45)] ring-1 ring-blue-100 backdrop-blur">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 text-blue-600">
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <path d="M16 2v4" />
                              <path d="M8 2v4" />
                              <path d="M3 10h18" />
                              <path d="M9.5 16.5l1.5 1.5 4-4" />
                            </svg>
                          </span>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
                            Selected Date
                          </span>
                        </div>
                  <p className="text-sm sm:text-base md:text-lg font-semibold text-blue-700 break-words">
                    <span className="mr-1 sm:mr-2 rounded-full bg-blue-100 px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {dayLabel || dayInitial}
                          </span>
                    <span className="block sm:inline mt-1 sm:mt-0">{formattedDate}</span>
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
                <div className="mb-4 sm:mb-6 flex flex-wrap justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-green-200 bg-white px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-400">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                    <span className="font-medium text-gray-700 text-[10px] sm:text-xs md:text-sm">Available</span>
                        </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-500 bg-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 text-white shadow-sm">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-gray-600 text-white">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                          </span>
                    <span className="font-medium text-[10px] sm:text-xs md:text-sm">Reserved</span>
                        </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-yellow-500 bg-yellow-300 px-2 sm:px-3 py-1 sm:py-1.5 text-black shadow-sm">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-yellow-400 text-yellow-900">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 3h2l.4 2M5 7h14l1 5H4l1-5z" />
                              <path d="M7 13v6h10v-6" />
                              <path d="M10 17h4" />
                            </svg>
                          </span>
                    <span className="font-medium text-[10px] sm:text-xs md:text-sm">Maintenance</span>
                        </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-400 bg-green-200 px-2 sm:px-3 py-1 sm:py-1.5 text-gray-900 shadow-sm">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-green-500 text-white">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 17l5 3-1.9-5.9L19 9l-6-.2L12 3l-1 5.8L5 9l3.9 5.1L7 20z" />
                            </svg>
                          </span>
                    <span className="font-medium text-[10px] sm:text-xs md:text-sm">Selected</span>
                        </div>
                      </div>

                {/* Mobile-friendly cards */}
                <div className="sm:hidden space-y-3">
                        {generateTimeSlots().map((timeSlot) => (
                    <div key={timeSlot.id} className="rounded-lg ring-1 ring-gray-200 overflow-hidden">
                      <div className="bg-gray-100 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700">{timeSlot.display}</div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3">
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
                              className={`flex flex-col gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-left text-xs transition-all duration-200 ${config.containerClass} disabled:cursor-not-allowed disabled:opacity-85 disabled:shadow-none disabled:transform-none ${
                                canInteract ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 active:scale-[0.99]' : 'opacity-95'
                              }`}
                            >
                              <div className="flex items-start sm:items-center justify-between gap-1.5 sm:gap-2">
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">{court.Court_Name}</span>
                                <div className="flex-shrink-0">{renderStatusBadge(displayState)}</div>
                                    </div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-1 sm:gap-2">
                                <span className={`${config.priceClass} text-xs sm:text-sm`}>{formatCurrency(court.Price)}</span>
                                <span className={`${config.helperClass} text-[9px] sm:text-[10px]`}>{config.helperText}</span>
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
                     <ShuttlecockLoader size="md" />
                     <p className="mt-4 text-gray-600">Loading courts...</p>
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
                     <ShuttlecockLoader size="md" />
                     <p className="mt-4 text-gray-600">Loading availability data...</p>
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
              <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-blue-100/50 shadow-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">
                        Equipment Rental Information
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Equipment rental rates vary by item. Select a racket below to view detailed specifications and configure your rental time and quantity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
                    {loading ? (
                      <div className="text-center py-8">
                  <ShuttlecockLoader size="md" />
                  <p className="mt-4 text-gray-600">Loading equipment...</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  {equipment.map((item, index) => {
                    // Get availability: if schedule cells are selected, use schedule-specific availability, otherwise use default stocks from admin
                    const availableStock = selectedCells.size > 0 && equipmentAvailability.has(item.id)
                      ? equipmentAvailability.get(item.id) ?? 0
                      : (item.stocks ?? 0)
                    
                    const isOutOfStock = availableStock === 0
                    const isSelected = isRacketBooked(item.equipment_name)
                    
                    return (
                          <div
                            key={item.id}
                      className={`relative h-auto min-h-[300px] sm:h-80 md:h-88 lg:h-96 animate-fade-in ${
                        isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer group'
                      }`}
                            style={{ animationDelay: `${index * 80}ms` }}
                            onClick={() => {
                              if (!isOutOfStock) {
                                handleRacketClick(item.equipment_name)
                              }
                            }}
                          >
                      <div className={`relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-7 h-full flex flex-col justify-between items-center transition-all duration-700 ease-out shadow-lg hover:shadow-2xl ${
                        isSelected 
                          ? 'border-emerald-400 ring-4 ring-emerald-200/60 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 shadow-emerald-300/50 hover:scale-[1.02] hover:-translate-y-1' 
                          : isOutOfStock
                            ? 'border-gray-200 bg-gradient-to-br from-white via-gray-50 to-blue-50'
                            : 'border-blue-200/60 hover:border-blue-400 hover:from-blue-50 hover:via-purple-50/30 hover:to-blue-100 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-blue-300/50 active:scale-[0.98]'
                            }`}>
                        {/* Premium Badge */}
                        {!isOutOfStock && availableStock > 5 && (
                          <div className="absolute -top-2 sm:-top-3 left-2 sm:left-3 z-20 bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-500 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-full shadow-xl border-2 border-white/50 backdrop-blur-sm animate-pulse">
                                      Popular
                                    </div>
                                  )}
                                  
                        {/* Stock Badge */}
                        {availableStock > 0 && (
                          <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 z-20 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs sm:text-sm font-extrabold rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shadow-xl border-2 border-white/50 backdrop-blur-sm animate-bounce">
                            {availableStock}
                                    </div>
                                  )}
                                  
                        {/* Equipment Image Container */}
                        <div className="flex-1 flex items-center justify-center w-full mb-3 sm:mb-4 relative">
                          <div className="relative group/image w-full h-32 sm:h-36 md:h-40 lg:h-44">
                            {/* Glow effect - only for available items */}
                            {!isOutOfStock && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
                            )}
                            
                            <div className={`relative w-full h-full bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden transition-all duration-700 ${
                              !isOutOfStock ? 'group-hover:shadow-2xl group-hover:shadow-blue-300/30' : ''
                            }`}>
                                        <img
                                src={item.image_path ? resolveImageUrl(item.image_path) : '/assets/img/equipments/racket-removebg-preview.png'}
                                          alt={item.equipment_name}
                                className={`w-full h-full object-contain object-center transition-all duration-700 ${
                                  !isOutOfStock ? 'group-hover:scale-110 group-hover:rotate-3' : ''
                                }`}
                                          style={{
                                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))',
                                            background: 'transparent'
                                          }}
                                        />
                              
                              {/* Shimmer effect on hover - only for available items */}
                              {!isOutOfStock && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                              )}
                                      </div>
                            
                            {/* Floating particles effect - only for available items */}
                            {!isOutOfStock && (
                              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                                <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                                <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.3s'}}></div>
                                <div className="absolute bottom-4 left-5 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.6s'}}></div>
                                <div className="absolute bottom-6 right-3 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.9s'}}></div>
                                      </div>
                            )}
                                    </div>
                                  </div>
                                  
                        {/* Equipment Info */}
                        <div className="w-full text-center space-y-3 sm:space-y-4">
                          <h3 className={`font-extrabold text-sm sm:text-base md:text-lg lg:text-xl line-clamp-2 transition-all duration-500 px-2 ${
                            isOutOfStock 
                              ? 'text-gray-600' 
                              : isSelected
                                ? 'text-emerald-700 group-hover:text-emerald-800'
                                : 'text-gray-800 group-hover:text-blue-600 transform group-hover:scale-105'
                          }`}>
                                      {item.equipment_name}
                                    </h3>
                                    
                          {/* Stock Status with Enhanced Animation */}
                          <div className="flex items-center justify-center space-x-2 sm:space-x-2.5">
                            <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full animate-pulse shadow-lg ${
                              availableStock > 0 
                                ? 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-300/60' 
                                : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-red-300/60'
                                      }`}></div>
                            <p className={`text-[11px] sm:text-xs md:text-sm font-semibold line-clamp-1 ${
                              isOutOfStock 
                                ? 'text-rose-600' 
                                : availableStock > 0 
                                  ? 'text-gray-700' 
                                  : 'text-gray-600'
                            }`}>
                              {availableStock > 0 ? `${availableStock} available${courtBookings.length > 0 ? ' for selected schedule' : ''}` : 'Out of stock'}
                                      </p>
                                    </div>
                                    
                          {/* Enhanced Price Display */}
                          <div className={`rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 border-2 shadow-md transition-all duration-500 ${
                            isOutOfStock
                              ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-gray-200/50'
                              : isSelected
                                ? 'bg-gradient-to-r from-emerald-100 via-green-50 to-emerald-100 border-emerald-300 shadow-emerald-200/50 group-hover:shadow-lg group-hover:border-emerald-400'
                                : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border-blue-300 shadow-blue-200/50 group-hover:shadow-xl group-hover:border-blue-400 group-hover:from-blue-100 group-hover:to-indigo-100'
                          }`}>
                            <p className={`text-sm sm:text-base md:text-lg font-extrabold tracking-tight ${
                              isOutOfStock 
                                ? 'text-gray-500' 
                                : isSelected
                                  ? 'text-emerald-700 group-hover:text-emerald-800'
                                  : 'text-blue-700 group-hover:text-blue-800'
                            }`}>
                                        ₱{item.price}/hour
                                      </p>
                                    </div>
                                  </div>
                                  
                        {/* Enhanced Hover Overlay - Only show if not out of stock */}
                        {!isOutOfStock && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 rounded-3xl transition-all duration-700 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-110 group-hover:rotate-12">
                              <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-2xl border-2 border-blue-300/50">
                                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                        )}
                                  
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-xl border-2 border-white/50 backdrop-blur-sm animate-pulse">
                            <span className="flex items-center gap-1.5 drop-shadow-lg">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                                      Selected
                            </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                    )
                  })}
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
                      {courtBookings.map((booking, index) => {
                        // Ensure each court-time combination is displayed as a separate row
                        console.log(`[BookingPage] Displaying booking ${index + 1}:`, {
                          court: booking.court,
                          schedule: booking.schedule,
                          subtotal: booking.subtotal
                        })
                        return (
                          <tr key={`${booking.court}-${booking.schedule}-${index}`}>
                            <td className="border border-gray-300 px-4 py-2 font-medium">{booking.court}</td>
                                <td className="border border-gray-300 px-4 py-2">{booking.schedule}</td>
                            <td className="border border-gray-300 px-4 py-2 font-medium">₱{booking.subtotal.toLocaleString()}</td>
                              </tr>
                        )
                      })}
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
                        <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
                        {courtBookings.length > 1 && (
                          <th className="border border-gray-300 px-4 py-2 text-left">For Court Schedule(s)</th>
                        )}
                              <th className="border border-gray-300 px-4 py-2 text-left">Sub total</th>
                            </tr>
                          </thead>
                          <tbody>
                      {equipmentBookings.map((booking, index) => {
                        // Get the court schedules this equipment is associated with
                        const associatedSchedules = booking.selectedCourtSchedules 
                          ? courtBookings.filter(cb => 
                              booking.selectedCourtSchedules?.includes(`${cb.court}-${cb.schedule}`)
                            )
                          : courtBookings.length === 1 
                            ? [courtBookings[0]]
                            : []
                        
                        return (
                              <tr key={index}>
                                <td className="border border-gray-300 px-4 py-2">{booking.equipment}</td>
                          <td className="border border-gray-300 px-4 py-2">{booking.quantity || 1}</td>
                                <td className="border border-gray-300 px-4 py-2">{booking.time}</td>
                            {courtBookings.length > 1 && (
                              <td className="border border-gray-300 px-4 py-2">
                                {associatedSchedules.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {associatedSchedules.map((schedule, idx) => (
                                      <span 
                                        key={idx}
                                        className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
                                      >
                                        {schedule.court} - {schedule.schedule}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Not specified</span>
                                )}
                              </td>
                            )}
                            <td className="border border-gray-300 px-4 py-2">{formatCurrency(booking.subtotal)}</td>
                          </tr>
                        )
                      })}
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
               <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 sm:space-x-4 mt-6 sm:mt-8 px-2">
                  <button
                   onClick={() => {
                     const prevStep = currentStep > 1 ? currentStep - 1 : 1
                     handleBackToStep(prevStep)
                   }}
                   className="flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    if (courtBookings.length === 0) {
                      toast.error('Select time and court number to proceed')
                      return
                    }
                    // Generate reference number when proceeding to payment step
                    if (!referenceNumber) {
                      const refNumber = Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
                      setReferenceNumber(refNumber)
                    }
                    setCurrentStep(4)
                    }}
                   className="bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base w-full sm:w-auto"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            )}

          {/* Step 4: Admin Payment Summary */}
          {currentStep === 4 && (
            <>
              {/* Header */}
              <div className="bg-gray-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg mb-4 shadow">
                <h2 className="text-lg sm:text-xl font-semibold">Admin Payment Summary</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Review reservation details and select payment method
                </p>
                </div>

              {/* Main Content */}
              <div className="space-y-4">
                {/* Selected Date and Reference Number in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Selected Date */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Selected Date</span>
                      <span className="text-base font-bold text-gray-900">{selectedDate}</span>
                    </div>
                  </div>

                {/* Reference Number */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Reference Number</p>
                        <p className="text-sm font-bold text-gray-900 font-mono truncate">{referenceNumber || 'Generating...'}</p>
                      </div>
                  </div>
                  </div>
                </div>

                {/* Booking Summary */}
                  <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Booking Summary
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">No.</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">Schedule</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          // Build rows: courts first, then equipment
                          const rows: Array<{ type: 'court' | 'equipment', data: any }> = []

                          // Add court bookings
                          courtBookings.forEach(booking => {
                            rows.push({ type: 'court', data: booking })
                          })

                          // Add equipment bookings - each booking is already associated with a specific schedule
                          equipmentBookings.forEach(booking => {
                            // Get the associated court schedule for this booking
                            // Since each booking with multiple schedules creates separate bookings (one per schedule),
                            // each booking's selectedCourtSchedules should have only one entry
                            let scheduleDisplay = booking.time // Default fallback
                            
                            if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 0) {
                              // Get the first (and typically only) associated schedule
                              const scheduleKey = booking.selectedCourtSchedules[0]
                              const [courtName, schedule] = scheduleKey.split('-')
                              const courtBooking = courtBookings.find(cb => cb.court === courtName && cb.schedule === schedule)
                              if (courtBooking) {
                                scheduleDisplay = `${courtName} • ${schedule}`
                              }
                            } else if (courtBookings.length === 1) {
                              // Single court booking - associate with it
                              scheduleDisplay = `${courtBookings[0].court} • ${courtBookings[0].schedule}`
                            }

                            rows.push({
                              type: 'equipment',
                              data: {
                                equipment: booking.equipment,
                                quantity: booking.quantity || 1,
                                time: booking.time,
                                schedule: scheduleDisplay,
                                subtotal: booking.subtotal
                              }
                            })
                          })

                          return rows.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 border border-gray-300">{index + 1}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300">
                                {row.type === 'court' ? (
                                  row.data.court
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{row.data.equipment}</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                                      {row.data.time.replace(' hr', 'h')}
                                      {row.data.quantity && row.data.quantity > 1 ? ` x${row.data.quantity}` : ''}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                                {row.type === 'court' ? row.data.schedule : row.data.schedule}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-blue-600 border border-gray-300">
                                {formatCurrency(row.data.subtotal)}
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Details */}
                  <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Payment Details
                  </h3>
                  <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(totalAmount)}
                      </span>
                  </div>
                    </div>
                </div>

                {/* Payment Methods */}
                    <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Select Payment Method
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Cash Payment */}
                    <button
                      onClick={() => {
                        setSelectedPaymentMethod('cash')
                        setSelectedQrProvider(null)
                        setQrCodeData(null)
                      }}
                      className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                        selectedPaymentMethod === 'cash'
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                          : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-base font-semibold text-gray-700">Cash Payment</span>
                        <span className="text-xs text-gray-500 mt-0.5">Process cash transaction</span>
                      </div>
                    </button>

                    {/* QR Ph Payment */}
                    <button
                      onClick={() => {
                        setSelectedPaymentMethod('qrph')
                        setShowQrProviderModal(true)
                      }}
                      className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                        selectedPaymentMethod === 'qrph'
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-base font-semibold text-gray-700">QR Ph Payment</span>
                        <span className="text-xs text-gray-500 mt-0.5">Process QR Ph transaction</span>
                      </div>
                    </button>
                  </div>

                  {/* QR Code Display - Show when QR code is generated */}
                  {selectedPaymentMethod === 'qrph' && selectedQrProvider && qrCodeData && (
                    <div className="mt-4 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1.5">
                          <img 
                            src={selectedQrProvider === 'gcash' 
                              ? '/assets/PAYMENT METHOD IMAGE/GCASH.png'
                              : selectedQrProvider === 'paymaya'
                              ? '/assets/PAYMENT METHOD IMAGE/maya.jpg'
                              : '/assets/PAYMENT METHOD IMAGE/Grabpay.png'
                            } 
                            alt={selectedQrProvider === 'gcash' ? 'GCash' : selectedQrProvider === 'paymaya' ? 'PayMaya' : 'GrabPay'} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 text-center">
                          Scan QR Code to Pay via {selectedQrProvider === 'gcash' ? 'GCash' : selectedQrProvider === 'paymaya' ? 'PayMaya' : 'GrabPay'}
                        </h4>
                      </div>
                      <div className="flex justify-center mb-4">
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                          <img 
                            src={qrCodeData.qrCode} 
                            alt="QR Code" 
                            className="w-64 h-64 object-contain"
                            onError={(e) => {
                              // Fallback if QR code image fails to load
                              const target = e.target as HTMLImageElement
                              target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData.qrCode)}`
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 text-center">
                        Amount: {formatCurrency(totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Scan this QR code with your {selectedQrProvider === 'gcash' ? 'GCash' : selectedQrProvider === 'paymaya' ? 'PayMaya' : 'GrabPay'} app to complete payment
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-gray-200 mt-4">
                  <button
                    onClick={() => handleBackToStep(3)}
                    disabled={isProcessingPayment}
                    className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  {selectedPaymentMethod === 'cash' && (
                  <button
                    onClick={handleProcessCashPayment}
                      disabled={isProcessingPayment}
                      className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm Cash Payment
                  </button>
                  )}
                  {selectedPaymentMethod === 'qrph' && qrCodeData && (
                  <button
                      onClick={handleProcessQrPhPayment}
                      disabled={isProcessingPayment}
                      className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confirm QR Ph Payment
                    </button>
                  )}
                  {!selectedPaymentMethod && (
                    <button
                      disabled
                      className="flex items-center justify-center px-8 py-3 bg-gray-400 text-white rounded-xl font-semibold cursor-not-allowed"
                    >
                      Select Payment Method
                    </button>
                  )}
                </div>
                </div>
              </>
            )}

          {/* Step 5: Completed */}
          {currentStep === 5 && (
            <div className="max-w-4xl mx-auto">
              {/* Success Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reservation Created Successfully</h2>
                <p className="text-gray-600 text-lg">The reservation has been successfully created for the customer</p>
              </div>

              {/* Confirmation Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
                {/* Reference Number */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                        <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reference Number</p>
                      <p className="text-xl font-bold text-gray-900 font-mono">{referenceNumber}</p>
                        </div>
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                        </div>
                      </div>

                {/* Customer Information */}
                {(customerName.trim() || customerEmail.trim() || customerContact.trim()) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {customerName.trim() && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-gray-900">{customerName}</p>
                        </div>
                      )}
                      {customerEmail.trim() && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{customerEmail}</p>
                        </div>
                      )}
                      {customerContact.trim() && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                          <p className="text-gray-900">{customerContact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                            Booking Summary
                          </h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Date</p>
                    <p className="text-lg font-bold text-gray-900">{selectedDate}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">No.</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">Schedule</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...courtBookings, ...equipmentBookings].map((booking, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border border-gray-300">{index + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border border-gray-300">
                              {'court' in booking ? booking.court : booking.equipment}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                              {'schedule' in booking ? booking.schedule : booking.time}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 border border-gray-300">
                              {formatCurrency(booking.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                        </div>

                {/* Payment Details */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalAmount)}
                    </span>
                            </div>
                  {selectedPaymentMethod && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedPaymentMethod === 'cash' 
                          ? 'Cash' 
                          : selectedQrProvider 
                            ? (selectedQrProvider === 'gcash' ? 'GCash' : selectedQrProvider === 'paymaya' ? 'PayMaya' : 'GrabPay')
                            : 'QR Ph'}
                      </span>
                    </div>
                  )}
                            </div>
                          </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => {
                    // Reset all states for a new reservation
                    setCurrentStep(1)
                    setCustomerName('')
                    setCustomerEmail('')
                    setCustomerContact('')
                    setSelectedDate('')
                    setTempSelectedDate('')
                    setCourtBookings([])
                    setEquipmentBookings([])
                    setSelectedCells(new Set())
                    setReferenceNumber('')
                    setSelectedPaymentMethod(null)
                  }}
                  className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors text-base"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Another Reservation
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors text-base"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
                      </div>
          </div>
        </main>
                        </div>

      {/* Booking Details Modal */}
      <RacketConfigurationModal
        isOpen={selectedRacketForModal !== null}
        onClose={() => {
          setSelectedRacketForModal(null)
          // Reset selected court schedules when closing
          setSelectedCourtSchedulesForRacket(new Set())
        }}
        equipment={selectedRacketForModal}
        initialQuantity={selectedRacketForModal ? (racketQuantities.get(selectedRacketForModal.equipment_name) || 0) : 0}
        initialTime={(() => {
          // If there are court bookings, use the reservation duration
          // Otherwise, use stored time or default to 1
          if (courtBookings.length > 0) {
            return calculateReservationDuration()
          }
          return selectedRacketForModal ? (racketTimes.get(selectedRacketForModal.equipment_name) || 1) : 1
        })()}
        maxTime={(() => {
          // Calculate max time based on selected schedules
          if (!selectedRacketForModal) return undefined
          const existingBooking = equipmentBookings.find(b => b.equipment === selectedRacketForModal.equipment_name)
          const schedulesToUse = existingBooking?.selectedCourtSchedules || 
            (selectedCourtSchedulesForRacket.size > 0 
              ? Array.from(selectedCourtSchedulesForRacket)
              : courtBookings.length === 1 
                ? [`${courtBookings[0].court}-${courtBookings[0].schedule}`]
                : [])
          
          if (schedulesToUse.length > 0) {
            return getMinScheduleDuration(schedulesToUse)
          } else if (courtBookings.length === 1) {
            return calculateScheduleDuration(courtBookings[0].schedule)
          } else if (courtBookings.length > 1) {
            const allDurations = courtBookings.map(cb => calculateScheduleDuration(cb.schedule))
            return Math.min(...allDurations)
          }
          return undefined
        })()}
        scheduleSpecificAvailability={
          // Only show reduced availability if schedule cells are selected AND availability has been calculated
          selectedRacketForModal && selectedCells.size > 0 && courtBookings.length > 0 && equipmentAvailability.has(selectedRacketForModal.id)
            ? equipmentAvailability.get(selectedRacketForModal.id) ?? undefined
            : undefined
        }
        onConfirm={(quantity, time) => {
          if (selectedRacketForModal) {
            handleRacketModalConfirm(selectedRacketForModal.equipment_name, quantity, time)
            // Reset selected court schedules after confirmation
            setSelectedCourtSchedulesForRacket(new Set())
          }
        }}
        resolveImageUrl={resolveImageUrl}
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

      {/* Modal: Require court and time selection before racket rental */}
      {showCourtTimeRequiredModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-orange-600 text-white px-6 py-4 font-semibold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Select Court and Time First</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">Please select a court and time first</p>
                  <p className="text-gray-600 text-sm">
                    Before you can rent a racket, you need to select a date, court, and time slot for your booking.
                              </p>
                            </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Steps to follow:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Select a date from the calendar</li>
                  <li>Choose a court and time slot</li>
                  <li>Then you can add racket rentals</li>
                </ol>
                            </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowCourtTimeRequiredModal(false)} 
                  className="px-6 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium"
                >
                  Got it
                </button>
                          </div>
                        </div>
                      </div>
        </div>
      )}

      {/* Modal: Select court schedule(s) for racket rental */}
      {showCourtScheduleSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4 font-semibold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Select Court Schedule(s) for Racket Rental</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">
                    You have selected multiple court schedules
                  </p>
                  <p className="text-gray-600 text-sm">
                    Please select which court schedule(s) you want to use this racket for. You can select one or both schedules.
                                </p>
                              </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Available Court Schedules:</p>
                  {courtBookings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = selectedCourtSchedulesForRacket.size === courtBookings.length
                        if (allSelected) {
                          setSelectedCourtSchedulesForRacket(new Set())
                        } else {
                          const allSchedules = new Set(courtBookings.map(b => `${b.court}-${b.schedule}`))
                          setSelectedCourtSchedulesForRacket(allSchedules)
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      {selectedCourtSchedulesForRacket.size === courtBookings.length ? 'Deselect All' : 'Select All'}
                    </button>
                            )}
                          </div>
                <div className="space-y-2">
                  {courtBookings.map((booking, index) => {
                    const scheduleKey = `${booking.court}-${booking.schedule}`
                    const isSelected = selectedCourtSchedulesForRacket.has(scheduleKey)
                    
                    return (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedCourtSchedulesForRacket)
                            if (e.target.checked) {
                              newSet.add(scheduleKey)
                            } else {
                              newSet.delete(scheduleKey)
                            }
                            setSelectedCourtSchedulesForRacket(newSet)
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{booking.court}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-700">{booking.schedule}</span>
                              </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Subtotal: {formatCurrency(booking.subtotal)}
                                </p>
                              </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                            )}
                      </label>
                    )
                  })}
                          </div>
                        </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The racket rental will be associated with the selected court schedule(s). 
                  You can select multiple schedules if you want to use the racket for all of them.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                          <button
                  onClick={() => {
                    setShowCourtScheduleSelectionModal(false)
                    setPendingRacketForScheduleSelection(null)
                    setSelectedCourtSchedulesForRacket(new Set())
                  }}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                          </button>
                          <button
                  onClick={handleCourtScheduleSelectionConfirm}
                  className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                          >
                  Continue
                          </button>
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
                  <strong>Note:</strong> This slot may have been booked in a previous session. The page will refresh to show the latest availability. 
                  If you believe this is an error, please check your existing reservations or contact support.
                </p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    setShowDuplicateModal(false)
                    // Refresh availability data to show updated reservation status
                    if (selectedDate) {
                      loadAvailabilityData(selectedDate)
                    }
                  }} 
                  className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Provider Selection Modal */}
      {showQrProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideDown">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Select from the available cashless payment</h3>
              <button
                onClick={() => {
                  setShowQrProviderModal(false)
                  if (!selectedQrProvider) {
                    setSelectedPaymentMethod(null)
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Provider Options */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* GCash */}
              <button
                onClick={() => {
                  setSelectedProviderForPreview('gcash')
                  setShowQrProviderModal(false) // Close wallet selection modal
                  setShowSampleQrModal(true) // Open QR code modal
                }}
                disabled={isProcessingPayment}
                className="p-6 border-2 border-gray-300 rounded-xl bg-white hover:border-green-500 hover:bg-green-50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/GCASH.png" 
                    alt="GCash" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-lg font-semibold text-gray-900 block">GCash</span>
                  <span className="text-sm text-gray-500">Pay using GCash QR code</span>
                </div>
              </button>

              {/* PayMaya */}
              <button
                onClick={() => {
                  setSelectedProviderForPreview('paymaya')
                  setShowQrProviderModal(false) // Close wallet selection modal
                  setShowSampleQrModal(true) // Open QR code modal
                }}
                disabled={isProcessingPayment}
                className="p-6 border-2 border-gray-300 rounded-xl bg-white hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/maya.jpg" 
                    alt="PayMaya" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-lg font-semibold text-gray-900 block">PayMaya</span>
                  <span className="text-sm text-gray-500">Pay using PayMaya QR code</span>
                </div>
              </button>

              {/* GrabPay */}
              <button
                onClick={() => {
                  setSelectedProviderForPreview('grab_pay')
                  setShowQrProviderModal(false) // Close wallet selection modal
                  setShowSampleQrModal(true) // Open QR code modal
                }}
                disabled={isProcessingPayment}
                className="p-6 border-2 border-gray-300 rounded-xl bg-white hover:border-orange-500 hover:bg-orange-50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/Grabpay.png" 
                    alt="GrabPay" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-lg font-semibold text-gray-900 block">GrabPay</span>
                  <span className="text-sm text-gray-500">Pay using GrabPay QR code</span>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowQrProviderModal(false)
                  if (!selectedQrProvider) {
                    setSelectedPaymentMethod(null)
                  }
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample QR Code Preview Modal */}
      {showSampleQrModal && selectedProviderForPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slideDown">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedProviderForPreview === 'gcash' ? 'GCash' : selectedProviderForPreview === 'paymaya' ? 'PayMaya' : 'GrabPay'} QR Code
              </h3>
              <button
                onClick={() => {
                  setShowSampleQrModal(false)
                  setSelectedProviderForPreview(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white p-8 rounded-xl shadow-lg mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${selectedProviderForPreview.toUpperCase()}_SAMPLE_${totalAmount}`)}`}
                  alt={`${selectedProviderForPreview === 'gcash' ? 'GCash' : selectedProviderForPreview === 'paymaya' ? 'PayMaya' : 'GrabPay'} QR Code`}
                  className="w-80 h-80 object-contain"
                />
              </div>
              <p className="text-base text-gray-600 text-center">
                Amount: <span className="font-semibold text-lg">{formatCurrency(totalAmount)}</span>
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSampleQrModal(false)
                  setSelectedProviderForPreview(null)
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Close the modal immediately
                  const provider = selectedProviderForPreview
                  setShowSampleQrModal(false)
                  setSelectedProviderForPreview(null)
                  
                  // Process payment and redirect to booking summary
                  // The loading screen will automatically show because isProcessingPayment will be true
                  if (provider) {
                    // Use setTimeout to ensure modal closes before processing starts
                    setTimeout(async () => {
                      await handleProcessQrPhPaymentWithProvider(provider)
                    }, 100)
                  }
                }}
                disabled={isProcessingPayment}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Payment Received
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen Overlay */}
      {isProcessingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-md w-full mx-4 flex flex-col items-center">
            <ShuttlecockLoader size="lg" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 mb-2">
              Processing Payment
            </h3>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              Please wait while we process your payment...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


