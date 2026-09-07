const Notification=require('../models/Notification');
const createNotification=async(data)=>Notification.create({title:String(data.title||'Notification').slice(0,160),message:String(data.message||'').slice(0,500),type:['order','inventory','system'].includes(data.type)?data.type:'system',isRead:false,targetUrl:data.targetUrl?String(data.targetUrl).slice(0,300):undefined});
module.exports={createNotification};
