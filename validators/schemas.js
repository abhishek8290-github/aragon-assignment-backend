const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const boardCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
});

const taskCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  description: Joi.string().allow(null, '').optional(),
  boardId: Joi.number().integer().positive().required(),
  // Accept either statusId or statusName (both optional)
  statusId: Joi.number().integer().positive().optional(),
  statusName: Joi.string().trim().optional(),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).optional(),
  description: Joi.allow(null, Joi.string()).optional(),
  boardId: Joi.number().integer().positive().optional(),
  statusId: Joi.allow(null, Joi.number().integer().positive()).optional(),
  statusName: Joi.allow(null, Joi.string().trim()).optional(),
});

const statusCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
});

module.exports = {
  idParam,
  boardCreateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  statusCreateSchema,
};
