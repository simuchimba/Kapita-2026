const REMEMBER_KEY = 'kapita_remember'

function getStorage() {
  return localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage
}

export function setRememberMe(value) {
  if (value) {
    localStorage.setItem(REMEMBER_KEY, 'true')
  } else {
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) === 'true'
}

export function getToken(name) {
  const storage = getStorage()
  const val = storage.getItem(name)
  if (val) return val
  const other = storage === localStorage ? sessionStorage : localStorage
  return other.getItem(name) || null
}

export function setToken(name, value) {
  const storage = getStorage()
  storage.setItem(name, value)
  const other = storage === localStorage ? sessionStorage : localStorage
  other.removeItem(name)
}

export function removeToken(name) {
  localStorage.removeItem(name)
  sessionStorage.removeItem(name)
}

export function clearTokens() {
  removeToken('access_token')
  removeToken('refresh_token')
  localStorage.removeItem(REMEMBER_KEY)
}
