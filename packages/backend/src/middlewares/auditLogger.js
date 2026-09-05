const SystemLog = require('../models/SystemLog');

const auditLogger = (req, res, next) => {
  res.on('finish', () => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || res.statusCode >= 400 || !req.user) return;

    const routePath = req.originalUrl
      .split('?')[0]
      .replace(/^\/api\/admin\/?/, '');
    const parts = routePath.split('/').filter(Boolean);
    SystemLog.create({
      action: `${req.method} /${routePath}`,
      admin: req.user._id,
      targetModule: parts[0] || 'admin',
      targetId: parts[1],
      metadata: {
        statusCode: res.statusCode,
        administratorRole: req.user.role,
      },
    }).catch((error) => console.error(`Audit log persistence failed: ${error.message}`));
  });
  next();
};

module.exports = auditLogger;
