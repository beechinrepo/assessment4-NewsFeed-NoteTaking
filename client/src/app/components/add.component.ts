import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { myAppService } from '../myApp.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent implements OnInit {
  form: FormGroup;
  categories: [];

  constructor(private mySvc: myAppService, private router: Router) {
    this.form = this.createFormGroup();
  }

  ngOnInit() {
    this.mySvc.getCategory()
    .then(result => {
      this.categories =  result['result'];
      console.info('entry categories: ', this.categories);
    })
    .catch(error => {
      console.info('error: ', error);
    });
  }

  // autogrow() {
  //   const textArea = document.getElementById('description')
  //   textArea.style.overflow = 'hidden';
  //   textArea.style.height = 'auto';
  //   textArea.style.height = textArea.scrollHeight + 'px';
  // }

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
    this.form.get('photo').updateValueAndValidity()
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
    // onSubmit() {
    // const val = this.form.value;
    // const save = {
    //   category: val.category,
    //   photo: val.photo,
    //   username: val.username,
    //   title: val.title,
    //   description: val.description
    // };
    // console.info(save);
    // console.info('#imageFile: ', this.imageFile.nativeElement.files);
    // this.mySvc.addEntry(this.form, this.imageFile)
    //   .then(response => {
    //     console.info('added entry: ', response)
    // });


  // add(form: NgForm) {
  //   console.info('#imageFile: ', this.imageFile.nativeElement.files);
  //   this.mySvc.addEntry(form, this.imageFile)
  //     .then(() => this.router.navigate(['/add']))
  //     .catch(error => console.error(error));

  // }

  
  // @ViewChild('imageFile', { static: false })
  // imageFile: ElementRef;
