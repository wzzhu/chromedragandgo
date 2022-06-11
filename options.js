// Copyright (c) 2010-2099 Wenzhang Zhu

function hideHints () {
  document.getElementById('hint').style.visibility = 'hidden'
}

let LEFT = 0
let RIGHT = 1
let UP_DOWN = 2
let DOWN_RIGHT = 3
let UP = 4
let DOWN = 5
function saveOptions () {
  let engine = document.getElementById('search_engine').value
  chrome.storage.sync.set({'search_engine': engine})
  chrome.storage.sync.set({'alt_key': document.getElementById('alt_key').checked})
  chrome.storage.sync.set({'ctrl_key': document.getElementById('ctrl_key').checked})

  let gesture = 0
  if (document.getElementById('left_gesture').checked) {
    gesture |= 1 << LEFT
  }
  if (document.getElementById('right_gesture').checked) {
    gesture |= 1 << RIGHT
  }
  if (document.getElementById('up_down_gesture').checked) {
    gesture |= 1 << UP_DOWN
  }
  if (document.getElementById('down_right_gesture').checked) {
    gesture |= 1 << DOWN_RIGHT
  }
  if (document.getElementById('up_gesture').checked) {
    gesture |= 1 << UP
  }
  if (document.getElementById('down_gesture').checked) {
    gesture |= 1 << DOWN
  }
  chrome.storage.sync.set({'gesture': gesture})

  chrome.storage.sync.set({'use_right_button': document.getElementById('use_right_button').checked}, function () {
    let hint = document.getElementById('hint')
    hint.style.visibility = 'visible'
    setTimeout(hideHints, 1500)
  })
}

function restoreOptions () {
  chrome.storage.sync.get(['search_engine', 'alt_key', 'ctrl_key', 'gesture', 'use_right_button'], function (localStorage) {
    let engine = localStorage['search_engine']
    if (!engine) {
      engine = 'http://www.google.com/search?&q='
    }
    document.getElementById('search_engine').value = engine
    document.getElementById('alt_key').checked = localStorage['alt_key']
    document.getElementById('ctrl_key').checked = localStorage['ctrl_key']
    document.getElementById('use_right_button').checked = localStorage['use_right_button']

    let gesture = localStorage['gesture']
    document.getElementById('left_gesture').checked = gesture & (1 << LEFT) == (1 << LEFT)
    document.getElementById('right_gesture').checked = gesture & (1 << RIGHT) == (1 << RIGHT)
    document.getElementById('up_down_gesture').checked = gesture & (1 << UP_DOWN) == (1 << UP_DOWN)
    document.getElementById('down_right_gesture').checked = gesture & (1 << DOWN_RIGHT) == (1 << DOWN_RIGHT)
    document.getElementById('up_gesture').checked = gesture & (1 << UP) == (1 << UP)
    document.getElementById('down_gesture').checked = gesture & (1 << DOWN) == (1 << DOWN)
  })
}

function resetOptions () {
  let input_text = document.getElementById('search_engine')
  input_text.value = 'http://www.google.com/search?&q='
  document.getElementById('ctrl_key').checked = true
  document.getElementById('alt_key').checked = true
  document.getElementById('use_right_button').checked = false
  document.getElementById('left_gesture').checked = false
  document.getElementById('right_gesture').checked = false
  document.getElementById('up_down_gesture').checked = false
  document.getElementById('down_right_gesture').checked = false
  document.getElementById('up_gesture').checked = false
  document.getElementById('down_gesture').checked = false
}

function i18n (id, name) {
  document.getElementById(id).innerText = chrome.i18n.getMessage(name)
}

function loadI18nStrings () {
  i18n('title', 'option_title')
  i18n('author', 'option_copyright')
  i18n('search_engine_title', 'option_search_engine_title')
  i18n('disable_drag', 'option_disable_drag')
  i18n('alt_key_label', 'option_alt_key')
  i18n('ctrl_key_label', 'option_ctrl_key')
  i18n('gesture_title', 'option_gesture_title')
  i18n('use_right_button_label', 'option_right_button')
  i18n('left', 'option_gesture_left')
  i18n('right', 'option_gesture_right')
  i18n('up_down', 'option_gesture_up_down')
  i18n('down_right', 'option_gesture_down_right')
  i18n('up', 'option_gesture_up')
  i18n('down', 'option_gesture_down')
  i18n('save', 'option_save')
  i18n('reset', 'option_reset')
  i18n('hint', 'option_hint')
}

document.addEventListener('DOMContentLoaded', function () {
  restoreOptions()
  loadI18nStrings()
  document.getElementById('save').addEventListener('click', saveOptions)
  document.getElementById('reset').addEventListener('click', resetOptions)
})
