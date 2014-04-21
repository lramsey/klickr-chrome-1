/* ------------------------------------------------------------------------------------*/
/* RECORDER
/* Streams ticks to BgRecorder
/* ------------------------------------------------------------------------------------*/

var Recorder = function(){
  console.log('Initializing recorder...');
  var self = this;
  this.getServer();
  this.rate = 100;
  this.mousePos = undefined;
  this.isRecording = false;
  this.addListeners();
  this.initEventHandlers();

  // Keep track of cursor positions
  // (cursor positions are logged using setInterval to prevent excessive logging)
  window.onmousemove = function(event){
    self.mouseMove.apply(self, [event]);
  };

  // Tell background that you're ready
  chrome.runtime.sendMessage({action: 'recorderReady'});
};

window.Recorder = Recorder;

/* Gets the server from background */
Recorder.prototype.getServer = function(){
  var self = this;
  chrome.runtime.sendMessage({action:'getServer'}, function(response){
    self.server = response.server;
  });
};

/* Add other event listeners */
Recorder.prototype.addListeners = function(){
  var self = this;

  $('html').click(function(event){
    if (self.isRecording){
      var target = {};
      target.tagName = event.target.tagName;
      target.index = getIndexOf(target.tagName, event.target);

      self.log(event.type, event.pageX, event.pageY, event.clientX, event.clientY, event.timeStamp,
        target, undefined, event.altKey, event.ctrlKey, event.metaKey, event.shiftKey, document.URL);
    }
  });

  $('html').keypress(function(event){
    if (self.isRecording){
      var target = {};
      target.tagName = event.target.tagName;
      target.index = getIndexOf(target.tagName, event.target);

      var charCode = event.which || event.keyCode;
      self.log(event.type, event.pageX, event.pageY, event.clientX, event.clientY, event.timeStamp,
        target, charCode, event.altKey, event.ctrlKey, event.metaKey, event.shiftKey);
    }
  });
};

/* Listens to messages from background */
Recorder.prototype.initEventHandlers = function() {
  var self = this;

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'startRecording'){
      sendResponse({response: 'Recorder: Started'});
      self.start();
    } else if (request.action === 'stopRecording'){
      sendResponse({response: 'Recorder: Stopped'});
      self.stop();
    } else if (request.action === 'getWindowSize'){
      sendResponse({innerWidth: window.innerWidth, innerHeight: window.innerHeight});
    }
  });
};

/* Records cursor positions */
Recorder.prototype.mouseMove = function(event) {
  event = event || window.event; // IE
  this.mousePos = {
    pageX: event.pageX,
    pageY: event.pageY,
    clientX: event.clientX,
    clientY: event.clientY,
    url: document.URL
  };
};

/* Logs to output */
Recorder.prototype.log = function(action, pageX, pageY, clientX, clientY, timestamp,
                         target, charCode, altKey, ctrlKey, metaKey, shiftKey, url){
  if ( this.mousePos ) {
    action = action || 'move';
    pageX = pageX || this.mousePos.pageX;
    pageY = pageY || this.mousePos.pageY;
    clientX = clientX || this.mousePos.clientX;
    clientY = clientY || this.mousePos.clientY;
    timestamp = timestamp || Date.now();
    url = url || document.URL;
    target = target || ['', -1];

    var tick = {
      action: action,
      pageX: pageX,
      pageY: pageY,
      clientX: clientX,
      clientY: clientY,
      timestamp: timestamp,
      target: target,
      charCode: charCode,
      altKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey,
      shiftKey: shiftKey,
      url: url
    };
    // no recording of passwords. period.
    var $element = $($(tick.target.tagName)[tick.target.index]);
    if($element.attr('type') === 'password'){
      tick.charCode = -1;
    }

    chrome.runtime.sendMessage({action: 'appendTick', tick: tick});
  }
};

/* Start recording */
Recorder.prototype.start = function(){
  if (!this.isRecording){
    console.log('Recorder: Started');
    var self = this;
    this.isRecording = true;
    this.timer = setInterval(function(){
      self.log();
    }, this.rate);
  }
};

/* Stop recording */
Recorder.prototype.stop = function(){
  if (this.isRecording){
    console.log('Recorder: Stopped');
    this.isRecording = false;
    clearInterval(this.timer);
  }
};

/* ------------------------------------------------------------------------------------*/
/* Helper
/* ------------------------------------------------------------------------------------*/
var getIndexOf = function (tag, element) {
  // expect 'tag' to be a string and 'element' to be a DOM element (not jQuery)
  var index = -1;
  var $allElementsWithTag = $(tag);
  $allElementsWithTag.each(function (idx, el) {
    if (el === element) {
      index = idx;
    }
  });
  return index;
};

/* ------------------------------------------------------------------------------------*/
/* Init
/* ------------------------------------------------------------------------------------*/

$(function(){
  window.recorder = new Recorder();
});
