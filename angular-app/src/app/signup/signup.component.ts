import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Cognito } from '../aws-clients/cognito';
import { DynamoDb } from "src/app/aws-clients/dynamodb";
import { AuthService } from '../auth.service';
import { UserBuilder } from '../Builders/user-builder';
import { InvalidParameterException, InvalidPasswordException, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { Role } from '../enum/Role';

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
  success: boolean = false;
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
    private router: Router
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
        if(this.role != Role.COACH && this.role != Role.SCOUT ){
          console.error("Invlaid Role");
          this.popUpnMsg = "La liga de registro es invalida. Contacta a la organizacion per la liga de registro corecta";
          this.openPopup();
        }
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
        if(error.message.includes('Invalid email address')) this.errorMessage = 'Formato the email invalido.';
        if(error.message.includes('password')) this.errorMessage = 'Formato the contraseña invalido. ' + this.passwordPolicyMessage;
      } else if (error instanceof UsernameExistsException) {
        /*try {
          await this.authService.resendConfirmationCode(this.email);
        } catch (error) {
          console.error('User Exists: ', error);
        }
        this.enableConfirmationUI();*/
        this.popUpnMsg = "Este usuario ya existe. Intenta hacer login.";
        this.openPopup();
        return
      } else if (error instanceof InvalidPasswordException) {        
        if(error.message.includes('Password not long enough')) this.errorMessage = 'La Contraseña es muy corta. ' + this.passwordPolicyMessage
        if(error.message.includes('uppercase characters')) this.errorMessage = 'La Contraseña no tiene mayusculas. ' + this.passwordPolicyMessage
        if(error.message.includes('lowercase characters')) this.errorMessage = 'La Contraseña no tiene minusculas. ' + this.passwordPolicyMessage
        if(error.message.includes('numeric characters')) this.errorMessage = 'La Contraseña no tiene numeros. ' + this.passwordPolicyMessage
      } else {
        console.error('Unrecognized Error', error);
      }
    }
     
    if(!output?.UserSub) {
      this.popUpnMsg = this.errorMessage;
      this.openPopup();
      return
    }

    this.success = true;
    this.popUpnMsg = "Registro completo. Por Favor iniciar session";
    this.openPopup();

  }

  openPopup() {
    this.displayStyle = "block";
  }
  async closePopup() {
    this.displayStyle = "none";
    if(this.success){
      await this.router.navigateByUrl('/login');
    } else {
      await this.router.navigateByUrl('/')
    }
  }

}
