/* ------------------------------------------------------------------------------------*/
/* Message Class
/* - Used by Player class
/* - Produces <div> element with text to display to user
/* - Built-in functionality to fade out
/* ------------------------------------------------------------------------------------*/

// function used in constructor to format message box
var formatMessage = function(div){
   div.css({
    "background-color": "rgba(230, 230, 250, 0.9)",
    "color": "black",
    "border-radius": "5px",
    "padding": "15px",
    "font-size": "24px",
    "max-width": "50%",
    "z-index": 2147483647
  });
};


// function used in constructor to position message box
var positionMessage = function (div, coords) {
  // "Recording Now" message at bottom-right corner
  if (div.hasClass('klickr_Recording_Now')){
    div.css('position','fixed');
    div.css('bottom', 0);
    div.css('right', 0);
  // Other recorder or player messages at center
  } else if (coords === undefined) {
    div.css('position','fixed');
    div.css('top', window.innerHeight/2 - div.outerHeight(true)/2);
    div.css('left', window.innerWidth/2 - div.outerWidth(true)/2);
  } else {
    // annotations, clicks, keypresses at coordinates of the event
    div.css('position','absolute');
    div.css('top', coords.top+ 45);
    div.css('left', coords.left);
  }
};

// function used in constructor to display message box
var displayMessage = function(div, duration){
  // add this Message object's $message property onto DOM
  $(document.body).append(div);
  console.log('should have displayed', div.text(), 'duration', duration, 'top', div.css('top'), 'left', div.css('left'));

  // fade out message
  if (duration !== undefined){
    div.fadeOut(duration, function(){
        div.remove();
    });
  }

};

// constructor
var Message = function (text, messageClass, coords, duration) {
  this.$message = $("<div class='klickrMessage'></div>");
  this.$message.text(text);
  this.$message.addClass(messageClass);
  formatMessage(this.$message);
  displayMessage(this.$message, duration);
  positionMessage(this.$message, coords);
};


/* ------------------------------------------------------------------------------------*/
/* Init
/* ------------------------------------------------------------------------------------*/

$(function () {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    // message creation function definitions for various messages received from the background
    var actions = {
      // create temporary message (for annotations, clicks, keypresses)
      createMessage : function(request, sender, sendResponse){
        var message = new Message(request.message, 'klickr_temp', request.coords, request.duration);
        sendResponse({response: "Message: Message has been displayed on screen"});
      },
      // create recorder or player message
      showRecordMessage : function(request, sender, sendResponse){
        console.log("showRecordMessage ", request.message, " is received");
        var message = new Message(request.message, 'klickr_' + request.message.replace(' ', '_'));
        sendResponse({response: "Message: Message has been displayed on screen"});
      },

      // remove "Recording Now" message
      removeRecordMessage : function(request, sender, sendResponse){
          console.log("removeRecordMessage is received");
          $('.klickr_Recording_Now').fadeOut(3000);
          sendResponse({response: "Message: Message has been displayed on screen"});
      }
    };

    // steps-over irrelevant actions
    if (actions.hasOwnProperty(request.action)){
      actions[request.action](request, sender, sendResponse);
    } else {
      console.log('message has no action:', request.action);
    }

  });
});

