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
    
  async login(username:string, password:string): Promise<User | undefined> {
    console.log("Starting Login")
    let output = await Cognito.authenticateUser(username, password)
    
    let idToken = output?.AuthenticationResult?.IdToken
    let accessToken = output?.AuthenticationResult?.AccessToken

    if(idToken == undefined) {
        console.log("ERROR: ID Token not found on user authentication output")
        return
    }
    console.log(`Found User ${username} ID Token`)
    return Cognito.getUserFromToken(idToken, accessToken)
  }

  async getCredentials(username: string, password: string, identity: CognitoIdentity = AUTHENTICATED_COGNITO_IDENTITY): Promise<AwsCredentialIdentity | Provider<AwsCredentialIdentity> | undefined> {
    console.log("Retrieving AWS Credentials")
    let output = await Cognito.authenticateUser(username, password)
    let token = output?.AuthenticationResult?.IdToken
    if(token == undefined) {
      console.log("ERROR: ID Token not found on user authentication output")
      return
    }
    console.log(`Found User ${username} ID Token`)
    return await Cognito.getAwsCredentials(token, identity)
  }

  async resendConfirmationCode(email: string) {
    await Cognito.resendConfirmationCode(email);
  }

  async forgotUserPassword(email: string) {
    await Cognito.forgotPassword(email)
  }

  async confirmForgotUserPassword(email: string, password: string, code: string) {
    await Cognito.confirmForgotPassword(email, password, code)
  }

  public setUserSession(user: User, password: string) {
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_pass', password);
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('user_username', user.email);
      localStorage.setItem('user_phone', user.phone);
      if(user.accessToken) localStorage.setItem('access_token', user.accessToken);
      if(user.idToken) localStorage.setItem('id_token', user.idToken);
  }

  public logout() {
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_pass");
      localStorage.removeItem("user_role");
      localStorage.removeItem('user_username');
      localStorage.removeItem('user_phone');
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
  }

  public isLoggedIn() {
    return (localStorage.getItem("user_id") != null)
  }

  isLoggedOut() {
      return !this.isLoggedIn();
  }

  getUserId() {
    let userId = localStorage.getItem("user_id");
    return userId ? userId : "";
  } 

  getUserName(): string {
    let userName = localStorage.getItem("user_name");
    return userName ? userName : "";
  } 

  getUserPass(): string {
    let userPass = localStorage.getItem("user_pass");
    return userPass ? userPass : "";
  } 

  getUserRole(): string {
    let userRole = localStorage.getItem("user_role");
    return userRole ? userRole : "";
  }

  getUserUsername(): string {
    let username = localStorage.getItem("user_username");
    return username ? username : "";
  } 

  getUserAccessToken(): string | undefined {
    let accessToken = localStorage.getItem("access_token");
    return accessToken ? accessToken : undefined
  }
  
  getUserIdToken(): string | undefined {
    let accessToken = localStorage.getItem("id_token");
    return accessToken ? accessToken : undefined
  } 
}
