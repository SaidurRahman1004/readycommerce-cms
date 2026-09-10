const DeliveryZone = require('../models/DeliveryZone');
const { AppError } = require('../middlewares/errorHandler');

const listZones = async (req, res, next) => {
  try {
    const zones = await DeliveryZone.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: zones });
  } catch (error) {
    return next(error);
  }
};

const createZone = async (req, res, next) => {
  try {
    const { name, type, postalCodes, isActive, deliveryCharge, codAvailable } = req.body;
    
    if (!name || deliveryCharge === undefined) {
      return next(new AppError('Name and Delivery Charge are required.', 400, 'INVALID_DATA'));
    }

    const zone = new DeliveryZone({
      name: String(name).trim(),
      type: type || 'custom_zone',
      postalCodes: Array.isArray(postalCodes) ? postalCodes.map(String) : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      deliveryCharge: Number(deliveryCharge),
      codAvailable: codAvailable !== undefined ? Boolean(codAvailable) : true
    });

    await zone.save();
    return res.status(201).json({ success: true, data: zone });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Delivery Zone with this name already exists.', 409, 'DUPLICATE_ZONE'));
    }
    return next(error);
  }
};

const updateZone = async (req, res, next) => {
  try {
    const { name, type, postalCodes, isActive, deliveryCharge, codAvailable } = req.body;
    
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) return next(new AppError('Delivery Zone not found.', 404, 'NOT_FOUND'));

    if (name !== undefined) zone.name = String(name).trim();
    if (type !== undefined) zone.type = type;
    if (postalCodes !== undefined) zone.postalCodes = Array.isArray(postalCodes) ? postalCodes.map(String) : [];
    if (isActive !== undefined) zone.isActive = Boolean(isActive);
    if (deliveryCharge !== undefined) zone.deliveryCharge = Number(deliveryCharge);
    if (codAvailable !== undefined) zone.codAvailable = Boolean(codAvailable);

    await zone.save();
    return res.json({ success: true, data: zone });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Delivery Zone with this name already exists.', 409, 'DUPLICATE_ZONE'));
    }
    return next(error);
  }
};

const deleteZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
    if (!zone) return next(new AppError('Delivery Zone not found.', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listZones,
  createZone,
  updateZone,
  deleteZone
};
