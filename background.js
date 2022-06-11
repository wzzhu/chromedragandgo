function tabAction (tab, drag_data) {
  let new_idx = tab.index
  if (drag_data.x_dir > 0) {
    ++new_idx
  }
  let fg = (drag_data.y_dir == 1)
  if (drag_data.selection.type == 'text') {
    chrome.storage.sync.get(['search_engine'], function (result) {
      let link = result['search_engine'] + drag_data.selection.data
      chrome.tabs.create({url: link, active: fg, index: new_idx})
    })
  } else {
    let link = drag_data.selection.data
    chrome.tabs.create({url: link, active: fg, index: new_idx})
  }
}

function initSettings () {
  chrome.storage.sync.get(['search_engine', 'alt_key', 'ctrl_key', 'restricted_distance', 'gesture' ], function (localStorage) {
    if (localStorage['search_engine'] == undefined) {
      let engine = 'http://www.google.com/search?&q='
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
  if (data.message == 'drag_and_go') {
    tabAction(port.sender.tab, data)
  } else if (data.message == 'closeMe') {
    chrome.tabs.remove(port.sender.tab.id)
  }
}

function connectionHandler (port) {
  port.onMessage.addListener(dragAndGoListener)
}
