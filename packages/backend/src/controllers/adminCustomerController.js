const mongoose = require('mongoose'); const Category = require('../models/Category'); const Product = require('../models/Product'); const User = require('../models/User'); const Order = require('../models/Order'); const Address = require('../models/Address'); const { AppError } = require('../middlewares/errorHandler'); const { clearCatalogCache } = require('../config/redis');
const slugify = (v) => String(v).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const listCategories = async (req,res,next)=>{try{return res.json({success:true,data:await Category.find().populate('parent','name slug').sort({sortOrder:1,name:1}).lean()})}catch(e){return next(e)}};
const createCategory = async(req,res,next)=>{try{if(!req.body.name)return next(new AppError('Category name is required.',400,'INVALID_CATEGORY'));const category=await Category.create({name:req.body.name,slug:slugify(req.body.slug||req.body.name),description:req.body.description,image:req.body.image,parent:req.body.parent||null,isActive:req.body.isActive!==false,sortOrder:Number(req.body.sortOrder)||0});await clearCatalogCache();return res.status(201).json({success:true,data:category})}catch(e){if(e.code===11000)return next(new AppError('Category slug already exists.',409,'DUPLICATE_CATEGORY'));return next(e)}};
const updateCategory = async(req,res,next)=>{try{if(!mongoose.isValidObjectId(req.params.id))return next(new AppError('Category not found.',404,'CATEGORY_NOT_FOUND'));const data={...req.body};if(data.name&&!data.slug)data.slug=slugify(data.name);const category=await Category.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});if(!category)return next(new AppError('Category not found.',404,'CATEGORY_NOT_FOUND'));await clearCatalogCache();return res.json({success:true,data:category})}catch(e){if(e.code===11000)return next(new AppError('Category slug already exists.',409,'DUPLICATE_CATEGORY'));return next(e)}};
const deleteCategory = async(req,res,next)=>{try{if(await Product.exists({category:req.params.id,status:{$ne:'archived'}}))return next(new AppError('Category has active products and cannot be deleted.',409,'CATEGORY_IN_USE'));const category=await Category.findByIdAndUpdate(req.params.id,{isActive:false},{new:true});if(!category)return next(new AppError('Category not found.',404,'CATEGORY_NOT_FOUND'));await clearCatalogCache();return res.json({success:true,data:{id:category._id,isActive:false}})}catch(e){return next(e)}};
const listCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const sortKey = String(req.query.sort || 'createdAt');
    const sortOrder = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const sortFields = new Set(['name', 'email', 'totalOrders', 'totalSpend', 'createdAt', 'isActive']);
    const sortField = sortFields.has(sortKey) ? sortKey : 'createdAt';
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = escapedSearch ? new RegExp(escapedSearch, 'i') : null;
    const match = { role: 'customer' };
    if (searchRegex) {
      match.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const result = await User.aggregate([
      { $match: match },
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          isActive: 1,
          isEmailVerified: 1,
          createdAt: 1,
          name: { $trim: { input: { $concat: ['$firstName', ' ', '$lastName'] } } },
          totalOrders: { $size: '$orders' },
          totalSpend: {
            $sum: {
              $map: {
                input: { $filter: { input: '$orders', as: 'order', cond: { $eq: ['$$order.paymentStatus', 'paid'] } } },
                as: 'order',
                in: { $ifNull: ['$$order.totalAmount', { $ifNull: ['$$order.total', 0] }] },
              },
            },
          },
        },
      },
      { $sort: { [sortField]: sortOrder, _id: -1 } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          metadata: [{ $count: 'total' }],
        },
      },
    ]);
    const data = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;
    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) {
    return next(e);
  }
};
const getCustomer = async(req,res,next)=>{try{if(!mongoose.isValidObjectId(req.params.id))return next(new AppError('Customer not found.',404,'CUSTOMER_NOT_FOUND'));const user=await User.findOne({_id:req.params.id,role:'customer'}).select('firstName lastName email phone isActive isEmailVerified createdAt').lean();if(!user)return next(new AppError('Customer not found.',404,'CUSTOMER_NOT_FOUND'));const [addresses,orders]=await Promise.all([Address.find({user:user._id}).lean(),Order.find({user:user._id}).sort({createdAt:-1}).lean()]);return res.json({success:true,data:{...user,name:`${user.firstName} ${user.lastName}`.trim(),addresses,orders}})}catch(e){return next(e)}};
const updateCustomerStatus=async(req,res,next)=>{try{const user=await User.findOneAndUpdate({_id:req.params.id,role:'customer'},{isActive:Boolean(req.body.isActive)},{new:true}).select('firstName lastName email isActive');if(!user)return next(new AppError('Customer not found.',404,'CUSTOMER_NOT_FOUND'));return res.json({success:true,data:user})}catch(e){return next(e)}};
module.exports={listCategories,createCategory,updateCategory,deleteCategory,listCustomers,getCustomer,updateCustomerStatus};
