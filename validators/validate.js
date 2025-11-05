const Joi = require('joi');

/**
 * Middleware factory that validates request parts (body, params, query) against provided Joi schemas.
 * Usage:
 *   const { validate } = require('../validators/validate');
 *   router.post('/boards', validate({ body: boardCreateSchema }), boardController.createBoard);
 *
 * Each schema is optional; validator will only check provided parts.
 */
function validate(schemas = {}) {
  const { body: bodySchema, params: paramsSchema, query: querySchema } = schemas;

  return (req, res, next) => {
    try {
      if (paramsSchema) {
        const { error, value } = paramsSchema.validate(req.params, { stripUnknown: true, convert: true });
        if (error) return res.status(400).json({ error: error.message });
        req.params = value;
      }

      if (querySchema) {
        const { error, value } = querySchema.validate(req.query, { stripUnknown: true, convert: true });
        if (error) return res.status(400).json({ error: error.message });
        req.query = value;
      }

      if (bodySchema) {
        const { error, value } = bodySchema.validate(req.body, { stripUnknown: true, convert: true });
        if (error) return res.status(400).json({ error: error.message });
        req.body = value;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { validate };
