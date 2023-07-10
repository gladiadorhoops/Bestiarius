import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cognito } from './aws-clients/cognito';
import { DynamoDb } from './aws-clients/dynamodb';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpService: HttpClient) { }
    
  async login(scout:string, password:string): Promise<string | undefined> {
    console.log("Starting Login")
    let credentials = Cognito.getAwsCredentials(scout, password);
    let ddb: DynamoDb
    let scoutId: string | undefined
    await credentials.then(
      async (credentials) => {
       if(credentials == undefined){
         return
       }

       console.log("credentials are valid")
       ddb = new DynamoDb(credentials)

       let item = ddb.query(scout, password)
       await item.then(
        (item) => {
          if(item != undefined) scoutId = item["pk"].S
          console.log("scoutId", scoutId)
        }
       )
      }
     )
     return scoutId
  }

  public setSession( scoutId: string) {
      localStorage.setItem('scout_id', scoutId);
  }

  public logout() {
      localStorage.removeItem("scout_id");
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
}
