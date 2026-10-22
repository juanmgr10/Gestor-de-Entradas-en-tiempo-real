/**
 * Registro, verificación del email e inicio de sesión: Java valida, el gateway emite el JWT.
 * El registro no devuelve token: la sesión empieza al verificar el código enviado por email.
 */
function createAuthController({ catalogService, tokenService }) {
  const session = (user) => ({ token: tokenService.sign(user), user });

  return {
    register: async (req, res) => {
      const { username, email } = await catalogService.register(req.body);
      res.status(201).json({ verificationRequired: true, user: { username, email } });
    },
    verifyEmail: async (req, res) => res.json(session(await catalogService.verifyEmail(req.body))),
    resendCode: async (req, res) => {
      await catalogService.resendCode(req.body);
      res.status(204).end();
    },
    login: async (req, res) => res.json(session(await catalogService.login(req.body))),
    me: async (req, res) => res.json(await catalogService.getUser(req.user.id)),
  };
}

module.exports = { createAuthController };
