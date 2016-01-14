var frisby = require('frisby');
frisby.create('POST request to signup')
  .post('http://localhost:3000/api/signup', {
    username: "test_user",
    password: "password",
    email: "blah"
  })
  .expectStatus(200)
  .expectJSON({
    "success": false,
    "msg": "Username already exists."
  })
.toss();
