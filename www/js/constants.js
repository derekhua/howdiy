angular.module('starter')

.constant('EC2', {
  address: 'http://localhost:3000'
})

.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})

.constant('USER_ROLES', {
  admin: 'admin_role',
  public: 'public_role'
})

// .constant('COLORS', {
//   statusbar: '#FF6600'
// });