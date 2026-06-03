'use client'

import { useEffect, useRef, useState } from 'react'

const INITIAL_BOTTOM = 24 // px — equivalente a bottom-6
const GROUP_HEIGHT = 184  // altura estimada dos 3 botões + gaps
const DRAG_THRESHOLD = 8  // px mínimos para iniciar o drag (evita cancelar taps)

export function DraggableFloatingGroup({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef(INITIAL_BOTTOM)
  const [bottom, setBottom] = useState(INITIAL_BOTTOM)
  const startTouchY = useRef(0)
  const startBottom = useRef(INITIAL_BOTTOM)
  const isDragging = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      startTouchY.current = e.touches[0].clientY
      startBottom.current = bottomRef.current
      isDragging.current = false
    }

    function onTouchMove(e: TouchEvent) {
      const totalDelta = startTouchY.current - e.touches[0].clientY

      if (!isDragging.current) {
        if (Math.abs(totalDelta) < DRAG_THRESHOLD) return
        isDragging.current = true
      }

      e.preventDefault()

      const maxBottom = window.innerHeight - GROUP_HEIGHT - 16
      const newBottom = Math.max(16, Math.min(maxBottom, startBottom.current + totalDelta))
      bottomRef.current = newBottom
      setBottom(newBottom)
    }

    function onTouchEnd() {
      isDragging.current = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed right-6 z-40 flex flex-col items-end gap-2"
      style={{ bottom: `${bottom}px` }}
    >
      {children}
    </div>
  )
}
