angular.module('starter')

.constant('EC2', {
  address: 'http://ec2-54-165-233-14.compute-1.amazonaws.com:3000'
})

.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})

.constant('USER_ROLES', {
  admin: 'admin_role',
  public: 'public_role'
})

.constant('S3', {
  bucketURL : 'https://s3.amazonaws.com/howdiy/'
})

.constant('TOKEN_KEY', {
  name: 'yourTokenKey'
});

// .constant('COLORS', {
//   statusbar: '#FF6600'
// });
