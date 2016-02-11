angular.module('starter.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS, $ionicHistory, $http, EC2) {
  // if (ionic.Platform.isAndroid()) {
  //   $cordovaStatusbar.styleHex(COLORS.statusbar);
  // }
  $scope.username = AuthService.username();
  $http.get(EC2.address + '/api/u/' + $scope.username).then(function(result) {
    $scope.userInfo = result.data;
  });

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

.controller('CreationCtrl', function($scope, $ionicHistory, $state, $ionicModal, $timeout, $cordovaCamera, ImageService,  $cordovaVibration, $ionicPopup, GuideTransferService) {
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });
  

  $scope.len = 0;
  $scope.step = 0;
  $scope.stepElements = [];
  $scope.finishedGuide = GuideTransferService.getGuideData();
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
      $scope.stepElements[$scope.step] = { "picturePath": document.getElementById('old_step_pic').src,"comments": [], "body": document.getElementById('description').value};
    else {
      $scope.stepElements.push({ "picturePath": document.getElementById('new_step_pic').src, "comments": [], "body": document.getElementById('description').value});
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
  $scope.profilePicture = "http://i.imgur.com/Iq6YOgl.jpg";
  $scope.numberOfGuides = 0;
  $scope.savedThumbnails = [];
  $scope.draftThumbnails = [];
  $scope.submittedThumbnails = [];
  $scope.showSaved = false;
  $scope.showDrafts = false;
  $scope.showSubmitted = true;
  var submittedLoading = false;
  var savedLoading = false;
  var draftLoading = false;

  // MODAL
  $ionicModal.fromTemplateUrl('templates/edit-profile.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.editProfileModal = modal;
  });

  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  }

  $scope.doRefresh = function() {
    console.log('Refreshing!');
    if ($scope.showSubmitted) {
      $scope.submittedThumbnails = [];
      $scope.showSubmittedGuides();
    } else if ($scope.showDrafts) {
      $scope.draftThumbnails = [];
      $scope.showDraftGuides();
    } else if ($scope.showSaved) {
      $scope.savedThumbnails = [];
      $scope.showSavedGuides();
    }
  };

  $scope.updateUserInfo = function() {
    $http.post(EC2.address + '/api/u/' + $scope.username, {
      "username": $scope.username, "email": document.getElementById("emailText").value, 
      "bio": document.getElementById("bioText").value, "website": document.getElementById("websiteText").value, 
      "phone": document.getElementById("phoneText").value, "gender": $scope.gender
    });
    $scope.editProfileModal.hide();
  }

  $scope.changeGenderSelectValue = function(gender) {
    $scope.gender = gender;
  }

  $scope.showSubmittedGuides = function() {
    if (!submittedLoading) {
      submittedLoading = true;
      $scope.showSaved = false;
      $scope.showDrafts = false;
      $scope.showSubmitted = false;
      if ($scope.submittedThumbnails.length != 0) {
        submittedLoading = false;
        $scope.showSubmitted = true;
        return;
      }

      var count = 0;
      for (var i = 0; i < $scope.userInfo.submittedGuides.length; ++i) {
        $http.get(EC2.address + '/api/t/' + $scope.userInfo.submittedGuides[i].guideId).then(function(result) {
          $scope.submittedThumbnails.push(result.data);
          if (++count == $scope.userInfo.submittedGuides.length) {
            submittedLoading = false;
            $scope.showSubmitted = true;
            $scope.$broadcast('scroll.refreshComplete');
          }
        });
      }
    }
  };

  $scope.showDraftGuides = function() {  
    if (!draftLoading) {
      draftLoading = true;   
      $scope.showSaved = false;
      $scope.showDrafts = false;
      $scope.showSubmitted = false;
      if ($scope.draftThumbnails.length != 0) {
        draftLoading = false;
        $scope.showDrafts = true;
        return;
      }
      var count = 0;
      for (var i = 0; i < $scope.userInfo.drafts.length; ++i) {
        $http.get(EC2.address + '/api/t/' + $scope.userInfo.drafts[i].guideId).then(function(result) {
          $scope.draftThumbnails.push(result.data);
          if (++count == $scope.userInfo.drafts.length) {
            draftLoading = false;
            $scope.showDrafts = true;
            $scope.$broadcast('scroll.refreshComplete');
          }
        });
      }
    }
  };

  $scope.showSavedGuides = function() {
    if (!savedLoading) {
      savedLoading = true;
      $scope.showSaved = false;
      $scope.showDrafts = false;
      $scope.showSubmitted = false;
      if ($scope.savedThumbnails.length != 0) {
        savedLoading = false;
        $scope.showSaved = true;
        return;
      }

      var count = 0;
      for (var i = 0; i < $scope.userInfo.savedGuides.length; ++i) {
        $http.get(EC2.address + '/api/t/' + $scope.userInfo.savedGuides[i].guideId).then(function(result) {
          $scope.savedThumbnails.push(result.data);
          if (++count == $scope.userInfo.savedGuides.length) {
            savedLoading = false;
            $scope.showSaved = true;
            $scope.$broadcast('scroll.refreshComplete');
          }
        });
      }
    }
  };

  $scope.goToGuide = function(guideId) {
    console.log("t" + guideId);
    $state.go('guide', { "guideId": guideId })
  };
})



