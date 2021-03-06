// resize active status
export const STATUS = {
  START: 'START',
  MOVE: 'MOVE',
  END: 'END'
}

// event
export const EVENT = {
  [STATUS.START]: 'pointerdown',
  [STATUS.MOVE]: 'pointermove',
  [STATUS.END]: 'pointerup'
}

export let isTouch = false
// touch event
if ('ontouchstart' in window) {
  Object.assign(EVENT, {
    [STATUS.START]: 'touchstart',
    [STATUS.MOVE]: 'touchmove',
    [STATUS.END]: 'touchend'
  })
  isTouch = true
}

// deal touch event
export const getEvent = (event) => {
  if (isTouch) {
    return event.touches.length > 0 ? event.touches[0] : event.changedTouches[0]
  }
  return event
}

// handle bar size
export const defaultThreshold = 10
// handle bar direction
export const defaultHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
export const RESIZE_HANDLE_STORE_KEY = '__RESIZE_HANDLE_STORE__'
export const HANDLE_DIRECTION_KEY = '__HANDLE_DIRECTION__'
export const HANDLE_LISTENER_REMOVE_KEY = '__HANDLE_LISTENER_REMOVE__'

// handle bar base style creator
export const createHandleStyleConfig = half => {
  const v1 = `${half * 2}px`
  const v2 = `${half}px`
  const v3 = `-${half}px`
  const [n, ne, e, se, s, sw, w, nw] = defaultHandles

  return {
    [n]: {
      top: v3,
      left: v2,
      right: v2,
      height: v1,
      cursor: 'ns-resize'
    },
    [ne]: {
      top: v3,
      right: v3,
      width: v2,
      height: v2,
      cursor: 'nesw-resize'
    },
    [e]: {
      right: v3,
      top: v2,
      bottom: v2,
      width: v1,
      cursor: 'ew-resize'
    },
    [se]: {
      right: v3,
      bottom: v3,
      width: v1,
      height: v1,
      cursor: 'nwse-resize'
    },
    [s]: {
      bottom: v3,
      left: v2,
      right: v2,
      height: v1,
      cursor: 'ns-resize'
    },
    [sw]: {
      bottom: v3,
      left: v3,
      width: v1,
      height: v1,
      cursor: 'nesw-resize'
    },
    [w]: {
      left: v3,
      top: v2,
      bottom: v2,
      width: v1,
      cursor: 'ew-resize'
    },
    [nw]: {
      left: v3,
      top: v3,
      width: v1,
      height: v1,
      cursor: 'nwse-resize'
    }
  }
}

// get stylesheet
export const getCSSStyle = function(el) {
  return window.getComputedStyle(el)
}
