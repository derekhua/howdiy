angular.module('starter.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $rootScope, $state, $ionicPopup, S3, EC2, TimeService, AuthService, AUTH_EVENTS, $ionicHistory, $ionicLoading, $http) {
  // if (ionic.Platform.isAndroid()) {
  //   $cordovaStatusbar.styleHex(COLORS.statusbar);
  // }
  $scope.timeDifference = TimeService.timeDifference;
  $scope.bucketURL = S3.bucketURL;
  $scope.ec2Address = EC2.address;
  $scope.username = AuthService.username();
  $http.get($scope.ec2Address + '/api/u/' + $scope.username).then(function(result) {
    $rootScope.userInfo = result.data;
    $rootScope.gender = result.data.gender;
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

  $scope.triggerLoader = function () {
      $ionicLoading.show({
        template: '<ion-spinner icon="crescent"></ion-spinner>',
        showBackdrop: false,
        animation: 'fade-in'
      });
  }

  $scope.myGoBack = function() {
    $ionicHistory.goBack();
    console.log('back');
  };

  $scope.goTo = function(next, options) {
    console.log(options);
    var currentSplitState = $state.current.name.split('.');
    $state.go(currentSplitState[0] + '.' + currentSplitState[1] + '.' + next, options);
  };

})

.controller('LoginCtrl', function($scope, $rootScope, $state, $http, $ionicPopup, AuthService) {
  $scope.test = "test";
  $scope.data = {};
  $scope.login = function(data) {
    AuthService.login(data.username, data.password).then(function(authenticated) {
      $state.go('tab.home', {}, {reload: true});
      $scope.setCurrentUsername(data.username);
      $http.get($scope.ec2Address + '/api/u/' + data.username).then(function(result) {
        $rootScope.userInfo = result.data;
        $rootScope.gender = result.data.gender;
      });
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

.controller('HomeCtrl', function($scope, $rootScope, $cordovaCamera, $state, $http, $ionicPopup, AuthService, $ionicLoading, $cordovaFileTransfer, $timeout, ImageService, $ionicPopover, $ionicActionSheet, $ionicScrollDelegate) {
  $scope.categories = [{name: 'cooking'}, {name: 'computers'}, {name: 'cooking'}, {name: 'computers'}, {name: 'cooking'}, {name: 'computers'}, {name: 'cooking'}, {name: 'computers'}];
  $scope.cardView = true;
  $scope.guides = [];
  $scope.guideIndex = -1;
  $scope.searchFlag = false;
  $scope.searchOn = function() {
    $scope.searchFlag = true;
    $ionicScrollDelegate.scrollTop();
  };
  $scope.searchOff = function() {
    $scope.searchFlag = false;
  };

  $scope.search = function(query) {
    if (query.trim()) {
      $http.get($scope.ec2Address + '/api/search/', { params: { "q": query.trim() }}).then(function(result) {
        console.log(result);
        $scope.searchResults = result.data;
      }).catch(function(result) {
        console.log("search error");
      });
    }
  }

  $ionicPopover.fromTemplateUrl('my-popover.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };
  
  // Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });

  $scope.showActionsheet = function() {
    var cog = $ionicActionSheet.show({
      buttons: [
        { text: (($scope.cardView) ? '<i ng-hide="liked" class="icon ion-navicon" style="color: #E9523B;"></i> Switch to compact view' : 
                                 '<i class="icon ion-card" style="color: #E9523B;"></i> Switch to card view')}
      ],
      buttonClicked: function(index) {
        if (index === 0) {
          $scope.cardView = !$scope.cardView;
        } 
        console.log('BUTTON CLICKED', index);
        return true;
      },
      destructiveButtonClicked: function() {
        console.log('DESTRUCT');
        return true;
      }
    });

    $timeout(function() {
     cog();
   }, 2000);
  };

  $scope.loadMore = function() {
    if (!$scope.searchFlag && $scope.guideIndex > 0) {
      $http.get($scope.ec2Address + '/api/u/' + $scope.username + '/feed', 
      {params: {'index': $scope.guideIndex}}).then(function(result) {
        $scope.guideIndex -= result.data.length;
        $scope.guides = $scope.guides.concat(result.data);
        console.log($scope.guides[0]);
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }).catch(function(result) {
        console.log("getGuides error");
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
    } else {
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }
  };

  $scope.doRefresh = function() {
    $http.post($scope.ec2Address + '/api/u/' + $scope.username + '/updateNewsFeed').then(function(result) {
      $scope.guides = [];
      $scope.guideIndex = result.data;
      $scope.$broadcast('scroll.refreshComplete');
      $scope.loadMore();      
    }).catch(function(result) {
      console.log("Refresh error");
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
  // Initial call
  $scope.doRefresh();
})

.controller('CreationCtrl', function($scope, $rootScope, $ionicHistory, $state, $ionicModal, $timeout, $cordovaCamera, ImageService, $ionicLoading, $cordovaVibration, $ionicPopup, $ionicPlatform, $http, GuideTransferService) {
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });

  $scope.step = 0;
  $scope.finishedGuide = GuideTransferService.getGuideData();
  var showFlag = false;

  $scope.doneLoading = false;
  if ( $scope.finishedGuide.steps.length !== 0) {
    $scope.triggerLoader();
  };

  $scope.descrip = $scope.finishedGuide.description;
  $scope.showCount = false;
  $scope.range = function(min, max, step) {
   step = step || 1;
   var input = [];
   for (var i = min; i <= max; i += step) {
       input.push(i);
   }
   return input;
  };
  
  var loadCount = 0;
  $scope.hideLoader = function () {
    if (++loadCount === $scope.finishedGuide.steps.length) {
      $scope.doneLoading = true;
      $ionicLoading.hide();
    }
  };

  $ionicModal.fromTemplateUrl('templates/creation-modal.html', {
    scope: $scope
  }).then(function(stepModal) {
    $scope.stepModal = stepModal;
  });

  $ionicModal.fromTemplateUrl('templates/title-modal.html', {
    scope: $scope
  }).then(function(titleModal) {
    $scope.titleModal = titleModal;
  });

  $scope.showTitleEdit = function() {
    $scope.titleModal.show();
    document.getElementsByClassName('description')[document.getElementsByClassName('description').length - 1].value = $scope.finishedGuide.description;
  };

  $scope.changeAccept = function() {
    $scope.finishedGuide.title = document.getElementsByClassName('guideTitle')[document.getElementsByClassName('guideTitle').length - 1].value;
    $scope.finishedGuide.category = document.getElementsByClassName('guideCategory')[document.getElementsByClassName('guideCategory').length - 1].value
    if ($scope.imgURI !== undefined ) {
      $scope.finishedGuide.picturePath = $scope.imgURI;
    }
    $scope.finishedGuide.description = document.getElementsByClassName('description')[document.getElementsByClassName('description').length - 1].value;
    $scope.imgURI = undefined;
    $scope.titleModal.hide();
  };

  $scope.changeCancel = function() {
    $scope.titleModal.hide();
  };

  $scope.createStep = function() {
    if( $scope.step < $scope.finishedGuide.steps.length && $scope.finishedGuide.steps !== undefined ) {
      $scope.finishedGuide.steps[$scope.step].picturePath = $scope.imgURI;
      $scope.finishedGuide.steps[$scope.step].body = document.getElementsByClassName('stepDescription')[document.getElementsByClassName('stepDescription').length - 1].value;
    }
    else {
      $scope.finishedGuide.steps.push({"picturePath": $scope.imgURI, 
                                       "body": document.getElementsByClassName('stepDescription')[document.getElementsByClassName('stepDescription').length - 1].value});
    }
    $scope.imgURI = undefined;
    document.getElementsByClassName('stepDescription')[document.getElementsByClassName('stepDescription').length - 1].value = "";
    $scope.stepModal.hide();
  };
  
  $scope.cancelStep = function() {
    $scope.imgURI = undefined;
    document.getElementsByClassName('stepDescription')[document.getElementsByClassName('stepDescription').length - 1].value = "";
    $scope.stepModal.hide();
  };

 var creationBack = function() {
      $scope.leaveCreation();
  }
  var deregisterHardBack = $ionicPlatform.registerBackButtonAction(
    creationBack, 101
  );

  $scope.$on('$destroy', function() {
    deregisterHardBack();
  });

  $scope.deleteStep = function(stepNum) {
    //$cordovaVibration.vibrate(300);
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
              $scope.finishedGuide.steps.splice(stepNum, 1);
              showFlag = false;
           }
         },
       ]
     });
  }

  $scope.showStep = function(stepNum) {
    if(showFlag === false) {
      $scope.step = stepNum;
      $scope.stepModal.show();
      if (stepNum < $scope.finishedGuide.steps.length)
        document.getElementsByClassName('stepDescription')[document.getElementsByClassName('stepDescription').length - 1].value = $scope.finishedGuide.steps[stepNum].body;
    }
  };
  
  $scope.submitGuide = function () {
    $scope.finishedGuide.createDate = Date.now;
    $scope.finishedGuide.draft = false;
    postFunction();
  }

  $scope.pictureOption = function() {
    var myPopup = $ionicPopup.show({
      title: 'Upload or take a picture!',
      scope: $scope,
      cssClass: "popup-vertical-buttons",
      buttons: [{ 
        text: 'Take Picture',
        type: 'button-positive',
        onTap: function(e) {
          var options = {
            quality : 100,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 400,
            targetHeight: 400,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
          };
          $cordovaCamera.getPicture(options).then(function(imageData) {
            $scope.imgURI = "data:image/jpeg;base64," + imageData;
          }).catch(function(err) {
            console.log(err);
          });
        }
      },
      {
        text: 'Upload',
        type: 'button-positive',
        onTap: function(e) {
          var options = {
            quality: 100,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            correctOrientation: true,
            allowEdit: true,
            targetWidth: 400,
            targetHeight: 400
          };
          $cordovaCamera.getPicture(options).then(function(imageUri) {
            console.log('img', imageUri);
            $scope.imgURI = "data:image/jpeg;base64," + imageUri;
          }).catch(function(err) {
            // error
          });
        }
      },
      { 
        text: 'Cancel',
        onTap: function(e) {
          showFlag = false;
        }
      }],
    });
  }

  $scope.leaveCreation = function() {
      var myPopup = $ionicPopup.show({
       title: 'Save this guide to drafts?',
       scope: $scope,
       cssClass: "popup-vertical-buttons",
       buttons: [
         { text: 'Yes',
           type: 'button-positive',
            onTap: function(e) {
              postFunction();
           }
         },
         {
           text: 'No',
           type: 'button-assertive',
           onTap: function(e) {
            $scope.myGoBack();
           }
         },
         { text: 'Cancel',
            onTap: function(e) {
           }
         },
       ]
     });
  }

  $scope.expandText = function(){
    var element = document.getElementsByClassName('stepDescription')[document.getElementsByClassName('stepDescription').length - 1].value
    element.style.height =  element.scrollHeight + "px";
  }

  var postFunction = function() {
    var param = '/api/g';
    if ("_id" in $scope.finishedGuide){
      param = '/api/g/' + $scope.finishedGuide._id;
    }
    console.log(param);
    $http.post($scope.ec2Address + param, $scope.finishedGuide)
      .then(function(response) {
        $http.get($scope.ec2Address + '/api/u/' + $scope.username).then(function(result) {
          $rootScope.userInfo = result.data;
        });
        $scope.myGoBack();
      }).catch(function(err){
        var alertPopup = $ionicPopup.alert({
          title: 'Guide submission failed!',
          template: 'Try again.'
        });
      });
  }
})

.controller('ActivityCtrl', function($rootScope, $scope, $http) {

  $http.get($scope.ec2Address + '/api/u/' + $rootScope.userInfo.username, {
    params: { 
      "projection": "activityFeed",
      "type": "activityFeed"
  }}).then(function(result) {
    $scope.activityFeed = result.data.activityFeed;
  });  
})

.controller('ProfileCtrl', function($scope, $rootScope, $state, $ionicModal, $http, $cordovaCamera, $ionicPopup, ImageService, AuthService, GuideTransferService, $stateParams, $ionicLoading, $cordovaVibration) {
  $scope.profileInfo = {};
  $scope.doneLoading = false;
  $scope.hold = false;
  $scope.triggerLoader();
  if ($stateParams.username === $scope.username || $stateParams.username === undefined) {
    $scope.profileInfo = $rootScope.userInfo;
    $scope.isOwnProfile = true;
  } else {
    $http.get($scope.ec2Address + '/api/u/' + $stateParams.username).then(function(result) {
      $scope.profileInfo = result.data;   
      $scope.isOwnProfile = false;   
    });  
  }
  $scope.onProfileLoad = function () {
    $scope.doneLoading = true;
    $ionicLoading.hide();
  };

  $scope.genderValues = [ "Male", "Female", "Other", "Not Specified"];
  $scope.savedThumbnails = [];
  $scope.draftThumbnails = [];
  $scope.submittedThumbnails = [];
  $scope.showSaved = false;
  $scope.showDrafts = false;
  $scope.showSubmitted = false;
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
    $http.get($scope.ec2Address + '/api/u/' + $scope.profileInfo.username).then(function(result) {
      $scope.profileInfo = result.data;   
      if ($scope.showSubmitted) {
        $scope.submittedThumbnails = [];
        $scope.showSubmittedGuides();
      } else if ($scope.showDrafts) {
        $scope.draftThumbnails = [];
        $scope.showDraftGuides();
      } else if ($scope.showSaved) {
        $scope.savedThumbnails = [];
        $scope.showSavedGuides();
      } else {
        $scope.$broadcast('scroll.refreshComplete');
      }
    });  
  };

  $scope.updateProfileInfo = function() {
    $http.post($scope.ec2Address + '/api/u/' + $rootScope.userInfo.username, {
      "username": $rootScope.userInfo.username,
      "email": document.getElementsByClassName("emailText")[document.getElementsByClassName("emailText").length - 1].value,
      "bio": document.getElementsByClassName("bioText")[document.getElementsByClassName("bioText").length - 1].value,
      "website": document.getElementsByClassName("websiteText")[document.getElementsByClassName("websiteText").length - 1].value,
      "phone": document.getElementsByClassName("phoneText")[document.getElementsByClassName("phoneText").length - 1].value,
      "gender": $scope.gender
    }).then(function() {
      $rootScope.userInfo.email = document.getElementsByClassName("emailText")[document.getElementsByClassName("emailText").length - 1].value;
      $rootScope.userInfo.bio = document.getElementsByClassName("bioText")[document.getElementsByClassName("bioText").length - 1].value;
      $rootScope.userInfo.website = document.getElementsByClassName("phoneText")[document.getElementsByClassName("phoneText").length - 1].value;
      $rootScope.userInfo.phone = document.getElementsByClassName("websiteText")[document.getElementsByClassName("websiteText").length - 1].value;
      $rootScope.userInfo.gender = $scope.gender;
    });
    $scope.editProfileModal.hide();
  }

  $scope.changeGenderSelectValue = function(gender) {
    $scope.gender = gender;
  }

  $scope.showSubmittedGuides = function() {
    if (!submittedLoading && $scope.profileInfo.submittedGuides.length !== 0) {
      submittedLoading = true;
      $scope.showSaved = false;
      $scope.showDrafts = false;
      $scope.showSubmitted = false;
      $scope.triggerLoader();
      $http.get($scope.ec2Address + '/api/u/' + $scope.profileInfo.username + '/guides', {
        params: { 
          "projection": "title picturePath author description category meta",
          "type": "submittedGuides"
      }}).then(function(result) {
        $scope.submittedThumbnails = result.data;
        console.log($scope.submittedThumbnails);
        submittedLoading = false;
        $scope.showSubmitted = true;
        $scope.$broadcast('scroll.refreshComplete');
      }).finally( function(){
            $ionicLoading.hide();
      });
    }
  };

  $scope.showDraftGuides = function() {  
    if (!draftLoading && $scope.profileInfo.drafts.length !== 0) {
      draftLoading = true;   
      $scope.showSaved = false;
      $scope.showDrafts = false;
      $scope.showSubmitted = false;
      $scope.triggerLoader();
      $http.get($scope.ec2Address + '/api/u/' + $scope.profileInfo.username + '/guides', {
        params: { 
          "projection": "title picturePath author description catergory meta",
          "type": "drafts"
      }}).then(function(result) {
        $scope.draftThumbnails = result.data;    
        draftLoading = false;
        $scope.showDrafts = true;
        $scope.$broadcast('scroll.refreshComplete');
      }).finally( function(){
            $ionicLoading.hide();
      });
    }
  };

  $scope.showSavedGuides = function() {
    if (!savedLoading && $scope.profileInfo.savedGuides.length !== 0) {
      savedLoading = true;
      $scope.showSaved = false;
      $scope.showDrafts = false;
      $scope.showSubmitted = false;
      $scope.triggerLoader();
      $http.get($scope.ec2Address + '/api/u/' + $scope.profileInfo.username + '/guides', {
        params: { 
          "projection": "title picturePath author description catergory meta",
          "type": "savedGuides"
      }}).then(function(result) {
        $scope.savedThumbnails = result.data;    
        savedLoading = false;
        $scope.showSaved = true;
        $scope.$broadcast('scroll.refreshComplete');
      }).finally( function(){
            $ionicLoading.hide();
      });
    }
  };

  $scope.deleteGuide = function(index, type, id) {
    //$cordovaVibration.vibrate(300);
    console.log($scope.submittedThumbnails);
    var myPopup = $ionicPopup.show({
       title: 'Delete this guide?',
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
            console.log(id);
            $http.post($scope.ec2Address + '/api/g/' + id + "/delete", {username: $rootScope.userInfo.username, guideType: type})
            .catch(function(err) {
              console.log(err);
            });
            if(type == 'submitted')
              $scope.submittedThumbnails.splice(index, 1);
            else
              $scope.draftThumbnails.splice(index, 1);
           }
         },
       ]
     });
  };

  $scope.showProfilePicturePopup = function() {
    var myPopup = $ionicPopup.show({
      title: 'Upload or take a picture!',
      scope: $scope,
      cssClass: "popup-vertical-buttons",
      buttons: [{ 
        text: 'Take Picture',
        type: 'button-positive',
        onTap: function(e) {
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
            $scope.uploadProfilePicture($scope.imgURI);
          }).catch(function(err) {
            console.log(err);
          });
        }
      },
      {
        text: 'Upload',
        type: 'button-positive',
        onTap: function(e) {
          var options = {
            quality: 100,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            targetWidth: 400,
            targetHeight: 400
          };
          $cordovaCamera.getPicture(options).then(function(imageUri) {
            $scope.imgURI = "data:image/jpeg;base64," + imageUri;
            console.log($scope.imgURI);
            $scope.uploadProfilePicture($scope.imgURI);
          }).catch(function(err) {
            // error
          });
        }
      },
      { 
        text: 'Cancel',
        onTap: function(e) {
          showFlag = false;
        }
      }],
    });
  }

  $scope.uploadProfilePicture = function(imageUri) {
    $http.post($scope.ec2Address + '/api/u/' + $scope.username, {"profilePicture" : imageUri}).then(function(result) {
      //concatenates image link with timestamp to force refresh
      $rootScope.userInfo.profilePicture = result.data.profilePicture + "?" + new Date().getTime();
    }).catch(function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Profile picture update error',
        template: 'Try again.'
      });
    });;

  }

  $scope.editDraft = function(guideId) {
      $http.get($scope.ec2Address + '/api/g/' + guideId).then(function successCallback(result) {
        var guide = result.data;
        GuideTransferService.putGuideData(guide);
        $state.go('creation');
      }).catch(function errorCallback(err) {
        console.log("getGuides error");
      });
  };

  $scope.followText = ($rootScope.userInfo.followings.indexOf($stateParams.username) != -1) ? "Unfollow" : "Follow";

  $scope.follow = function(userId) {
    if ($scope.followText === "Follow") {
      $scope.followText = "Unfollow";
      $http.post($scope.ec2Address + '/api/u/' + $rootScope.userInfo.username, {$push : {"followings": $stateParams.username}})
      .then(function(result) {
        $rootScope.userInfo.followings.push($stateParams.username);
        console.log("Follow - self.followings updated");
      });
      $http.post($scope.ec2Address + '/api/u/' + $stateParams.username, {$push : {"followers" : $rootScope.userInfo.username}})
      .then(function(result) {
        console.log("Follow - other user followers updated");
      });
    }
    else {
      $scope.followText = "Follow";
      $http.post($scope.ec2Address + '/api/u/' + $rootScope.userInfo.username, {$pull : {"followings": $stateParams.username}})
      .then(function(result) {
        if ($rootScope.userInfo.followings.indexOf($stateParams.username) !== -1) {
          $rootScope.userInfo.followings.splice($rootScope.userInfo.followings.indexOf($stateParams.username), 1);
        }
        console.log("Unfollow - self.followings updated");
      });
      $http.post($scope.ec2Address + '/api/u/' + $stateParams.username, {$pull : {"followers" : $rootScope.userInfo.username}})
      .then(function(result) {
        console.log("Unfollow - other user followers updated")
      });
    }
  };

})



