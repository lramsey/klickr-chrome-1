/* ------------------------------------------------------------------------------------*/
/* BACKGROUND RECORDER
/* Consolidates ticks streamed from content script recorders into Klick object
/* ------------------------------------------------------------------------------------*/

var BgRecorder = function(){

  // bind listeners so they can be removed later
  this.bindUpdateActiveTab = helpers.bind(this.updateActiveTab, this);
  this.bindMsgHandler = helpers.bind(this.msgHandler, this);

  // init
  this.init();

};

window.BgRecorder = BgRecorder;

/* ------------------------------------------------------------------------------------*/
/* Init and Listeners
/* ------------------------------------------------------------------------------------*/

/* Background -> BgRecorder: Start recording */
BgRecorder.prototype.init = function(){
  window.Klickr.bgPlayer.reset();
  helpers.activeTabSendMessage({action: 'startRecording'});
  window.Klickr.recorderStatus = 'recording';
  this.isRecording = true;
  this.createKlick();
  this.bindUpdateActiveTab();
  this.addListeners();
  this.startMessage();
  helpers.activeTabSendMessage({action: 'showRecordMessage', message: 'Recording Now'});
};



/* Add listeners */
BgRecorder.prototype.addListeners = function(){
  chrome.tabs.onUpdated.addListener(this.bindUpdateActiveTab);
  chrome.runtime.onMessage.addListener(this.bindMsgHandler);
};

/* Remove listeners */
BgRecorder.prototype.removeListeners = function(){
  chrome.tabs.onUpdated.removeListener(this.bindUpdateActiveTab);
  chrome.runtime.onMessage.removeListener(this.bindMsgHandler);
};

/* Handles messages from content scripts
 * @request: message sent
 * @sender: chrome tab that sent message
 * @res: response
 */
BgRecorder.prototype.msgHandler = function(req, sender, res){
  var self = this;
  // appends tick to Klick
  if (req.action === 'appendTick') {
    self.appendTick(req.tick, sender.tab);
  }
  // when any recorder script is loaded, refresh the active tab
  else if (req.action === 'recorderReady') {
    self.bindUpdateActiveTab();
  }
};

/* ------------------------------------------------------------------------------------*/
/* Display Annotations
/* ------------------------------------------------------------------------------------*/

/* Display start recording message */
BgRecorder.prototype.startMessage = function(){
  helpers.activeTabSendMessage({
    action: 'createMessage',
    message: 'Start Recording Now',
    duration: 2000,
    coords: undefined
  });
};

/* Display stop recording message */
BgRecorder.prototype.stopMessage = function(){
  helpers.activeTabSendMessage({
    action: 'createMessage',
    message: 'Stop Recording Now',
    duration: 2000,
    coords: undefined
  });
};

/* ------------------------------------------------------------------------------------*/
/* Klick Construction
/* ------------------------------------------------------------------------------------*/

/* Creates a new Klick object */
BgRecorder.prototype.createKlick = function(){
  this.klick = {
    url: document.URL,
    description: '',
    ticks: []
  };
  this.getWindowSize();
};

/* Return Klick object */
BgRecorder.prototype.getKlick = function(){
  return this.klick;
};

/* Update Klick object
 * @klick: KLick object to replace existing one
 */
BgRecorder.prototype.updateKlick = function(klick){
  this.klick = klick;
};

/* Append tick to Klick object
 * @tick: single tick object
 * @fromTab: chrome tab that sent tick
 */
BgRecorder.prototype.appendTick = function(tick, fromTab){
  // if sent from active tab
  if (this.isRecording && this.activeTabId === fromTab.id){
    this.klick.ticks.push(tick);
  }
};

/* ------------------------------------------------------------------------------------*/
/* Klick Edits
/* ------------------------------------------------------------------------------------*/

/* Add description to Klick
 * @desc: description of Klick
 */
BgRecorder.prototype.addDescription = function(desc){
  this.klick.description = desc;
};

