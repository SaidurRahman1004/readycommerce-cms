const PaymentSetting = require('../models/PaymentSetting');

/**
 * @desc    Get all payment settings for the current tenant
 * @route   GET /api/admin/payments/settings
 * @access  Private/Admin
 */
exports.getPaymentSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || null; // Adjust based on auth middleware
    const settings = await PaymentSetting.find({ tenantId }).sort({ sortOrder: 1 });
    
    // Mask credentials before sending to frontend
    const safeSettings = settings.map(setting => {
      const obj = setting.toObject();
      const hasCredentials = !!obj.credentials;
      // Do not expose encrypted string to frontend either
      delete obj.credentials;
      obj.isConfigured = hasCredentials;
      return obj;
    });

    res.json({ success: true, data: safeSettings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment settings', error: error.message });
  }
};

/**
 * @desc    Update or create a payment setting
 * @route   PUT /api/admin/payments/settings/:provider
 * @access  Private/Admin
 */
exports.updatePaymentSetting = async (req, res) => {
  try {
    const { provider } = req.params;
    const tenantId = req.user.tenantId || null;
    const { 
      name, type, enabled, mode, credentials, 
      manualDetails, codDetails, restrictions, logo, sortOrder 
    } = req.body;

    let setting = await PaymentSetting.findOne({ tenantId, provider });

    if (!setting) {
      setting = new PaymentSetting({ tenantId, provider });
    }

    if (name !== undefined) setting.name = name;
    if (type !== undefined) setting.type = type;
    if (enabled !== undefined) setting.enabled = enabled;
    if (mode !== undefined) setting.mode = mode;
    
    // If frontend sends new credentials, update them. 
    // Mongoose pre-save hook will encrypt this string.
    if (credentials) {
      // Expecting a JSON string of keys
      setting.credentials = typeof credentials === 'string' ? credentials : JSON.stringify(credentials);
    }
    
    if (manualDetails !== undefined) setting.manualDetails = manualDetails;
    if (codDetails !== undefined) setting.codDetails = codDetails;
    if (restrictions !== undefined) setting.restrictions = restrictions;
    if (logo !== undefined) setting.logo = logo;
    if (sortOrder !== undefined) setting.sortOrder = sortOrder;

    await setting.save();

    // Return safe version
    const safeObj = setting.toObject();
    delete safeObj.credentials;
    safeObj.isConfigured = !!setting.credentials;

    res.json({ message: 'Payment setting updated', data: safeObj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment setting', error: error.message });
  }
};

/**
 * @desc    Test connection with the provider using provided credentials
 * @route   POST /api/admin/payments/settings/:provider/test
 * @access  Private/Admin
 */
exports.testPaymentConnection = async (req, res) => {
  // const { provider } = req.params;
  // const tenantId = req.user.tenantId || null;
  // TODO: Implement actual ping to provider using decrypted credentials
  res.json({ message: 'Connection successful (Mocked)' });
};
