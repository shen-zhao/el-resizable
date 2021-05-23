import {
  noop,
  EVENT,
  STATUS,
  RESIZE_HANDLE_STORE_KEY,
  HANDLE_DIR_KEY,
  defaultHandles,
  defaultThreshold,
  createHandleStyleConfig,
  getCSSStyle,
  getEvent
} from '../utils'
import { throttle } from 'throttle-debounce'

export default class Resizable {
  static START = STATUS.START
  static MOVE = STATUS.MOVE
  static END = STATUS.END
  constructor(target, options) {
    this.target = target
    this.options = Object.assign({
      handles: 'all',
      callback: noop,
      onStart: noop,
      onMove: noop,
      onEnd: noop,
      bound: false,
      threshold: defaultThreshold
    }, options)

    this.normalizeOptions(this.options)
    this.cleanup()
    this.init()
  }

  init() {
    const { target } = this
    const {
      handles
    } = this.options
    // initial handle store
    this._handles = target[RESIZE_HANDLE_STORE_KEY] = []
    // get target CSSStyleDeclaration
    this.targetCSSStyle = getCSSStyle(target)
    // creat handle base style config
    this.handleStyleConfig = createHandleStyleConfig(this.half)
    // set target position
    if (this.targetCSSStyle.getPropertyValue('position') === 'static') {
      target.style.position = 'relative'
    }
    // create handler
    this.handler = this.createHandler();
    // create handle dom and bind event
    handles.forEach(dir => {
      this.createHandle(dir)
    })
  }

  createHandle(dir) {
    const handle = document.createElement('div')
    handle.style.position = 'absolute'
    handle.style.userSelect = 'none'
    Object.assign(handle.style, this.handleStyleConfig[dir])
    Object.defineProperty(handle, HANDLE_DIR_KEY, {
      value: dir
    })
    this.bindEvent(handle, this.handler)
    this.target.appendChild(handle)
    this._handles.push(handle)
  }

  /**
   * bind handle event
   * @param {handle} hd
   * @param {Function} handler
   * @memberof Resizable
   */
  bindEvent(hd, handler) {
    let sx, sy, status, clientW, clientH
    const half = this.half

    const handleStart = e => {
      e = getEvent(e);
      const rect = hd.getBoundingClientRect()
      this.setHandleStyle(hd, true)
      status = STATUS.START
      clientW = document.documentElement.clientWidth
      clientH = document.documentElement.clientHeight
      const { x, y } = rect
      sx = x + half
      sy = y + half
      const payload = {
        offsetX: 0,
        offsetY: 0
      }
      handler(hd, status, payload, e)
      document.addEventListener(EVENT.MOVE, handleMove)
      document.addEventListener(EVENT.END, handleEnd)
    }
    const handleMove = throttle(12, e => {
      e = getEvent(e);
      if (status === STATUS.END) return
      status = STATUS.MOVE
      let { clientX: rx, clientY: ry } = e
      // 处理边界
      if (this.options.bound) {
        if (rx <= half) {
          rx = half;
        }
        if (ry <= half) {
          ry = half;
        }
        if (rx >= clientW - half) {
          rx = clientW - half;
        }
        if (ry >= clientH - half) {
          ry = clientH - half;
        }
      }
      const payload = {
        offsetX: rx - sx,
        offsetY: ry - sy
      }
      this.setCursorStyle(hd, payload, true)
      handler(hd, status, payload, e)
    });
    const handleEnd = e => {
      e = getEvent(e);
      status = STATUS.END
      this.setHandleStyle(hd, false)
      const { clientX: ex, clientY: ey } = e
      const payload = {
        offsetX: ex - sx,
        offsetY: ey - sy
      }
      this.setCursorStyle(hd, payload, false)
      handler(hd, status, payload, e)
      document.removeEventListener(EVENT.MOVE, handleMove)
      document.removeEventListener(EVENT.END, handleEnd)
    }

    hd.addEventListener(EVENT.START, handleStart)
  }

