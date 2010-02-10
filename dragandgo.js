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
  if (e.srcElement.parentNode.nodeName == "A") {
    data = e.srcElement.parentNode.href;
  } else {
    data = e.dataTransfer.getData('Text');
    if (!data) {
      data = window.getSelection().toString();
    }
  }
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
