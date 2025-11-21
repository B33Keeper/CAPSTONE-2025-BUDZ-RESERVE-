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
  unit?: string
  weight?: string
  tension?: string
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

export interface QueuePlayer {
  id: number
  name: string
  sex: 'male' | 'female'
  skill: 'Beginner' | 'Intermediate' | 'Advanced'
  gamesPlayed: number
  status: 'In Queue' | 'Waiting' | 'In Match'
  createdAt: string
  updatedAt: string
  lastPlayed: string | null
}

export interface QueuePlayerHistory {
  id: number
  userId: number
  originalId: number
  name: string
  sex: 'male' | 'female'
  skill: 'Beginner' | 'Intermediate' | 'Advanced'
  gamesPlayed: number
  status: 'In Queue' | 'Waiting' | 'In Match'
  lastPlayed: string | Date | null
  createdAt: string
  updatedAt: string
  archivedAt: string | Date
}

export type QueueingCourtStatus = 'available' | 'occupied' | 'maintenance' | 'unavailable'

export interface QueueingCourt {
  id: number
  name: string
  status: QueueingCourtStatus
  createdAt: string
  updatedAt: string
}

export type QueueMatchStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type QueueMatchGameType = 'mens-doubles' | 'womens-doubles' | 'mixed-doubles'

export interface QueueMatchPlayer {
  id: number
  name: string
  sex: 'male' | 'female'
  skill: 'Beginner' | 'Intermediate' | 'Advanced'
}

export interface QueueMatch {
  id: number
  gameType: QueueMatchGameType
  status: QueueMatchStatus
  teamA: QueueMatchPlayer[]
  teamB: QueueMatchPlayer[]
  courtId: number | null
  courtName: string | null
  startedAt: string | null
  completedAt: string | null
  winner: 'teamA' | 'teamB' | 'draw' | null
  createdAt: string
  updatedAt: string
}

export interface QueueMatchHistory {
  id: number
  userId: number
  originalId: number
  gameType: QueueMatchGameType
  teamA: QueueMatchPlayer[]
  teamB: QueueMatchPlayer[]
  courtId: number | null
  courtName: string | null
  startedAt: string | Date | null
  completedAt: string | Date | null
  winner: 'teamA' | 'teamB' | 'draw' | null
  createdAt: string
  updatedAt: string
  archivedAt: string | Date
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

  async getQueueingCourts(): Promise<QueueingCourt[]> {
    const response = await api.get('/queueing-courts')
    return response.data
  },

  async createQueueingCourt(payload: { name: string; status?: QueueingCourtStatus }): Promise<QueueingCourt> {
    const response = await api.post('/queueing-courts', payload)
    return response.data
  },

  async deleteQueueingCourt(id: number): Promise<void> {
    await api.delete(`/queueing-courts/${id}`)
  },

  async clearQueueingCourts(): Promise<void> {
    await api.delete('/queueing-courts')
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
  },

  // Queue Players
  async getQueuePlayers(): Promise<QueuePlayer[]> {
    const response = await api.get('/queue-players')
    return response.data
  },

  async getQueuePlayersHistory() {
    const response = await api.get('/queue-players/history')
    return response.data
  },

  async migratePlayers() {
    const response = await api.post('/queue-players/migrate')
    return response.data
  },

  async createQueuePlayer(data: {
    name: string
    sex: 'male' | 'female'
    skill: 'Beginner' | 'Intermediate' | 'Advanced'
    status?: 'In Queue' | 'Waiting'
    lastPlayed?: string
  }) {
    const response = await api.post('/queue-players', data)
    return response.data
  },

  async updateQueuePlayer(
    id: number,
    data: {
      name: string
      sex: 'male' | 'female'
      skill: 'Beginner' | 'Intermediate' | 'Advanced'
      status?: 'In Queue' | 'Waiting'
    }
  ) {
    const response = await api.patch(`/queue-players/${id}`, data)
    return response.data
  },

  async deleteQueuePlayer(id: number) {
    await api.delete(`/queue-players/${id}`)
  },

  async savePlayersToHistory() {
    const response = await api.post('/queue-players/save-to-history')
    return response.data
  },

  async clearPlayersHistory() {
    const response = await api.delete('/queue-players/history')
    return response.data
  },

  async generateQueueMatches(payload: { gameType: QueueMatchGameType }) {
    const response = await api.post('/queue-matches/generate', payload)
    return response.data
  },

  async createQueueMatch(payload: {
    gameType: QueueMatchGameType
    courtId?: number | null
    teamA: Array<{ id: number; name: string; sex: 'male' | 'female'; skill: 'Beginner' | 'Intermediate' | 'Advanced' }>
    teamB: Array<{ id: number; name: string; sex: 'male' | 'female'; skill: 'Beginner' | 'Intermediate' | 'Advanced' }>
  }): Promise<QueueMatch> {
    const response = await api.post('/queue-matches', payload)
    return response.data
  },

  async getQueueMatches(params?: { status?: QueueMatchStatus }): Promise<QueueMatch[]> {
    const response = await api.get('/queue-matches', { params })
    return response.data
  },

  async getQueueMatchesHistory(): Promise<QueueMatchHistory[]> {
    const response = await api.get('/queue-matches/history')
    return response.data
  },

  async completeQueueMatch(id: number, payload: { winner: 'teamA' | 'teamB' | 'draw' }): Promise<QueueMatch> {
    const response = await api.patch(`/queue-matches/${id}/complete`, payload)
    return response.data
  },

  async cancelQueueMatch(id: number): Promise<QueueMatch> {
    const response = await api.patch(`/queue-matches/${id}/cancel`)
    return response.data
  },

  async clearPendingQueueMatches(): Promise<{ cleared: number }> {
    const response = await api.delete('/queue-matches/pending')
    return response.data
  }
}
