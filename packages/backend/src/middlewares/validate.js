const { AppError } = require('./errorHandler');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(new AppError(error.details.map((detail) => detail.message).join(', '), 400, 'VALIDATION_ERROR'));
  }
  req[property] = value;
  return next();
};

module.exports = validate;
