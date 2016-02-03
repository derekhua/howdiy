angular.module('starter.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS, $ionicHistory) {
  // if (ionic.Platform.isAndroid()) {
  //   $cordovaStatusbar.styleHex(COLORS.statusbar);
  // }
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
  $scope.search = false;
  $scope.searchOn = function() {
    $scope.search = true;
  };

  $scope.searchOff = function() {
    $scope.search = false;
  };

  // go to guide testing purposes
  $scope.goToGuide = function(guideId) {
    $state.go('guide', { "guideId": guideId });
  };

  $scope.getGuides = function() {
    $http.get(EC2.address + '/api/g').then(function(result) {
      $scope.response = result;
      $scope.guides = result.data;
    }).catch(function(result) {
      console.log("getGuides error");
    });
  };

  $scope.printToken = function() {
    $scope.response = window.localStorage.getItem('yourTokenKey');
  };

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

  $scope.doRefresh = function() {
    console.log('Refreshing!');
    $http.get(EC2.address + '/api/g').then(function(result) {
      $scope.guides = result.data;
      $scope.$broadcast('scroll.refreshComplete');
    }).catch(function(result) {
      console.log("Refresh error");
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('CreationCtrl', function($scope, $ionicHistory, $state, $ionicModal, $timeout, $cordovaCamera, ImageService,  $cordovaVibration, $ionicPopup) {
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });
  
  $scope.len = 0;
  $scope.step = 0;
  $scope.stepElements = [];
  $scope.finishedGuide = {
    "id": "",
    "title": "",
    "picturePath": "",
    "author": "",
    "category": "",
    "meta": {
        "favs": 0,
        "createDate": {
          "$date": ""
        }
    },
    "comments": [
        {
          "date": {
            "$date": ""
          }
        }
    ],
    "steps": [
        {
            "picturePath": "",
            "comments": [
                {
                    "date": {
                      "$date": ""
                    }
                }
            ],
            "body": ""
        }
    ],
    "description": ""
  };
  var showFlag = false;

  $scope.range = function(min, max, step) {
   step = step || 1;
   var input = [];
   for (var i = min; i <= max; i += step) {
       input.push(i);
   }
   return input;
  };
  
  $ionicModal.fromTemplateUrl('templates/creation-modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  
  $scope.createStep = function() {
    if( $scope.step < $scope.len )
      $scope.stepElements[$scope.step] = { "picturePath": document.getElementById('old_step_pic').src,"comments": [{"date": {}}], "body": document.getElementById('description').value};
    else {
      $scope.stepElements.push({ "picturePath": document.getElementById('new_step_pic').src, "comments": [{"date": {}}], "body": document.getElementById('description').value});
      $scope.len = $scope.len + 1;
    }
    $scope.imgURI = undefined;
    document.getElementById('description').value = "";
    $scope.modal.hide();
  };
  
  $scope.cancelStep = function() {
    $scope.imgURI = undefined;
    document.getElementById('description').value = "";
    $scope.modal.hide();
  }

  $scope.deleteStep = function(stepNum) {
    $cordovaVibration.vibrate(300);
    showFlag = true;
    var myPopup = $ionicPopup.show({
       title: 'Delete this step?',
       scope: $scope,
       buttons: [
         { text: 'Cancel',
            onTap: function(e) {
              showFlag = false;
           }
         },
         {
           text: '<b>Delete</b>',
           type: 'button-positive',
           onTap: function(e) {
              $scope.stepElements.splice(stepNum, 1);
              $scope.len--;
              showFlag = false;
           }
         },
       ]
     });
  }

  $scope.showStep = function(stepNum) {
    if(showFlag === false) {
      $scope.step = stepNum;
      if (stepNum < $scope.len)
        document.getElementById('description').value = $scope.stepElements[stepNum].body;
      $scope.modal.show();
    }
  };
  $scope.submitGuide = function () {
    $scope.finishedGuide.steps = $scope.stepElements;
  }
  $scope.takePicture = function() {
    var options = {
      quality : 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.CAMERA,
      allowEdit : true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 350,
      targetHeight: 400,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.imgURI = "data:image/jpeg;base64," + imageData;
    }).catch(function(err) {
      console.log(err);
    });
  };

  $scope.expandText = function(){
    var element = document.getElementById("description");
    element.style.height =  element.scrollHeight + "px";
  }

})

.controller('ActivityCtrl', function($scope) {

})

.controller('ProfileCtrl', function($scope, $state, $ionicModal, $http, EC2, AuthService) {
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  }

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
    $http.post(EC2.address + '/api/u/' + $scope.username, {
      "username": $scope.username, "email": document.getElementById("emailText").value, 
      "bio" : document.getElementById("bioText").value, "website" : document.getElementById("websiteText").value, 
      "phone" : document.getElementById("phoneText").value, "gender" : $scope.gender
    });
    $scope.modal.hide();
  }

  $scope.changeGenderSelectValue = function(gender) {
    $scope.gender = gender;
  }

  $scope.showSaved = false;
  $scope.showDrafts = false;
  $scope.showOwn = true;

  $scope.getSavedGuides = function() {
    $scope.showSaved = true;
    $scope.showDrafts = false;
    $scope.showOwn = false;

    $scope.savedGuides = [];

    $http.get(EC2.address + '/api/u/' + $scope.username).then(function successCallback(result) {
      $scope.savedGuides = result.data.savedGuides;
      console.log($scope.savedGuides);
    }).catch(function errorCallback(result) {
      console.log("get saved guides error");
    });
  };
})

.controller('SavedCtrl', function($scope, $state, $ionicHistory, $http, EC2, $ionicModal, $ionicGesture, $ionicSlideBoxDelegate, $ionicLoading) {
  $scope.myGoBack = function() {
    $ionicHistory.goBack();
  };

  $ionicModal.fromTemplateUrl('templates/savedguide-modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });

  $scope.savedGuides = ["0","1"];
  $scope.guideData = [];

  var getSaved = function(i) {
    $http.get(EC2.address + '/api/g/' + $scope.savedGuides[i]).then(function successCallback(result) {
      $scope.guide = result.data;
      $scope.guideData.push({id:$scope.guide.id, image: $scope.guide.steps[0].picturePath, title: $scope.guide.title, description: $scope.guide.description});
    }).catch(function errorCallback(result) {
      console.log("get saved guides error");
    });
  }

  for (i = 0; i < $scope.savedGuides.length; i++) {
    getSaved(i);
  }

  $scope.goToGuide = function(guideId) {
    $state.go('guide', { "guideId": guideId })
  };
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
