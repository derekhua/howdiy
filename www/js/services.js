angular.module('starter.services', [])

.service('AuthService', function($q, $http, USER_ROLES, EC2) {
  var LOCAL_TOKEN_KEY = 'yourTokenKey';
  var username = '';
  var isAuthenticated = false;
  var role = '';
  var authToken;

  function loadUserCredentials() {
    var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (token) {
      useCredentials(token);
    }
  }

  function storeUserCredentials(token) {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
    useCredentials(token);
  }

  function useCredentials(token) {
    username = token.split('@')[0];
    isAuthenticated = true;
    authToken = token.split('@')[1];
    if (username == 'admin') {
      role = USER_ROLES.admin;
    }
    if (username == 'user') {
      role = USER_ROLES.public;
    }
    // Set the token as header for requests
    $http.defaults.headers.common.Authorization = authToken;
  }

  function destroyUserCredentials() {
    authToken = undefined;
    username = '';
    isAuthenticated = false;
    $http.defaults.headers.common.Authorization = undefined;
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
  }

  var login = function(username, pw) {
    return $q(function(resolve, reject) {
      $http.post(EC2.address + '/api/auth', {"username": username,"password": pw})
      .then(function(response) {
        if (response.data.success === true) {
          // Make a request and receive your auth token from your server
          storeUserCredentials(username + '@' + response.data.token);
          resolve('Login success.');
        } else {
          reject('Login failed.');
        }
      });
    });
  };

  var signup = function(username, email, pw) {
    return $q(function(resolve, reject) {
      $http.post(EC2.address + '/api/signup', {"username": username, "email": email, "password": pw, "bio" : "This is your bio", 
                                               "website" : "Website URL here", "phone" : "5555555555", "gender" : "Not Specified"})
      .then(function(response) {
        if (response.data.success === true) {        
          resolve('Sign up success.');
        } else {
          reject('Sign up failed.');
        }
      });
    });
  };

  var logout = function() {
    destroyUserCredentials();
  };

  var isAuthorized = function(authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
  };

  loadUserCredentials();

  return {
    login: login,
    signup: signup,
    logout: logout,
    isAuthorized: isAuthorized,
    isAuthenticated: function() {return isAuthenticated;},
    username: function() {return username;},
    role: function() {return role;}
  };
})

.service('ImageService', function($q) {
  var resizeAndConvert = function(imageURI) {    
    return $q(function(resolve, reject) {
      var tempImg = new Image();
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

        resolve(canvas.toDataURL("image/jpeg"));
      };

      tempImg.onerror = function(err) {        
        reject(err);
      };

      tempImg.src = imageURI;
    });
  };

  return {
    resizeAndConvert: resizeAndConvert
  };
})

.service('GuideTransferService', function(){
  var guideData = {};

  var putGuideData = function(transferGuide) {
    guideData = transferGuide;
  };

  var getGuideData = function() {
    return guideData;
  };

  return {
    putGuideData: putGuideData,
    getGuideData: getGuideData,
  }
})

.service('TimeService', function() {
  var timeDifference = function (previous) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;

    var current = Date.now();
    var elapsed = current - previous;

    if (elapsed < 0) {
      return 'Just now';
    }
    if (elapsed < msPerMinute) {
      return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
      return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
      return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else {
      var time = new Date(previous);
      return time.toString().substring(4,21);   
    }
  };

  return {
    timeDifference: timeDifference
  }
})

 // Broadcast a message when returns 401 or 403
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized
      }[response.status], response);
      return $q.reject(response);
    }
  };
})

.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});
