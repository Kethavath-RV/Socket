const mongoose =  require('mongoose')


let MessageNotSentSchema = new mongoose.Schema({
    messageId:String,
    roomId:String,
    senderId:String,
    message:String,
    time:Date
})

module.exports = mongoose.model('messageNotSent',MessageNotSentSchema)