import { Component, OnInit } from '@angular/core';
import {io} from 'socket.io-client'
const SE = 'localhost:9090';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {
  socket:any;
  message?:string;
  constructor() { }

  ngOnInit(): void {
    this.socketConnection()
  }

  socketConnection(){
    this.socket = io(SE);
   this.socket.on('message-broadcast', (data: string) => {
   if (data) {
    const element = document.createElement('li');
    element.innerHTML = data;
    element.style.background = 'white';
    element.style.padding =  '15px 30px';
    element.style.margin = '10px';
    //document.getElementById('message-list').appendChild(element);
    }
  });
 }
 SendMessage() {
  this.socket.emit('message', this.message);
  const element = document.createElement('li');
 // element.innerHTML = this.message;
  element.style.background = 'white';
  element.style.padding =  '15px 30px';
  element.style.margin = '10px';
  element.style.textAlign = 'right';
  //document.getElementById('message-list').appendChild(element);
  this.message = '';
}

}
