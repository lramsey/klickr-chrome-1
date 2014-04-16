/* ------------------------------------------------------------------------------------*/
/* BACKGROUND
/* Overall controller between BgEditor, BgPlayer and BgRecorder
/* ------------------------------------------------------------------------------------*/

console.log('Background initiated...');

/* ------------------------------------------------------------------------------------*/
/* CONFIG
/* ------------------------------------------------------------------------------------*/

var Klickr = {};
window.Klickr = Klickr;

Klickr.hostname = 'klickr.io';
Klickr.server = 'http://www.klickr.io';

  //stephan start
  window.latestLinks = [];
  //stehan send

/* ------------------------------------------------------------------------------------*/
/* RECORDER
/* ------------------------------------------------------------------------------------*/

// TODO: Refactor into BgRecorder

// Update recorder status
// loading -> ready -> recording -> processing -> saving
window.recorderStatus = 'loading';

window.refreshRecorderStatus = function(forced){
  if (forced === undefined) forced = false;
  if (forced || (window.recorderStatus === 'loading' || window.recorderStatus === 'ready') ){
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
      console.log('Background: Tab updated', tabs[0].url, tabs[0].status);
      if (tabs[0].status === 'loading'){
        window.recorderStatus = 'loading';
      } else if (tabs[0].status === 'complete') {
        window.recorderStatus = 'ready';
      }
    });
  }
};

chrome.tabs.onUpdated.addListener(function(){
  window.refreshRecorderStatus();
});

/* Background -> BgRecorder: Start recording */
window.startRecording = function(){
  if (window.recorderStatus === 'ready'){
    console.log('Background: Start recording');
    bgPlayer.reset();
    window.recorderStatus = 'recording';
    window.rec = new BgRecorder();
    helpers.activeTabSendMessage({action: 'showRecordMessage', message: 'Recording Now'});
  }
};

/* Background -> BgRecorder: Stop recording */
window.stopRecording = function(){
  if (window.recorderStatus === 'recording'){
    console.log('Background: Stop recording');
    window.recorderStatus = 'processing';
    window.rec.stop();
    window.editor = new Editor();
    helpers.activeTabSendMessage({action: 'removeRecordMessage'});
  }
};

/* Background -> BgRecorder: Save Klick */
window.saveKlick = function(desc){
  if (window.recorderStatus === 'processing'){
    console.log('Background: Save recording');
    window.editor.updateKlick();
    window.rec.addDescription(desc);
    window.rec.send();
    window.rec = undefined;
    window.refreshRecorderStatus(true);
  }
};

window.delete = function () {
  window.rec = undefined;
  window.refreshRecorderStatus(true);
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Sends server to content scripts
  if (request.action === 'getServer') {
    sendResponse({server: Klickr.server});
  }

  // Save recording: staged recording is sent to recorder to be pushed to server
  else if (request.action === 'save') {
    console.log('Background: Save recording');
    window.rec.addDescription(request.description);
    window.rec.send();
    window.rec = undefined;
    bgPlayer.klickQueue = [];
    sendResponse({response: 'Background: Processed save message'});
  }

  // If DOM is ready and window.recorderStatus = 'recording', then send message to message.js
  else if (request.action === 'recorderReady' && window.recorderStatus === 'recording') {
    helpers.activeTabSendMessage({action: 'showRecordMessage', message: 'Recording Now'});
  }
});