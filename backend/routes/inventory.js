const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

/**
 * Helper function to format inventory item for response
 */
const toInventoryShape = (doc) => {
  return {
    id: String(doc._id),
    itemName: doc.itemName,
    category: doc.category,
    description: doc.description,
    totalQuantity: Number(doc.totalQuantity || 0),
    usedQuantity: Number(doc.usedQuantity || 0),
    remainingQuantity: Number(doc.remainingQuantity || 0),
    unit: doc.unit,
    costPerUnit: Number(doc.costPerUnit || 0),
    totalCost: Number(doc.totalCost || 0),
    minThreshold: Number(doc.minThreshold || 5),
    status: doc.status,
    supplier: doc.supplier || {},
    lastRestocked: doc.lastRestocked,
    lastUsed: doc.lastUsed,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// ============================================================================
// GET ENDPOINTS
// ============================================================================

/**
 * GET /api/inventory - Get all inventory items
 * Optional query: ?category=decoration
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};

    const items = await Inventory.find(query).sort({ createdAt: -1 });

    if (!items || !Array.isArray(items)) {
      return res.json([]);
    }

    res.json(items.map((item) => toInventoryShape(item)));
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventory/stats - Get inventory statistics
 * Returns: totals, categories, low stock items, etc
 */
router.get('/stats', async (req, res) => {
  try {
    const items = await Inventory.find();

    // Calculate statistics
    const stats = {
      totalItems: items.length,
      totalValue: 0,
      byCategory: {},
      lowStockItems: [],
      outOfStockItems: [],
      byStatus: { 'in-stock': 0, 'low-stock': 0, 'out-of-stock': 0 },
    };

    items.forEach((item) => {
      // Total value
      stats.totalValue += item.totalCost || 0;

      // By category
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = {
          count: 0,
          totalValue: 0,
        };
      }
      stats.byCategory[item.category].count += 1;
      stats.byCategory[item.category].totalValue += item.totalCost || 0;

      // Low stock alerts
      if (item.status === 'low-stock') {
        stats.lowStockItems.push({
          id: String(item._id),
          itemName: item.itemName,
          remaining: item.remainingQuantity,
          minThreshold: item.minThreshold,
        });
      }

      // Out of stock
      if (item.status === 'out-of-stock') {
        stats.outOfStockItems.push({
          id: String(item._id),
          itemName: item.itemName,
        });
      }

      // By status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    });

    res.json(stats);
  } catch (err) {
    console.error('Error fetching inventory stats:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventory/:id - Get single inventory item
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    res.json(toInventoryShape(item));
  } catch (err) {
    console.error('Error fetching inventory item:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// POST ENDPOINTS
// ============================================================================

/**
 * POST /api/inventory - Create new inventory item
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};

    // Validation
    if (!payload.itemName || !payload.category || payload.totalQuantity === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: itemName, category, totalQuantity',
      });
    }

    const item = new Inventory({
      itemName: payload.itemName,
      category: payload.category,
      description: payload.description || '',
      totalQuantity: Number(payload.totalQuantity || 0),
      usedQuantity: Number(payload.usedQuantity || 0),
      unit: payload.unit || 'pieces',
      costPerUnit: Number(payload.costPerUnit || 0),
      minThreshold: Number(payload.minThreshold || 5),
      supplier: payload.supplier || {},
      notes: payload.notes || '',
    });

    const saved = await item.save();
    res.status(201).json(toInventoryShape(saved));
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// PATCH ENDPOINTS
// ============================================================================

/**
 * PATCH /api/inventory/:id - Update inventory item
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const updated = await Inventory.findByIdAndUpdate(
      id,
      {
        $set: {
          itemName: payload.itemName,
          category: payload.category,
          description: payload.description,
          totalQuantity: payload.totalQuantity,
          usedQuantity: payload.usedQuantity,
          unit: payload.unit,
          costPerUnit: payload.costPerUnit,
          minThreshold: payload.minThreshold,
          supplier: payload.supplier,
          notes: payload.notes,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    res.json(toInventoryShape(updated));
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/inventory/:id/use - Mark items as used
 * Updates usedQuantity and auto-updates status
 */
router.patch('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body || {};

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity.' });
    }

    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    const newUsed = item.usedQuantity + quantity;

    if (newUsed > item.totalQuantity) {
      return res.status(400).json({
        error: `Cannot use more than total quantity. Available: ${item.totalQuantity - item.usedQuantity}`,
      });
    }

    item.usedQuantity = newUsed;
    item.lastUsed = new Date();
    const updated = await item.save();

    res.json(toInventoryShape(updated));
  } catch (err) {
    console.error('Error updating item usage:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/inventory/:id/restock - Add items to inventory
 */
router.patch('/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body || {};

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity.' });
    }

    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    item.totalQuantity += quantity;
    item.lastRestocked = new Date();
    const updated = await item.save();

    res.json(toInventoryShape(updated));
  } catch (err) {
    console.error('Error restocking item:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DELETE ENDPOINTS
// ============================================================================

/**
 * DELETE /api/inventory/:id - Delete inventory item
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Inventory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    res.json({ success: true, message: 'Inventory item deleted.' });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
