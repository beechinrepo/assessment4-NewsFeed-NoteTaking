import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { myAppService } from '../myApp.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private mySvc: myAppService, private router: Router, private formBuilder: FormBuilder) { }

  ngOnInit() {
  }

  submit() {
    console.info('> ', this.form.value);
    this.mySvc.authenticate(this.form.value['username'], this.form.value['password'])
      .then(result => {
        console.log('authenticated: ', result);
        this.router.navigate(['/home']);
      });
  }
}

// performLogin(form: NgForm) {
//   console.info('> ', form.value);
//   this.mySvc.authenticate(form.value['username'], form.value['password'])
//     .then(result => {
//       console.log('authenticated: ', result);
//       this.router.navigate(['/home']);
//     });
// }