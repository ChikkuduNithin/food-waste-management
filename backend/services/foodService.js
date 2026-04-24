const Food = require('../models/Food');
const Request = require('../models/Request');
const { AppError } = require('../middleware/errorMiddleware');

const createFood = async (donorId, data) => {
  const food = await Food.create({ ...data, donor: donorId });
  return await food.populate('donor', 'name email phone organization');
};

const getAllFoods = async (query = {}) => {
  const { status, category, page = 1, limit = 10 } = query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;

  // Auto-expire past expiry
  const now = new Date();
  await Food.updateMany(
    { expiryTime: { $lt: now }, status: 'available' },
    { status: 'expired' }
  );

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [foods, total] = await Promise.all([
    Food.find(filter)
      .populate('donor', 'name email phone organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Food.countDocuments(filter),
  ]);

  return {
    foods,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  };
};

const getFoodById = async (foodId) => {
  const food = await Food.findById(foodId).populate('donor', 'name email phone organization');
  if (!food) throw new AppError('Food listing not found.', 404);
  return food;
};

const getDonorFoods = async (donorId, query = {}) => {
  const { status, page = 1, limit = 10 } = query;
  const filter = { donor: donorId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [foods, total] = await Promise.all([
    Food.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Food.countDocuments(filter),
  ]);

  return {
    foods,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  };
};

const updateFood = async (foodId, donorId, updates) => {
  const food = await Food.findById(foodId);
  if (!food) throw new AppError('Food listing not found.', 404);

  if (food.donor.toString() !== donorId.toString()) {
    throw new AppError('Not authorized to update this listing.', 403);
  }

  // Prevent editing completed/expired
  if (['completed', 'expired'].includes(food.status)) {
    throw new AppError(`Cannot update a ${food.status} listing.`, 400);
  }

  const allowedUpdates = ['title', 'description', 'quantity', 'expiryTime', 'location', 'category', 'images'];
  allowedUpdates.forEach((field) => {
    if (updates[field] !== undefined) food[field] = updates[field];
  });

  await food.save();
  return await food.populate('donor', 'name email phone organization');
};

const deleteFood = async (foodId, userId, userRole) => {
  const food = await Food.findById(foodId);
  if (!food) throw new AppError('Food listing not found.', 404);

  if (userRole !== 'ADMIN' && food.donor.toString() !== userId.toString()) {
    throw new AppError('Not authorized to delete this listing.', 403);
  }

  await Request.deleteMany({ food: foodId });
  await Food.findByIdAndDelete(foodId);
  return { message: 'Food listing deleted successfully.' };
};

module.exports = { createFood, getAllFoods, getFoodById, getDonorFoods, updateFood, deleteFood };
