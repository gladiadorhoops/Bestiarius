import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { CodeMismatchException, InvalidParameterException, NotAuthorizedException, UserNotConfirmedException, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { Cognito } from '../aws-clients/cognito';
import { User } from '../interfaces/user';
import { UserBuilder } from '../Builders/user-builder';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form:FormGroup;
  codigoForm : FormGroup = this.fb.group({codigo: '', email: ''});

  passform: FormGroup;
  isLoggedIn: boolean = false;
  ddb!: DynamoDb;
  loading = true;
  userId: string = "";
  username: string = "";
  name: string = "";
  email: string = "";
  failed: boolean = false;
  codigoErrorMsg: string | undefined = undefined;
  displayStyle = "none";
  displayCodigo = "none";
  displayChangePassword = "none";
  popUpnMsg = "";

  codeSent: boolean = false;

  tokenId: string = "";

    constructor(private fb:FormBuilder, 
              private authService: AuthService,
              private userBuilder: UserBuilder,
              private router: Router, private activatedRoute: ActivatedRoute) {

        this.form = this.fb.group({
            email: ['',Validators.required],
            password: ['',Validators.required]
        });

        this.passform = this.fb.group({
          email: ['',Validators.required],
          password: ['',Validators.required],
          codigo: ['', Validators.required]
        });

        if(this.authService.isLoggedIn()){
          let username = this.authService.getUserUsername();
          let pass = this.authService.getUserPass();
          this.authService.getCredentials(username, pass).then(
            (credentials) => {
              if (credentials == undefined) {
                throw Error("AWS Credentials are undefined. Unable to set DDB client")
              }
              DynamoDb.build(credentials).then(
                (client) => {
                  this.ddb = client;
                  this.loading = false;
                });
            }
          )
        }
    }

    ngOnInit(){
      this.reloadLoginStatus()
      this.loading = false;

      if(this.isLoggedIn){
        console.log("user is loged in")
        let logout = false;
        this.activatedRoute.queryParams.subscribe(params => {
          logout = params['logout'];
        });
        
        if(logout){
          this.logout()
        }
        else{
          window.location.assign('/#/restricted');
        }
      }
    }
    
    reloadLoginStatus() {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.userId = this.authService.getUserId();
      this.username = this.authService.getUserUsername();
      this.name = this.authService.getUserName();
      console.log("Log in Status Reloaded");
    }

    async enterRecoverPassword(){
      this.displayChangePassword = 'block';
      

      this.passform.get('codigo')?.disable();
      this.passform.get('password')?.disable();
    }

    async getCode(){
      const val = this.passform.value;
      if (!(val.email)) {
        this.failed = true;
        return;
      }

      await this.authService.forgotUserPassword(val.email);
      this.codeSent = true;

      this.passform.get('codigo')?.enable();
      this.passform.get('password')?.enable();
    }

    async changePassword() {
      const val = this.passform.value;
      if (!(val.email && val.password && val.codigo)) {
        this.failed = true;
        return;
      }

      await this.authService.confirmForgotUserPassword(val.email, val.password, val.codigo);
      this.displayChangePassword = 'none';
      this.codeSent = false;
    }

    async performLogin(email: string, password: string){
      var user = undefined
      try {
        user = await this.authService.login(email, password)
      } catch(error) {
        console.warn('Login Error', error)
        this.failed = true;
        if (error instanceof UserNotConfirmedException) {
          this.openCodigoPopup();
          //this.popUpnMsg = 'Email no verificado'
          //this.openPopup();        
        } else if (error instanceof NotAuthorizedException) {
          this.popUpnMsg = 'Email o Contraseña Incorrecta'
          this.openPopup();
        } else {
          this.popUpnMsg = 'Error. Intentat de nuevo'
          this.openPopup();
        }
      }
      return user;
    }

    async login() {
      const val = this.form.value;
      this.failed = false;
      this.email = val.email

      if (!(val.email && val.password)) {
        this.failed = true
        return
      }
      
      var user = await this.performLogin(val.email, val.password);
      
      if (user == undefined) {
        console.log("Failed to log in");
        this.failed = true;
        return
      }

      this.userId = user.id
      this.username = user.email
      this.name = user.name
      
      console.log(user);
      this.authService.setUserSession(user, val.password);
      this.reloadLoginStatus();
      console.log("User is logged in");
      window.location.reload();
    }

    async logout() {
      this.authService.logout();
      window.location.reload();
      this.reloadLoginStatus();
      console.log("User is logged out");
      await this.router.navigateByUrl('/login');
      window.location.reload();
    }

    openPopup() {
      this.displayStyle = "block";
    }
    closePopup() {
      this.displayStyle = "none";
    }

    async confirm() {
      console.log("Validating user: " + this.email);
  
      try {
        await Cognito.confirmSignUpUser(this.codigoForm.value.codigo, this.email);
      } catch (error){
        console.warn('User Confirmation Error: ', error)
  
        if(error instanceof NotAuthorizedException) {
          if(!error.message.includes('Current status is CONFIRMED')) {
            this.codigoErrorMsg = "Error verificando codigo. Intenta de nuevo";
            return
          }         
        }else if(error instanceof CodeMismatchException || error instanceof InvalidParameterException) {
          this.codigoErrorMsg = 'Codigo de verificacion incorrecto. Intenta de nuevo'
          return
        } else {
          console.error('Unrecognized Error', error);
          return
        }        
      }

      this.closeCodigoPopup();

      if(this.form.value.email != '' && this.form.value.password != ''){
        var user = await this.performLogin(this.form.value.email, this.form.value.password);
    
        await this.authService.setUserSession(user!, this.form.value.password);
        await this.storeUserData(user!, this.form.value.password);
  
        this.reloadLoginStatus();
        console.log("User is logged in");
        window.location.reload();
      }
    }

    async confirmEmail(){
      this.email = this.codigoForm.value.email;
    }

    openCodigoPopup(){
      this.displayCodigo = "block";
    }

    closeCodigoPopup(){
      this.displayCodigo = "none";
    }

    async resendCode(){
      try {
        await this.authService.resendConfirmationCode(this.email);
        this.codigoErrorMsg = "Codigo enviado. Verifica tu correo.";
      } catch (error) {
        console.error('User Exists: ', error);
      }
    }
  
    private async storeUserData(user: User, password: string){
      let credentials = await this.authService.getCredentials(user.email, password)
      if (credentials == undefined) {
        throw Error("AWS Credentials are undefined. Unable to set DDB client")
      }
      this.ddb = await DynamoDb.build(credentials);
      
      await this.userBuilder.createUser(this.ddb, user)
    }
}
