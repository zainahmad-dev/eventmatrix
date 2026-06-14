const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/authorize');

// Models
const Category = require('../models/Category');
const EquipmentItem = require('../models/EquipmentItem');
const EquipmentBooking = require('../models/EquipmentBooking');
const AdminActionLog = require('../models/AdminActionLog');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format equipment item for response
 */
const toEquipmentShape = (doc) => {
  const categoryDoc = doc.category && doc.category._id ? doc.category : null;
  const categoryId = categoryDoc ? String(categoryDoc._id) : String(doc.category || '');
  const categoryName = categoryDoc ? categoryDoc.name : (typeof doc.category === 'string' ? doc.category : '');
  const categoryIcon = categoryDoc ? categoryDoc.icon : '📦';

  return {
    id: String(doc._id),
    name: doc.name,
    category: {
      id: categoryId,
      name: categoryName,
      icon: categoryIcon,
    },
    description: doc.description,
    images: doc.images || [],
    totalQuantity: Number(doc.totalQuantity || 0),
    availableQuantity: Number(doc.availableQuantity || 0),
    pricePerDay: Number(doc.pricePerDay || 0),
    condition: doc.condition,
    lastMaintenance: doc.lastMaintenance,
    maintenanceNotes: doc.maintenanceNotes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const findCategoryByIdOrName = async (categoryValue) => {
  if (!categoryValue) {
    return null;
  }

  const query = [{ name: categoryValue }];
  if (mongoose.isValidObjectId(categoryValue)) {
    query.unshift({ _id: categoryValue });
  }

  return Category.findOne({ $or: query });
};

// ============================================================================
// SEED ENDPOINT - Initialize database with categories and items
// ============================================================================

/**
 * POST /api/equipment/init - Seed database with initial data
 * Only works if database is empty
 */
router.post('/init', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Check if data already exists
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      return res.json({
        message: 'Database already populated. Skipping seed.',
        categoriesCount: existingCategories,
      });
    }

    const { categoryData, equipmentData } = require('../seeds/inventory.seed');

    // Create categories
    const createdCategories = await Category.insertMany(categoryData);
    console.log(`✓ Created ${createdCategories.length} categories`);

    // Create equipment items with category references
    const equipmentWithCategoryRefs = equipmentData.map((item) => {
      const category = createdCategories.find((cat) => cat.name === item.category);
      return {
        ...item,
        category: category._id,
        availableQuantity: item.totalQuantity, // Start with all available
      };
    });

    const createdEquipment = await EquipmentItem.insertMany(equipmentWithCategoryRefs);
    console.log(`✓ Created ${createdEquipment.length} equipment items`);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      categoriesCreated: createdCategories.length,
      itemsCreated: createdEquipment.length,
    });
  } catch (err) {
    console.error('Error seeding database:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// GET ENDPOINTS (Public - anyone can view)
// ============================================================================

/**
 * GET /api/equipment - Get all equipment
 * Query params:
 *   - category: Filter by category ID or name
 *   - startDate & endDate: Filter by availability for date range
 *   - condition: Filter by condition (good, damaged, under-maintenance)
 *   - adminView: If true (and user is admin), show all items including unavailable
 */
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate, condition, adminView } = req.query;
    const isAdmin = req.user?.role === 'admin';

    // Build query
    const query = {};

    if (category) {
      const cat = await findCategoryByIdOrName(category);
      if (cat) query.category = cat._id;
    }

    if (condition) {
      query.condition = condition;
    }

    // For customers, only show 'good' condition items
    if (!isAdmin && !adminView) {
      query.condition = 'good';
    }

    // Get all matching equipment
    let items = await EquipmentItem.find(query)
      .populate('category')
      .sort({ createdAt: -1 });

    // If date range provided, filter by availability
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      items = await Promise.all(
        items.map(async (item) => {
          const available = await item.getAvailabilityForDateRange(start, end);
          return {
            ...item.toObject ? item.toObject() : item,
            availableQuantity: available,
            isAvailable: available > 0,
          };
        })
      );

      // For customers, filter out unavailable items
      if (!isAdmin && !adminView) {
        items = items.filter((item) => item.isAvailable);
      }
    }

    // Format response
    const formattedItems = items.map((item) =>
      item.toObject ? toEquipmentShape(item) : item
    );

    res.json(formattedItems);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/equipment/category/:categoryId - Get items by category
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const category = await findCategoryByIdOrName(req.params.categoryId);

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const items = await EquipmentItem.find({ category: category._id })
      .populate('category')
      .sort({ createdAt: -1 });

    const formattedItems = items.map((item) => toEquipmentShape(item));
    res.json(formattedItems);
  } catch (err) {
    console.error('Error fetching equipment by category:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/categories - Get all equipment categories
 */
router.get('/list/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(
      categories.map((cat) => ({
        id: String(cat._id),
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
      }))
    );
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/equipment/:id/availability - Check availability for date range
 * Query params: startDate, endDate
 */
router.get('/:id/availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required.' });
    }

    const item = await EquipmentItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Equipment item not found.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const available = await item.getAvailabilityForDateRange(start, end);

    res.json({
      id: String(item._id),
      name: item.name,
      totalQuantity: item.totalQuantity,
      availableQuantity: available,
      isAvailable: available > 0,
      startDate,
      endDate,
    });
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/equipment/:id - Get single equipment item with availability
 * Query params:
 *   - startDate & endDate: Check availability for specific dates
 */
