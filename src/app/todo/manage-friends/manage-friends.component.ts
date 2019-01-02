import { Component, OnInit } from '@angular/core';
import { ToastrManager } from 'ng6-toastr-notifications';
import { SocketService } from "./../../socket.service";
import { CookieService } from 'ngx-cookie-service';
import { AppService } from "./../../app.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-manage-friends',
  templateUrl: './manage-friends.component.html',
  styleUrls: ['./manage-friends.component.css'],
  providers: [SocketService]
})
export class ManageFriendsComponent implements OnInit {
  public authToken;
  public userName;
  public userId;
  public allUsers = [];
  public allFriends = [];
  public myDetail = [];
  public myFriends = [];
  public friendRequestRecieved = [];
  public friendRequestSent = [];

  constructor(public router: Router, public toastr: ToastrManager, public socketService: SocketService, public Cookie: CookieService, public appService: AppService) { }

  ngOnInit() {
    this.authToken = this.Cookie.get('authToken');
    this.userName= this.Cookie.get('userName')
    this.userId = this.Cookie.get('userId')
    this.verifyUserConfirmation()
    
   // this.getAllRequestSent()
    this.getMyDetail()
     this.getAllUserDetail()
    // console.log(this.userId)
    // console.log(this.authToken)

  }

  public verifyUserConfirmation: any = () => {
    this.socketService.verifyUser()
      .subscribe(() => {
        this.socketService.setUser(this.authToken);//in reply to verify user emitting set-user event with authToken as parameter.
      },
        (err) => {
          this.toastr.errorToastr(err, "Some error occured");
        });//end subscribe
  }//end verifyUserConfirmation

  public logOut() {
    this.appService.logout(this.userId,this.authToken).subscribe(apiResponse => {
      if(apiResponse.status === 200) {
        this.toastr.successToastr('logged out successfull')
        this.router.navigate(['/login'])
      } else {
        this.toastr.errorToastr(apiResponse.message)
      }
    }, error => {
      this.toastr.errorToastr(error.message);
      
    })
    
  }


  public getAllUserDetail() {
  this.appService.getAllUsers(this.authToken).subscribe(apiResponse => {
    
    this.allUsers = apiResponse.data
    //this.allUsers.shift()
 /*    for(let friend of this.allUsers) {
      for(let requestSentFriend  of this.friendRequestSent) {
        if(friend.userId !== requestSentFriend.friendId) {
          //return true
          this.allFriends.push(friend)
        } 
      }
    } */
    // console.log(this.allUsers)
    // console.log('allfriends', this.allFriends)
  })

}

public getMyDetail() {
  this.appService.getUserDetails(this.userId, this.authToken).subscribe(apiResponse => {
    if(apiResponse.status === 200) {
      this.myDetail = apiResponse.data
      this.myFriends = apiResponse.data.friends
      this.friendRequestRecieved = apiResponse.data.friendRequestRecieved;
      this.friendRequestSent = apiResponse.data.friendRequestSent
      // this.getAllUserDetail()
      // console.log(this.myDetail)
      // console.log(this.myFriends)
    } else {
      this.toastr.errorToastr(apiResponse.message)
    }
  }, error => {
    this.toastr.errorToastr(error.message)
  })
}

public addFriend(userId, userName) {
  // // console.log('add friend called', userId)
  let data = {
    senderId: this.userId,
    senderName: this.userName,
    recieverId: userId,
    recieverName: userName,
    authToken: this.authToken
  }
  // console.log(data)
  this.appService.sendFriendRequest(data).subscribe(apiResponse => {
    // console.log(apiResponse)
    if(apiResponse.status === 200) {
      this.toastr.successToastr('Friend request sent')
      this.getAllUserDetail()
     // this.getAllRequestSent()
     this.getMyDetail()
    } else {
      this.toastr.errorToastr(apiResponse.message)
    }
  }, error => {
    this.toastr.errorToastr(error.messsage)
  })
}

/* public getAllRequestSent() {
    let data = {
      authToken: this.authToken,
      userId: this.authToken
    }
    this.appService.getAllRequestSent(data).subscribe(apiResponse => {
      if(apiResponse.status === 200) {
            this.friendRequestSent = apiResponse.data
            this.getMyDetail()
      } else {
        this.toastr.errorToastr(apiResponse.message)
      }
    }, error => {
      this.toastr.errorToastr(error.message)
    })
} */






public cancelFriendRequest(userId, userName) {
  let data = {
    senderId: this.userId,
    senderName: this.userName,
    recieverId: userId,
    recieverName: userName,
    authToken: this.authToken
  }

  this.appService.cancelFriendRequest(data).subscribe(apiResponse => {
    // console.log(apiResponse)
    if(apiResponse.status === 200) {
      this.toastr.successToastr('friend request cancel')
      this.getMyDetail()
      this.getAllUserDetail()
     
    } else  {
      this.toastr.errorToastr(apiResponse.message)
    }
  }, error => {
    this.toastr.errorToastr(error.message);    
  })
}

public rejectFriendRequest(userId, userName) {
  let data = {
    senderId: userId,
    senderName: userName,
    recieverId: this.userId,
    recieverName: this.userName,
    authToken: this.authToken
  }

  this.appService.rejectFriendRequest(data).subscribe(apiResponse => {
    // console.log(apiResponse)
    if(apiResponse.status === 200) {
      this.toastr.successToastr('friend request cancel')
      this.getMyDetail()
      this.getAllUserDetail()
     
    } else  {
      this.toastr.errorToastr(apiResponse.message)
    }
  }, error => {
    this.toastr.errorToastr(error.message);    
  })
}

public acceptFriendRequest(friendId, friendName) {
  let data = {
    senderId: friendId,
    senderName: friendName,
    recieverId: this.userId,
    recieverName: this.userName,
    authToken: this.authToken
  }

  this.appService.acceptFriendRequest(data).subscribe(apiResponse => {
    if(apiResponse.status === 200 ) {
      this.toastr.successToastr('friend request accepted')
      this.getMyDetail()
    } else {
      this.toastr.errorToastr(apiResponse.message)
    }
  }, error => {
    this.toastr.errorToastr(error.message)
  })
}


}
