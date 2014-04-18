angular.module('KlickrChromeApp', [])

  .controller('PopupCtrl', function ($scope, $interval) {

    var Klickr = chrome.extension.getBackgroundPage().Klickr;

    /* Status update loop */
    $scope.refreshStatus = function(){
      $scope.recorderStatus = Klickr.recorderStatus;
      $scope.editorStatus = Klickr.editor === undefined ? 'inactive' : Klickr.editor.getStatus();
    };

    $scope.refreshStatus();
    $interval(function() {
      $scope.refreshStatus();
      $scope.Links = Klickr.latestLinks;  //stephan add
      if ($scope.Links.length>0) {$scope.showRecentLinks = true;}  //stephan add
    }, 500);

    $scope.showMessage = false;
    $scope.message = '';
    $scope.showRecentLinks = false;

    /* ------------------------------------------------------------------------------------*/
    /* TOP NAV
    /* ------------------------------------------------------------------------------------*/

    $scope.canRecord = function(){
      return $scope.recorderStatus === 'ready' && Klickr.bgPlayer.getStatus() !== 'playing';
    };

    $scope.canStop = function(){
      return $scope.recorderStatus === 'recording';
    };

    $scope.canPlay = function(){
      return Klickr.bgPlayer.getStatus() === 'ready';
    };

    $scope.showSaver = function(){
      return $scope.recorderStatus === 'processing';
    };

    // on click handlers
    $scope.startRecording = function(){
      window.close();
      $scope.recorderStatus = 'recording';
      Klickr.startRecording();
    };

    $scope.stopRecording = function(){
      $scope.recorderStatus = 'processing';
      Klickr.bgRecorder.stopRecording();
      $scope.isPaused = true;
    };

    $scope.playRecording = function(){
      window.close();
      Klickr.bgPlayer.play();
    };

    $scope.toHome = function(){
      chrome.tabs.create({url: 'http://www.klickr.io'});
    };

    /* ------------------------------------------------------------------------------------*/
    /* POST-RECORDING PROCESSING
    /* ------------------------------------------------------------------------------------*/


    $scope.replay = function(){
      if (Klickr.editor === undefined) throw new Error('Popup: BgEditor should be defined when replay is clicked');
      Klickr.editor.replay();
      $scope.refreshStatus();
    };

    $scope.pause = function(){
      // $scope.isPaused = !$scope.isPaused;
      if (Klickr.editor === undefined) throw new Error('Popup: BgEditor should be defined when pause is clicked');
      Klickr.editor.pausePlayback();
      $scope.refreshStatus();
    };

    $scope.save = function(){
      if ($scope.desc === undefined || $scope.desc === ''){
        $scope.errorMsg = 'Give your Klick a name that packs punch';
      } else {
        $scope.recorderStatus = 'saving';
        $scope.message = 'All\'s Good';
        $scope.showMessage = true;
        Klickr.bgRecorder.save($scope.desc);

        Klickr.deleteRecorder();
      }
    };

    $scope.delete = function(){
      Klickr.deleteRecorder();
      window.close();
    };

    $scope.encodedUrl = function(url){
      return encodeURIComponent(url);
    };

  });
