function createPurchaseController({ purchaseOrchestrator }) {
  return {
    create: async (req, res) => res.status(201).json(await purchaseOrchestrator.checkout(req.body)),
  };
}

module.exports = { createPurchaseController };