router.get('/:id', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const item = await EquipmentItem.findById(req.params.id).populate('category');

    if (!item) {
      return res.status(404).json({ error: 'Equipment item not found.' });
    }

    let formattedItem = toEquipmentShape(item);

    // Check availability for date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const available = await item.getAvailabilityForDateRange(start, end);
      formattedItem.availableQuantity = available;
      formattedItem.isAvailable = available > 0;
    }

    res.json(formattedItem);
  } catch (err) {
    console.error('Error fetching equipment item:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// POST ENDPOINTS (Admin only)
// ============================================================================

/**
 * POST /api/equipment - Create new equipment item (Admin only)
 */
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const payload = req.body || {};

    // Validation
    if (!payload.name || !payload.category || payload.totalQuantity === undefined) {
      return res.status(400).json({
        error: 'Required fields: name, category, totalQuantity',
      });
    }

    // Find category
    const category = await Category.findOne({
      $or: [{ _id: payload.category }, { name: payload.category }],
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Create equipment item
    const item = new EquipmentItem({
      name: payload.name,
      category: category._id,
      description: payload.description || '',
      images: payload.images || [],
      totalQuantity: Number(payload.totalQuantity),
      availableQuantity: Number(payload.totalQuantity), // Start with all available
      pricePerDay: Number(payload.pricePerDay || 0),
      condition: payload.condition || 'good',
      maintenanceNotes: payload.maintenanceNotes || '',
    });

    const saved = await item.save();

    // Log action
    await AdminActionLog.create({
      performedBy: req.user.id,
      actionType: 'equipment_item_created',
      summary: `Created equipment: ${saved.name}`,
      payload: { itemId: saved._id, name: saved.name },
    });

    res.status(201).json(await saved.populate('category').then((doc) => toEquipmentShape(doc)));
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/equipment/category - Create new category (Admin only)
 */
router.post('/category', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name required.' });
    }

    const category = new Category({
      name,
      icon: icon || '📦',
      description: description || '',
    });

    const saved = await category.save();

    // Log action
    await AdminActionLog.create({
      performedBy: req.user.id,
      actionType: 'equipment_category_created',
      summary: `Created category: ${saved.name}`,
      payload: { categoryId: saved._id, name: saved.name },
    });

    res.status(201).json({
      id: String(saved._id),
      name: saved.name,
      icon: saved.icon,
      description: saved.description,
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// PUT ENDPOINTS (Admin only)
// ============================================================================

/**
 * PUT /api/equipment/:id - Update equipment item (Admin only)
 */
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const item = await EquipmentItem.findById(id).populate('category');

    if (!item) {
      return res.status(404).json({ error: 'Equipment item not found.' });
    }

    // Update fields
    if (payload.name) item.name = payload.name;
    if (payload.category) {
      const cat = await Category.findOne({
        $or: [{ _id: payload.category }, { name: payload.category }],
      });
      if (cat) item.category = cat._id;
    }
    if (payload.description !== undefined) item.description = payload.description;
    if (payload.images) item.images = payload.images;
    if (payload.totalQuantity !== undefined) {
      item.totalQuantity = Number(payload.totalQuantity);
    }
    if (payload.pricePerDay !== undefined) item.pricePerDay = Number(payload.pricePerDay);
    if (payload.condition) item.condition = payload.condition;

    const updated = await item.save();

    // Log action
    await AdminActionLog.create({
      performedBy: req.user.id,
      actionType: 'equipment_item_updated',
      summary: `Updated equipment: ${updated.name}`,
      payload: { itemId: updated._id, name: updated.name },
    });

    res.json(toEquipmentShape(updated));
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/equipment/:id/maintenance - Update maintenance status (Admin only)
 */
router.put('/:id/maintenance', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, maintenanceNotes } = req.body;

    if (!condition) {
      return res.status(400).json({ error: 'Condition required.' });
    }

    const item = await EquipmentItem.findById(id).populate('category');

    if (!item) {
      return res.status(404).json({ error: 'Equipment item not found.' });
    }

    const previousCondition = item.condition;
    item.condition = condition;
    item.maintenanceNotes = maintenanceNotes || item.maintenanceNotes;
    item.lastMaintenance = new Date();

    const updated = await item.save();

    // Log action
    const actionType =
      condition === 'under-maintenance' ? 'equipment_maintenance_started' : 'equipment_maintenance_completed';

    await AdminActionLog.create({
      performedBy: req.user.id,
      actionType,
      summary: `${previousCondition} → ${condition}: ${updated.name}`,
      payload: {
        itemId: updated._id,
        name: updated.name,
        previousCondition,
        newCondition: condition,
      },
    });

    res.json(toEquipmentShape(updated));
  } catch (err) {
    console.error('Error updating maintenance status:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DELETE ENDPOINTS (Admin only)
// ============================================================================

/**
 * DELETE /api/equipment/:id - Delete equipment item (Admin only)
 */
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await EquipmentItem.findById(id);

    if (!item) {
      return res.status(404).json({ error: 'Equipment item not found.' });
    }

    const itemName = item.name;

    // Delete all bookings for this item
    await EquipmentBooking.deleteMany({ equipmentItem: id });

    // Delete the item
    await EquipmentItem.findByIdAndDelete(id);

    // Log action
    await AdminActionLog.create({
      performedBy: req.user.id,
      actionType: 'equipment_item_deleted',
      summary: `Deleted equipment: ${itemName}`,
      payload: { itemId: id, name: itemName },
    });

    res.json({ success: true, message: 'Equipment item deleted.' });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
