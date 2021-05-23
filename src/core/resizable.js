import {
  noop,
  EVENT,
  STATUS,
  RESIZE_HANDLE_STORE_KEY,
  HANDLE_DIRECTION_KEY,
  HANDLE_LISTENER_REMOVE_KEY,
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
    if (target == null) {
      throw new TypeError('The target parameter is required')
    }
    this.target = typeof target === 'string'
      ? document.querySelector(target)
      : target
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
    Object.defineProperty(handle, HANDLE_DIRECTION_KEY, {
      value: dir
    })
    handle[HANDLE_LISTENER_REMOVE_KEY] = this.bindEvent(handle, this.handler)
    this.target.appendChild(handle)
    this._handles.push(handle)
  }

  /**
   * bind handle event
   * @param {handle} handle
   * @param {Function} handler
   * @memberof Resizable
   */
  bindEvent(handle, handler) {
    let startX, startY, status, clientW, clientH
    const half = this.half

    const handleStart = ev => {
      ev = getEvent(ev);
      this.setHandleStyle(handle, true)
      status = STATUS.START
      clientW = document.documentElement.clientWidth
      clientH = document.documentElement.clientHeight
      const { clientX, clientY } = ev;
      startX = clientX
      startY = clientY
      const payload = {
        offsetX: 0,
        offsetY: 0
      }
      handler(handle, status, payload, ev)
      document.addEventListener(EVENT.MOVE, handleMove)
      document.addEventListener(EVENT.END, handleEnd)
    }
    const handleMove = throttle(12, ev => {
      ev = getEvent(ev);
      if (status === STATUS.END) return
      status = STATUS.MOVE
      let { clientX: moveX, clientY: moveY } = ev
      // 处理边界
      if (this.options.bound) {
        if (moveX <= half) {
          moveX = half;
        }
        if (moveY <= half) {
          moveY = half;
        }
        if (moveX >= clientW - half) {
          moveX = clientW - half;
        }
        if (moveY >= clientH - half) {
          moveY = clientH - half;
        }
      }
      const payload = {
        offsetX: moveX - startX,
        offsetY: moveY - startY
      }
      this.setCursorStyle(handle, payload, true)
      handler(handle, status, payload, ev)
    });
    const handleEnd = ev => {
      ev = getEvent(ev);
      status = STATUS.END
      this.setHandleStyle(handle, false)
      const { clientX: ex, clientY: ey } = ev
      const payload = {
        offsetX: ex - startX,
        offsetY: ey - startY
      }
      this.setCursorStyle(handle, payload, false)
      handler(handle, status, payload, ev)
      document.removeEventListener(EVENT.MOVE, handleMove)
      document.removeEventListener(EVENT.END, handleEnd)
    }

    handle.addEventListener(EVENT.START, handleStart)

    return () => {
      handle.removeEventListener(EVENT.START, handleStart)
    }
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
    

    return (handle, status, offsetConfig, ev) => {
      const {
        offsetX,
        offsetY
      } = offsetConfig
      const dir = handle[HANDLE_DIRECTION_KEY]
      const [n, ne, e, se, s, sw, w, nw] = defaultHandles

      let defaultDiff = { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }
      let diff
      switch (dir) {
        case n:
          diff = { top: offsetY, height: -offsetY }
          break
        case ne:
          diff = { top: offsetY, right: -offsetX, width: offsetX, height: -offsetY }
          break
        case e:
          diff = { right: -offsetX, width: offsetX }
          break
        case se:
          diff = { right: -offsetX, bottom: -offsetY, width: offsetX, height: offsetY }
          break
        case s:
          diff = { bottom: -offsetY, height: offsetY }
          break
        case sw:
          diff = { bottom: -offsetY, left: offsetX, width: -offsetX, height: offsetY }
          break
        case w:
          diff = { left: offsetX, width: -offsetX }
          break
        case nw:
          diff = { top: offsetY, left: offsetX, width: -offsetX, height: -offsetY }
          break
        default:
      }
      
      const posDiff = Object.assign(defaultDiff, diff)
      callback(status, posDiff, ev)
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
      handler(posDiff, ev)
    }
  }

  setHandleStyle(handle, active) {
    if (active) {
      handle.style.zIndex = '9999'
      handle.style.backgroundColor = 'rgba(86, 159, 248, 0.2)'
      handle.style.filter = 'blur(3px)'
    } else {
      handle.style.zIndex = ''
      handle.style.backgroundColor = ''
      handle.style.filter = ''
    }
  }

  setCursorStyle(handle, offset, isMove) {
    const dir = handle[HANDLE_DIRECTION_KEY]
    const [n, ne, e, se, s, sw, w, nw] = defaultHandles
    let cursor = this.handleStyleConfig[dir].cursor
    if (isMove) {
      const { offsetX, offsetY } = offset
      switch (dir) {
        case w:
        case e:
          cursor = offsetX > 0 ? 'w-resize' : 'e-resize'
          break
        case n:
        case s:
          cursor = offsetY > 0 ? 'n-resize' : 's-resize'
          break
        case ne:
        case sw:
          if (offsetX > 0 && offsetY < 0) {
            cursor = 'sw-resize'
          } else if (offsetX < 0 && offsetY > 0) {
            cursor = 'ne-resize'
          }
          break
        case nw:
        case se:
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

  cleanup() {
    const { target } = this
    if (RESIZE_HANDLE_STORE_KEY in target) {
      const handles = target[RESIZE_HANDLE_STORE_KEY]
      if (Array.isArray(handles)) {
        handles.forEach(handle => {
          handle[HANDLE_LISTENER_REMOVE_KEY]()
          target.removeChild(handle)
        })
      }
      delete target[RESIZE_HANDLE_STORE_KEY]
    }
  }

  destroy() {
    this.cleanup()
  }
}
