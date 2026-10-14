const MenuItem = require('../models/MenuItem');

const getMenuItems = async (req, res, next) => {
  try {
    const { category, search, availableOnly } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (availableOnly === 'true') {
      query.isAvailable = true;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    next(err);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, image, category, preparationTimeMinutes } = req.body;

    const newItem = await MenuItem.create({
      name,
      description,
      price: parseFloat(price),
      image,
      category,
      preparationTimeMinutes: preparationTimeMinutes ? parseInt(preparationTimeMinutes, 10) : 20
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: newItem
    });
  } catch (err) {
    next(err);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
