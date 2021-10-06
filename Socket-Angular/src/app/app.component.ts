import { Component } from '@angular/core';
import { SocketioService } from './socketio.service';
import { FormBuilder } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'socketjs';
  CHAT_ROOM = "";
  messages:any[] = [];

  messageForm = this.formBuilder.group({
    message:'',
    reciever:'',
  })

  tokenForm = this.formBuilder.group({
    userId:'',
    userName:'',
    i:'',
  })

  constructor(private socService:SocketioService, private formBuilder:FormBuilder){}
  ngOnInit(){
    // let tempArray = localStorage.getItem("msgs")
    // if(tempArray){
    //   this.messages = JSON.parse(tempArray)
    // }
    
  }

  subUser(){
    let userId = this.tokenForm.get("userId")?.value;
    let userName = this.tokenForm.get("userName")?.value;
    let i = this.tokenForm.get("i")?.value;
    if(userId && userName && i){
      this.socService.setSocketConncetion(userId, userName,i);
      this.socService.subscribeToMessages((err:any, data:any) => {
        console.log("NEW MESSAGE ", data);
        this.messages = [...this.messages, data];
       // localStorage.setItem("msgs",JSON.stringify(this.messages))
      });
    }
  }

  submitMessage() {
    this.CHAT_ROOM = this.messageForm.get('reciever')?.value
    if(!this.CHAT_ROOM){
      this.CHAT_ROOM = "room"
    }
    let message = this.messageForm.get('message')?.value;
    if (message) {
      this.socService.sendMessage({message, roomName: this.CHAT_ROOM}, (cb:any) => {
        console.log("ACKNOWLEDGEMENT ", cb);
      }); 
      let SENDER = {
        id:this.tokenForm.get("userId")?.value,
        name:this.tokenForm.get("userName")?.value,
      };
      this.messages = [
        ...this.messages,
        {
          message,
          ...SENDER,
        },
      ];
      // clear the input after the message is sent
      this.messageForm.reset();
    }
  }

  ngOnDestroy(){
      this.socService.disconnect()
  }
}
