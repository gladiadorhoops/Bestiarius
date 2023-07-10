import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cognito } from './aws-clients/cognito';
import { DynamoDb } from './aws-clients/dynamodb';

const LOGIN_URL =  'https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-10/scoutid.json'
//const LOGIN_URL =  'https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-10/category-matches-2022-07-29.json'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpService: HttpClient) { }
    
  login(scout:string, password:string ) {
    let credentials = Cognito.getAwsCredentials(scout, password);
    let ddb: DynamoDb

    return credentials.then(
      (credentials) => {
       console.log("Checking credentials")
       if(credentials == undefined) return ""
       console.log("credentials are valid", credentials)
       ddb = new DynamoDb(credentials)
       /*ddb.getItem(
         {
           pk: { S: `${playerId}.${scoutId}` },
           sk: { S: `${playerId}.report` },
           body: { S: "test" },
         }
       )*/
       return "1234"
      } 
     )


    //return this.httpService.get<string>(LOGIN_URL)
    //return this.httpService.post('/api/scouts', {scout, password})
          // this is just the HTTP call, 
          // we still need to handle the reception of the token
          //.shareReplay();
  }

  public setSession( scoutId: string) {
      localStorage.setItem('scout_id', scoutId);
      window.location.reload();
  }

  public logout() {
      localStorage.removeItem("scout_id");
      window.location.reload();
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




/*import {Request, Response} from "express";
import express from 'express';
//const bodyParser = require('body-parser');
//const cookieParser = require('cookie-parser');
import * as jwt from 'jsonwebtoken';
import * as fs from "fs";

const app: express.Application = express();

//app.use(bodyParser.json());

app.route('/api/login')
    .post(loginRoute);

const RSA_PRIVATE_KEY = fs.readFileSync('./demos/private.key');

export function loginRoute(req: Request, res: Response) {

    const scout = req.body.email,
          password = req.body.password;

    if (validateEmailAndPassword()) {
       const userId = findUserIdForEmail(scout);

        const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
                algorithm: 'RS256',
                expiresIn: 120,
                subject: userId
            }
        );

        // send the JWT back to the user
        // TODO - multiple options available                              
        
        // set it in an HTTP Only + Secure Cookie
        res.cookie("SESSIONID", jwtBearerToken, {httpOnly:true, secure:true});

    }
    else {
        // send status 401 Unauthorized
        res.sendStatus(401); 
    }
}

function validateEmailAndPassword(){
    
    return true
}

function findUserIdForEmail(scout: any) {
    
    
    return scout
}

*/