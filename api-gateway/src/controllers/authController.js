/** Registro e inicio de sesión: Java valida credenciales, el gateway emite el JWT. */
function createAuthController({ catalogService, tokenService }) {
  const session = (user) => ({ token: tokenService.sign(user), user });

  return {
    register: async (req, res) => res.status(201).json(session(await catalogService.register(req.body))),
    login: async (req, res) => res.json(session(await catalogService.login(req.body))),
    me: async (req, res) => res.json(await catalogService.getUser(req.user.id)),
  };
}

module.exports = { createAuthController };
