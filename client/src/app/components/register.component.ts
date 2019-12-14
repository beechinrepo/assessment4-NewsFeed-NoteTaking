import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { myAppService } from '../myApp.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  @ViewChild('imageFile', { static: false })
  imageFile: ElementRef;

  constructor(private mySvc: myAppService,
              private router: Router) { }

  ngOnInit() {
  }

  submit(form: NgForm) {
    console.info('#imageFile: ', this.imageFile.nativeElement.files);
    this.mySvc.addUser(form, this.imageFile)
      .then(() => this.router.navigate(['/login']))
      .catch(error => console.error(error));
  }
}
