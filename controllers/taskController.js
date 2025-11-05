/**
 * controllers/taskController.js
 *
 * Controllers for Task CRUD operations.
 * Uses Prisma Client to interact with PostgreSQL.
 *
 * Endpoints handled:
 * - POST /api/tasks
 * - PUT /api/tasks/:id
 * - DELETE /api/tasks/:id
 *
 * Notes:
 * - Status is a separate model (Status). API accepts either statusId (integer) or statusName (string)
 *   when creating/updating a task. If neither is provided the default status "TODO" will be used if it exists.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Helper: resolve status by id or name.
 * Returns the status record or null if not provided/found.
 */
async function resolveStatus({ statusId, statusName }) {
  // Prefer statusId when provided and ignore statusName if both are supplied.
  if (statusId == undefined || statusId == null) {
    const err = new Error('Status not found');
    err.status = 404;
    throw err;
  }
  const parsed = parseInt(statusId, 10);
  if (Number.isNaN(parsed)) {
    const err = new Error('statusId must be a valid integer');
    err.status = 400;
    throw err;
  }
  const s = await prisma.status.findUnique({ where: { id: parsed } });
  if (!s) {
    const err = new Error('Status not found');
    err.status = 404;
    throw err;
  }
  return s;



}

/**
 * Create a new task.
 * Validation: title and valid boardId required.
 * Returns 404 if referenced board not found.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, boardId, statusId, statusName } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const parsedBoardId = parseInt(boardId, 10);
    if (Number.isNaN(parsedBoardId)) {
      return res.status(400).json({ error: 'Valid boardId is required' });
    }

    const board = await prisma.board.findUnique({ where: { id: parsedBoardId } });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Resolve status (can throw typed errors)
    let status = null;
    try {
      status = await resolveStatus({ statusId, statusName });
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message });
    }

    const data = {
      title: title.trim(),
      description: description ? String(description).trim() : null,
      board: { connect: { id: parsedBoardId } },
    };

    if (status) {
      data.status = { connect: { id: status.id } };
    }

    const task = await prisma.task.create({ data });

    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a task (title, description, status, or boardId).
 * Validation: id must be valid; 404 if task not found.
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, statusId, statusName, boardId } = req.body;

    const taskId = parseInt(id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const data = {};

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Task title, if provided, must be a non-empty string' });
      }
      data.title = title.trim();
    }

    if (description !== undefined) {
      data.description = description === null ? null : String(description).trim();
    }

    if (boardId !== undefined) {
      const parsedBoardId = parseInt(boardId, 10);
      if (Number.isNaN(parsedBoardId)) {
        return res.status(400).json({ error: 'boardId must be a valid integer' });
      }
      const board = await prisma.board.findUnique({ where: { id: parsedBoardId } });
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }
      data.board = { connect: { id: parsedBoardId } };
    }

    // Handle status update:
    if (statusId !== undefined || statusName !== undefined) {
      // If explicit null provided, unlink status
      if (statusId === null || statusName === null) {
        data.status = { disconnect: true };
      } else {
        let status = null;
        try {
          status = await resolveStatus({ statusId, statusName });
        } catch (e) {
          return res.status(e.status || 400).json({ error: e.message });
        }
        if (status) {
          data.status = { connect: { id: status.id } };
        } else {
          // If resolved to null, set status to null
          data.status = { disconnect: true };
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a task.
 * Returns 404 if task not found.
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
};
