/* ------------------------------------------------------------------------------------*/
/* Message Class
/* ------------------------------------------------------------------------------------*/

var Message = function (text, classes, coords, duration, template) {
  this.text = text;
  this.classes = classes;
  this.coords = coords;
  this.duration = duration;

  this.parse();
  this.render();
  this.html(text);
  this.position(coords);
  this.addClasses(classes);
  this.display();
};

Message.prototype.fadeInOut = function(elem){
  elem.fadeOut(500).fadeIn(500);
  setInterval(function(){
    elem.fadeOut(500).fadeIn(500);
  }, 1000);
};

/* Extracts shortcodes from text and processes them */
Message.prototype.parse = function(){
  var matches = this.text.match(/\[([^\]]+)]/g);
  var parsed = '';
  if (matches){

  }
  this.text.replace(/\[(.*?)\]/g, '').trim();
  switch (parsed){
    case 'click':
      this.template = 'click';
      break;
    default:
      break;
  }
};

Message.prototype.render = function(){
  switch (this.template){
    case 'record':
      this.$message = $('<div class="klickr-msg klickr-msg-record"><div class="klickr-record"></div></div>');
      this.fadeInOut(this.$message.find('.klickr-record'));
      break;
    case 'play':
      this.$message = $('<div class="klickr-msg klickr-msg-play"><div class="klickr-play"></div></div>');
      this.fadeInOut(this.$message.find('.klickr-play'));
      break;
    case 'click':
      this.$message = $('<div class="klickr-click"></div>');
      break;
    default:
      this.$message = $('<div class="klickr-msg"></div>');
      break;
  }
};

Message.prototype.html = function(text){
  this.$message.append(text);
};

// function used in constructor to position message box
Message.prototype.position = function (coords) {
  // Other recorder or player messages at center
  if (coords === 'override'){
    // do nothing
  } else if (coords === undefined) {
    this.$message.css('position','fixed');
    this.$message.css('top', window.innerHeight/2 - this.$message.outerHeight(true)/2);
    this.$message.css('left', window.innerWidth/2 - this.$message.outerWidth(true)/2);
  } else {
    // annotations, clicks, keypresses at coordinates of the event
    this.$message.css('position','absolute');
    this.$message.css('top', coords.top + 45);
    this.$message.css('left', coords.left);
  }
};

Message.prototype.display = function(){
  $(document.body).append(this.$message);

  // fade out message
  var self = this;
  if (this.duration !== undefined && this.duration !== 0 && this.duration !== ''){
    this.$message.fadeOut(this.duration, function(){
      self.$message.remove();
    });
  }
};

Message.prototype.addClasses = function(classes){
  var classArr = classes.split(' ');
  for (var i = 0; i < classArr.length; i++){
    this.$message.addClass(classArr[i]);
  }
};

/* ------------------------------------------------------------------------------------*/
/* Init
/* ------------------------------------------------------------------------------------*/

$(function () {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    // message creation function definitions for various messages received from the background
    var actions = {
      // create temporary message (for annotations, clicks, keypresses)
      createMessage: function(request, sender, sendResponse){
        var message = new Message(request.message, 'klickr_temp', request.coords, request.duration);
        sendResponse({response: "Message: Message has been displayed on screen"});
      },
      // create recorder or player message
      showRecordMessage: function(request, sender, sendResponse){
        console.log("showRecordMessage ", request.message, " is received");
        var message = new Message(request.message, 'klickr-msg-sticky', 'override', 0, request.template);
        sendResponse({response: "Message: Message has been displayed on screen"});
      },

      // remove "Recording Now" message
      removeRecordMessage: function(request, sender, sendResponse){
        console.log("removeRecordMessage is received");
        $('.klickr-msg-sticky').fadeOut(1000);
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

