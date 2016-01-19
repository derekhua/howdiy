angular.module('starter.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS) {
  $scope.username = AuthService.username();

  // Handle broadcasted messages
  $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });

  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $state.go('login');
    var alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, you have to login again.'
    });
  });

  $scope.setCurrentUsername = function(name) {
    $scope.username = name;
  };
})

.controller('LoginCtrl', function($scope, $state, $ionicPopup, AuthService) {
  $scope.data = {};
  $scope.login = function(data) {
    AuthService.login(data.username, data.password).then(function(authenticated) {
      $state.go('tab.home', {}, {reload: true});
      $scope.setCurrentUsername(data.username);
    }, function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please check your credentials!'
      });
    });
  };

  $scope.goSignup = function() {
    $state.go('signup');
  };
})

.controller('SignupCtrl', function($scope, $state, $ionicPopup, AuthService, $ionicViewSwitcher) {
  $scope.data = {};
  $scope.signup = function(data) {
    AuthService.signup(data.username, data.email, data.password).then(function() {
      $state.go('login', {}, {reload: true});
      var alertPopup = $ionicPopup.alert({
        title: 'Success!',
        template: 'Now log in!'
      });
    }, function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Sign up failed!',
        template: 'Please check your credentials!'
      });
    });
  };

  $scope.back = function() {
    $ionicViewSwitcher.nextDirection('back'); // 'forward', 'back', etc.
    $state.go('login');
  };
})

