import { useInView } from 'react-intersection-observer'
import { useAnimation } from 'framer-motion'
import { useEffect } from 'react'

export function useScrollAnimation() {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      })
    } else {
      controls.start({
        opacity: 0,
        y: 50,
        x: 0,
        scale: 0.9,
      })
    }
  }, [inView, controls])

  return { ref, controls, inView }
}
