const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStatuses = async (req, res, next) => {
  try {
    const statuses = await prisma.status.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json(statuses);
  } catch (err) {
    next(err);
  }
};


const createStatus = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Status name is required' });
    }

    const trimmed = name.trim();

    const existing = await prisma.status.findUnique({ where: { name: trimmed } });
    if (existing) {
      return res.status(400).json({ error: 'Status name already exists' });
    }

    const status = await prisma.status.create({
      data: { name: trimmed },
    });

    return res.status(201).json(status);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const statusId = parseInt(id, 10);
    if (Number.isNaN(statusId)) {
      return res.status(400).json({ error: 'Invalid status id' });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Status name is required' });
    }

    const trimmed = name.trim();

    const existing = await prisma.status.findUnique({ where: { id: statusId } });
    if (!existing) {
      return res.status(404).json({ error: 'Status not found' });
    }

    const conflict = await prisma.status.findUnique({ where: { name: trimmed } });
    if (conflict && conflict.id !== statusId) {
      return res.status(400).json({ error: 'Another status with this name already exists' });
    }

    const updated = await prisma.status.update({
      where: { id: statusId },
      data: { name: trimmed },
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a status.
 * Behavior: set statusId = null on tasks that reference this status (non-destructive),
 * then delete the status. Returns 404 if status not found.
 */
const deleteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statusId = parseInt(id, 10);
    if (Number.isNaN(statusId)) {
      return res.status(400).json({ error: 'Invalid status id' });
    }

    const existing = await prisma.status.findUnique({ where: { id: statusId } });
    if (!existing) {
      return res.status(404).json({ error: 'Status not found' });
    }

    // Unlink tasks referencing this status (set statusId to null)
    await prisma.task.updateMany({
      where: { statusId },
      data: { statusId: null },
    });

    await prisma.status.delete({ where: { id: statusId } });

    return res.status(200).json({ message: 'Status deleted and tasks unlinked' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
};
