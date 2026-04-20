import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // IMPORTANT:
  // - Keep the initial render consistent between server and client to avoid hydration mismatch.
  // - We intentionally default to `false` and update after mount.
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const setFromWindow = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setFromWindow()
    const onChange = () => {
      setFromWindow()
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
