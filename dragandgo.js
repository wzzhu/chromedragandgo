function cancel (e) {
  if (e.preventDefault) {
	e.preventDefault ();
  }
  return false;
}

function dragStart(e) {
  start_x = e.screenX;
  start_y = e.screenY;  
}
document.addEventListener('dragstart', dragStart, false);
document.addEventListener('dragover', cancel, false);
document.addEventListener('drop', function (e) {	
	if (e.preventDefault) {
	  e.preventDefault ();
	}
	var x_dir = 1;
	if (e.screenX < start_x) {
	  x_dir = -1;
	}
	var y_dir = 1;
	if (e.screenY < start_y) {
	  y_dir = -1;
	}
  var data = e.dataTransfer.getData('URL');
  if (!data) {
    data = e.dataTransfer.getData('Text');
  }
  if (data) {
    chrome.extension.connect().postMessage({
      message: 'tab', values: data, x_dir: x_dir, y_dir: y_dir});
    return false;
  }
});