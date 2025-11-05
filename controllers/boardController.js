/**
 * controllers/boardController.js
 *
 * Controllers for Board CRUD operations.
 * Uses Prisma Client to interact with PostgreSQL.
 *
 * Endpoints handled:
 * - GET /api/boards
 * - POST /api/boards
 * - PUT /api/boards/:id
 * - DELETE /api/boards/:id
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * List all boards with their tasks.
 * Uses eager loading (include: { tasks: true }) for optimized single-query fetch.
 */
const getBoards = async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        tasks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return res.status(200).json(boards);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new board.
 * Validation: name must be provided.
 */
const createBoard = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Board name is required' });
    }

    const trimmedName = name.trim();

    // Prevent duplicate board names (pre-check to return a clean 400)
    const existingByName = await prisma.board.findUnique({ where: { name: trimmedName } });
    if (existingByName) {
      return res.status(400).json({ error: 'Board name already exists' });
    }

    const board = await prisma.board.create({
      data: {
        name: trimmedName,
      },
    });

    return res.status(201).json(board);
  } catch (err) {
    next(err);
  }
};

/**
 * Update board name.
 * Validation: name must be provided and id must be valid.
 * Returns 404 if board not found.
 */
const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const boardId = parseInt(id, 10);
    if (Number.isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board id' });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Board name is required' });
    }

    const trimmedName = name.trim();

    const existing = await prisma.board.findUnique({ where: { id: boardId } });
    if (!existing) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Ensure new name does not conflict with other boards
    const conflict = await prisma.board.findFirst({
      where: {
        name: trimmedName,
        NOT: { id: boardId },
      },
    });
    if (conflict) {
      return res.status(400).json({ error: 'Another board with this name already exists' });
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: { name: trimmedName },
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a board and all its tasks.
 * Returns 404 if board not found.
 */
const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const boardId = parseInt(id, 10);
    if (Number.isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board id' });
    }

    const existing = await prisma.board.findUnique({ where: { id: boardId } });
    if (!existing) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Delete tasks explicitly to ensure cascade-like behavior regardless of DB constraints
    await prisma.task.deleteMany({ where: { boardId } });

    await prisma.board.delete({ where: { id: boardId } });

    return res.status(200).json({ message: 'Board and its tasks deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
};
