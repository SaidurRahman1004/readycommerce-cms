const getShippingCost = (city = '') => city.trim().toLowerCase() === 'dhaka' ? 60 : 120;
module.exports = {getShippingCost};
