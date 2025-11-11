import api from './api'

// Types based on backend entities
export interface Court {
  Court_Id: number
  Court_Name: string
  Status: 'Available' | 'Maintenance'
  Price: number
  Created_at: string
  Updated_at: string
}

export interface Equipment {
  id: number
  equipment_name: string
  stocks: number
  price: number
  status: string
  image_path: string
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface Reservation {
  Reservation_Id: number
  User_ID: number
  Court_ID: number
  Reservation_Date: string
  Start_Time: string
  End_Time: string
  Total_Amount: number
  Status: string
  Reference_Number: string
  Notes?: string
  Created_at: string
  Updated_at: string
}

// API Service Functions
export const apiServices = {
  // Courts
  async getCourts(): Promise<Court[]> {
    const response = await api.get('/courts')
    return response.data
  },

  async getAvailableCourts(): Promise<Court[]> {
    const response = await api.get('/courts/available')
    return response.data
  },

  async getCourtById(id: number): Promise<Court> {
    const response = await api.get(`/courts/${id}`)
    return response.data
  },

  async getCourtCount(): Promise<number> {
    const response = await api.get('/courts/count')
    return response.data
  },

  async getAvailableCourtCount(): Promise<number> {
    const response = await api.get('/courts/available-count')
    return response.data
  },

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    const response = await api.get('/equipment')
    return response.data
  },

  async getAvailableEquipment(): Promise<Equipment[]> {
    const response = await api.get('/equipment/available')
    return response.data
  },

  async getEquipmentById(id: number): Promise<Equipment> {
    const response = await api.get(`/equipment/${id}`)
    return response.data
  },

  // Time Slots
  async getTimeSlots(): Promise<TimeSlot[]> {
    const response = await api.get('/time-slots')
    return response.data
  },

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    const response = await api.get('/reservations')
    return response.data
  },

  async getMyReservations(): Promise<Reservation[]> {
    const response = await api.get('/reservations/my')
    return response.data
  },

  async getAvailability(courtId: number, date: string) {
    const response = await api.get(`/reservations/availability?courtId=${courtId}&date=${date}`)
    return response.data
  },

  async createReservation(data: any) {
    const response = await api.post('/reservations', data)
    return response.data
  }
}
