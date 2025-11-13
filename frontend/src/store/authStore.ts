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
  role?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<{ user: User; access_token: string }>
  register: (userData: RegisterData) => Promise<{ user: User; access_token: string }>
  authenticate: (payload: { user: User; access_token: string }) => void
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

          // Return user data for navigation logic
          return { user, access_token }
        } catch (error: any) {
          set({ isLoading: false })
          const status = error.response?.status
          if (status === 401) {
            throw new Error('Wrong username or password')
          }

          throw new Error(error.response?.data?.message || 'Login failed')
        }
      },

      authenticate: ({ user, access_token }) => {
        const normalizedUser = { ...user }
        if (normalizedUser.profile_picture && !normalizedUser.profile_picture.startsWith('http')) {
          normalizedUser.profile_picture = `http://localhost:3001${normalizedUser.profile_picture}`
        }

        localStorage.setItem('access_token', access_token)
        set({
          user: normalizedUser,
          isAuthenticated: true,
          isLoading: false,
        })
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

          return { user, access_token }
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Registration failed')
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // Clear terms acceptance when user logs out
        const userId = get().user?.id
        if (userId) {
          localStorage.removeItem(`termsAccepted_${userId}`)
          sessionStorage.removeItem(`announcement_shown_${userId}`)
        }
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
          const userId = get().user?.id
          if (userId) {
            sessionStorage.removeItem(`announcement_shown_${userId}`)
          }
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
