import { useState, useEffect } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface ResponsiveConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

const defaultBreakpoints: ResponsiveConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useResponsive(breakpoints: ResponsiveConfig = defaultBreakpoints) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('xs')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Use requestAnimationFrame to batch layout reads and prevent forced reflow
    const updateSize = () => {
      requestAnimationFrame(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        setWindowSize({ width, height })

        // Determine current breakpoint
        if (width >= breakpoints['2xl']) {
          setCurrentBreakpoint('2xl')
        } else if (width >= breakpoints.xl) {
          setCurrentBreakpoint('xl')
        } else if (width >= breakpoints.lg) {
          setCurrentBreakpoint('lg')
        } else if (width >= breakpoints.md) {
          setCurrentBreakpoint('md')
        } else if (width >= breakpoints.sm) {
          setCurrentBreakpoint('sm')
        } else {
          setCurrentBreakpoint('xs')
        }
      })
    }

    // Debounce resize handler to prevent excessive layout reads
    let resizeTimeout: ReturnType<typeof setTimeout>
    const debouncedUpdateSize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateSize, 150) // 150ms debounce
    }

    // Initial size update - defer to prevent blocking initial render
    requestAnimationFrame(() => {
      updateSize()
    })

    window.addEventListener('resize', debouncedUpdateSize, { passive: true })
    return () => {
      window.removeEventListener('resize', debouncedUpdateSize)
      clearTimeout(resizeTimeout)
    }
  }, [breakpoints])

  const isMobile = currentBreakpoint === 'xs' || currentBreakpoint === 'sm'
  const isTablet = currentBreakpoint === 'md'
  const isDesktop = currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl'

  const getModalSize = () => {
    if (isMobile) {
      return {
        width: '95vw',
        height: '95vh',
        maxWidth: 'none',
        maxHeight: 'none',
      }
    } else if (isTablet) {
      return {
        width: '90vw',
        height: '90vh',
        maxWidth: '900px',
        maxHeight: '800px',
      }
    } else {
      return {
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px',
        maxHeight: '900px',
      }
    }
  }

  const getTableColumns = () => {
    if (isMobile) {
      return ['ID', 'Date', 'Time', 'Court', 'Price', 'Action']
    } else if (isTablet) {
      return ['ID', 'Date', 'Time', 'Court no.', 'Price', 'Mode of Payment', 'Action']
    } else {
      return ['ID', 'Date', 'Time', 'Court no.', 'Price', 'Mode of Payment', 'Action']
    }
  }

  return {
    currentBreakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    getModalSize,
    getTableColumns,
  }
}
