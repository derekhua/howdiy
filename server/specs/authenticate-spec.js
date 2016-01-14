var frisby = require('frisby');
frisby.create('POST request to authenticate a user')
  .post('http://localhost:3000/api/auth', {
    username: "test_user",
    password: "password"
  })
  .expectStatus(200)
  .expectJSON({
    "success": true,
    "token": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1Njk1YzI3MTdmMTVhMzIwOGFiNDRhYjUiLCJ1c2VybmFtZSI6InRlc3RfdXNlciIsImVtYWlsIjoidGVzdGVtYWlsIiwicGFzc3dvcmQiOiIkMmEkMTAkOGRaaGZndzAxNGJLUmJLRzJmU0JWT3FCR0hYY3k5Q215MlFabDRlckp3V1NhWTB3Z0ZyT20iLCJfX3YiOjB9.Y5g5ToxKVkrYJ5yVO87N4zAV1JAa7ciI6q_M-l6L2YM"
  })
.toss();
