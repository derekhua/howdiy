describe('AppController', function() {
  var controller,
    deferredLogout,
    scopeMock,
    stateMock,
    ionicPopupMock,
    AuthServiceMock,
    AUTH_EVENTSMock;

  beforeEach(module('starter'));

  // Disable template caching
  beforeEach(module(function($provide, $urlRouterProvider) {
    $provide.value('$ionicTemplateCache', function(){} );
    $urlRouterProvider.deferIntercept();
  }));

  // Instantiate the controller and mocks for every test
  beforeEach(inject(function($controller, $q) {
    deferredLogout = $q.defer();

    // Mock AuthService
    AuthServiceMock = {
      username: jasmine.createSpy('username spy')
                    .and.returnValue(),
      logout: jasmine.createSpy('logout spy')
                    .and.returnValue(deferredLogout.promise),
    };

    // Mock AUTH_EVENTS
    AUTH_EVENTSMock =  {
      notAuthenticated: 'auth-not-authenticated',
      notAuthorized: 'auth-not-authorized'
    };

    // Mock $state
    stateMock = jasmine.createSpyObj('$state spy', ['go']);

    // Mock $scope
    scopeMock = jasmine.createSpyObj('$scope spy', ['username', '$on']);

    // Mock $ionicPopup
    ionicPopupMock = jasmine.createSpyObj('$ionicPopup spy', ['alert']);

    // Instantiate LoginController
    controller = $controller('AppCtrl', {
                    '$scope': scopeMock,
                    '$ionicPopup': ionicPopupMock,
                    '$state': stateMock,
                    'AuthService': AuthServiceMock,
                    'AUTH_EVENTS': AUTH_EVENTSMock,
                 });
  }));

  describe('#notAuthorized broadcast', function() {
    beforeEach(inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
      spyOn($rootScope, '$broadcast').and.callThrough();
      $rootScope.$broadcast(AUTH_EVENTSMock.notAuthorized);
    }));

    it('should receive the broadcast', function() {
      $rootScope.$digest();
      expect(scopeMock.$on).toHaveBeenCalled();
      // expect(ionicPopupMock.alert).toHaveBeenCalled();
    });
  });

  describe('#notAuthenticated broadcast', function() {
    beforeEach(inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
      $rootScope.$broadcast(AUTH_EVENTSMock.notAuthenticated);
    }));

    it('should receive the broadcast', function() {
      $rootScope.$digest();
      expect(scopeMock.$on).toHaveBeenCalled();
      // expect(ionicPopupMock.alert).toHaveBeenCalled();
    });
  });
});
