function createProfileController({ catalogService }) {
  return {
    purchases: async (req, res) => res.json(await catalogService.getUserPurchases(req.user.id)),
  };
}

module.exports = { createProfileController };
