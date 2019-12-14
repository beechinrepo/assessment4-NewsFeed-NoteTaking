import { Component, OnInit } from '@angular/core';
import { myAppService } from '../myApp.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SocialService } from 'ngx-social-button';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.css']
})
export class EntryComponent implements OnInit {
  form: FormGroup;
  public categories: [];
  entryDescription: [];
  entryInfo: [];
  category: [];
  photo: string;

  shareObj = {
    href: '',
    hastag: '#news'
  };

  constructor(private mySvc: myAppService,
              private route: ActivatedRoute,
              private router: Router,
              private http: HttpClient,
              private socialAuthService: SocialService,
              private meta: Meta) {
                this.form = this.createFormGroup();
                this.meta.addTag({ property: 'og:url', content: 'https://sleepy-ridge-60880' });
                this.meta.addTag({ property: 'og:type', content: 'article' });
                this.meta.addTag({ property: 'og:title', content: 'GEEKS share' });
                this.meta.addTag({ property: 'og:url', content: 'https://sleepy-ridge-60880' });
                this.meta.addTag({ property: 'og:description', content: 'Best Article Ever' });
                this.meta.addTag({ property: 'og:image', content: 'https://cdn.dribbble.com/users/71890/screenshots/2267188/tech_geek_logo.jpg' });
                this.meta.addTag({ property: 'fb:app_id', content: '441224926819771' });
            }

  ngOnInit() {
    this.mySvc.getCategory()
    .subscribe(data => this.categories = data['result']);

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