  /**
   *
   * @param {dir} dir
   * @returns warper handler
   * @memberof Resizable
   */
  createHandler() {
    const {
      callback,
      onStart,
      onMove,
      onEnd,
    } = this.options

    return (handle, status, offsetConfig, e) => {
      const {
        offsetX,
        offsetY
      } = offsetConfig
      const dir = handle[HANDLE_DIR_KEY]

      let defaultDiff = { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }
      let diff
      switch (dir) {
        case 't':
          diff = { top: offsetY, height: -offsetY }
          break
        case 'rt':
          diff = { top: offsetY, right: -offsetX, width: offsetX, height: -offsetY }
          break
        case 'r':
          diff = { right: -offsetX, width: offsetX }
          break
        case 'rb':
          diff = { right: -offsetX, bottom: -offsetY, width: offsetX, height: offsetY }
          break
        case 'b':
          diff = { bottom: -offsetY, height: offsetY }
          break
        case 'lb':
          diff = { bottom: -offsetY, left: offsetX, width: -offsetX, height: offsetY }
          break
        case 'l':
          diff = { left: offsetX, width: -offsetX }
          break
        case 'lt':
          diff = { top: offsetY, left: offsetX, width: -offsetX, height: -offsetY }
          break
        default:
      }
      
      const posDiff = Object.assign(defaultDiff, diff)
      callback(status, posDiff, e)
      let handler
      switch (status) {
        case STATUS.START:
          handler = onStart
          break
        case STATUS.MOVE:
          handler = onMove
          break
        case STATUS.END:
          handler = onEnd
          break
        default:
      }
      handler(posDiff, e)
    }
  }

  setHandleStyle(hd, active) {
    if (active) {
      hd.style.zIndex = '9999'
      hd.style.backgroundColor = 'rgba(86, 159, 248, 0.2)'
      hd.style.filter = 'blur(3px)'
    } else {
      hd.style.zIndex = ''
      hd.style.backgroundColor = ''
      hd.style.filter = ''
    }
  }

  setCursorStyle(handle, offset, isMove) {
    const dir = handle[HANDLE_DIR_KEY]
    let cursor = this.handleStyleConfig[dir].cursor
    if (isMove) {
      const { offsetX, offsetY } = offset
      switch (dir) {
        case 'l':
        case 'r':
          cursor = offsetX > 0 ? 'w-resize' : 'e-resize'
          break
        case 't':
        case 'b':
          cursor = offsetY > 0 ? 'n-resize' : 's-resize'
          break
        case 'rt':
        case 'lb':
          if (offsetX > 0 && offsetY < 0) {
            cursor = 'sw-resize'
          } else if (offsetX < 0 && offsetY > 0) {
            cursor = 'ne-resize'
          }
          break
        case 'lt':
        case 'rb':
          if (offsetX > 0 && offsetY > 0) {
            cursor = 'nw-resize'
          } else if (offsetX < 0 && offsetY < 0) {
            cursor = 'se-resize'
          }
          break
      }
    }
    handle.style.cursor = cursor
  }

  cleanup() {
    const { target } = this
    if (RESIZE_HANDLE_STORE_KEY in target) {
      const handles = target[RESIZE_HANDLE_STORE_KEY]
      if (Array.isArray(handles)) {
        handles.forEach(child => {
          target.removeChild(child)
        })
      }
      delete target[RESIZE_HANDLE_STORE_KEY]
    }
  }

  destroy() {
    this.cleanup()
  }

  normalizeOptions(options) {
    let {
      handles: originHandles,
      threshold
    } = options
    
    // deal handles dir config
    let handles = Array.isArray(originHandles) ? originHandles : originHandles.split(/\s+/)
    if (handles.includes('all')) {
      handles = defaultHandles
    } else {
      handles = handles.filter(dir => defaultHandles.includes(dir))
    }

    Object.assign(options, {
      handles
    })
    // deal handle size
    this.half = threshold >> 1 || defaultThreshold >> 1
  }
}
