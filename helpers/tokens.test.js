const jwt = require('jsonwebtoken');
const { createToken } = require('./tokens');
const { SECRET_KEY } = require('../config');

describe('createToken', function() {
  test('works: not admin', function() {
    const token = createToken({ username: 'test', role: 'trainee' });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      username: 'test',
      role: 'trainee'
    });
  });

  test('works: admin', function() {
    const token = createToken({ username: 'test', role: 'manager' });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      username: 'test',
      role: 'manager'
    });
  });

  test('works: default no admin', function() {
    // given the security risk if this didn't work, checking this specifically
    const token = createToken({ username: 'test' });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      username: 'test',
      role: 'trainee'
    });
  });
});
