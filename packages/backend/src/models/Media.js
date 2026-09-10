const mongoose=require('mongoose');
const mediaSchema=new mongoose.Schema({
  filename:{type:String,required:true,unique:true},
  url:{type:String,required:true},
  size:{type:Number,required:true,min:1},
  mimetype:{type:String,enum:['image/jpeg','image/png','image/webp'],required:true},
  width:{type:Number,required:false},
  height:{type:Number,required:false},
  altText:{type:String,required:false},
  uploadedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true}
},{timestamps:true});
mediaSchema.index({createdAt:-1});
module.exports=mongoose.models.Media||mongoose.model('Media',mediaSchema);
