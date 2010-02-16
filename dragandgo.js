var drag_and_go = {
  in_drag: false,
  drag_selection: {type: "text", data: ""},
  start_x: -1,
  start_y: -1,
  local_options: {},

  // Extract the link from the given text if any.
  // Otherwise return empty string.
  getTextLink: function(text) {
    var re = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([-\w\/_~\.,#%=\*:]*(\?\S+)?)?)?/;
    var re2 = /www\.[-\w\.]+(\/[\S]*)*/;
    var link = "";
    var matches = text.match(re);
    if (matches) {
      link = matches[0];
    } else {
      matches = text.match(re2);
      if (matches) {
        link = "http://" + matches[0];
      }
    }
    return link;
  },

  getDragSelection: function(e) {
    var data;
    var data_type = "text";
    var selection = window.getSelection();
    var parent_node = e.srcElement.parentNode;
    while(parent_node && parent_node.nodeName != "A") {
      parent_node = parent_node.parentNode;
    }
    if (parent_node) {
      if (parent_node.href.substr(0, 11) != "javascript:") {
        data = parent_node.href;
      }
    } else if (e.srcElement.nodeName == "IMG") {
      data_type = "img";
      data = e.srcElement.src;
    } else {
      data = e.dataTransfer.getData('Text');
      if (!data) {
        data = selection.toString();
      }
    }
    return {"type": data_type, "data": data};
  },
  
  dragStart: function(e) {
    if (this.local_options["alt_key"] == "true" && e.altKey ||
        this.local_options["ctrl_key"] == "true" && e.ctrlKey) {
      return true;
    }
    this.in_drag = true;
    this.start_x = e.pageX;
    this.start_y = e.pageY;
    this.drag_selection = this.getDragSelection(e);
    if (this.drag_selection.type == "text") {
      var link = this.getTextLink(this.drag_selection.data);
      if (link != "") {
	this.drag_selection.type = "link";
	this.drag_selection.text = link;
      }
    }
    return false;
  },

  dragOver: function(e) {
    if (!this.in_drag) {
      return true;
    }
    if (e.preventDefault) {
      e.preventDefault ();
    }
    return false;
  },

  dragEnd: function(e) {
    if (!this.in_drag) {
      return true;
    }
    this.in_drag = false;
    var d = this.local_options["restricted_distance"];
    if (d >= 100) {
      d = 99;
    }
    if ((e.pageX - this.start_x) * (e.pageX - this.start_x) +
	 (e.pageY - this.start_y) * (e.pageY - this.start_y) <
	 d * d) {
      // If the drag distrance is too small (within 16 pixels from
      // the starting point), then no go action.
      return true;
    }
    var x_dir = 1;
    if (e.preventDefault) {
      e.preventDefault ();
    }
    if (e.pageX < this.start_x) {
      x_dir = -1;
    }
    var y_dir = 1;
    if (e.pageY < this.start_y) {
      y_dir = -1;
    }
    this.start_x = -1;
    this.start_y = -1;
    if (this.drag_selection.data) {
      chrome.extension.connect().postMessage({
        message: 'drag_and_go', selection: this.drag_selection,
	x_dir: x_dir, y_dir: y_dir});
      return false;
    }
    return true;
  },
};

function dragStart(e) {
  chrome.extension.sendRequest({message: 'get_options'}, function(response) {
    drag_and_go.local_options = response;
  }); 
  drag_and_go.dragStart(e);
}

function dragOver(e) {
  drag_and_go.dragOver(e);
}

function dragEnd(e) {
  drag_and_go.dragEnd(e);
}

document.addEventListener('dragstart', dragStart, false);
document.addEventListener('dragover', dragOver, false);
document.addEventListener('drop', dragEnd, false);
document.addEventListener('dragend', dragEnd, false);
chrome.extension.sendRequest({message: 'get_options'}, function(response) {
  drag_and_go.local_options = response;
}); 
