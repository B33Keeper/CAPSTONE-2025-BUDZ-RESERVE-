/**
 * Utility functions for handling image URLs
 * Handles both static assets and uploaded images from the backend
 */

import api from './api'

/**
 * Get the backend base URL (without /api)
 */
export function getBackendBaseUrl(): string {
  // Try to get from axios instance first
  if (api.defaults.baseURL) {
    const baseURL = api.defaults.baseURL as string
    return baseURL.replace(/\/api\/?$/, '')
  }

  // Try environment variable
  const envBase = import.meta.env.VITE_API_URL || ''
  if (envBase) {
    return envBase.replace(/\/api\/?$/, '')
  }

  // Fallback to current origin (works for Docker and local dev)
  return window.location.origin
}

/**
 * Resolve a full URL for an uploaded image
 * @param imagePath - The image path from the backend (e.g., "/uploads/avatars/image.jpg")
 * @returns Full URL to the image
 */
export function resolveImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return ''
  }

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // If it's an uploaded file (starts with /uploads/)
  if (imagePath.startsWith('/uploads/')) {
    const backendBaseUrl = getBackendBaseUrl()
    return `${backendBaseUrl}${imagePath}`
  }

  // For static assets (starts with /assets/), return as-is
  if (imagePath.startsWith('/assets/')) {
    return imagePath
  }

  // If path doesn't start with /, add it
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  
  // If it looks like an upload path, prepend backend URL
  if (normalizedPath.includes('uploads') || normalizedPath.includes('avatars') || normalizedPath.includes('announcements') || normalizedPath.includes('gallery') || normalizedPath.includes('equipments')) {
    const backendBaseUrl = getBackendBaseUrl()
    return `${backendBaseUrl}${normalizedPath}`
  }

  // Default: assume it's a static asset
  return normalizedPath
}

/**
 * Resolve multiple image URLs
 */
export function resolveImageUrls(imagePaths: (string | null | undefined)[]): string[] {
  return imagePaths.map(resolveImageUrl).filter(Boolean)
}

