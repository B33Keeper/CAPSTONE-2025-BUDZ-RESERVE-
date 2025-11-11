import axios, { AxiosError } from 'axios'

interface ErrorResponse {
  message?: string | string[]
  error?: string
  errors?: Array<{ message?: string; field?: string }>
}

const pickFirst = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined
  return Array.isArray(value) ? value.find(Boolean) : value
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'string') {
    return error
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>
    const responseData = axiosError.response?.data

    const messageFromResponse =
      pickFirst(responseData?.message) ||
      pickFirst(responseData?.errors?.map((err) => err.message).filter(Boolean) as string[]) ||
      responseData?.error

    if (messageFromResponse && typeof messageFromResponse === 'string') {
      return messageFromResponse
    }

    if (axiosError.message) {
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage
  }

  try {
    const serialized = JSON.stringify(error)
    if (serialized && serialized !== '{}') {
      return serialized
    }
  } catch {
    // ignore serialization errors
  }

  return fallbackMessage
}

