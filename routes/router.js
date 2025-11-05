const express = require('express');
const router = express.Router();

const boardController = require('../controllers/boardController');
const taskController = require('../controllers/taskController');
const statusController = require('../controllers/statusController');

const { validate } = require('../validators/validate');
const { idParam, boardCreateSchema, taskCreateSchema, taskUpdateSchema, statusCreateSchema } = require('../validators/schemas');

/**
 * Boards
 */
router.get('/boards', boardController.getBoards);
router.post('/boards', validate({ body: boardCreateSchema }), boardController.createBoard);
router.put('/boards/:id', validate({ params: idParam, body: boardCreateSchema }), boardController.updateBoard);
router.delete('/boards/:id', validate({ params: idParam }), boardController.deleteBoard);

/**
 * Tasks
 */
router.post('/tasks', validate({ body: taskCreateSchema }), taskController.createTask);
router.put('/tasks/:id', validate({ params: idParam, body: taskUpdateSchema }), taskController.updateTask);
router.delete('/tasks/:id', validate({ params: idParam }), taskController.deleteTask);

/**
 * Statuses
 */
router.get('/statuses', statusController.getStatuses);
router.post('/statuses', validate({ body: statusCreateSchema }), statusController.createStatus);
router.put('/statuses/:id', validate({ params: idParam, body: statusCreateSchema }), statusController.updateStatus);
router.delete('/statuses/:id', validate({ params: idParam }), statusController.deleteStatus);

module.exports = router;
