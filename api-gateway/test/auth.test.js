const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTokenService } = require('../src/services/tokenService');
const { requireAuth, requireRole } = require('../src/middlewares/auth');

const tokens = createTokenService({ secret: 'x'.repeat(32), expiresIn: '1h' });
const user = { id: 7, name: 'Ana', username: 'ana', email: 'ana@test.com', role: 'USER' };

// Ejecuta un middleware y devuelve el error pasado a next (o undefined)
const run = (mw, req) => new Promise((resolve) => mw(req, {}, resolve));

test('el token firmado conserva los datos del usuario', () => {
  assert.deepEqual(tokens.verify(tokens.sign(user)), user);
});

test('requireAuth deja el usuario del token en req.user', async () => {
  const req = { headers: { authorization: `Bearer ${tokens.sign(user)}` } };
  assert.equal(await run(requireAuth(tokens), req), undefined);
  assert.equal(req.user.id, 7);
});

test('requireAuth responde 401 sin token, con token falso o de otro secreto', async () => {
  const other = createTokenService({ secret: 'y'.repeat(32), expiresIn: '1h' });
  for (const authorization of [undefined, 'Bearer abc.def.ghi', `Bearer ${other.sign(user)}`, tokens.sign(user)]) {
    const err = await run(requireAuth(tokens), { headers: { authorization } });
    assert.equal(err?.status, 401, `esperaba 401 para ${authorization}`);
  }
});

test('requireRole responde 403 si el rol no coincide', async () => {
  assert.equal((await run(requireRole('ADMIN'), { user }))?.status, 403);
  assert.equal(await run(requireRole('ADMIN'), { user: { ...user, role: 'ADMIN' } }), undefined);
});
