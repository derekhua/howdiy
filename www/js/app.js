// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var howdiyApp = angular.module('starter', ['ionic', 'ngCordova', 'starter.controllers', 'starter.services', 'angular-loading-bar'])

.run(function($rootScope, $ionicPlatform) {
  $rootScope.appReady = {status:false};

  $ionicPlatform.ready(function() {
  	$rootScope.appReady.status = true;
  	$rootScope.$apply();

	  // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    // if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    //   cordova.plugins.Keyboard.disableScroll(true);

    // }
    // if (window.StatusBar) {
    //   // org.apache.cordova.statusbar required
    //   StatusBar.styleDefault();
    // }
  });
})

.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.latencyThreshold = 100;
}])

.config(function($ionicConfigProvider) {
    $ionicConfigProvider.navBar.alignTitle('center');
    $ionicConfigProvider.tabs.position('bottom');
})

.config(function($stateProvider, $urlRouterProvider, $compileProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('intro', {
    url: '/',
    templateUrl: 'templates/intro.html',
    controller: 'IntroCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'SignupCtrl'
  })

  .state('guide', {
    cache: false,
    url: '/guide/:guideId',
    templateUrl: 'templates/guide.html',
    controller: 'GuideCtrl'
  })

  .state('saved', {
    url: '/saved',
    templateUrl: 'templates/saved.html',
    controller: 'SavedCtrl'
  })

  // Setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  .state('tab.home', {
    url: '/home',
    views: {
      'tab-home': {
        templateUrl: 'templates/tab-home.html',
        controller: 'HomeCtrl'
      }
    }
  })

  .state('tab.search', {
    url: '/search',
    views: {
      'tab-search': {
        templateUrl: 'templates/tab-search.html',
        controller: 'SearchCtrl'
      }
    }
  })

  .state('creation', {
    url: '/creation',
    templateUrl: 'templates/creation.html',
    controller: 'CreationCtrl'
  })

  .state('tab.activity', {
    url: '/activity',
    views: {
      'tab-activity': {
        templateUrl: 'templates/tab-activity.html',
        controller: 'ActivityCtrl'
      }
    }
  })

  .state('tab.profile', {
    cache: false,
    url: '/profile',
    views: {
      'tab-profile': {
        templateUrl: 'templates/tab-profile.html',
        controller: 'ProfileCtrl'
      }
    }
  });

  // If none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var $state = $injector.get("$state");
    // If seen intro already
    if (window.localStorage['intro']) {
      $state.go("login");
    } else {
      $state.go("intro");
      // Set intro to true
      window.localStorage['intro'] = true;
    }
  });
})

.run(function ($rootScope, $state, AuthService, AUTH_EVENTS) {
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
    // Authorization
    if ('data' in next && 'authorizedRoles' in next.data) {
      var authorizedRoles = next.data.authorizedRoles;
      if (!AuthService.isAuthorized(authorizedRoles)) {
        event.preventDefault();
        $state.go($state.current, {}, {reload: true});
        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
      }
    }
    // Authentication
    if (!AuthService.isAuthenticated() && window.localStorage['intro'] && next.name !== 'signup') {
      if (next.name !== 'login') {
        event.preventDefault();
        $state.go('login');
      }
    } else if (!AuthService.isAuthenticated() && !window.localStorage['intro']) {
      if (next.name !== 'intro') {
        event.preventDefault();
        $state.go('intro');
      }
    }
  });
});