.controller('GuideCtrl', function($scope, $rootScope, $ionicSlideBoxDelegate, $http, $stateParams, $state, $ionicHistory, $ionicModal, $ionicActionSheet, $ionicGesture, $ionicLoading, $ionicPopup) {
  $scope.images = [];
  $scope.stepNumber = 1;

  $scope.liked = (($rootScope.userInfo.likedGuides.indexOf($stateParams.guideId) != -1) ? true : false);
  $scope.doneLoading = false;
  // Get guide
  $scope.guide = {};
  $scope.triggerLoader();
  $http.get($scope.ec2Address + '/api/g/' + $stateParams.guideId).then(function successCallback(result) {
    $scope.guide = result.data;
    console.log($scope.guide.title);
    $ionicSlideBoxDelegate.update();
    for(i = 0; i < $scope.guide.steps.length; ++i) {
      $scope.images.push({
        id: i, 
        src: $scope.guide.steps[i].picturePath, 
        sub: $scope.guide.steps[i].body,
      });
    }
  }).catch(function errorCallback(err) {
    console.log("getGuides error");
  }).finally( function(){
    if ( $scope.images.length === 0 ) {
      $ionicLoading.hide();
    } 
  });
  
  var loadCount = 0;
  $scope.hideLoader = function () {
    if (++loadCount === $scope.images.length) {
      $scope.doneLoading = true;
      $ionicLoading.hide();
    }
  }

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

    angular.forEach(events, function(obj) {
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
      $http.post($scope.ec2Address + '/api/g/' + $scope.guide._id, {$inc: { "meta.likes" : -1}});
      $http.post($scope.ec2Address + '/api/u/' + $scope.username, { $pull: {"likedGuides" :$scope.guide._id}});
      $rootScope.userInfo.likedGuides.splice($rootScope.userInfo.likedGuides.indexOf($scope.guide._id), 1);
    } else {
      $http.post($scope.ec2Address + '/api/g/' + $scope.guide._id, {$inc: { "meta.likes" : 1}});
      $http.post($scope.ec2Address + '/api/u/' + $scope.username, { $push: {"likedGuides" : $scope.guide._id}});
      $rootScope.userInfo.likedGuides.push($scope.guide._id);
    }
    $scope.liked = !$scope.liked;
  };

  $scope.shareHandler = function() {
    if ($rootScope.userInfo.sharedGuides.indexOf($scope.guide._id) == -1) {
      var shared = $scope.guide.shares + 1;
      $rootScope.userInfo.sharedGuides.push($scope.guide._id);
      $http.post($scope.ec2Address + '/api/u/' + $scope.username, { $push: {"sharedGuides" : $scope.guide._id}});
      $http.post($scope.ec2Address + '/api/g/' + $scope.guide._id, {$inc: { "meta.shares" : 1}});
    }
  };

  $scope.submitComment = function(comment) {
    $http.post($scope.ec2Address + '/api/g/' + $scope.guide._id, {$push: { 
      "comments": {
        "username": $scope.username, 
        "body": comment,
      }
    }}).then(function(result) {
      // Mock update view
      $scope.guide.comments.push({
        "username": $scope.username, 
        "body": comment,
        "date": Date.now()
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
        { text: '<i class="icon ion-ios-upload-outline"></i> Share' },
        { text: (($scope.liked) ? '<i ng-hide="liked" class="icon ion-ios-heart" style="color: #E9523B;"></i> Unlike' : 
                                 '<i ng-hide="liked" class="icon ion-ios-heart-outline" style="color: #E9523B;"></i> Like')} ,
        { text: '<i class="icon ion-ios-chatbubble-outline"></i> Comment'}, 
        { text: '<i class="icon ion-alert"></i> Report' },
      ],
      destructiveText: ($scope.guide._id in $rootScope.userInfo.submittedGuides) ? 'Delete' : '',
      cancelText: 'Cancel',
      cancel: function() {
        console.log('CANCELLED');
      },
      buttonClicked: function(index) {
        if (index === 0) {
          $scope.shareHandler();
        } else if (index === 1) {
          $scope.likeHandler();
        } else if (index === 2) {
          $http.get($scope.ec2Address + '/api/g/' + $stateParams.guideId, {
            params: { 
              "projection": "comments",
              "type": "comments"
          }}).then(function(result) {
            $scope.guide.comments = result.data.comments;
            $scope.commentModal.show();
          });
        } else if (index === 3) {
          console.log('report');
        }
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

.controller('TabsCtrl', function($scope, $state, $ionicModal, AuthService, GuideTransferService, $cordovaCamera, ImageService, $ionicPopup) {
  $ionicModal.fromTemplateUrl('templates/creation-start-modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.showCount = false;

  $scope.showModal = function () {
    $scope.modal.show();
    $scope.imgPicURI = undefined;
    document.getElementById('category').value ='';
    document.getElementById('description').value = '';
    document.getElementById('title').value = '';
  }
  $scope.hideModal = function() {
    $scope.modal.hide();
  }
  $scope.pictureOption = function() {
      var myPopup = $ionicPopup.show({
        title: 'Upload or take a picture!',
        scope: $scope,
        cssClass: "popup-vertical-buttons",
        buttons: [{ 
          text: 'Take Picture',
          type: 'button-positive',
          onTap: function(e) {
            var options = {
              quality : 100,
              destinationType : Camera.DestinationType.DATA_URL,
              sourceType : Camera.PictureSourceType.CAMERA,
              allowEdit : true,
              encodingType: Camera.EncodingType.JPEG,
              targetWidth: 400,
              targetHeight: 400,
              popoverOptions: CameraPopoverOptions,
              saveToPhotoAlbum: false
            };
            $cordovaCamera.getPicture(options).then(function(imageData) {
              $scope.imgPicURI = "data:image/jpeg;base64," + imageData;
            }).catch(function(err) {
              console.log(err);
            });
          }
        },
        {
          text: 'Upload',
          type: 'button-positive',
          onTap: function(e) {
            var options = {
              quality: 100,
              destinationType: Camera.DestinationType.DATA_URL,
              sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
              correctOrientation: true,
              allowEdit: true,
              targetWidth: 400,
              targetHeight: 400
            };
            $cordovaCamera.getPicture(options).then(function(imageUri) {
              console.log('img', imageUri);
              $scope.imgPicURI = "data:image/jpeg;base64," + imageUri;
            }).catch(function(err) {
              // error
            });
          }
        },
        { 
          text: 'Cancel',
          onTap: function(e) {
            showFlag = false;
          }
        }],
      });
    }

  $scope.goToCreation = function() {
    // Check fields
    if (!document.getElementById('title').value || 
        !document.getElementById('category').value ||
        !document.getElementById('description').value) {
      var alertPopup = $ionicPopup.alert({
        title: 'Fields Empty!',
        template: 'Please fill out the empty fields.'
      });
      return;
    }
    var guideSkeleton = {
      "draft": true,
      "id": "",
      "title": document.getElementById('title').value,
      "picturePath": $scope.imgPicURI,
      "author": $scope.username,
      "category": document.getElementById('category').value,
      "meta": {
          "favs": 0,
          "likes": 0,
          "shares": 0
      },
      "comments": [],
      "steps": [],
      "description": document.getElementById("description").value
    };
    GuideTransferService.putGuideData(guideSkeleton);
    $state.go('creation');
    $scope.modal.hide();
    document.getElementById('title').value ='';
  }

})

.controller('SearchCtrl', function($scope) {
  $scope.searchResults = [];
});