.controller('GuideCtrl', function($scope, $ionicSlideBoxDelegate, $http, $stateParams, EC2, $state, $ionicHistory, $ionicModal, $ionicActionSheet, $ionicGesture, $ionicLoading, $ionicPopup) {
  $scope.images = [];
  $scope.stepNumber = 1;

  // Get guide
  $http.get(EC2.address + '/api/g/' + $stateParams.guideId).then(function successCallback(result) {
    $scope.guide = result.data;
    $ionicSlideBoxDelegate.update();
    $scope.liked = (($scope.guide._id in $scope.userInfo.likedGuides) ? true : false);
    for(i = 0; i < $scope.guide.steps.length; ++i) {
      $scope.images.push({id: i, src: $scope.guide.steps[i].picturePath});
    }
  }).catch(function errorCallback(err) {
    console.log("getGuides error");
  });

  // MODALS
  $ionicModal.fromTemplateUrl('templates/guide-modal.html', {
    scope: $scope,
    animation: 'fade-in'
  }).then(function(modal) {
    $scope.guideModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/comment-modal.html', {
    scope: $scope
    // animation: 'fade-in'
  }).then(function(modal) {
    $scope.commentModal = modal;
  });

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });

  // SLIDES
  $scope.slideHasChanged = function(index) {
    $scope.stepNumber = index + 1;
    $ionicSlideBoxDelegate.update();
  };

  $scope.goToSlide = function(index) {
    console.log(index);
    $scope.stepNumber = index + 1;
    $scope.guideModal.show();

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

  // HANDLERS
  $scope.likeHandler = function() {
    if ($scope.liked) {
      delete $scope.userInfo.likedGuides[$scope.guide._id];
      $http.post(EC2.address + '/api/g/' + $scope.guide._id, {$inc: { "meta.likes" : -1}});
    } else {
      $scope.userInfo.likedGuides[$scope.guide._id] = "1";
      $http.post(EC2.address + '/api/g/' + $scope.guide._id, {$inc: { "meta.likes" : 1}});
    }
    $http.post(EC2.address + '/api/u/' + $scope.username, {"likedGuides" : $scope.userInfo.likedGuides});
    $scope.liked = !$scope.liked;
  };

  $scope.shareHandler = function() {
    if (!($scope.guide._id in $scope.userInfo.sharedGuides)) {
      var shared = $scope.guide.shares + 1;
      $scope.userInfo.sharedGuides[$scope.guide._id] = "1";
      $http.post(EC2.address + '/api/u/' + $scope.username, {
        "sharedGuides" : $scope.userInfo.sharedGuides
      });
      $http.post(EC2.address + '/api/g/' + $scope.guide._id, {$inc: { "meta.shares" : 1}});
    }
  };

  $scope.submitComment = function(comment) {
    $http.post(EC2.address + '/api/g/' + $scope.guide._id, {$push: { 
      "comments": {
        "username": $scope.username, 
        "body": comment
      }
    }}).then(function(result) {
      // Mock update view
      $scope.guide.comments.push({
        "username": $scope.username, 
        "body": comment,
        "date": "Just now"
      });
      var alertPopup = $ionicPopup.alert({
        title: 'Success!',
        template: 'Keep commenting!'
      });
    }).catch(function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Comment not posted!',
        template: 'Try again.'
      });
    });
  };

  $scope.showActionsheet = function() {
    $ionicActionSheet.show({
      titleText: 'ActionSheet Example',
      buttons: [
        { text: '<i class="icon ion-alert"></i> Report' },
      ],
      destructiveText: ($scope.guide._id in $scope.userInfo.submittedGuides) ? 'Delete' : '',
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
})

.controller('TabsCtrl', function($scope, $state, $ionicModal, GuideTransferService) {
  $ionicModal.fromTemplateUrl('templates/creation-start-modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  var guideSkeleton = {
    "id": "",
    "title": "",
    "picturePath": "",
    "author": "",
    "category": "",
    "meta": {
        "favs": 0,
        "createDate": {
          "$date": ""
        },
        "likes": 0,
        "shares": 0
    },
    "comments": [],
    "steps": [
        {
            "picturePath": "",
            "comments": [],
            "body": ""
        }
    ],
    "description": ""
  };

  $scope.cancelCreation = function() {
    document.getElementById('title').value ='';
    $scope.modal.hide();
  }

  $scope.goToCreation = function() {
    guideSkeleton.title = document.getElementById('title').value;
    GuideTransferService.putGuideData(guideSkeleton);
    $state.go('creation');
    document.getElementById('title').value ='';
    $scope.modal.hide();
  }

});