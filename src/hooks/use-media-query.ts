import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const getMatches = () => window.matchMedia(query).matches

  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return getMatches()
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQueryList = window.matchMedia(query)
    const updateMatch = () => setMatches(mediaQueryList.matches)

    updateMatch()
    mediaQueryList.addEventListener('change', updateMatch)

    return () => mediaQueryList.removeEventListener('change', updateMatch)
  }, [query])

  return matches
}
