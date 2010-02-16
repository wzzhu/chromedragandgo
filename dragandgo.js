var drag_and_go = {
  in_drag: false,
  drag_selection: {type: "text", data: ""},
  start_x: -1,
  start_y: -1,

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
    in_drag = true;
    start_x = e.pageX;
    start_y = e.pageY;
    drag_selection = drag_and_go.getDragSelection(e);
    if (drag_selection.type == "text") {
      var link = drag_and_go.getTextLink(drag_selection.data);
      if (link != "") {
	drag_selection.type = "link";
	drag_selection.text = link;
      }
    }
    return false;
  },

  dragOver: function(e) {
    if (!in_drag) {
      return true;
    }
    if (e.preventDefault) {
      e.preventDefault ();
    }
    return false;
  },

  dragEnd: function(e) {
    if (!in_drag) {
      return true;
    }
    in_drag = false;
    var x_dir = 1;
    if (e.preventDefault) {
      e.preventDefault ();
    }
    if (e.pageX < start_x) {
      x_dir = -1;
    }
    var y_dir = 1;
    if (e.pageY < start_y) {
      y_dir = -1;
    }
    start_x = -1;
    start_y = -1;
    if (drag_selection.data) {
      chrome.extension.connect().postMessage({
        message: 'drag_and_go', selection: drag_selection,
	x_dir: x_dir, y_dir: y_dir});
      return false;
    }
    return true;
  },
};

document.addEventListener('dragstart', drag_and_go.dragStart, false);
document.addEventListener('dragover', drag_and_go.dragOver, false);
document.addEventListener('drop', drag_and_go.dragEnd, false);
document.addEventListener('dragend', drag_and_go.dragEnd, false);
