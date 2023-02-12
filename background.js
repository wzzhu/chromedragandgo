function tabAction (tab, dragData) {
  let newIdx = tab.index
  if (dragData.xDir > 0) {
    ++newIdx
  }
  let fg = (dragData.yDir == 1)
  if (dragData.selection.type == 'text') {
    chrome.storage.sync.get(['search_engine'], function (result) {
      let link = result['search_engine'] + encodeURIComponent(dragData.selection.data)
      chrome.tabs.create({url: link, active: fg, index: newIdx})
    })
  } else {
    let link = dragData.selection.data
    chrome.tabs.create({url: link, active: fg, index: newIdx})
  }
}

function initSettings () {
  chrome.storage.sync.get(['search_engine', 'alt_key', 'ctrl_key', 'restricted_distance', 'gesture' ], function (localStorage) {
    if (localStorage['search_engine'] == undefined) {
      let engine = 'http://www.google.com/search?q='
      chrome.storage.sync.set({'search_engine': engine})
    }
    if (localStorage['alt_key'] == undefined) {
      chrome.storage.sync.set({'alt_key': true})
    }

    if (localStorage['ctrl_key'] == undefined) {
      chrome.storage.sync.set({'ctrl_key': true})
    }

    if (localStorage['restricted_distance'] == undefined) {
      chrome.storage.sync.set({'restricted_distance': 16})
    }

    // Disables gesture by default.
    if (localStorage['gesture'] == undefined) {
      chrome.storage.sync.set({'gesture': 0})
    }
  })
}

initSettings()
chrome.runtime.onConnect.addListener(connectionHandler)

function dragAndGoListener (data, port) {
  if (data.message == 'dragAndGo') {
    tabAction(port.sender.tab, data)
  } else if (data.message == 'closeMe') {
    chrome.tabs.remove(port.sender.tab.id)
  }
}

function connectionHandler (port) {
  port.onMessage.addListener(dragAndGoListener)
}
