const Address = require('../models/Address');
const listAddresses = async (req, res, next) => { try { const data = await Address.find({user: req.user._id}).sort({isDefault: -1, createdAt: -1}).lean(); return res.json({success: true, data}); } catch (error) { return next(error); } };
const createAddress = async (req, res, next) => { try { const data = await Address.create({...req.body, user: req.user._id}); return res.status(201).json({success: true, data}); } catch (error) { return next(error); } };
module.exports = {listAddresses, createAddress};
