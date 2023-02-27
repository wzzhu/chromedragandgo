// Copyright(c) 2011 Wenzhang Zhu.
// All rights reserved.
//
// Super drag and go content script. Handle mouse events for mouse gesture
// and drag.
var localOptions = {}

function canvas() {
  this.htmlCanvas = document.createElement('canvas')
  this.ctx = this.htmlCanvas.getContext('2d')
  this.setCanvasStyle = function (strokeStyle, fillStyle, lineWidth) {
    this.htmlCanvas.setAttribute('width', window.innerWidth + 'px')
    this.htmlCanvas.setAttribute('height', window.innerHeight + 'px')
    this.htmlCanvas.setAttribute(
      'style',
      'z-index:100;position:fixed;top:0px;left:0px')
    this.ctx.fillStyle = fillStyle
    this.ctx.strokeStyle = strokeStyle
    this.ctx.lineWidth = lineWidth
    this.ctx.save()
  }

  this.showCanvas = function (x, y, parent) {
    if (!parent) {
      return
    }
    if (parent.lastChild != this.htmlCanvas) {
      parent.appendChild(this.htmlCanvas)
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
    return (this.htmlCanvas.parentNode &&
      this.htmlCanvas.parentNode.lastChild == this.htmlCanvas)
  }

  this.hideCanvas = function () {
    if (this.htmlCanvas.parentNode &&
      this.htmlCanvas.parentNode.lastChild == this.htmlCanvas) {
      this.htmlCanvas.parentNode.removeChild(this.htmlCanvas)
    }
  }
}

var gesture = {
  inGesture: false,
  shouldCloseContextMenu: false,
  seq: '', // Gesture sequence
  lastPos: {
    x: -1,
    y: -1
  }, // Last mouse position
  startTime: 0,
  beginGesture: function (e) {
    this.inGesture = true
    this.seq = ''
    this.lastPos = {
      x: e.clientX,
      y: e.clientY
    }
    this.startTime = new Date().getTime()
    return false
  },
  canvas: new canvas(),

  isValidGesturePrefix: function (seq) {
    let g = localOptions['gesture']
    return this.checkAction(g, 0) && seq == "L" ||
      this.checkAction(g, 1) && seq == "R" ||
      this.checkAction(g, 2) && seq == "U" ||
      this.checkAction(g, 3) && seq == "D" ||
      this.checkAction(g, 4) && seq == "U" ||
      this.checkAction(g, 5) && seq == "D"
  },

  moveGesture: function (e) {
    if (!this.inGesture) {
      return true
    }
    if (new Date().getTime() - this.startTime < 300) {
      // Wait for dragStart for 300us
      return true
    }
    let range = null
    if (window.getSelection().rangeCount > 0) {
      range = window.getSelection().getRangeAt(0)
    }
    let useRightButton = localOptions['use_right_button']
    if (!useRightButton && !this.canvas.hasCanvas() && range &&
      range.startContainer == range.endContainer &&
      (range.startContainer.nodeName == '#text' &&
        range.startOffset < range.startContainer.length &&
        range.endOffset < range.endContainer.length ||
        range.startOffset == range.endOffset)) {
      this.cancelGesture(e)
      return true
    }
    this.canvas.showCanvas(this.lastPos.x, this.lastPos.y, document.body)
    this.collectGestures(e)
    if (this.seq.length > 3 || this.seq.length == 0) {
      this.cancelGesture()
      return true
    }
    window.getSelection().empty()
    this.canvas.showLineTo(this.lastPos.x, this.lastPos.y, false)
    return false
  },

  checkGesture: function (e) {
    if (this.lastPos.x < 0 || this.lastPos.y < 0) {
      this.lastPos = {
        x: e.clientX,
        y: e.clientY
      }
    } else {
      let dx = e.clientX - this.lastPos.x
      let dy = e.clientY - this.lastPos.y
      if (dx * dx < 25 && dy * dy < 25) {
        // Ignore short distance.
        return ""
      }
      let newGesture
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          newGesture = 'R'
        } else {
          newGesture = 'L'
        }
      } else {
        if (dy > 0) {
          newGesture = 'D'
        } else {
          newGesture = 'U'
        }
      }
      return newGesture
    }
  },

  collectGestures: function (e) {
    let newGesture = this.checkGesture(e)
    if (newGesture == "") {
      return false
    }
    if (this.seq.length == 0 && !this.isValidGesturePrefix(newGesture)) {
      return false
    }
    if (this.seq.length <= 0 ||
      this.seq.substring(this.seq.length - 1) != newGesture) {
      this.seq = this.seq + newGesture
    }
    this.lastPos = {
      x: e.clientX,
      y: e.clientY
    }
    return true
  },

  endGesture: function (e) {
    if (!this.inGesture) {
      return true
    }
    this.inGesture = false
    this.collectGestures(e)
    if (this.seq != '') {
      this.canvas.showLineTo(this.lastPos.x, this.lastPos.y, true)
      if (this.takeAction(this.seq)) {
        window.getSelection().empty()
        this.shouldCloseContextMenu = true
      }
      this.seq = ''
      this.canvas.hideCanvas()
      if (e.preventDefault) {
        e.preventDefault()
      }
    }
    document.removeEventListener('mousemove', mouseMove, false)
    this.lastPos = {
      x: -1,
      y: -1
    }
    return false
  },

  cancelGesture: function (_e) {
    this.inGesture = false
    this.canvas.hideCanvas()
  },

  checkAction: function (g, bf) {
    return (g & (1 << bf)) == (1 << bf)
  },

  takeAction: function (seq) {
    let gesture = localOptions['gesture']
    if (this.seq == 'L' && this.checkAction(gesture, 0)) {
      history.back()
      return true
    } else if (this.seq == 'R' && this.checkAction(gesture, 1)) {
      history.forward()
      return true
    } else if (this.seq == 'UD' && this.checkAction(gesture, 2)) {
      location.reload(true)
      return true
    } else if (this.seq == 'DR' && this.checkAction(gesture, 3)) {
      chrome.runtime.connect().postMessage({
        message: 'closeMe'
      })
      return true
    } else if (this.seq == 'U' && this.checkAction(gesture, 4)) {
      window.scroll(0, 0)
      return true
    } else if (this.seq == 'D' && this.checkAction(gesture, 5)) {
      window.scroll(0, document.body.scrollHeight)
      return true
    }
    return false
  }
}

