const SystemLog=require('../models/SystemLog');
const auditLogger=(req,res,next)=>{res.on('finish',()=>{if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&res.statusCode<400&&req.user&&!req.path.endsWith('/access')){const parts=req.path.split('/').filter(Boolean);SystemLog.create({action:`${req.method} ${req.path}`,admin:req.user._id,targetModule:parts[1]||'admin',targetId:parts[2],metadata:{statusCode:res.statusCode}}).catch(()=>{});}});next();};
module.exports=auditLogger;
