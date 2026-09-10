const StoreSettings = require('../models/StoreSettings');
const DeliveryZone = require('../models/DeliveryZone');

const getShippingCost = async (city = '', postalCode = '') => {
  // First attempt: match by postalCode if provided
  if (postalCode) {
    const zoneByPostal = await DeliveryZone.findOne({ isActive: true, postalCodes: postalCode }).lean();
    if (zoneByPostal) {
      return { cost: zoneByPostal.deliveryCharge, codAvailable: zoneByPostal.codAvailable, zoneName: zoneByPostal.name };
    }
  }

  // Second attempt: match by exact city name (if type is city or custom_zone matching name)
  if (city) {
    const zoneByCity = await DeliveryZone.findOne({ 
      isActive: true, 
      name: { $regex: new RegExp(`^${city}$`, 'i') } 
    }).lean();
    
    if (zoneByCity) {
      return { cost: zoneByCity.deliveryCharge, codAvailable: zoneByCity.codAvailable, zoneName: zoneByCity.name };
    }
  }

  // Fallback to legacy logic
  const settings = await StoreSettings.findOne({ key: 'store' }).select('insideDhakaRate outsideDhakaRate').lean();
  const dhaka = city.trim().toLowerCase() === 'dhaka';
  const legacyCost = dhaka ? (settings?.insideDhakaRate ?? 60) : (settings?.outsideDhakaRate ?? 120);
  
  return { cost: legacyCost, codAvailable: true, zoneName: dhaka ? 'Inside Dhaka (Legacy)' : 'Outside Dhaka (Legacy)' };
};

module.exports = {getShippingCost};
