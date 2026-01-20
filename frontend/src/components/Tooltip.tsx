import { useState, ReactNode, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = rect.top + scrollY - 8
          left = rect.left + scrollX + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + scrollY + 8
          left = rect.left + scrollX + rect.width / 2
          break
        case 'left':
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX - 8
          break
        case 'right':
          top = rect.top + scrollY + rect.height / 2
          left = rect.right + scrollX + 8
          break
      }

      setCoords({ top, left })
    }
  }, [show, position])

  const getTooltipStyle = () => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 99999,
    }

    switch (position) {
      case 'top':
        return { ...base, top: coords.top, left: coords.left, transform: 'translate(-50%, -100%)' }
      case 'bottom':
        return { ...base, top: coords.top, left: coords.left, transform: 'translate(-50%, 0)' }
      case 'left':
        return { ...base, top: coords.top, left: coords.left, transform: 'translate(-100%, -50%)' }
      case 'right':
        return { ...base, top: coords.top, left: coords.left, transform: 'translate(0, -50%)' }
    }
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent'
  }

  return (
    <>
      <span 
        ref={triggerRef}
        className="inline-flex cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>
      {show && createPortal(
        <span 
          style={getTooltipStyle()}
          className="px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-xl pointer-events-none"
        >
          <span className="whitespace-nowrap max-w-xs inline-block">{content}</span>
          <span className={`absolute border-4 ${arrowClasses[position]}`}></span>
        </span>,
        document.body
      )}
    </>
  )
}