.controller('HomeCtrl', function($scope, $rootScope, $cordovaCamera, $state, $http, $ionicPopup, AuthService, $ionicLoading, $cordovaFileTransfer, EC2, $timeout) {
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  }

  $scope.getGuides = function() {
    $http.get(EC2.address + '/api/g').then(
      function successCallback(result) {
        $scope.response = result;
      },
      function errorCallback(result) {
        console.log("getGuides error");
      });
  };

  $scope.getUsers = function() {
    $http.get(EC2.address + '/api/u').then(
      function successCallback(result) {
        $scope.response = result;
      },
      function errorCallback(result) {
        console.log("getUsers error");
      });
  };

  $scope.printToken = function() {
    $scope.response = window.localStorage.getItem('yourTokenKey');
  };

  $scope.ready = false;
  $scope.images = [];

  $rootScope.$watch('appReady.status', function() {
    console.log('watch fired '+$rootScope.appReady.status);
    if($rootScope.appReady.status) $scope.ready = true;
  });

  $scope.selImages = function() {
    var options = {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      targetWidth: 200,
      targetHeight: 200
    };
    $cordovaCamera.getPicture(options).then(function(imageUri) {
      console.log('img', imageUri);
      $scope.images.push(imageUri);
    }, function(err) {
      // error
    });
  };

  $scope.uploadPicture = function() {
    var options = {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    };
    $cordovaCamera.getPicture(options).then(
    function(imageURI) {
      var tempImg = new Image();
      tempImg.src = imageURI;
      tempImg.onload = function() {
        var canvas = document.createElement('canvas');
        // Get image size and aspect ratio.
        var targetWidth = tempImg.width;
        var targetHeight = tempImg.height;
        var aspect = tempImg.width / tempImg.height;

        // Calculate resolution of resized image based on the max resolution that
        // we want images to have on the long side
        var longSideMax = 1280;
        if (tempImg.width > tempImg.height) {
          longSideMax = Math.min(tempImg.width, longSideMax);
          targetWidth = longSideMax;
          targetHeight = longSideMax / aspect;
        }
        else {
          longSideMax = Math.min(tempImg.height, longSideMax);
          targetHeight = longSideMax;
          targetWidth = longSideMax * aspect;
        }
    
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        var ctx = canvas.getContext("2d");
        
        // .jpeg does not support transparent background this sets the background
        // to white if we are converting a .png image with transparent pixels to .jpeg
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0,0,targetWidth,targetHeight);
        ctx.drawImage(this, 0, 0, targetWidth, targetHeight);
        
        $ionicLoading.show({template: 'Uploading photo...', duration:500});
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.chunkedMode = true;

        var ft = new FileTransfer();
        var image = canvas.toDataURL("image/jpeg"); //extracts resized image as a jpeg
        ft.upload(image, encodeURI(EC2.address + '/photos'),
          function successCallback(FileUploadResult) {
            console.log('response: ' + FileUploadResult.response);
            $ionicLoading.show({template: 'Success!', duration:500});
          },
          function errorCallback(error) {
            console.log("Upload error: " + error);
            $ionicLoading.show({template: 'Connection error...', duration:500});
          },
          options);
      };
    },
    
    function(err){
      $ionicLoading.show({template: 'Error getting photo...', duration:500});
    });
  };

  $scope.takePicture = function() {
    var options = {
      quality : 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.CAMERA,
      allowEdit : true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 300,
      targetHeight: 300,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.imgURI = "data:image/jpeg;base64," + imageData;
    }, function(err) {
      // An error occured. Show a message to the user
    });
  };

  $scope.doRefresh = function() {
    console.log('Refreshing!');
    $timeout( function() {
      //simulate async response
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
  };
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('SearchCtrl', function($scope, $state) {
    // go to guide testing purposes
  $scope.goToGuide = function(guideId) {
    $state.go('guide-detail', { "guideId": guideId });
  };
})


.controller('CreationCtrl', function($scope) {

})

.controller('ActivityCtrl', function($scope) {

})

.controller('ProfileCtrl', function($scope) {

})

.controller('GuideCtrl', function($scope) {
})

.controller('GuideDetailCtrl', function($scope, $ionicSlideBoxDelegate, $http, $stateParams, EC2, $state, $ionicHistory) {
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
    
  });
 
  $scope.myGoBack = function() {
     $ionicHistory.goBack();
  };
  
  $scope.friend = [
    {_id:'Steak 1', picturePath:'http://i.imgur.com/NErBswV.jpg', body:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque feugiat id justo eu eleifend. Vivamus congue faucibus dictum. Curabitur suscipit ac metus ac vehicula. Praesent diam justo, scelerisque in purus nec, bibendum ultrices massa. .'},
    {_id:'Steak 2', picturePath:'http://i.imgur.com/464Qa.jpg', body:'Aliquam vitae magna quis eros iaculis laoreet at vel est. Vestibulum nisi enim, placerat vel sagittis sed, lacinia sed mauris. Praesent iaculis lorem nec dolor viverra, et ultricies risus vehicula. Vestibulum pulvinar, lectus in tincidunt euismod, urna nibh pulvinar justo, ac ultrices nibh justo id nulla. Maecenas nec volutpat lorem, eu lacinia quam. In eu metus consectetur, condimentum nisl elementum, placerat turpis. Nam efficitur, ante non tempor convallis, risus ipsum accumsan tortor, laoreet viverra dolor neque nec est. Sed ex eros, volutpat eget nibh quis, tristique malesuada lacus. Nulla vestibulum auctor elit consectetur condimentum. Nam efficitur, dolor a tincidunt vulputate, sapien nisi luctus libero, ut aliquet diam lorem non lorem. Aliquam erat volutpat.'},
    {_id:'Steak 3', picturePath:'http://i.imgur.com/elhXCPw.jpg', body:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque feugiat id justo eu eleifend. Vivamus congue faucibus dictum. Curabitur suscipit ac metus ac vehicula. Praesent diam justo, scelerisque in purus nec, bibendum ultrices massa. .'},
    {_id:'Steak 4', picturePath:'http://i.imgur.com/twdmb.jpg', body:'Aliquam vitae magna quis eros iaculis laoreet at vel est. Vestibulum nisi enim, placerat vel sagittis sed, lacinia sed mauris. Praesent iaculis lorem nec dolor viverra, et ultricies risus vehicula. Vestibulum pulvinar, lectus in tincidunt euismod, urna nibh pulvinar justo, ac ultrices nibh justo id nulla. Maecenas nec volutpat lorem, eu lacinia quam. In eu metus consectetur, condimentum nisl elementum, placerat turpis. Nam efficitur, ante non tempor convallis, risus ipsum accumsan tortor, laoreet viverra dolor neque nec est. Sed ex eros, volutpat eget nibh quis, tristique malesuada lacus. Nulla vestibulum auctor elit consectetur condimentum. Nam efficitur, dolor a tincidunt vulputate, sapien nisi luctus libero, ut aliquet diam lorem non lorem. Aliquam erat volutpat.'},
    {_id:'Steak 5', picturePath:'http://i.imgur.com/hHYufmJ.jpg', body:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque feugiat id justo eu eleifend. Vivamus congue faucibus dictum. Curabitur suscipit ac metus ac vehicula. Praesent diam justo, scelerisque in purus nec, bibendum ultrices massa. .'}
  ];
  // using if statements for now to separate between friend array and the guide in db
  var id = Number($stateParams.guideId);
  if (id === 0){
    $http.get(EC2.address + '/api/g').then(
      function successCallback(result) {
        $scope.guideSteps = result.data[id].steps;
        $ionicSlideBoxDelegate.update();
      },
      function errorCallback(result) {
        console.log("getGuides error");
    });
  }
  else if (id === 1){
    $scope.guideSteps = $scope.friend;
  }

  $scope.slideHasChanged = function() {
    $ionicSlideBoxDelegate.update();
  };
})

.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate) {
  // Called to navigate to the main app
  $scope.startApp = function() {
    $state.go('login');
  };
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
});
