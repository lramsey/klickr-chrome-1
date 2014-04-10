$(function(){

  $('#view').click(function() {
    chrome.tabs.create({url: "popups/viewer.html"});
  });

  $('#options').click(function() {
    chrome.tabs.create({url: "popups/options.html"});
  });

  $('#start').click(function() {
    // window.close will automatically close the browser action window
    // so that mouse movements can be detected by recorder.js
    window.close();
    chrome.extension.getBackgroundPage().startRecording();
  });

  // $('#pause').click(function() {
  //   chrome.extension.getBackgroundPage().pauseRecording();
  // });

  $('#stop').click(function() {
    window.close();
    chrome.extension.getBackgroundPage().stopRecording();
  });

  $('#play').click(function() {
    window.close();
    chrome.extension.getBackgroundPage().playKlick();
  });

});