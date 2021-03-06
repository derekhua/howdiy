// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var howdiyApp = angular.module('starter', ['ionic', 'ngCordova', 'starter.controllers', 'starter.directives', 'starter.services', 'angular-loading-bar'])

.run(function($rootScope, $ionicPlatform) {
  $rootScope.appReady = {status:false};

  $ionicPlatform.ready(function() {
  	$rootScope.appReady.status = true;
  	$rootScope.$apply();

    console.log("KEYBOARD: Now load keyboard plugin...");
    console.log("KEYBOARD: Keyboard plugin: " + window.cordova.plugins.Keyboard);
    console.log("KEYBOARD: And cordova keyboard: " + cordova.plugins.Keyboard);

	  // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      // On iOS, if there is an input in your footer, you will need to set
      cordova.plugins.Keyboard.disableScroll(true);
    }    
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }

    console.log("KEYBOARD: Loaded keyboard plugin...");
  });
  
  
})

.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.latencyThreshold = 100;
}])

.config(function($ionicConfigProvider) {
    $ionicConfigProvider.navBar.alignTitle('center');
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.tabs.style('standard');
})

.config(function($stateProvider, $urlRouterProvider, $compileProvider, TOKEN_KEY) {

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

  // Setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabsCtrl'
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

  .state('tab.home.guide', {
    cache: false,
    url: '/guide/:guideId',
    views: {
      'tab-home@tab': {
        templateUrl: 'templates/guide.html',
        controller: 'GuideCtrl'
      }
    }
  })

  .state('tab.home.profile', {
    url: '/profile/:username',
    views: {
      'tab-home@tab': {
        templateUrl: 'templates/tab-profile.html',
        controller: 'ProfileCtrl'
      }
    }
  })

  .state('creation', {
    cache: false,
    url: '/creation',
    templateUrl: 'templates/creation.html',
    controller: 'CreationCtrl'
  })

  .state('tab.activity', {
    cache: false,
    url: '/activity',
    views: {
      'tab-activity': {
        templateUrl: 'templates/tab-activity.html',
        controller: 'ActivityCtrl'
      }
    }
  })

  .state('tab.activity.guide', {
    cache: false,
    url: '/guide/:guideId',
    views: {
      'tab-activity@tab': {
        templateUrl: 'templates/guide.html',
        controller: 'GuideCtrl'
      }
    }
  })

  .state('tab.activity.profile', {
    url: '/profile/:username',
    views: {
      'tab-activity@tab': {
        templateUrl: 'templates/tab-profile.html',
        controller: 'ProfileCtrl'
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
  })

  .state('tab.profile.guide', {
    url: '/guide/:guideId',
    views: {
      'tab-profile@tab': {
        templateUrl: 'templates/guide.html',
        controller: 'GuideCtrl'
      }
    }
  })

  .state('tab.profile.profile', {
    url: '/profile/:username',
    views: {
      'tab-profile@tab': {
        templateUrl: 'templates/tab-profile.html',
        controller: 'ProfileCtrl'
      }
    }
  });

  // If none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var $state = $injector.get("$state");
    // If seen intro already
    if (window.localStorage.getItem(TOKEN_KEY.name)) {
      $state.go("tab.home");
    }
    else if (window.localStorage['intro']) {
      $state.go("login");
    } 
    else {
      $state.go("intro");
      // Set intro to true
      window.localStorage['intro'] = true;
    }
  });
})

.run(function ($rootScope, $state, AuthService, AUTH_EVENTS, TOKEN_KEY) {
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
    if (window.localStorage.getItem(TOKEN_KEY.name) && next.name === 'login') {
      console.log("You are attempting to access the login page while a token already exists");
      $state.go("tab.home");
    }

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


