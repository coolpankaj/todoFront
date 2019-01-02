import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppService } from './../../app.service';
import { TodoService } from './../../todo.service';
import { Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { SocketService } from "./../../socket.service";
import { CookieService } from 'ngx-cookie-service';
import { FormBuilder, Validators } from '@angular/forms';
import * as $ from 'jquery';

@Component({
  selector: 'app-multi-user',
  templateUrl: './multi-user.component.html',
  styleUrls: ['./multi-user.component.css']
})
export class MultiUserComponent implements OnInit, OnDestroy {
  public userId: string;
  public userName: string;
  public userInfo: any;
  public authToken: string;
  public userDetails: any;
  public cookieFriends:any;
  public userFriendsTemp: any = []
  public userFriends: any = []
  public hidden: boolean;
  public selectedListId;
  public selectedList;
  public allLists = [];
  public allItems = [];
  public selectedListDetail: any;
  public itemName: any;
  public currentItemDetail;
  public addSubItemName;
   

  constructor(public fb: FormBuilder, public appService: AppService, public router: Router, public toastr: ToastrManager, public socketService: SocketService, public cookie: CookieService, public todoService: TodoService) { }

  ngOnInit() {
    this.authToken = this.cookie.get('authToken');
    this.userId = this.cookie.get('userId');
    this.userName = this.cookie.get('userName');
    this.userInfo = this.appService.getUserInfoFromLocalStorage()

    this.verifyUserConfirmation()
   // this.getAllListFunction()

    $(document).ready(function () {
      $('#createListForm').hide()
    });
    let KeyPress = (e) => {
      var evtobj = window.event? event : e
      if (evtobj.keyCode == 90 && evtobj.ctrlKey)  this.fetchHistory()    ;
}

     document.onkeydown = KeyPress;

    this.userInfo = this.appService.getUserInfoFromLocalStorage()
    
    this.userFriendsTemp.push(this.userId) // add all friends and user to variable to get their public lists

    for (let x of this.userInfo.friends) {
      this.userFriendsTemp.push(x.friendId)
      this.userFriends.push(x.friendId) // array of friends to notify about changes of todo
    }

    //// console.log(this.userFriendsTemp)
   // this.verifyUserConfirmation()

    this.getUpdatesFromUser()
    
    this.getAllPublicListFunction(this.userFriendsTemp)

  }

  ngOnDestroy() {
    this.socketService.exitSocket()
  }

  public fetchHistory = () => {
    let data = {
      listId: this.selectedListId,
      authToken: this.authToken
    }
    // console.log('fetch history ',data)
    this.todoService.getHistory(data).subscribe(apiResponse => {
      // console.log(apiResponse)
    })
  }

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

  createListForm = this.fb.group({
    listName: [null, Validators.required],
    listType: ['private', Validators.required]
  })

  addItemForm = this.fb.group({
    itemName: [null, Validators.required]
  })

  showForm() {
    $('#createListForm').slideToggle()
  }


  hideme() {
    // $('.left-box').slideToggle(500,"swing");
    // $('.my-box').animate( {  width: "toggle" }, 500)
    this.hidden = true;
    $('.my-box').fadeToggle(1000)
  }

  showme() {
    this.hidden = false;
    $('.my-box').fadeToggle(1000)

  }



  eventHandler($event: any) {
    if ($event.keycode == 13) {
      this.onSubmit()
    }
  }
  itemNameEvent($event: any) {
    if ($event.keycode == 13) {
      this.addItem()
    }
  }





  onSubmit() {
   // // console.log('create new list called')
   delete this.selectedListId
   delete this.selectedList
    let data = {
      listName: this.createListForm.value.listName,
      listCreatorId: this.userId,
      listCreatorName: this.userName,
      listModifierId: this.userId,
      listModifierName: this.userName,
      listMode: this.createListForm.value.listType,
      authToken: this.authToken

    }
   // // console.log(data)
    this.todoService.createNewList(data).subscribe(apiResponse => {
      if (apiResponse.status === 200) {
        this.toastr.successToastr("List Created")
        this.createListForm.reset()
        this.showForm()
        this.getAllListFunction()
      } else {
        this.toastr.errorToastr(apiResponse.message)
        this.createListForm.reset()
        this.showForm()

      }
    }, (error) => {
      this.toastr.errorToastr(error)

    })
  }
  public getAllListFunction = () => {
    //this function will get all the lists of User. 
    this.allLists = []
    if (this.userId && this.authToken) {
      let data = {
        userId: this.userId,
        authToken: this.authToken
      }
      this.todoService.getAllList(data).subscribe((apiResponse) => {
       // // console.log(apiResponse)
       // this.allLists = [];
        if (apiResponse.status === 200) {
          this.allLists = apiResponse.data;
          this.allLists.reverse()
         // console.log(this.allLists)
        }
        else {
          this.toastr.infoToastr(apiResponse.message, "Update!");
          this.allLists.length = 0;
        }
      },
        (error) => {
          if (error.status == 400) {
            this.toastr.warningToastr("Lists Failed to Update", "Either user or List not found");
            this.allLists.length = 0;
          }
          else {
            this.toastr.errorToastr("Some Error Occurred", "Error!");
            this.router.navigate(['/serverError']);

          }
        }//end error
      );

    }//end if checking undefined
    else {
      this.toastr.infoToastr("Missing Authorization Key", "Please login again");
      //this.router.navigate(['/user/login']);

    }

  }//end getAllListFunction

  public deleteList() {
    let data = {
      listId: this.selectedListId,
      authToken: this.authToken
    }
    this.todoService.deleteList(data).subscribe(apiResponse => {
      if(apiResponse.status === 200) {
        this.toastr.successToastr('list deleted')
        delete this.selectedList
        delete this.selectedListId
        this.getAllListFunction()
      } else {
        this.toastr.errorToastr(apiResponse.message)
        
      }
    }, error => {
      this.toastr.errorToastr(error.message)
      this.router.navigate(['/server-error'])
    })
  }

  getUpdatesFromContainer(data) {

    let dataForNotify = {
      message: data.message,
      userId: this.userFriends,
      listId:data.listId
    }

    this.notifyUpdatesToUser(dataForNotify);
  }
  public getAllPublicListFunction = (userIds) => {
    //this function will get all the public lists of User. 
    this.allLists = []
    if (this.authToken != null) {
      this.todoService.getAllSharedList(userIds, this.authToken).subscribe((apiResponse) => {
        if (apiResponse.status == 200) {

          //// console.log(apiResponse.data)

          for (let apiItem of apiResponse.data) {
            this.allLists.push(apiItem)
          }


        }
        else {
          this.toastr.infoToastr(apiResponse.message, "Update!");
          this.allLists.length = 0;

        }
      },
        (error) => {
          if (error.status == 400) {
            this.toastr.warningToastr("Lists Failed to Update", "Either user or List not found");
            this.allLists.length = 0;
          }
          else {
            this.toastr.errorToastr("Some Error Occurred", "Error!");
            this.router.navigate(['/serverError']);

          }
        }//end error
      );//end appservice.getAllLists

    }//end if checking undefined
    else {
      this.toastr.infoToastr("Missing Authorization Key", "Please login again");
      this.router.navigate(['/login']);

    }

  }//end getAllPublicListFunction

  public updateList= (listMode) => {
    // console.log('updatelist called', listMode)
  
    let data = {
      listId: this.selectedListDetail.listId,
      listName : this.selectedListDetail.listName,
      listModifierId: this.userId,
      listModifierName: this.userName,
      listMode: listMode,
      authToken: this.authToken
    }
    if(listMode == 'private') {
      delete this.selectedListId
      delete this.selectedList
      this.allLists.length = 0
     
    // window.location.reload();
     // this.allLists = null
     // this.getAllListFunction()
    }
    this.todoService.updateList(data).subscribe(apiResponse => {
      if(apiResponse.status === 200) {
        this.getListDetails(this.selectedListId)
        this.toastr.successToastr('list updated')
        this.getAllPublicListFunction(this.userFriendsTemp)
      } else {
        this.toastr.errorToastr(apiResponse.message)
      }
    }, error => {
      this.toastr.errorToastr(error.message)
    })
  
  }
    

  public getListItems = (listId, listName) => {
    //  // console.log('fetching current list items', listId)
    this.getListDetails(listId)
      this.selectedListId = listId
      this.selectedList = listName
      let data = {
        listId: listId,
        authToken: this.authToken
      }
      this.todoService.getListItem(data).subscribe(apiResponse => {
      //  // console.log(apiResponse)
        this.allItems = []
        if (apiResponse.status === 200) {
  
          this.allItems = apiResponse.data
          this.allItems.reverse()
          //// console.log('allItems', this.allItems)
          /* if(apiResponse.subItems) {
            this.subItems = apiResponse.subItems
          }
          // console.log('subItems', this.subItems) */
  
          // console.log(this.allItems)
          this.toastr.infoToastr('list details fetched')
          
        } else {
          this.toastr.errorToastr(apiResponse.message)
        }
      }, (error) => {
        this.toastr.errorToastr(error.message, 'Error')
      })
    }
    public getListDetails = (listId) => {
      // console.log('getlistDetails called', listId)
  
      let data = {
        listId: listId,
        authToken: this.authToken
      }
      this.todoService.getListDetail(data).subscribe(apiResponse => {
        this.selectedListDetail = '';
       // // console.log('list detail',apiResponse)
        if (apiResponse.status === 200) {
          this.selectedListDetail = apiResponse.data
          this.toastr.successToastr('List details fetched') 
          // console.log(this.selectedListDetail)       
        } else  {
          this.toastr.errorToastr(apiResponse.message, 'Error')
        }
      }, (error) => {
        this.toastr.errorToastr(error.message, 'Error')
      })
    }  
    public deleteItem(itemId) {
      // console.log('delete Item called', itemId)
      let data = {
        authToken: this.authToken,
        itemId: this.currentItemDetail.itemId
      }
      // console.log(data)
      this.todoService.deleteItemId(data).subscribe(apiResponse => {
        if(apiResponse.status === 200) {
          this.toastr.successToastr('item deleted')
          //this.getAllListFunction()
          this.getListItems(this.selectedListId, this.selectedList)
          this.pushToHistory(itemId)
        } else {
          this.toastr.errorToastr(apiResponse.message)
        }
      }, error => {
        this.toastr.errorToastr(error.message);
        
      })
    }
    public pushToHistory = (itemId) => {
      // console.log('addhistory called')
       let data = {
         listId: this.selectedListId,
         key: 'details updated',
         itemId: itemId,      
         authToken: this.authToken
       }
       // console.log('addhistory called',data)
       this.todoService.addHistory(data).subscribe(apiResponse => {
         // console.log(apiResponse)
         // console.log('addhistory resposne')
       })
     }

    public itemDone = (itemId) => {
      // // console.log('item done called', itemId)
   
       let data = {
         authToken: this.authToken,
         itemId: itemId,
         itemDone: 'yes'
       }
   
       this.todoService.itemDone(data).subscribe(apiResponse => {
      //   // console.log(apiResponse)
         if (apiResponse.status === 200) {
           this.getListItems(this.selectedListId, this.selectedList)
           this.toastr.successToastr('item Done')
         } else {
           this.toastr.errorToastr(apiResponse.message)
         }
       }, (error) => {
         this.toastr.errorToastr(error.message)
       })
     }
   
     itemNotDone = (itemId) => {
     //  // console.log('item notdone called', itemId)
   
       let data = {
         authToken: this.authToken,
         itemId: itemId,
         itemDone: 'no'
       }
   
       this.todoService.itemNotDone(data).subscribe(apiResponse => {
       //  // console.log(apiResponse)
         if (apiResponse.status === 200) {
           this.getListItems(this.selectedListId, this.selectedList)
           this.toastr.successToastr('item not Done')
         } else {
           this.toastr.errorToastr(apiResponse.message)
         }
       }, (error) => {
         this.toastr.errorToastr(error.message)
       })
     }

     public addItem = () => {
      // // console.log('addItem called', this.itemName)
   
       let data = {
         listId: this.selectedListId,
         itemName: this.itemName,
         itemCreatorId: this.userId,
         itemCreatorName: this.userName,
         itemModifierId: this.userId,
         itemModifierName: this.userName,
         authToken: this.authToken
       }
   
       this.todoService.addItem(data).subscribe(apiResponse => {
        // // console.log(apiResponse)
         if (apiResponse.status === 200) {
           this.toastr.successToastr('Item added')
           this.getListItems(this.selectedListId, this.selectedList)
           this.allItems = []
           this.allItems = apiResponse.data;
         //  // console.log(this.allItems)
           delete this.itemName
         } else {
           this.toastr.errorToastr(apiResponse.message, 'Error')
         }
       }, (error) => {
         this.toastr.errorToastr(error.message)
       })
   
     }

     public addSubItemFunction() {
      //   // console.log('addSubItem called')
     
         let data = {
           authToken: this.authToken,
           itemId: this.currentItemDetail.itemId,
           subItemName: this.addSubItemName,
           subItemCreatorId: this.userId,
           subItemCreatorName: this.userName,
           subItemModifierId: this.userId,
           subItemModifierName: this.userName
         }
     
         this.todoService.addSubItem(data).subscribe(apiResponse => {
        //   // console.log(apiResponse)
           if (apiResponse.status === 200) {
             this.toastr.successToastr('SubItem added')
             this.getListItems(this.selectedListId, this.selectedList)
             delete this.addSubItemName
           } else {
             this.toastr.errorToastr(apiResponse.message)
           }
         }, (error) => {
           this.toastr.errorToastr(error.message)
         })
       }
     

     public itemModal($event, itemId) {
      // console.log('list Click', itemId)
      let data = {
        itemId: itemId,
        authToken: this.authToken
      }
      this.todoService.getItemDetail(data).subscribe(apiResponse => {
        // console.log('item details after click', apiResponse)
        this.currentItemDetail = ""
        if(apiResponse.status === 200) {
          this.currentItemDetail = apiResponse.data
        } else {
          this.toastr.errorToastr(apiResponse.message)
        }
      }, error => {
        this.toastr.errorToastr('failed to fetch item details')
        this.router.navigate(['/server-error'])
      })
    }


  //* Sockets functions *//

  /* Listened Events */

  public getUpdatesFromUser = () => {

    this.socketService.getUpdatesFromUser(this.userId).subscribe((data) => {
      //getting message from user.
      this.toastr.infoToastr(data.message);
      //// console.log(data)

      if(!data.listId)
        this.getAllPublicListFunction(this.userFriendsTemp)

    });
  }//end getUpdatesFromUser


    //listened
    public verifyUserConfirmation: any = () => {
      this.socketService.verifyUser()
        .subscribe(() => {
          this.socketService.setUser(this.authToken);//in reply to verify user emitting set-user event with authToken as parameter.
        },
        (err) => {
          this.toastr.errorToastr(err,"Some error occured");
        });//end subscribe
    }//end verifyUserConfirmation
  
  //emitted 

  public notifyUpdatesToUser: any = (data) => {
    //data will be object with message and userId(recieverId)
    this.socketService.notifyUpdates(data);
    //// console.log(data)

    if(!data.listId)
      this.getAllPublicListFunction(this.userFriendsTemp)

  }//end notifyUpdatesToUser

}
