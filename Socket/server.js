const app = require('express')();
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const http = require('http').createServer(app);
var serverClient = require('socket.io-client');
const redis = require('redis'); 
const client = redis.createClient()
const cors = require('cors')

const UserMessageModel = require('./model/userMessage.model')
const MessageNotSentModel = require('./model/MessageNotSentYet.model')

require("dotenv").config();

var port = process.env.PORT;
var host = "localhost";

let url = "mongodb+srv://admin:admin@meanstack-cluster.wcizr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

app.use(bodyParser.json())
app.use(cors())

mongoose.connect(url).then(con=>{
  console.log("database connected successfully")
}).catch(err=>{
  console.log("error : ", err)
})
mongoose.connection;

const io = require("socket.io")(http, {
	cors: {
    credentials: true
	},
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to Collab</h1>');
});

//-----------------------------------------------------------
io.use( (socket, next) => {
  const user = socket.handshake.auth.user;
  try {
    console.log('user', user);
    //save the user data into socket object
    socket.user = user;
    next();
  } catch (e) {
    console.log('error', e.message);
    return next(new Error(e.message));
  }
});
//--------------------------------------------------------------

io.on('connection',async (socket) => {
  console.log('a user connected');

  client.hmset('userActiveStatus',socket.user.userId,"Active",(err,res)=>{
    if(!err){
      console.log("user status is active")

      client.hmset('socketHash',socket.user.userId,socket.id,(err1,res1)=>{
        if(!err1){
          console.log("user id along with socket id is stored")

          const server = {      //holds server address  (host and port)
            host:host,
            port:port
          }

          client.hmset('serverHash',socket.id,JSON.stringify(server),(err2,res2)=>{
            if(!err2){
              console.log("socket id along with server address is stored")
//****************** */
              MessageNotSentModel.find({roomId:socket.user.userId},(err3,doc)=>{
                console.log("results are ", doc);
                if(!err3) {   //receiver will receive all his messages whenever he is online
                  doc.forEach(record=>{
                    let sent = socket.emit('message',record)
                    console.log("sent",sent)
                    console.log("record",record)
                    if(sent){
                      MessageNotSentModel.deleteMany({messageId:record.messageId})
                    }
                  })
                }   
              })
            }
          })

        }
      })

    }
  }) 

  

//----------------------------------------------------------------------------

  socket.join('room');

//-----------------------------------------------------------------------------
  socket.on('disconnect', () => {
    client.hdel('socketHash',socket.user.userId,(err,res)=>{
      if(!err){
        console.log("user deleted from map1")
      }
    })
    client.hdel('socketHash',socket.id,(err,res)=>{
      if(!err){
        console.log("socketId is deleted from map2")
      }
    })
    client.hmset('socketHash',socket.user.userId,null,(err,res)=>{
      if(!err){
        console.log("user inactive Status is updated as he is disconnected")
      }
    })

    console.log('user disconnected');
  })



//----------------------------------------------------------------------------------------
  socket.on('join', (roomName) => {
    console.log('join: ' + roomName);
    socket.join(roomName);
  });

//--------------------------------------------------------------------------------------

  socket.on('message',({message,roomSocketId, roomName, SenderId},callback)=>{
    console.log("message", message)
    console.log("Roomsocketid", roomSocketId)
    const outgoingMessage = {
      senderId:SenderId,
      message:message,
    };

    //message sending to user if user is active 
    let check = socket.broadcast.to(roomSocketId).emit('message',outgoingMessage);
    if(check){
      console.log("Sent")
      let userMessage = new UserMessageModel({
        receiverId:roomName,
        senderId:SenderId,
        senderName:SenderName,
        message:message
      })
      userMessage.save()
      console.log("mongo stored message is : ",userMessage)

    } else{
      console.log("unable to sent")
    }
  })



///--------------------------------------------------------------------------------------


  socket.on('message1',({payload}, callback) => {
    //console.log('message1: ' + message + ' in ' + roomName);
    console.log("payload is ", payload)

    //message format that should be sent to the reciever
    const outgoingMessage = {
      id: socket.user.userId,
      message:message,
    };


    console.log("sender is ", outgoingMessage) 
    let SenderId = socket.user.userId
    var socketId;


    client.hmget('socketHash',roomName,(err,res)=>{
      if( res[0] !=null && !err ){
        console.log("sockethash result is ",typeof(res))
        socketId = res[0]
        let roomSocketId = res[0] 
        console.log("socket id is ", socketId)

        client.hmget('serverHash',socketId,(err1,res1)=>{
          const socketServer = JSON.parse(res1)
          let url = "http://"+socketServer.host+":"+socketServer.port
          console.log(url)

          if(port == socketServer.port){    // if receiver and sender are in same server then 

            let SentStatus = socket.broadcast.to(roomSocketId).emit('message',outgoingMessage);

            if(SentStatus){
              console.log("message sent",SentStatus)

              let userMessage = new UserMessageModel({
                messageId:mongoose.Types.ObjectId(),
                roomId:roomName,
                senderId:SenderId,
                message:message,
                time:Date.now()
              })

              console.log("mongo stored message is : ",userMessage)
              userMessage.save()

            }else {
              console.log("not sent error")
            }

          }else{

            const usr = {
              userId:12345,
              userName:"temp"
            }

            //create one client for that server to send messages to that server clients
            socket2 = serverClient(url, {
              auth: {
                user: usr 
              }
            });
            console.log("connected")
            socket2.emit("message",{message,roomSocketId,roomName,senderId})

          }
        })
      }else{
        console.log("user is inactive now it is stored in database ")
        let StoreNotSentMessages = new MessageNotSentModel({
          messageId:mongoose.Types.ObjectId(),
          roomId:roomName,
          senderId:SenderId,
          message:message,
          time:Date.now()
        })
        StoreNotSentMessages.save()
      }
    })

    
    // send socket to all in room except sender
    // socket.to(roomName).emit("message", outgoingMessage);
    // callback({
    //   status: "ok"
    // });

  })
});






app.post('/send',(req,res) => {
  payload = {
    message : req.body.message,
    senderId : req.body.sender,
    receiverId : req.body.reciever
  }
  console.log("req body ", req.body)
  console.log("pppaalloooad ",payload)
  const usr = {
    userId:00000,
    userName:"Mediator"
  }
  let url = "http://"+host+":"+port
  socketTemp = serverClient(url,{
    auth:{
      user:usr
    }
  });
  socketTemp.emit('message1', {payload})

  res.send("successfull")
})















http.listen(port, host, () => {
  console.log("server running on ")
  console.log(`${port} ${host}` );
});