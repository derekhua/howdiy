angular.module('starter.controllers', [])

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
      $state.go('tab.dash', {}, {reload: true});
      $scope.setCurrentUsername(data.username);
    }, function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please check your credentials!'
      });
    });
  };
})

.controller('DashCtrl', function($scope, $state, $http, $ionicPopup, AuthService) {
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  };

  $scope.getGuides = function() {
    $http.get('http://localhost:3000/api/g').then(
      function(result) {
        $scope.response = result;
      });
  };

  $scope.getUsers = function() {
    $http.get('http://localhost:3000/api/u').then(
      function(result) {
        $scope.response = result;
      });
  };

  $scope.printToken = function() {
    console.log(window.localStorage.getItem('yourTokenKey'));
    $scope.response = window.localStorage.getItem('yourTokenKey');
  };
})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
