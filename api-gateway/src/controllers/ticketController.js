function createTicketController({ catalogService }) {
  return {
    verify: async (req, res) => res.json(await catalogService.getTicket(req.params.code)),
  };
}

module.exports = { createTicketController };
