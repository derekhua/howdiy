angular.module('starter.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS, $ionicHistory, $cordovaStatusbar, COLORS) {
  if (ionic.Platform.isAndroid()) {
    $cordovaStatusbar.styleHex(COLORS.statusbar);
  }
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

  $scope.myGoBack = function() {
    $ionicHistory.goBack();
    console.log('back');
  };

})

.controller('LoginCtrl', function($scope, $state, $ionicPopup, AuthService) {
  $scope.data = {};
  $scope.login = function(data) {
    AuthService.login(data.username, data.password).then(function(authenticated) {
      $state.go('tab.home', {}, {reload: true});
      $scope.setCurrentUsername(data.username);
    }).catch(function(err) {
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
    }).catch(function(err) {
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

.controller('HomeCtrl', function($scope, $rootScope, $cordovaCamera, $state, $http, $ionicPopup, AuthService, $ionicLoading, $cordovaFileTransfer, EC2, $timeout, ImageService) {
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  }

  $scope.getGuides = function() {
    $http.get(EC2.address + '/api/g').then(function(result) {
      $scope.response = result;
    }).catch(function(result) {
      console.log("getGuides error");
    });
  };

  $scope.getUsers = function() {
    $http.get(EC2.address + '/api/u').then(function(result) {
      $scope.response = result;
    }).catch(function(result) {
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
    }).catch(function(err) {
      // error
    });
  };

  $scope.uploadPicture = function() {
    var options = {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    };
    $cordovaCamera.getPicture(options).then(function(imageURI) {      
      ImageService.resizeAndConvert(imageURI).then(function(image64) {
        $ionicLoading.show({template: 'Uploading photo...', duration:500});
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = image64.substr(image64.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.chunkedMode = true;
        var ft = new FileTransfer();
        ft.upload(image64, encodeURI(EC2.address + '/photos'), 
        function successCallback(FileUploadResult) {
          console.log(FileUploadResult.response);        
          $ionicLoading.show({template: 'Done!', duration:500});
        },function errorCallback(err) {
          console.log(err);
          $ionicLoading.show({template: 'Failed!', duration:500});
        }, options);
      });
    }).catch(function(err) {
      console.log(err);
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
    }).catch(function(err) {
      console.log(err);
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
    $state.go('guide', { "guideId": guideId });
  };
})


.controller('CreationCtrl', function($scope) {

})

.controller('ActivityCtrl', function($scope) {

})

.controller('ProfileCtrl', function($scope, $ionicModal, $http, EC2) {
  $scope.profilePicture = "http://i.imgur.com/Iq6YOgl.jpg";
  $scope.numberOfGuides = 0;

  $http.get(EC2.address + '/api/u/' + $scope.username).then(function(result) {
    $scope.userInfo = result.data;
    $scope.website = $scope.userInfo.website;
    $scope.bio = $scope.userInfo.bio;
    $scope.email = $scope.userInfo.email;
    $scope.phone = $scope.userInfo.phone;
    $scope.genderValues = [ "Male", "Female", "Other", "Not Specified"];
    $scope.gender = $scope.userInfo.gender;
  }).catch(function(result) {
    console.log("http get userInfo error");
  });

  $ionicModal.fromTemplateUrl('templates/edit-profile.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.editProfile = function() {
    $scope.modal.show();
  }

  $scope.updateUserInfo = function() {
    console.log(document.getElementById("websiteText").value);
    console.log(document.getElementById("bioText").value);
    console.log(document.getElementById("emailText").value);
    console.log(document.getElementById("phoneText").value);
    console.log($scope.gender);
  }

  $scope.changeGenderSelectValue = function(gender) {
    $scope.gender = gender;
  }
})

.controller('GuideCtrl', function($scope, $ionicSlideBoxDelegate, $http, $stateParams, EC2, $state, $ionicHistory, $ionicModal, $ionicActionSheet, $ionicGesture, $ionicLoading) {
  $ionicModal.fromTemplateUrl('templates/guide-modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });

  $scope.images = [];
  
  var id = $stateParams.guideId;
  $scope.stepNumber = 1;
  $http.get(EC2.address + '/api/g/' + id).then(function successCallback(result) {
    $scope.guide = result.data;
    $ionicSlideBoxDelegate.update();
    console.log($scope.guide.steps);
    for(i = 0; i < $scope.guide.steps.length; ++i) {
      $scope.images.push({id: i, src: $scope.guide.steps[i].picturePath});
    }
  }).catch(function errorCallback(result) {
    console.log("getGuides error");
  });

  $scope.slideHasChanged = function(index) {
    $scope.stepNumber = index + 1;
    $ionicSlideBoxDelegate.update();
  };

  $scope.goToSlide = function(index) {
    console.log(index);
    $scope.stepNumber = index + 1;
    $scope.modal.show();

    var elements = document.getElementsByClassName("guide-step");
    var angularElements = [];
    console.log(elements.length);
    // when there are multiple elements with same class name we need to create multiple angular element objects
    for(i = 0; i < elements.length; i++) {
      angularElements.push(angular.element(elements[i]));
    }

    var events = [{
      event: 'pinchin',
      text: 'You pinched in!'
    },{
      event: 'pinchout',
      text: 'You pinched out!'
    }];

    angular.forEach(events, function(obj){
      for (i = 0; i < elements.length; i++) {
        $ionicGesture.on(obj.event, function (event) {
          $scope.$apply(function () {
            if (obj.event === 'pinchin' && $scope.modal.isShown()) {
              $scope.modal.hide();
            }
            else if (obj.event !== 'pinchin') {
              $ionicLoading.show({template: obj.text, duration: 500});
            }
          });
        }, angularElements[i]);
      }
    });
    $ionicSlideBoxDelegate.slide(index);
    $ionicSlideBoxDelegate.update();
  };

  $scope.showActionsheet = function() {
    $ionicActionSheet.show({
      titleText: 'ActionSheet Example',
      buttons: [
        { text: '<i class="icon ion-share"></i> Share' },
        { text: '<i class="icon ion-arrow-move"></i> Move' },
      ],
      destructiveText: 'Delete',
      cancelText: 'Cancel',
      cancel: function() {
        console.log('CANCELLED');
      },
      buttonClicked: function(index) {
        console.log('BUTTON CLICKED', index);
        return true;
      },
      destructiveButtonClicked: function() {
        console.log('DESTRUCT');
        return true;
      }
    });
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
