function dragOver (e) {
  if (start_x == -1 || start_y == -1) {
    // The dragover event is from external, keep original action.
    return true;
  }
  if (e.preventDefault) {
    e.preventDefault ();
  }
  return false;
}

mouse_style = "default";
function dragStart(e) {
  mouse_style = document.body.style.cursor;
  document.body.style.cursor = "move";
  start_x = e.screenX;
  start_y = e.screenY;
}

function getDragSelection(e) {
	var data;
	var selection = window.getSelection();
	var parent_node = e.srcElement.parentNode;
	while(parent_node && parent_node.nodeName != "A") {
	  parent_node = parent_node.parentNode;
	}
  if (parent_node) {
		if (selection && selection.baseNode &&
		    (selection.baseNode.baseURI == e.srcElement.baseURI) &&
		    (selection.baseNode.data== e.srcElement.data) &&
				(selection.baseOffset != selection.extentOffset)) {
		  data = selection.toString();
		} else {
			data = parent_node.href;
		}
  } else {
    data = e.dataTransfer.getData('Text');
    if (!data) {
      data = selection.toString();
    }
  }
	return data;
}

function dragEnd(e) {
  if (start_x == -1 || start_y == -1) {
    // The drop event is from external, keep original action.
    return true;
  }
  document.body.style.cursor = mouse_style;
  mouse_style = "default";
  var x_dir = 1;
  if (e.preventDefault) {
    e.preventDefault ();
  }
  if (e.screenX < start_x) {
    x_dir = -1;
  }
  var y_dir = 1;
  if (e.screenY < start_y) {
    y_dir = -1;
  }
  start_x = -1;
  start_y = -1;
	var data = getDragSelection(e);
  if (data) {
    chrome.extension.connect().postMessage({
      message: 'tab', values: data, x_dir: x_dir, y_dir: y_dir});
    return false;
  }
  return true;
}
start_x = -1;
start_y = -1;
document.addEventListener('dragstart', dragStart, false);
document.addEventListener('dragover', dragOver, false);
document.addEventListener('drop', dragEnd, false);
document.addEventListener('dragend', dragEnd, false);
