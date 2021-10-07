const app = require('express')();
const http = require('http').createServer(app);
var serverClient = require('socket.io-client');
const redis = require('redis');
const client = redis.createClient()

require("dotenv").config();

var port = process.env.PORT;
var host = "localhost";

const io = require("socket.io")(http, {
	cors: {
		origins: [
			"http://localhost:4200"
		],
    credentials: true
	},
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to Collab</h1>');
});

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

io.on('connection',async (socket) => {
  console.log('a user connected');
  client.hmset('socketHash',socket.user.userId,socket.id,(err,res)=>{
    if(!err){
      console.log("stored")
    }
  })

  const server = {
    host:host,
    port:port
  }

  client.hmset('serverHash',socket.id,JSON.stringify(server),(err,res)=>{
    if(!err){
      console.log("stored")
    }
  })

  socket.join('room');


  socket.on('disconnect', () => {
    console.log('user disconnected');
  })


  socket.on('join', (roomName) => {
    console.log('join: ' + roomName);
    socket.join(roomName);
  });


  socket.on('message',({message,recieverSocketId, SenderId, SenderName},callback)=>{
    console.log("message", message)
    console.log("Rsocketid", recieverSocketId)
    const outgoingMessage = {
      name:SenderName,
      id:SenderId,
      message,
    };
    socket.broadcast.to(recieverSocketId).emit('message',outgoingMessage); 
    
  })




  socket.on('message1',({message, roomName}, callback) => {
    console.log('message1: ' + message + ' in ' + roomName);

    // generate data to send to receivers
    const outgoingMessage = {
      name:socket.user.userName,
      id: socket.user.userId,
      message,
    };
    console.log("sender is ", outgoingMessage) 
    var socketId;


    client.hmget('socketHash',roomName,(err,res)=>{
      if(!err){
        socketId = res[0]
        let recieverSocketId = res[0]
        console.log("socket id is ", socketId)

         client.hmget('serverHash',socketId,(err2,res2)=>{
           const socketServer = JSON.parse(res2)
          console.log("map2 result is ",socketServer )
          let url = "http://localhost"+":"+socketServer.port
          console.log(url)
          console.log("length is ",(socketServer.port).length)
          //socket2 = serverClient.connect(url,{ reconnect: true})
          if(port == socketServer.port){

            socket.broadcast.to(recieverSocketId).emit('message',outgoingMessage);

          }else{

            const usr = {
              userId:12345,
              userName:"temp"
            }

            let SenderId = socket.user.userId
            let SenderName = socket.user.userName
  
            socket2 = serverClient(url, {
              auth: {
                user: usr 
              }
            });
            console.log("connected")
            
            socket2.emit("message",{message,recieverSocketId,SenderId,SenderName})

          }
        })
      }
    })

    socket.broadcast.to(socketId).emit('message',outgoingMessage); 
        callback({
            status:'ok'
        });
     
    // send socket to all in room except sender
    // socket.to(roomName).emit("message", outgoingMessage);
    // callback({
    //   status: "ok"
    // });

  })
});

http.listen(port, host, () => {
  console.log("server running on ")
  console.log(`${port} ${host}` );
});