/* Update active tab url */
BgRecorder.prototype.updateActiveTab = function(){
  if (this.isRecording){
    var self = this;

    // update active tab and start its recording
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
      self.activeUrl = tabs[0].url;
      self.activeTabId = tabs[0].id;
      chrome.tabs.sendMessage(self.activeTabId, {action: 'startRecording'});
    });

    // stop other tabs from recording
    chrome.tabs.query({'lastFocusedWindow': false}, function(tabs){
      for (var i = 0; i < tabs.length; i++){
        chrome.tabs.sendMessage(tabs[i].id, {action: 'stopRecording'});
      }
    });
  }
};

/* Gets inner width and height from active tab */
BgRecorder.prototype.getWindowSize = function(){
  var self = this;
  helpers.activeTabSendMessage({action: 'getWindowSize'}, function(response){
    if (response && response.innerWidth && response.innerHeight){
      self.klick.width = response.innerWidth;
      self.klick.height = response.innerHeight;
    }
  });
};


/* ------------------------------------------------------------------------------------*/
/*  End Recording
/* ------------------------------------------------------------------------------------*/


/* Background -> BgRecorder: Stop recording */
BgRecorder.prototype.stopRecording = function(){
  if (window.Klickr.recorderStatus === 'recording'){
    window.Klickr.recorderStatus = 'processing';
    this.stop();
    window.Klickr.editor = new BgEditor();
    helpers.activeTabSendMessage({action: 'removeRecordMessage'});
  }
};



/* Append tick to Klick object */
BgRecorder.prototype.stop = function(){
  this.isRecording = false;
  helpers.sendMessage({action: 'stopRecording'});
  this.removeListeners();
  this.stopMessage();
};

/* Background -> BgRecorder: Save Klick */
BgRecorder.prototype.save = function(desc){
  if (window.Klickr.recorderStatus === 'processing'){
    window.Klickr.editor.updateKlick();
    this.addDescription(desc);
    this.send();
  }
};

/* Background -> Server: Send current klick object to the server to save */
BgRecorder.prototype.send = function(){
  $.ajax({
    type: 'POST',
    url: Klickr.server + '/klicks',
    data: JSON.stringify(this.klick),
    contentType: 'application/json',
    success: function(data) {
      // stephan start
      var newLink = window.Klickr.server + data.linkUrl;
      window.Klickr.latestLinks.push({description: data.description, url: newLink});
      // stephan end
    },
    error: function(data){
    }
  });
};


/* ------------------------------------------------------------------------------------*/
/* RECORDER Set Up
/* ------------------------------------------------------------------------------------*/

// Update recorder status
// loading -> ready -> recording -> processing -> saving
window.Klickr.recorderStatus = 'loading';

// refresh re
window.Klickr.refreshRecorderStatus = function(forced){
  if (forced === undefined){
    forced = false;
  }
  if (forced || (window.Klickr.recorderStatus === 'loading' || window.Klickr.recorderStatus === 'ready') ){
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
      if (tabs[0].status === 'loading'){
        window.Klickr.recorderStatus = 'loading';
      } else if (tabs[0].status === 'complete') {
        window.Klickr.recorderStatus = 'ready';
      }
    });
  }
};

chrome.tabs.onUpdated.addListener(function(){
  window.Klickr.refreshRecorderStatus();
});

// creates BgRecorder if the recorder status is ready
window.Klickr.startRecording = function(){
  if (window.Klickr.recorderStatus === 'ready'){
    window.Klickr.bgRecorder = new BgRecorder();
  }
};

// deletes the recorder on Klickr
window.Klickr.deleteRecorder = function () {
  window.Klickr.bgRecorder = undefined;
  window.Klickr.refreshRecorderStatus(true);
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Sends server to content scripts
  if (request.action === 'getServer') {
    sendResponse({server: Klickr.server});
  }

  // Save recording: staged recording is sent to recorder to be pushed to server
  else if (request.action === 'save') {
    window.Klickr.bgRecorder.addDescription(request.description);
    window.Klickr.bgRecorder.send();
    window.Klickr.bgRecorder = undefined;
    window.Klickr.bgPlayer.klickQueue = [];
    sendResponse({response: 'Background: Processed save message'});
  }

  // If DOM is ready and window.recorderStatus = 'recording', then send message to message.js
  else if (request.action === 'recorderReady' && window.Klickr.recorderStatus === 'recording') {
    helpers.activeTabSendMessage({action: 'showRecordMessage', message: 'Recording Now'});
  }
});
