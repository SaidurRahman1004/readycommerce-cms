const mongoose = require('mongoose');
const storeSettingsSchema = new mongoose.Schema({ key:{type:String,unique:true,default:'store'}, storeName:{type:String,trim:true,default:'ReadyCommerce'}, contactEmail:{type:String,trim:true,lowercase:true,default:''}, supportPhone:{type:String,trim:true,default:''}, currency:{type:String,enum:['BDT','USD'],default:'BDT'}, insideDhakaRate:{type:Number,min:0,default:60}, outsideDhakaRate:{type:Number,min:0,default:120} },{timestamps:true});
module.exports=mongoose.models.StoreSettings||mongoose.model('StoreSettings',storeSettingsSchema);
