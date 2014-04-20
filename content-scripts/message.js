/* ------------------------------------------------------------------------------------*/
/* Message Class
/* ------------------------------------------------------------------------------------*/

var Message = function (text, classes, coords, duration, template) {
  this.text = text;
  this.classes = classes;
  this.coords = coords;
  this.duration = duration;
  this.template = template;

  this.parse();
  this.render();
  this.html(this.text);
  this.addClasses(this.classes);
  this.position();
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
  var matches = this.text.match(/\[([^\]]+)]/);

  if (matches){
    var match = matches[1].trim().toLowerCase();
    switch (match){
      case 'click':
        this.template = 'click';
        this.text = this.text.replace(/\[([^\]]+)]/, '').trim();
        break;
      case 'header':
        this.template = 'header';
        this.text = this.text.replace(/\[([^\]]+)]/, '').trim();
        break;
      case 'center':
        this.template = 'center';
        this.text = this.text.replace(/\[([^\]]+)]/, '').trim();
        break;
      case 'footer':
        this.template = 'footer';
        this.text = this.text.replace(/\[([^\]]+)]/, '').trim();
        break;
      default:
        break;
    }
  }
};

Message.prototype.render = function(){
  switch (this.template){
    case 'record':
      this.$message = $('<div class="klickr klickr-msg klickr-msg-record klickr-anim-hatch"><div class="klickr-record"></div></div>');
      this.fadeInOut(this.$message.find('.klickr-record'));
      break;
    case 'play':
      this.$message = $('<div class="klickr klickr-msg klickr-msg-play klickr-anim-hatch"><div class="klickr-play"></div></div>');
      this.fadeInOut(this.$message.find('.klickr-play'));
      break;
    case 'click':
      this.$message = $('<div class="klickr klickr-click klickr-fade-in"></div>');
      this.duration = 500;
      break;
    case 'center':
      this.$message = $('<div class="klickr klickr-msg"></div>');
      this.coords = undefined;
      break;
    case 'footer':
      this.$message = $('<div class="klickr klickr-footer"></div>');
      break;
    case 'header':
      this.$message = $('<div class="klickr klickr-header"></div>');
      break;
    default:
      this.$message = $('<div class="klickr klickr-msg"></div>');
      break;
  }
};

Message.prototype.html = function(text){
  this.$message.append(text);
};

// function used in constructor to position message box
Message.prototype.position = function () {

  if (this.coords === 'override'){
    // do nothing
  } else if (this.template === 'footer'){
    // set height
    this.$message.css('top', window.innerHeight - 75);
  } else if (this.template === 'header'){
    // do nothing
  } else if (this.template === 'click'){
    // for clicks
    this.$message.css('position','absolute');
    this.$message.css('top', this.coords.top-25);
    this.$message.css('left', this.coords.left-25);
  } else if (this.coords === undefined) {
    this.$message.css('position','fixed');
    this.$message.css('top', window.innerHeight/2 - this.$message.outerHeight(true)/2);
    this.$message.css('left', window.innerWidth/2 - this.$message.outerWidth(true)/2);
  } else {
    // annotations, keypresses at coordinates of the event
    this.$message.css('position','absolute');
    this.$message.css('top', this.coords.top + 45);
    this.$message.css('left', this.coords.left);
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
        var message = new Message(request.message, 'klickr-temp', request.coords, request.duration);
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

