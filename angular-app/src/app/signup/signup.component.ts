import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Cognito } from '../aws-clients/cognito';
import { DynamoDb } from "src/app/aws-clients/dynamodb";
import { AuthService } from '../auth.service';
import { UserBuilder } from '../Builders/user-builder';
import { roleFromString } from '../enum/Role';
import { User } from '../interfaces/user';
import { CodeMismatchException, InvalidParameterException, InvalidPasswordException, NotAuthorizedException, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm:FormGroup;
  ddb!: DynamoDb;

  role: string;
  email = "";
  password = "";
  failed: boolean = false;
  confirmation: boolean = false;
  displayStyle = "none";
  popUpnMsg = "";
  userId = "";
  phone = "";
  name = "";
  errorMessage: string = 'Ocurrio un error. Revisa tu informacion e intenta de nuevo';
  passwordPolicyMessage = 'La contraseña necesita minimo: 1 mayuscula, 1 minuscula, 1 numero y 8 caracteres'

  constructor(
    private fb:FormBuilder, 
    private activatedRoute: ActivatedRoute, 
    private authService: AuthService,
    private userBuilder: UserBuilder,
  ) {
    this.role = "";
    this.email = "emailPlaceholder";
    this.signupForm = this.fb.group({
      nombre: ['',Validators.required],
      email: ['',Validators.required],
      phone: ['',Validators.required],
      password: ['',Validators.required],
      codigo: {value: '', disabled: true}
    });
  }

  ngOnInit() {
    // Note: Below 'queryParams' can be replaced with 'params' depending on your requirements
    this.activatedRoute.queryParams.subscribe(params => {
        this.role = params['role'];
        console.log(this.role);
      });
  }

  async signup() {
    console.log("Registering "+this.role+": "+this.signupForm.value.nombre);
    console.log("Email: "+this.signupForm.value.email);
    this.email = this.signupForm.value.email;
    this.password = this.signupForm.value.password
    this.phone = this.signupForm.value.phone
    this.name = this.signupForm.value.nombre

    var output = undefined
    try {
      output = await Cognito.signUpUser(this.signupForm.value.nombre, this.email, this.signupForm.value.phone, this.password, this.role!)
    } catch (error){
      
      console.warn("Signup Error: ", error);
      
      if(error instanceof InvalidParameterException){
        if(error.message.includes('Invalid phone number')) this.errorMessage = 'Formato the telefono invalido. Ejemplo de Formato: +526561234567';
      } else if (error instanceof UsernameExistsException) {
        try {
          await this.authService.resendConfirmationCode(this.email);
        } catch (error) {
          console.error('User Exists: ', error);
        }
        this.enableConfirmationUI();
        return
      } else if (error instanceof InvalidPasswordException) {        
        if(error.message.includes('Password not long enough')) this.errorMessage = 'La Contraseña es muy corta. ' + this.passwordPolicyMessage
        if(error.message.includes('uppercase characters')) this.errorMessage = 'La Contraseña no tiene mayusculas. ' + this.passwordPolicyMessage
        if(error.message.includes('lowercase characters')) this.errorMessage = 'La Contraseña no tiene minusculas. ' + this.passwordPolicyMessage
        if(error.message.includes('numeric characters')) this.errorMessage = 'La Contraseña no tiene numeros. ' + this.passwordPolicyMessage
      } else {
        console.error('Unrecognized Error', error);
      }
      return
    }
     
    if(!output?.UserSub) {
      this.popUpnMsg = this.errorMessage;
      this.openPopup();
      return
    }

    this.userId = output?.UserSub
    this.enableConfirmationUI()
  }

  async confirm() {
    console.log("Validating "+this.role+": " + this.email);

    try {
      await Cognito.confirmSignUpUser(this.signupForm.value.codigo, this.email);
    } catch (error){
      console.warn('User Confirmation Error: ', error)

      if(error instanceof NotAuthorizedException) {
        if(!error.message.includes('Current status is CONFIRMED')) {
          this.confirmation = false;
          this.popUpnMsg = "Error verificando codigo. Intenta de nuevo";
          this.openPopup();
          return
        }         
      }else if(error instanceof CodeMismatchException || error instanceof InvalidParameterException) {
        this.errorMessage = 'Codigo de verificacion incorrecto. Intenta de nuevo'
        this.confirmation = false;
        this.popUpnMsg = this.errorMessage;
        this.openPopup();
        return
      } else {
        console.error('Unrecognized Error', error);
        return
      }        
    }

    let user = {
      id: this.userId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: roleFromString(this.role)
    }

    this.authService.setUserSession(user, this.password);
    await this.storeUserData(user)

    this.confirmation = false;
    this.signupForm.get('nombre')?.enable();
    this.signupForm.get('email')?.enable();
    this.signupForm.get('phone')?.enable();
    this.signupForm.get('password')?.enable();
    this.signupForm.get('codigo')?.disable();
    this.signupForm.reset();
    this.popUpnMsg = "Registro Completo!";
    this.openPopup();
  }

  private async storeUserData(user: User){
    let credentials = await this.authService.getCredentials(this.email, this.password)
    if (credentials == undefined) {
      throw Error("AWS Credentials are undefined. Unable to set DDB client")
    }
    this.ddb = await DynamoDb.build(credentials);
    
    await this.userBuilder.createUser(this.ddb, user)
  }


  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }

  private enableConfirmationUI(){
    this.confirmation = true;
    this.signupForm.get('nombre')?.disable();
    this.signupForm.get('email')?.disable();
    this.signupForm.get('phone')?.disable();
    this.signupForm.get('password')?.disable();
    this.signupForm.get('codigo')?.enable();
    this.popUpnMsg = "Verifica tu correo introduciendo tu código de verificación.  No olvides buscar en la carpeta de correo no deseado";
    this.openPopup();
  }
}
