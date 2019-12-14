import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { myAppService } from '../myApp.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent implements OnInit {
  form: FormGroup;
  public categories: [];

  constructor(private mySvc: myAppService,
              private router: Router) {
                this.form = this.createFormGroup();
              }

  ngOnInit() {
    this.mySvc.getCategory()
    .subscribe(data => this.categories = data['result']);
  }

  createFormGroup() {
    return new FormGroup({
     category: new FormControl('', [Validators.required]),
     photo: new FormControl(null, []),
     username: new FormControl('', [Validators.required]),
     title: new FormControl('', [Validators.required]),
     description: new FormControl('', [Validators.required]),
   });
  }

  uploadFile(event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({
      photo: file
    });
    this.form.get('photo').updateValueAndValidity();
  }

  onSubmit() {
    console.info(this.form.value);
    const formData:any = new FormData();
    formData.append('photo', this.form.get('photo').value);
    formData.append('title', this.form.get('title').value);
    formData.append('username', this.form.get('username').value);
    formData.append('description', this.form.get('description').value);
    formData.append('category', this.form.get('category').value);
    this.mySvc.addEntry(formData)
      .subscribe(
        (response) => {
          console.info('added entry: ', response);
          this.router.navigate(['/search']);
        },
        (error) => console.info(error)
      );
    }
  }
