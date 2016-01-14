describe('LoginController', function() {
  var controller,
    deferredLogin,
    AuthServiceMock,
    stateMock,
    ionicPopupMock,
    scopeMock;

  beforeEach(module('starter'));

  // Disable template caching
  beforeEach(module(function($provide, $urlRouterProvider) {
    $provide.value('$ionicTemplateCache', function(){} );
    $urlRouterProvider.deferIntercept();
  }));

  // Instantiate the controller and mocks for every test
  beforeEach(inject(function($controller, $q) {
    deferredLogin = $q.defer();

    // Mock AuthService
    AuthServiceMock = {
      login: jasmine.createSpy('login spy')
                    .and.returnValue(deferredLogin.promise)
    };

    // Mock $state
    stateMock = jasmine.createSpyObj('$state spy', ['go']);

    // Mock $scope
    scopeMock = jasmine.createSpyObj('$scope spy', ['setCurrentUsername', 'login'])

    // Mock $ionicPopup
    ionicPopupMock = jasmine.createSpyObj('$ionicPopup spy', ['alert']);

    // Instantiate LoginController
    controller = $controller('LoginCtrl', {
                    '$scope': scopeMock,
                    '$ionicPopup': ionicPopupMock,
                    '$state': stateMock,
                    'AuthService': AuthServiceMock
                 });
  }));

  describe('#login', function() {
    // Call login on the controller for every test
    beforeEach(inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
      scopeMock.login({username:'test_user', password: 'password'});
    }));

    it('should call login on AuthService', function() {
      expect(AuthServiceMock.login).toHaveBeenCalledWith('test_user', 'password');
    });

    describe('when the login is executed,', function() {
      it('if successful, should change state to tab.home', function() {
        // Mock the login response from AuthService
        deferredLogin.resolve();
        $rootScope.$digest();

        expect(stateMock.go).toHaveBeenCalledWith('tab.home', {}, {reload: true});
      });

      it('if successful, should call setCurrentUsername on $scope', function() {
        // Mock the login response from AuthService
        deferredLogin.resolve();
        $rootScope.$digest();

        expect(scopeMock.setCurrentUsername).toHaveBeenCalledWith('test_user');
      });

      it('if unsuccessful, should show a popup', function() {
        // Mock the login response from AuthService
        deferredLogin.reject();
        $rootScope.$digest();

        expect(ionicPopupMock.alert).toHaveBeenCalled();
      });
    });
  })
});