let dragAndGo = {
  inDrag: false,
  dragSelection: {
    type: 'text',
    data: ''
  },
  startX: -1,
  startY: -1,

  // Extract the link from the given text if any.
  // Otherwise return empty string.
  getTextLink: function (text) {
    let re = /((http|ftp|https|file):\/\/|www\.)[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:\/~\+#\*!]*[\w\-\.,@?^=%&:\/~\+#\*!])?/
    let link = ''
    let matches = text.match(re)
    if (matches) {
      link = matches[0]
      if (matches.length <= 2 || matches[2] != 'http' && matches[2] != 'https' && matches[2] != 'ftp' && matches[2] != 'file') {
        link = 'https://' + link
      }
    }
    return link
  },

  getDragSelection: function (e) {
    let data
    let dataType = 'text'
    let selection = window.getSelection()
    let parent = e.srcElement
    while (parent && parent.nodeName != 'A') {
      parent = parent.parentNode
    }
    if (parent) {
      if (parent.href.substr(0, 11) != 'javascript:') {
        dataType = 'link'
        data = parent.href
      }
    } else if (e.srcElement.nodeName == 'IMG') {
      dataType = 'img'
      data = e.srcElement.src
    } else {
      data = e.dataTransfer.getData('Text')
      if (!data) {
        data = selection.toString()
      }
    }
    return {
      'type': dataType,
      'data': data
    }
  },

  dragStart: function (e) {
    if (localOptions['alt_key'] && e.altKey ||
      localOptions['ctrl_key'] && e.ctrlKey) {
      return true
    }
    this.inDrag = true
    this.startX = e.clientX
    this.startY = e.clientY
    this.dragSelection = this.getDragSelection(e)
    if (this.dragSelection.type == 'text') {
      let link = this.getTextLink(this.dragSelection.data)
      if (link != '') {
        // Update the selection from text type to link
        this.dragSelection.type = 'link'
        this.dragSelection.data = link
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
    if (!this.inDrag) {
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
    if (!this.inDrag) {
      return true
    }
    this.inDrag = false
    let xDir = 1
    if (e.preventDefault) {
      e.preventDefault()
    }
    if (e.clientX < this.startX) {
      xDir = -1
    }
    let yDir = 1
    if (e.clientY < this.startY) {
      yDir = -1
    }
    this.startX = -1
    this.startY = -1
    if (this.dragSelection.data) {
      chrome.runtime.connect().postMessage({
        message: 'dragAndGo',
        selection: this.dragSelection,
        xDir: xDir,
        yDir: yDir
      })
      return false
    }
    return true
  },

  dragEnd: function (_e) {
    this.inDrag = false
  }
}

function dragStart(e) {
  gesture.cancelGesture(e)
  return dragAndGo.dragStart(e)
}

function dragOver(e) {
  return dragAndGo.dragOver(e)
}

function dragEnd(e) {
  return dragAndGo.dragEnd(e)
}

function drop(e) {
  return dragAndGo.drop(e)
}

function mouseDown(e) {
  let useRightButton = localOptions['use_right_button']
  if (!((useRightButton && e.button == 2) ||
    (!useRightButton && e.button == 0))) {
    gesture.cancelGesture(e)
    return true
  }
  if (localOptions['gesture'] > 0 && !e.ctrlKey && !e.altKey && !gesture.inGesture) {
    document.addEventListener('mousemove', mouseMove, false)
    return gesture.beginGesture(e)
  } else {
    gesture.cancelGesture(e)
    return true
  }
}

function mouseUp(e) {
  if (localOptions['gesture'] > 0) {
    return gesture.endGesture(e)
  }
}

function mouseMove(e) {
  if (!dragAndGo.inDrag && localOptions['gesture'] > 0) {
    return gesture.moveGesture(e)
  }
  document.removeEventListener('mousemove', mouseMove, false)
  return true
}

function onContextMenu(e) {
  if (localOptions['use_right_button'] && localOptions['gesture'] > 0 && gesture.shouldCloseContextMenu) {
    e.preventDefault()
  }
  gesture.shouldCloseContextMenu = false
}

document.addEventListener('dragstart', dragStart, false)
document.addEventListener('dragover', dragOver, false)
document.addEventListener('drop', drop, false)
document.addEventListener('dragend', dragEnd, false)
document.addEventListener('mousedown', mouseDown, false)
document.addEventListener('mouseup', mouseUp, false)
document.addEventListener('contextmenu', onContextMenu, true)

function loadOptions() {
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
  loadOptions()
})
