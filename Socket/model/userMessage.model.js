const mongoose = require('mongoose')


let UserMessageSchema = new mongoose.Schema({
    messageId:mongoose.Schema.Types.ObjectId,
    roomId:String,
    senderId:String,
    message:String,
    time:Date
})

module.exports = mongoose.model('userMessage',UserMessageSchema)


