import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cognito } from './aws-clients/cognito';
import { User } from './interfaces/user';
import { CognitoIdentity } from './interfaces/cognito-identity';
import { AUTHENTICATED_COGNITO_IDENTITY } from './aws-clients/constants';
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpService: HttpClient) { }
    
  async login(username:string, password:string): Promise<User | undefined> {
    console.log("Starting Login")
    let idToken = await Cognito.authenticateUser(username, password)
    if(idToken == undefined) return
    return Cognito.getUserFromToken(idToken)
  }

  async getCredentials(username: string, password: string, identity: CognitoIdentity = AUTHENTICATED_COGNITO_IDENTITY): Promise<AwsCredentialIdentity | Provider<AwsCredentialIdentity> | undefined> {
    console.log("Retrieving AWS Credentials")
    let idToken = await Cognito.authenticateUser(username, password)
    if(idToken == undefined) return
    return await Cognito.getAwsCredentials(idToken, identity)
  }

  public setSession( userName: string, userId: string, userPass: string) {
      localStorage.setItem('user_name', userName.toLocaleLowerCase());
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_pass', userPass);
  }

  public logout() {
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_pass");
  }

  public isLoggedIn() {
    return (localStorage.getItem("user_id") != null)
  }

  isLoggedOut() {
      return !this.isLoggedIn();
  }

  getUserId() {
    var userid = localStorage.getItem("user_id");
    if (userid != null){
      return userid;
    }
    else{
      return "";
    }
  } 

  getUserName() {
    var userName = localStorage.getItem("user_name");
    if (userName != null){
      return userName;
    }
    else{
      return "";
    }
  } 

  getUserPass() {
    var userPass = localStorage.getItem("user_pass");
    if (userPass != null){
      return userPass;
    }
    else{
      return "";
    }
  } 
}
