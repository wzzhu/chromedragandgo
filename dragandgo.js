// Copyright(c) 2011 Wenzhang Zhu.
// All rights reserved.
//
// Super drag and go content script. Handle mouse events for mouse gesture
// and drag.
var localOptions = {}

function Canvas () {
  this.html_canvas = document.createElement('canvas')
  this.ctx = this.html_canvas.getContext('2d')
  this.setCanvasStyle = function (stroke_style, fill_style, line_width) {
    this.html_canvas.setAttribute('width', window.innerWidth + 'px')
    this.html_canvas.setAttribute('height', window.innerHeight + 'px')
    this.html_canvas.setAttribute(
      'style',
      'z-index:100;position:fixed;top:0px;left:0px')
    this.ctx.fillStyle = fill_style
    this.ctx.strokeStyle = stroke_style
    this.ctx.lineWidth = line_width
    this.ctx.save()
  }

  this.showCanvas = function (x, y, parent_node) {
    if (!parent_node) {
      return
    }
    if (parent_node.lastChild != this.html_canvas) {
      parent_node.appendChild(this.html_canvas)
      this.setCanvasStyle('blue', 'white', 5)
    }
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
  }

  this.showLineTo = function (x, y, stop) {
    this.ctx.lineTo(x, y)
    this.ctx.stroke()
    if (!stop) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
    }
  }

  this.hasCanvas = function () {
    return (this.html_canvas.parentNode &&
      this.html_canvas.parentNode.lastChild == this.html_canvas)
  }

  this.hideCanvas = function () {
    if (this.html_canvas.parentNode &&
      this.html_canvas.parentNode.lastChild == this.html_canvas) {
      this.html_canvas.parentNode.removeChild(this.html_canvas)
    }
  }
}

var gesture = {
  in_gesture: false,
  should_close_context_menu: false,
  seq: '', // Gesture sequence
  last_pos: {
    x: -1,
    y: -1
  }, // Last mouse position
  start_time: 0,
  beginGesture: function (e) {
    this.in_gesture = true
    this.seq = ''
    this.last_pos = {
      x: e.clientX,
      y: e.clientY
    }
    this.start_time = new Date().getTime()
    return false
  },
  canvas: new Canvas(),

  moveGesture: function (e) {
    if (!this.in_gesture) {
      return true
    }
    if (new Date().getTime() - this.start_time < 300) {
      // Wait for dragStart before some us time passes.
      return true
    }
    let range = null
    if (window.getSelection().rangeCount > 0) {
      range = window.getSelection().getRangeAt(0)
    }
    let use_right_button = localOptions['use_right_button']
    if (!use_right_button && !this.canvas.hasCanvas() && range &&
      range.startContainer == range.endContainer &&
      (range.startContainer.nodeName == '#text' &&
      range.startOffset < range.startContainer.length &&
      range.endOffset < range.endContainer.length ||
      range.startOffset == range.endOffset)) {
      this.cancelGesture(e)
      return true
    }
    this.canvas.showCanvas(this.last_pos.x, this.last_pos.y, document.body)
    if (this.seq.length > 3) {
      this.cancelGesture()
      window.getSelection().empty()
      return true
    }
    this.collectGestures(e)
    window.getSelection().empty()
    this.canvas.showLineTo(this.last_pos.x, this.last_pos.y, false)
    return false
  },

  collectGestures: function (e) {
    if (this.last_pos.x < 0 || this.last_pos.y < 0) {
      this.last_pos = {
        x: e.clientX,
        y: e.clientY
      }
    } else {
      let dx = e.clientX - this.last_pos.x
      let dy = e.clientY - this.last_pos.y
      if (dx * dx + dy * dy < 256) {
        // Ignore short distance.
        return false
      }
      let new_gesture
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          new_gesture = 'R'
        } else {
          new_gesture = 'L'
        }
      } else {
        if (dy > 0) {
          new_gesture = 'D'
        } else {
          new_gesture = 'U'
        }
      }
      if (this.seq.length <= 0 ||
        this.seq.substr(this.seq.length - 1, 1) != new_gesture) {
        this.seq = this.seq + new_gesture
      }
    }
    this.last_pos = {
      x: e.clientX,
      y: e.clientY
    }
    return false
  },

  endGesture: function (e) {
    if (!this.in_gesture) {
      return true
    }
    this.in_gesture = false
    this.collectGestures(e)
    if (this.seq != '') {
      this.canvas.showLineTo(this.last_pos.x, this.last_pos.y, true)
      if (this.takeAction(this.seq)) {
        window.getSelection().empty()
        this.should_close_context_menu = true
      }
      this.seq = ''
      this.canvas.hideCanvas()
      if (e.preventDefault) {
        e.preventDefault()
      }
    }
    document.removeEventListener('mousemove', mouseMove, false)
    this.last_pos = {
      x: -1,
      y: -1
    }
    return false
  },

  cancelGesture: function (_e) {
    this.in_gesture = false
    this.canvas.hideCanvas()
  },

  takeAction: function (seq) {
    let checkAction = function (g, bf) {
      return (g & (1 << bf)) == (1 << bf)
    }
    let gesture = localOptions['gesture']
    if (this.seq == 'L' && checkAction(gesture, 0)) {
      history.back()
      return true
    } else if (this.seq == 'R' && checkAction(gesture, 1)) {
      history.forward()
      return true
    } else if (this.seq == 'UD' && checkAction(gesture, 2)) {
      location.reload(true)
      return true
    } else if (this.seq == 'DR' && checkAction(gesture, 3)) {
      chrome.runtime.connect().postMessage({
        message: 'closeMe'
      })
      return true
    } else if (this.seq == 'U' && checkAction(gesture, 4)) {
      window.scroll(0, 0)
      return true
    } else if (this.seq == 'D' && checkAction(gesture, 5)) {
      window.scroll(0, document.body.scrollHeight)
      return true
    }
    return false
  }
}

