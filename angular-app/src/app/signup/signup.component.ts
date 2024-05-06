import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Cognito } from '../aws-clients/cognito';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm:FormGroup;
  ddb!: DynamoDb;

  role: string | null;
  email = "";
  password = "";
  failed: boolean = false;
  confirmation: boolean = false;
  displayStyle = "none";
  popUpnMsg = "";
  userId = "";
  phone = "";
  name = "";

  constructor(private fb:FormBuilder, private activatedRoute: ActivatedRoute) {
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

    let output = await Cognito.signUpUser(this.signupForm.value.nombre, this.email, this.signupForm.value.phone, this.password, this.role!)
    
    if(!output?.UserSub) {
      this.popUpnMsg = "Ocurrio un error. Intenta de nuevo";
      this.openPopup();
      return
    }

    this.userId = this.role + '.' + output?.UserSub

    this.confirmation = true;
    this.signupForm.get('nombre')?.disable();
    this.signupForm.get('email')?.disable();
    this.signupForm.get('phone')?.disable();
    this.signupForm.get('password')?.disable();
    this.signupForm.get('codigo')?.enable();
    this.popUpnMsg = "Verifica tu correo introduciendo tu código de verificación.  No olvides buscar en la carpeta de correo no deseado";
    this.openPopup();
  }

  async confirm() {
    console.log("Validating "+this.role+": " + this.email);
    await Cognito.confirmSignUpUser(this.signupForm.value.codigo, this.email);

    await this.storeUserData()

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

  private async storeUserData(){
    this.ddb = await DynamoDb.build(this.email, this.password);
    let record: Record<string, AttributeValue> = {}

    record[PK_KEY] = {S: `${this.userId}`}
    record[SK_KEY] = {S: `${this.role}.data`}
    record['name'] = {S: `${this.name}`}
    record['email'] = {S: `${this.email}`}
    record['phone'] = {S: `${this.phone}`}
    console.log('Storing user data', record)
    
    await this.ddb.putItem(record);
  }


  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}
