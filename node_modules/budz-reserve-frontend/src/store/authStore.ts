import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  name: string
  age?: number
  sex?: 'Male' | 'Female'
  contact_number?: string
  profile_picture?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

interface RegisterData {
  name: string
  age: number
  sex: 'Male' | 'Female'
  username: string
  email: string
  password: string
  contact_number?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', credentials)
          const { access_token, user } = response.data

          // Convert profile picture path to full URL if it exists
          if (user.profile_picture && !user.profile_picture.startsWith('http')) {
            user.profile_picture = `http://localhost:3001${user.profile_picture}`
          }

          localStorage.setItem('access_token', access_token)
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Login failed')
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', userData)
          const { access_token, user } = response.data

          // Convert profile picture path to full URL if it exists
          if (user.profile_picture && !user.profile_picture.startsWith('http')) {
            user.profile_picture = `http://localhost:3001${user.profile_picture}`
          }

          localStorage.setItem('access_token', access_token)
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Registration failed')
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          isAuthenticated: false,
        })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await api.get('/auth/profile')
          const user = response.data

          // Convert profile picture path to full URL if it exists
          if (user.profile_picture && !user.profile_picture.startsWith('http')) {
            user.profile_picture = `http://localhost:3001${user.profile_picture}`
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
