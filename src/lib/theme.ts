export type AppTheme = 'brand' | 'dark'

const STORAGE_KEY = 'tacticboard-theme'

export function getStoredTheme(): AppTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'brand'
  } catch {
    return 'brand'
  }
}

export function applyTheme(theme: AppTheme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
