import { api } from './api'
import type { User } from './types'

export interface LoginCredentials {
  email: string
  password: string
}

export async function login(credentials: LoginCredentials) {
  const { data } = await api.post('/auth/login/', credentials)
  localStorage.setItem('access_token', data.access)
  localStorage.setItem('refresh_token', data.refresh)
  return data
}

export async function logout() {
  const refresh = localStorage.getItem('refresh_token')
  try {
    await api.post('/auth/logout/', { refresh })
  } finally {
    localStorage.clear()
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me/')
  return data
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token')
}
