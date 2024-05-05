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
  form:FormGroup;

  constructor(private fb:FormBuilder, private activatedRoute: ActivatedRoute) {
    this.role = "";
    this.form = this.fb.group({
      nombre: ['',Validators.required],
      email: ['',Validators.required],
      phone: ['',Validators.required],
      password: ['',Validators.required]
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
    console.log("Registering "+this.role+": "+this.form.value.nombre)
    console.log("NEED TO IMPLEMENT SIGNUP FUNCTION")
  }


  role: string | null;
  failed: boolean = false;

}
