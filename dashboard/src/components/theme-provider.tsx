"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: "class" | (string & {})
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  enableColorScheme?: boolean
  forcedTheme?: Exclude<Theme, "system">
  storageKey?: string
  value?: Partial<Record<Exclude<Theme, "system">, string>>
}

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

const MEDIA_QUERY = "(prefers-color-scheme: dark)"

function getSystemTheme(mql?: MediaQueryList): ResolvedTheme {
  const query = mql ?? window.matchMedia(MEDIA_QUERY)
  return query.matches ? "dark" : "light"
}

function withoutTransitions(nonce?: string) {
  const style = document.createElement("style")
  if (nonce) style.setAttribute("nonce", nonce)
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}",
    ),
  )
  document.head.appendChild(style)
  return () => {
    window.getComputedStyle(document.body)
    setTimeout(() => {
      document.head.removeChild(style)
    }, 1)
  }
}

function applyThemeToDocument({
  attribute,
  disableTransitionOnChange,
  enableColorScheme,
  mappedValue,
  resolvedTheme,
}: {
  attribute: string
  disableTransitionOnChange: boolean
  enableColorScheme: boolean
  mappedValue?: string
  resolvedTheme: ResolvedTheme
}) {
  const root = document.documentElement
  const value = mappedValue ?? resolvedTheme

  const cleanupTransitions = disableTransitionOnChange
    ? withoutTransitions()
    : null

  if (attribute === "class") {
    root.classList.remove("light", "dark")
    if (mappedValue) root.classList.remove(mappedValue)
    root.classList.add(value)
  } else if (attribute.startsWith("data-")) {
    root.setAttribute(attribute, value)
  } else {
    root.setAttribute(attribute, value)
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme
  }

  cleanupTransitions?.()
}

function readStoredTheme(storageKey: string): Theme | null {
  try {
    const value = window.localStorage.getItem(storageKey)
    if (value === "light" || value === "dark" || value === "system") return value
    return null
  } catch {
    return null
  }
}

export function ThemeProvider({
  children,
  attribute = "data-theme",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  enableColorScheme = true,
  forcedTheme,
  storageKey = "theme",
  value,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    return readStoredTheme(storageKey) ?? defaultTheme
  })

  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "light"
    return getSystemTheme()
  })

  const resolvedTheme: ResolvedTheme = React.useMemo(() => {
    if (forcedTheme) return forcedTheme
    if (theme === "system") return enableSystem ? systemTheme : "light"
    return theme
  }, [enableSystem, forcedTheme, systemTheme, theme])

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next)
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mql = window.matchMedia(MEDIA_QUERY)
    const onChange = () => setSystemTheme(getSystemTheme(mql))

    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      const next = readStoredTheme(storageKey) ?? defaultTheme
      setThemeState(next)
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [defaultTheme, storageKey])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mappedValue = value?.[resolvedTheme]
    applyThemeToDocument({
      attribute,
      disableTransitionOnChange,
      enableColorScheme,
      mappedValue,
      resolvedTheme,
    })
  }, [
    attribute,
    disableTransitionOnChange,
    enableColorScheme,
    resolvedTheme,
    value,
  ])

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, systemTheme, setTheme }),
    [resolvedTheme, setTheme, systemTheme, theme],
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const value = React.useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return value
}
