/* ------------------------------------------------------------------------------------*/
/* Player Class Constructor
/*
/* ------------------------------------------------------------------------------------*/


var Player = function(){
  console.log('Initializing player...');
  this.pause = false;
  this.end = false;
  this.window = $(window);
  this.body = $('body');
  var that = this;

  // player function definitions for various messages received from the background
  this.actions = {
    play : function (request, sender, sendResponse){
      that.newPlayController(request.klick);
      console.log('Playing Klick');
      sendResponse({response: 'Player: Playing Klick...'});
    },
    pause : function (request, sender, sendResponse){
      that.pause = true;
      console.log('paused');
    },
    end : function(request, sender, sendResponse){
      that.end = true;
      console.log('end');
    },
    resume : function (request, sender, sendResponse){
      that.resumePlayController(request.klick, request.index);
      console.log('Resuming Klick Play');
      sendResponse({response: "Player: Resuming Klick Play"});
    },
    ready : function (request, sender, sendResponse) {
      sendResponse({response: 'ready'});
    }
  };

};

window.Player = Player;


/* ------------------------------------------------------------------------------------*/
/* Klick Formatting Methods
/* ------------------------------------------------------------------------------------*/

// update window size property, refresh interval, annotation inclusion 
Player.prototype.formatKlick = function(klick) {
  var movement = klick.ticks;
  this.scaleXY(klick);
  this.setMoveIntervals(movement);
};

//scales clientX, clientY, pageX, and pageY so different screen sizes will have the same display.
Player.prototype.scaleXY = function(klick){
  var xScale = this.window.width() / klick.width || 1;
  var yScale = this.window.height() / klick.height || 1;
  klick.width = this.window.width();
  klick.height = this.window.height();
  for(var i = 0; i < klick.ticks.length; i++){
    klick.ticks[i].clientX = klick.ticks[i].clientX*xScale;
    klick.ticks[i].clientY = klick.ticks[i].clientY*yScale;
    klick.ticks[i].pageX = klick.ticks[i].pageX*xScale;
    klick.ticks[i].pageY = klick.ticks[i].pageY*yScale;
  }
};

//uses Date.parse to turn the timestamp value from a date to an integer.  Also establishes the t value of the movement array.
// put movement[0].t === undefined so for multiple recordings, there would not be a lag between recordings
Player.prototype.setMoveIntervals = function(movement){
  if(movement[0].t === undefined){
    if(typeof movement[0].timestamp !== 'number'){
      this.parseDate(movement);
    }
    movement[0].t = 0;
    for (var i = 1; i < movement.length-1; i++){
      movement[i].t = movement[i].timestamp - movement[i-1].timestamp;
    }
  }
};

//changes the iso date object in timestamp to an integer of the Date.now() format
Player.prototype.parseDate = function(movement){
  for(var i = 0; i < movement.length; i++){
    movement[i].timestamp = Date.parse(movement[i].timestamp);
  }
};


/* ------------------------------------------------------------------------------------*/
/* Play Recording Methods
/* ------------------------------------------------------------------------------------*/

// chains mouse moves together. also adds the scrolling logic. the pageX and pageY values of the movement object at index are passed to move.
// function operates recursively, waiting the duration of the prior move in a setTimeout before calling the next move.
Player.prototype.playRecording = function(movement, index){
  if ( index === movement.length || this.end ) {
    this.endPlay();
  } else if (this.pause){
    this.pausePlay(index);
  } else {
    if(index === 0){
      this.placeMouse(movement);
    } else {
      this.showPlay(movement, index);
    }
    var that = this;
    setTimeout(function(){
      that.playRecording(movement, index+1);
    }, movement[index].t);
  }
};

// this function is very similar to Recorder.sendToBackground.  sends the nextKlick message to background, passing data over as the klick.
Player.prototype.endPlay = function(){
  console.log('Player: Sending to background');
  if(this.end){
    chrome.runtime.sendMessage({action: "klickEnded"});
  }
  chrome.runtime.sendMessage({action : "klickFinished"});
  $('.mouse').detach();
};

// function to pause playback
Player.prototype.pausePlay = function(index){
  chrome.runtime.sendMessage({action : "klickPaused", index:index});
  console.log('Player: paused');
};

// NEEDS REFACTOR !!
//places the mouse in the dom and gives the mouse's initial position and characteristics
Player.prototype.placeMouse = function(movement){
  var cursor = chrome.extension.getURL("img/klickr-pointer.png");
  this.body.append('<div class="mouse" style="position:absolute; background: url('+cursor+'); width: 40px;' +
           'z-index: 9999; height:40px; top: '+movement[0].pageY+'px; left:'+movement[0].pageX+'px;"></div>');
};

// function to display in DOM the various elements of a playback
Player.prototype.showPlay = function(movement, index){
  if (movement[index].action === 'move'){
    this.move(movement, index);
  } else if (movement[index].action === 'keypress'){
    this.keypress(movement, index);
  } else if (movement[index].action === 'click'){
    this.click(movement, index);
  }
  if (movement[index].annotation !== '' && movement[index].annotation !== undefined){
    var message = new Message(movement[index].annotation,
                              'klickr_Annotations',
                              {'top':movement[index].pageY, 'left':movement[index].pageX },
                              3000);
  }
};

// moves mouse to given destination with duration
Player.prototype.move = function (movement, index){
  this.window.scrollLeft(movement[index].pageX-movement[index].clientX);
  this.window.scrollTop(movement[index].pageY-movement[index].clientY);
  d3.select('.mouse')
    .transition()
    .duration(movement[index].t)
    .style({'top': movement[index].pageY + 'px', 'left': movement[index].pageX + 'px'});
};

// shows key presses during recording
Player.prototype.keypress =function(movement, index) {
  var $element = $($(movement[index].target.tagName)[movement[index].target.index]);
  var key = String.fromCharCode(movement[index].charCode);
  var text = $element.val();
  $element.val(text + key);
};

// shows clicks during recording
Player.prototype.click = function(movement, index) {
  var $clickElement = $($(movement[index].target.tagName)[movement[index].target.index]);
  $clickElement.trigger('click');
};


/* ------------------------------------------------------------------------------------*/
/* Play Controllers
/* ------------------------------------------------------------------------------------*/

// generate new playback
Player.prototype.newPlayController = function(klick){
  this.formatKlick(klick);
  this.playRecording(klick.ticks, 0);
};

// resume playback after pause
Player.prototype.resumePlayController = function(klick, index){
  this.formatKlick(klick);
  this.pause = false;
  this.playRecording(klick.ticks, index);
};


/* ------------------------------------------------------------------------------------*/
/* Init
/* ------------------------------------------------------------------------------------*/

$(function(){

  //helper for playing back mouse actions
  var player = new Player();

  // Trigger listeners to messages from background
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request.action);
    if (player.actions.hasOwnProperty(request.action)){
      player.actions[request.action](request, sender, sendResponse);
    } else {
      console.log('player has no action:', request.action);
    }
  });

});
