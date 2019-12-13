import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { myAppService } from '../myApp.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.css']
})
export class EntryComponent implements OnInit {
  form: FormGroup;
  categories: [];
  entryDescription: [];
  entryInfo: [];
  category: [];
  photo: string;

  constructor(private mySvc: myAppService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient) {
    this.form = this.createFormGroup();
  }

  ngOnInit() {
    this.mySvc.getCategory()
      .then(result => {
        this.categories = result.result;
        console.info('entry categories: ', this.categories);
      })
      .catch(error => {
        console.info('error: ', error);
      });

    const selectedId = this.route.snapshot.paramMap.get('entryId');
    this.mySvc.getEntry(selectedId).then(response => {
      this.entryDescription = response['entryDescription'][0];
      this.entryInfo = response['entryInfo'][0];
      this.category = response['category'][0];
      this.photo = response['entryInfo'][0]['photo'];
      // console.info(response);
      console.info('entry description: ', this.entryDescription);
      console.info('entry info: ', this.entryInfo);
      console.info('category: ', this.category);
      this.form.setValue({
        username: this.entryInfo['username'],
        photo: this.entryInfo['photo'],
        title: this.entryInfo['title'],
        description: this.entryDescription['entryDescription'],
        category: this.category['category']
      });
    })
      .catch(error => {
        console.info('error: ', error);
      });
  }

  createFormGroup() {
    return new FormGroup({
      username: new FormControl('', [Validators.required]),
      photo: new FormControl(null),
      title: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      category: new FormControl('', [Validators.required]),
    });
  }

  uploadFile(event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({
      photo: file
    });
    this.form.get('photo').updateValueAndValidity();
  }

  onDelete() {
    console.info('form values: ', this.form.value);
    const formData: any = new FormData();
    formData.append('title', this.form.get('title').value);
    formData.append('username', this.form.get('username').value);
    formData.append('description', this.form.get('description').value);
    formData.append('category', this.form.get('category').value);
    formData.append('photo', this.form.get('photo').value);
    this.mySvc.deleteEntry(formData, this.route.snapshot.paramMap.get('entryId'))
      .subscribe(
        (response) => {
          console.info('deleted entry: ', response);
          this.router.navigate(['/search']);
        },
        (error) => console.info(error)
      );
  }

  onEdit() {
    console.info('form values: ', this.form.value);
    const formData: any = new FormData();
    formData.append('title', this.form.get('title').value);
    formData.append('username', this.form.get('username').value);
    formData.append('description', this.form.get('description').value);
    formData.append('category', this.form.get('category').value);
    formData.append('photo', this.form.get('photo').value);
    this.mySvc.editEntry(formData, this.route.snapshot.paramMap.get('entryId'))
      .subscribe(
        (response) => {
          console.info('edited entry: ', response);
          this.router.navigate(['/search']);
        },
        (error) => console.info(error)
      );
  }
}
// client ID: 998770374995-ptvb1v1gsl0jn42be3afmusvrgguahco.apps.googleusercontent.com
// client secret: 1ngPDSB0Sk8PfWvvi1rpihrn

// ngOnInit() {
//   const selectedId = this.route.snapshot.paramMap.get('entryId');
//   this.mySvc.getEntry(selectedId)
//     .then(response => {

//       this.entryDescription = response['entryDescription'][0];
//       this.entryInfo = response['entryInfo'][0];
//       // console.info(response);
//       console.info('entry description: ', this.entryDescription);
//       console.info('entry info: ', this.entryInfo);
//     })
//     .catch(error => {
//       console.info('error: ', error);
//     });
// }