import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DynamoDb } from './aws-clients/dynamodb';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpService: HttpClient) { }
    
  async login(username:string, password:string, ddb: DynamoDb): Promise<string | undefined> {
    console.log("Starting Login")
    var scoutId: string | undefined;
    await ddb.findIdQuery(username, password).then(
      (item) => {
        if(item != undefined) scoutId = item["pk"].S
        console.log("scoutId", scoutId)
      }
    )
    return scoutId
  } 

  public setSession( scoutName: string, scoutId: string, scoutPass: string) {
      localStorage.setItem('scout_name', scoutName);
      localStorage.setItem('scout_id', scoutId);
      localStorage.setItem('scout_pass', scoutPass);
  }

  public logout() {
      localStorage.removeItem("scout_id");
      localStorage.removeItem("scout_name");
      localStorage.removeItem("scout_pass");
  }

  public isLoggedIn() {
    return (localStorage.getItem("scout_id") != null)
  }

  isLoggedOut() {
      return !this.isLoggedIn();
  }

  getScoutId() {
    var scoutid = localStorage.getItem("scout_id");
    if (scoutid != null){
      return scoutid;
    }
    else{
      return "";
    }
  } 

  getScoutName() {
    var scoutName = localStorage.getItem("scout_name");
    if (scoutName != null){
      return scoutName;
    }
    else{
      return "";
    }
  } 

  getScoutPass() {
    var scoutPass = localStorage.getItem("scout_pass");
    if (scoutPass != null){
      return scoutPass;
    }
    else{
      return "";
    }
  } 
}
