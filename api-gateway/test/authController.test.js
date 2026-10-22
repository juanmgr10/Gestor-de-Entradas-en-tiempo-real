const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAuthController } = require('../src/controllers/authController');
const { createTokenService } = require('../src/services/tokenService');

const tokens = createTokenService({ secret: 'x'.repeat(32), expiresIn: '1h' });
const user = { id: 7, name: 'Ana', username: 'ana', email: 'ana@test.com', role: 'USER', emailVerified: true };

// Respuesta mínima de Express que registra el estado y el cuerpo enviados
function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  res.end = () => res;
  return res;
}

test('el registro no entrega token: exige verificar el email', async () => {
  const catalogService = { register: async () => ({ ...user, emailVerified: false }) };
  const res = fakeRes();

  await createAuthController({ catalogService, tokenService: tokens }).register({ body: {} }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { verificationRequired: true, user: { username: 'ana', email: 'ana@test.com' } });
});

test('verificar el código inicia la sesión', async () => {
  let sent;
  const catalogService = { verifyEmail: async (body) => ((sent = body), user) };
  const res = fakeRes();

  await createAuthController({ catalogService, tokenService: tokens })
    .verifyEmail({ body: { username: 'ana', code: '1234' } }, res);

  assert.deepEqual(sent, { username: 'ana', code: '1234' });
  assert.equal(tokens.verify(res.body.token).id, 7);
  assert.deepEqual(res.body.user, user);
});

test('reenviar el código responde 204', async () => {
  const res = fakeRes();
  await createAuthController({ catalogService: { resendCode: async () => {} }, tokenService: tokens })
    .resendCode({ body: { username: 'ana' } }, res);
  assert.equal(res.statusCode, 204);
});
