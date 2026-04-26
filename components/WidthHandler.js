import React from 'react'
import { DEFAULT_WIDTHS } from '../src/modules/editor/config'

const { minWidth, maxWidth } = DEFAULT_WIDTHS
const KEYBOARD_STEP = 16
const KEYBOARD_STEP_LARGE = 64
const CENTER_ANCHORED_WIDTH_MULTIPLIER = 2

function getViewportMaxWidth() {
  if (typeof window === 'undefined') {
    return maxWidth
  }

  return Math.max(minWidth, Math.floor(window.innerWidth * 0.9))
}

function clamp(value, min, max) {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function getResizableElement(handleElement, fallbackRef) {
  if (handleElement?.closest) {
    const container = handleElement.closest('.panda-container')

    if (container) {
      return container
    }
  }

  const fallbackElement = fallbackRef?.current

  if (!fallbackElement) {
    return null
  }

  if (fallbackElement.matches?.('.panda-container')) {
    return fallbackElement
  }

  return fallbackElement.querySelector?.('.panda-container') || fallbackElement
}

function measureWidth(handleElement, fallbackRef) {
  const element = getResizableElement(handleElement, fallbackRef)

  if (!element) {
    return minWidth
  }

  return Math.round(element.getBoundingClientRect().width)
}

export default function WidthHandler({
  innerRef,
  onChangeComplete,
  paddingHorizontal,
  paddingVertical,
}) {
  const handleRef = React.useRef(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const dragRef = React.useRef({
    currentWidth: minWidth,
    element: null,
    frameId: null,
    hasChanged: false,
    latestClientX: 0,
    pointerId: null,
    dragging: false,
    startLineX: 0,
    startWidth: minWidth,
  })
  const bodyStyleRef = React.useRef(null)

  const readWidth = React.useCallback(
    handleElement => measureWidth(handleElement, innerRef),
    [innerRef]
  )

  const syncWidth = React.useCallback(
    handleElement => {
      const width = readWidth(handleElement)
      return width
    },
    [readWidth]
  )

  const applyPreviewWidth = React.useCallback(
    (target, width) => {
      const element = getResizableElement(target, innerRef)

      if (!element) {
        return width
      }

      const nextWidth = clamp(Math.round(width), minWidth, getViewportMaxWidth())

      element.style.setProperty('--panda-width', `${nextWidth}px`)
      element.style.setProperty('--panda-max-width', '90vw')
      return nextWidth
    },
    [innerRef]
  )

  const setDraggingCursor = React.useCallback(isActive => {
    if (typeof document === 'undefined') {
      return
    }

    const { body } = document

    if (!body) {
      return
    }

    if (isActive) {
      if (!bodyStyleRef.current) {
        bodyStyleRef.current = {
          cursor: body.style.cursor,
          userSelect: body.style.userSelect,
        }
      }

      body.style.cursor = 'ew-resize'
      body.style.userSelect = 'none'
      return
    }

    if (bodyStyleRef.current) {
      body.style.cursor = bodyStyleRef.current.cursor
      body.style.userSelect = bodyStyleRef.current.userSelect
      bodyStyleRef.current = null
    }
  }, [])

  const cancelDragFrame = React.useCallback(() => {
    const drag = dragRef.current

    if (drag.frameId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(drag.frameId)
      drag.frameId = null
    }
  }, [])

  const flushDragWidth = React.useCallback(() => {
    const drag = dragRef.current

    if (!drag.dragging) {
      return drag.currentWidth
    }

    // The editor stays centered, so the visible right edge only moves half of
    // the width delta. Doubling the pointer delta keeps the handle aligned
    // with the cursor across both slow and fast drags.
    const delta = (drag.latestClientX - drag.startLineX) * CENTER_ANCHORED_WIDTH_MULTIPLIER
    const nextWidth = clamp(Math.round(drag.startWidth + delta), minWidth, getViewportMaxWidth())

    if (nextWidth !== drag.currentWidth) {
      drag.currentWidth = applyPreviewWidth(drag.element || handleRef.current, nextWidth)
      drag.hasChanged = drag.hasChanged || drag.currentWidth !== drag.startWidth
    }

    return drag.currentWidth
  }, [applyPreviewWidth])

  const scheduleDragFrame = React.useCallback(() => {
    const drag = dragRef.current

    if (drag.frameId !== null || typeof window === 'undefined') {
      return
    }

    drag.frameId = window.requestAnimationFrame(() => {
      drag.frameId = null
      flushDragWidth()
    })
  }, [flushDragWidth])

  const finishDrag = React.useCallback(
    handleElement => {
      const drag = dragRef.current

      if (!drag.dragging) {
        return
      }

      cancelDragFrame()

      const finalWidth = flushDragWidth() ?? syncWidth(handleElement)

      if (
        handleElement &&
        drag.pointerId != null &&
        handleElement.hasPointerCapture?.(drag.pointerId)
      ) {
        handleElement.releasePointerCapture(drag.pointerId)
      }

      const shouldNotify = drag.hasChanged

      drag.currentWidth = finalWidth
      drag.element = null
      drag.frameId = null
      drag.hasChanged = false
      drag.latestClientX = 0
      drag.pointerId = null
      drag.dragging = false
      drag.startLineX = 0
      drag.startWidth = finalWidth ?? minWidth

      setIsDragging(false)
      setDraggingCursor(false)

      if (shouldNotify) {
        onChangeComplete(finalWidth)
      }
    },
    [cancelDragFrame, flushDragWidth, onChangeComplete, setDraggingCursor, syncWidth]
  )

  React.useEffect(() => {
    syncWidth()

    const element = getResizableElement(null, innerRef)

    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      if (!dragRef.current.dragging) {
        syncWidth()
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [innerRef, syncWidth])

  const handleWindowPointerMove = React.useCallback(
    event => {
      const drag = dragRef.current

      if (!drag.dragging || drag.pointerId !== event.pointerId) {
        return
      }

      const coalescedEvents = event.getCoalescedEvents?.()
      const latestEvent =
        coalescedEvents && coalescedEvents.length
          ? coalescedEvents[coalescedEvents.length - 1]
          : event

      drag.latestClientX = latestEvent.clientX
      scheduleDragFrame()
      event.preventDefault()
    },
    [scheduleDragFrame]
  )

  const handleWindowPointerEnd = React.useCallback(
    event => {
      const drag = dragRef.current

      if (!drag.dragging) {
        return
      }

      if (event.type !== 'blur' && drag.pointerId !== event.pointerId) {
        return
      }

      finishDrag(handleRef.current)
    },
    [finishDrag]
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false })
    window.addEventListener('pointerup', handleWindowPointerEnd)
    window.addEventListener('pointercancel', handleWindowPointerEnd)
    window.addEventListener('blur', handleWindowPointerEnd)

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerEnd)
      window.removeEventListener('pointercancel', handleWindowPointerEnd)
      window.removeEventListener('blur', handleWindowPointerEnd)
    }
  }, [handleWindowPointerEnd, handleWindowPointerMove])

  React.useEffect(
    () => () => {
      cancelDragFrame()
      setDraggingCursor(false)
    },
    [cancelDragFrame, setDraggingCursor]
  )

  const handlePointerDown = React.useCallback(
    event => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      const startWidth = syncWidth(event.currentTarget)
      const drag = dragRef.current
      const element = getResizableElement(event.currentTarget, innerRef)
      const handleRect = event.currentTarget.getBoundingClientRect()

      drag.currentWidth = startWidth
      drag.element = element
      drag.frameId = null
      drag.hasChanged = false
      drag.latestClientX = event.clientX
      drag.pointerId = event.pointerId
      drag.dragging = true
      drag.startLineX = handleRect.left + handleRect.width / 2
      drag.startWidth = startWidth

      event.currentTarget.setPointerCapture?.(event.pointerId)
      setIsDragging(true)
      setDraggingCursor(true)
      event.preventDefault()
    },
    [innerRef, setDraggingCursor, syncWidth]
  )

  const handleKeyDown = React.useCallback(
    event => {
      const viewportMaxWidth = getViewportMaxWidth()
      const baseWidth = readWidth(event.currentTarget)
      const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP

      let nextWidth = baseWidth

      switch (event.key) {
        case 'ArrowLeft':
          nextWidth = baseWidth - step
          break
        case 'ArrowRight':
          nextWidth = baseWidth + step
          break
        case 'Home':
          nextWidth = minWidth
          break
        case 'End':
          nextWidth = viewportMaxWidth
          break
        default:
          return
      }

      event.preventDefault()

      const clampedWidth = clamp(Math.round(nextWidth), minWidth, viewportMaxWidth)

      if (clampedWidth === baseWidth) {
        return
      }

      applyPreviewWidth(event.currentTarget, clampedWidth)
      onChangeComplete(clampedWidth)
    },
    [applyPreviewWidth, onChangeComplete, readWidth]
  )

  return (
    <div
      ref={handleRef}
      className="width-handler"
      data-dragging={isDragging || undefined}
      style={{
        top: paddingVertical,
        bottom: paddingVertical,
        right: paddingHorizontal,
      }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      role="separator"
      tabIndex={0}
    />
  )
}
