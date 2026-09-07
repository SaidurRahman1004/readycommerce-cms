const StoreSettings = require('../models/StoreSettings');

const getShippingCost = async (city = '') => {
  const settings = await StoreSettings.findOne({ key: 'store' }).select('insideDhakaRate outsideDhakaRate').lean();
  const dhaka = city.trim().toLowerCase() === 'dhaka';
  return dhaka ? (settings?.insideDhakaRate ?? 60) : (settings?.outsideDhakaRate ?? 120);
};

module.exports = {getShippingCost};
