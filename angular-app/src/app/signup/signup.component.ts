import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm:FormGroup;

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

  signup() {
    console.log("Registering "+this.role+": "+this.signupForm.value.nombre);
    console.log("Email: "+this.signupForm.value.email);
    this.email = this.signupForm.value.email;
    console.log("NEED TO IMPLEMENT SIGNUP FUNCTION");
    this.confirmation = true;
    this.signupForm.get('nombre')?.disable();
    this.signupForm.get('email')?.disable();
    this.signupForm.get('phone')?.disable();
    this.signupForm.get('password')?.disable();
    this.signupForm.get('codigo')?.enable();
    this.popUpnMsg = "Verifica tu correo introduciendo tu código de verificación.  No olvides buscar en la carpeta de correo no deseado";
    this.openPopup();
  }

  confirm() {
    console.log("Validating "+this.role+": "+this.signupForm.value.email);
    console.log("NEED TO IMPLEMENT CONFIRM FUNCTION");
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


  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }

  role: string | null;
  email: string;
  failed: boolean = false;
  confirmation: boolean = false;
  displayStyle = "none";
  popUpnMsg = ""

}