let drag_and_go = {
  in_drag: false,
  drag_selection: {
    type: 'text',
    data: ''
  },
  start_x: -1,
  start_y: -1,

  // Extract the link from the given text if any.
  // Otherwise return empty string.
  getTextLink: function (text) {
    let re = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    let link = ''
    let matches = text.match(re)
    if (matches) {
      link = matches[0]
    }
    return link
  },

  getDragSelection: function (e) {
    let data
    let data_type = 'text'
    let selection = window.getSelection()
    let parent_node = e.srcElement
    while (parent_node && parent_node.nodeName != 'A') {
      parent_node = parent_node.parentNode
    }
    if (parent_node) {
      if (parent_node.href.substr(0, 11) != 'javascript:') {
        data_type = 'link'
        data = parent_node.href
      }
    } else if (e.srcElement.nodeName == 'IMG') {
      data_type = 'img'
      data = e.srcElement.src
    } else {
      data = e.dataTransfer.getData('Text')
      if (!data) {
        data = selection.toString()
      }
    }
    return {
      'type': data_type,
      'data': data
    }
  },

  dragStart: function (e) {
    if (localOptions['alt_key'] && e.altKey ||
      localOptions['ctrl_key'] && e.ctrlKey) {
      return true
    }
    this.in_drag = true
    this.start_x = e.clientX
    this.start_y = e.clientY
    this.drag_selection = this.getDragSelection(e)
    if (this.drag_selection.type == 'text') {
      let link = this.getTextLink(this.drag_selection.data)
      if (link != '') {
        // Update the selection from text type to link
        this.drag_selection.type = 'link'
        this.drag_selection.data = link
      } else {
        return true
      }
    }
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.dropEffect = 'copy'
    }
    return false
  },

  dragOver: function (e) {
    if (!this.in_drag) {
      return true
    }
    if (e.preventDefault) {
      e.preventDefault()
    }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.dropEffect = 'copy'
    return false
  },

  drop: function (e) {
    if (!this.in_drag) {
      return true
    }
    this.in_drag = false
    let x_dir = 1
    if (e.preventDefault) {
      e.preventDefault()
    }
    if (e.clientX < this.start_x) {
      x_dir = -1
    }
    let y_dir = 1
    if (e.clientY < this.start_y) {
      y_dir = -1
    }
    this.start_x = -1
    this.start_y = -1
    if (this.drag_selection.data) {
      chrome.runtime.connect().postMessage({
        message: 'drag_and_go',
        selection: this.drag_selection,
        x_dir: x_dir,
        y_dir: y_dir
      })
      return false
    }
    return true
  },

  dragEnd: function (_e) {
    this.in_drag = false
  }
}

function dragStart (e) {
  gesture.cancelGesture(e)
  return drag_and_go.dragStart(e)
}

function dragOver (e) {
  return drag_and_go.dragOver(e)
}

function dragEnd (e) {
  return drag_and_go.dragEnd(e)
}

function drop (e) {
  return drag_and_go.drop(e)
}

function mouseDown (e) {
  let use_right_button = localOptions['use_right_button']
  if (!((use_right_button && e.button == 2) ||
    (!use_right_button && e.button == 0))) {
    gesture.cancelGesture(e)
    return true
  }
  if (localOptions['gesture'] > 0 && !e.ctrlKey && !e.altKey && !gesture.in_gesture) {
    document.addEventListener('mousemove', mouseMove, false)
    return gesture.beginGesture(e)
  } else {
    gesture.cancelGesture(e)
    return true
  }
}

function mouseUp (e) {
  if (localOptions['gesture'] > 0) {
    return gesture.endGesture(e)
  }
}

function mouseMove (e) {
  if (!drag_and_go.in_drag && localOptions['gesture'] > 0) {
    return gesture.moveGesture(e)
  }
  document.removeEventListener('mousemove', mouseMove, false)
  return true
}

function onContextMenu (e) {
  if (localOptions['use_right_button'] && localOptions['gesture'] > 0 && gesture.should_close_context_menu) {
    e.preventDefault()
  }
  gesture.should_close_context_menu = false
}

document.addEventListener('dragstart', dragStart, false)
document.addEventListener('dragover', dragOver, false)
document.addEventListener('drop', drop, false)
document.addEventListener('dragend', dragEnd, false)
document.addEventListener('mousedown', mouseDown, false)
document.addEventListener('mouseup', mouseUp, false)
document.addEventListener('contextmenu', onContextMenu, true)

function loadOptions () {
  chrome.storage.sync.get(['search_engine', 'alt_key', 'ctrl_key', 'restricted_distance', 'gesture', 'use_right_button'], function (localStorage) {
    localOptions = {
      alt_key: localStorage['alt_key'],
      ctrl_key: localStorage['ctrl_key'],
      search_engine: localStorage['search_engine'],
      restricted_distance: localStorage['restricted_distance'],
      use_right_button: localStorage['use_right_button'],
      gesture: localStorage['gesture']
    }
  })
}

loadOptions()
chrome.storage.onChanged.addListener((_changes, _area) => {
  loadOptions()})
