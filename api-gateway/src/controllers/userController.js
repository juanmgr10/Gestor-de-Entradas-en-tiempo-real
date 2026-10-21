function createUserController({ catalogService }) {
  return {
    register: async (req, res) => res.status(201).json(await catalogService.registerUser(req.body)),
  };
}

module.exports = { createUserController };
