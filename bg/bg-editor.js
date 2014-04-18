/* ------------------------------------------------------------------------------------*/
/* EDITOR
/* - The purpose of editor is to control both the current bg-recorder and bg-player
 * instances.
 * - It contains a deep copy of the current klick object (from bg-recorder) and will use
 * this copy to add annotations with the ticks array.
 * - This deep copy of the current klick object will automatically insert annotations
 * for click and keypress events from the klick object.
 * - The editor can knows whether the bg-player instance is currently paused, and can
 * unpause it by resuming playback.
 * - The editor allows users to pause at any moment in the recording and add annotations,
 * and will automatically resume playback after adding the annotation.
/* ------------------------------------------------------------------------------------*/

var BgEditor = function () {
  /* Configurations for each new BgEditor instance */

  this.currentRecorder = window.Klickr.bgRecorder; // reference to current recorder in background // NEED TO CONFIRM WITH JUSTIN THAT THIS ISNT UNDEFINED
  this.currentPlayer = window.Klickr.bgPlayer; // reference to current player in background // NEED TO CONFIRM WITH LUKE THAT THIS ISNT UNDEFINED
  this.currentIndex = 0; // Current tick object index within ticks array where playback should start at
  this.resumeIndex = 0;  // index which will be sent back to the context player in the bgPlayer.resume function
  this.status = 'ready';
  this.currentKlickObject = _.cloneDeep(this.currentRecorder.getKlick()); // Using lo-dash for _.cloneDeep
  this.addClickAndKeypressAnnotations(); // automatically add annotations for keypress and click events within ticks array
  this.currentPlayer.buildKlickQueue(this.currentKlickObject);

  this.addEditorListeners();

};

/* ------------------------------------------------------------------------------------*/
/* LISTENER
/* ------------------------------------------------------------------------------------*/

BgEditor.prototype.addEditorListeners = function(){
  var self = this;
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // listens for playerDone action sent by bgPlayer
    if (request.action === 'playerDone') {
      self.playerDone();
    }
    //listens for the pauseIndex action sent by bgPlayer
    else if(request.action === 'pauseIndex') {
      self.pauseIndex(request);
    }
  });
};

// 
BgEditor.prototype.playerDone = function(){
  if (this.status !== 'playing') {
    throw new Error('BgEditor: Expected playing status instead of ' + this.status + ' when player is done');
  } else {
    this.setStatus('ready');
  }
};

// 
BgEditor.prototype.pauseIndex = function(request){
  window.Klickr.editor.currentIndex = request.rawIndex;
  window.Klickr.editor.resumeIndex = request.resumeIndex;
  window.Klickr.editor.addAnnotations();
};

/* ------------------------------------------------------------------------------------*/
/* Editor Functions
/* ------------------------------------------------------------------------------------*/

/* Control bg-player instance and invoke its pause function, which returns the index
 * within the ticks array of where pause is occurring. */
BgEditor.prototype.pausePlayback = function () {
  if (this.status === 'playing') {
    this.currentPlayer.pause();
    this.setStatus('paused');
  }
};

// begins replay after replay button click
BgEditor.prototype.replay = function(){
  if (this.status === 'ready'){
    this.currentPlayer.reset();
    this.currentPlayer.buildKlickQueue(this.currentKlickObject);
    this.currentPlayer.play();
    this.setStatus('playing');
  }
};

/* Control bg-player instance and invoke its resume function, which takes an index within
 * the ticks array to resume on. */
BgEditor.prototype.resumePlayback = function () {
  if (this.status === 'paused') {
    this.currentPlayer.resume(this.resumeIndex);
    this.setStatus('playing');
  }
};

/* Prompt users to input a String as their annotation. Append this annotation
 * to the actual tick if the input is nonempty. */
BgEditor.prototype.addAnnotations = function () {
  if (this.status === 'paused'){
    var message = window.prompt('Please enter the annotation you\'d like to add.');

    if (message && message.length !== 0) {
      this.currentKlickObject.ticks[this.currentIndex].annotation = message;
    }

    this.resumePlayback();
  }
};

/* Add annotations for click and keypress events within currentKlickObject */
BgEditor.prototype.addClickAndKeypressAnnotations = function () {
  var ticks = this.currentKlickObject.ticks;
  _.forEach(ticks, function (tick) { // Using lo-dash _.forEach
    if (tick.action === 'keypress') {
      tick.annotation = '[ ' + String.fromCharCode(tick.charCode) + ' ]';
    }
    else if (tick.action === 'click') {
      tick.annotation = '[ Click ]';
    }
  });
};

/* Send (modified) klick object back to bg-recorder instance */
BgEditor.prototype.updateKlick = function () {
  this.currentRecorder.updateKlick(this.currentKlickObject);
};

// sets the editor status
BgEditor.prototype.setStatus = function(status){
  this.status = status;
};

// gets the editor status
BgEditor.prototype.getStatus = function(){
  return this.status;
};
