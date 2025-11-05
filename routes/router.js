const express = require('express');
const router = express.Router();

const boardController = require('../controllers/boardController');
const taskController = require('../controllers/taskController');
const statusController = require('../controllers/statusController');

/**
 * Boards
 */
router.get('/boards', boardController.getBoards);
router.post('/boards', boardController.createBoard);
router.put('/boards/:id', boardController.updateBoard);
router.delete('/boards/:id', boardController.deleteBoard);

/**
 * Tasks
 */
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

/**
 * Statuses
 */
router.get('/statuses', statusController.getStatuses);
router.post('/statuses', statusController.createStatus);
router.put('/statuses/:id', statusController.updateStatus);
router.delete('/statuses/:id', statusController.deleteStatus);

module.exports = router;
