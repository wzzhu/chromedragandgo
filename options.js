// Copyright (c) 2010-2015 Wenzhang Zhu
// Script for option page
function notifyOptionChange(tabs) {
  for (var i = 0; i < tabs.length; ++i) {
    var tab = tabs[i];
    chrome.tabs.sendMessage(
    tab.id, {
      message: "set_options",
      options: {
        alt_key: localStorage["alt_key"],
        ctrl_key: localStorage["ctrl_key"],
        search_engine: localStorage["search_engine"],
        enable_gesture: localStorage["enable_gesture"],
        use_right_button: localStorage["use_right_button"]
      }
    });
  }
}

function iterateWindows(windows) {
  for (var i = 0; i < windows.length; ++i) {
    chrome.tabs.getAllInWindow(windows[i].id, notifyOptionChange);
  }
}

function hideHints() {
  document.getElementById('hint').style.visibility = 'hidden';
}

function saveOptions() {
  var engine = document.getElementById("search_engine")
    .value;
  localStorage["search_engine"] = engine;
  localStorage["alt_key"] = document.getElementById("alt_key").checked;
  localStorage["ctrl_key"] = document.getElementById("ctrl_key").checked;
  localStorage["enable_gesture"] =
      document.getElementById("enable_gesture").checked;
  localStorage["use_right_button"] =
      document.getElementById("use_right_button").checked;

  chrome.windows.getAll({
    populate: true
  }, iterateWindows);
  var hint = document.getElementById("hint");
  hint.style.visibility = "visible";
  setTimeout(hideHints, 1500);
}

function restoreOptions() {
  var engine = localStorage["search_engine"];
  if (!engine) {
    engine = "http://www.google.com/search?&q=";
  }
  var input_text = document.getElementById("search_engine");
  input_text.value = engine;

  var alt_key = localStorage["alt_key"];
  document.getElementById("alt_key").checked = (alt_key == "true");
  var ctrl_key = localStorage["ctrl_key"];
  document.getElementById("ctrl_key").checked = (ctrl_key == "true");
  var enable_gesture = localStorage["enable_gesture"];
  document.getElementById("enable_gesture").checked =
     (enable_gesture == "true");
  var use_right_button = localStorage["use_right_button"];
  document.getElementById("use_right_button").checked =
      (use_right_button == "true");
}

function resetOptions() {
  var engine = "http://www.google.com/search?&q=";
  var input_text = document.getElementById("search_engine");
  input_text.value = engine;
  document.getElementById("ctrl_key").checked = true;
  document.getElementById("alt_key").checked = true;
  document.getElementById("enable_gesture").checked = false;
  document.getElementById("use_right_button").checked = false;
}

function i18n(id, name) {
  document.getElementById(id).innerText = chrome.i18n.getMessage(name)
}

function loadI18nStrings() {
  i18n("title", "option_title");
  i18n("author", "option_copyright");
  i18n("search_engine_title", "option_search_engine_title");
  i18n("disable_drag", "option_disable_drag");
  i18n("alt_key_label", "option_alt_key");
  i18n("ctrl_key_label", "option_ctrl_key");
  i18n("gesture_title", "option_gesture_title");
  i18n("use_right_button_label", "option_right_button");
  i18n("enable_gesture_label", "option_enable_gesture");
  i18n("left", "option_gesture_left");
  i18n("right", "option_gesture_right");
  i18n("up_down", "option_gesture_up_down");
  i18n("down_right", "option_gesture_down_right");
  i18n("up", "option_gesture_up");
  i18n("down", "option_gesture_down");
  i18n("save", "option_save");
  i18n("reset", "option_reset");
  i18n("hint", "option_hint");
}

function init() {
  restoreOptions();
  loadI18nStrings();
}

document.addEventListener('DOMContentLoaded', function () {
  init();
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('reset').addEventListener('click', resetOptions);

});
