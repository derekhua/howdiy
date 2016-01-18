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
    logout: logout,
    isAuthorized: isAuthorized,
    isAuthenticated: function() {return isAuthenticated;},
    username: function() {return username;},
    role: function() {return role;}
  };
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
