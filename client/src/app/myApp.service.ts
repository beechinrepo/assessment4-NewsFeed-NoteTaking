import { Injectable, ElementRef } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { NgForm, FormGroup } from '@angular/forms';
// import { NEWS, USER, ENTRY } from './models';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable()
export class myAppService implements CanActivate {

  private authenticated = false;
  private token = '';

  constructor(private http: HttpClient, private router: Router) { }

  isAuthenticated(): boolean {
    return (this.authenticated);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authenticated) {
      this.router.navigate(['/login']);
    }
    return (this.authenticated);
  }

  getHome(): Promise<any> {
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.token}`);
    return (
      this.http.get('http://localhost:3000/home', { headers })
        .toPromise()
    );
  }

  authenticate(username: string, password: string): Promise<boolean> {
    const params = new HttpParams()
      .set('username', username)
      .set('password', password);
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded');

    return (
      this.http.post('http://localhost:3000/authenticate',
        params.toString(), { headers })
        .toPromise()
        .then((result: any) => {
          console.info('> result: ', result);
          this.authenticated = true;
          this.token = result.access_token;
          return true;
        })
        .catch(() => {
          this.authenticated = false;
          this.token = '';
          return false;
        })
    );
  }

  addUser(form: NgForm, fileRef: ElementRef): Promise<any> {
    // multipart/form-data
    const formData = new FormData();
    // normal non file files
    formData.set('username', form.value.username);
    formData.set('password', form.value.password);
    formData.set('email', form.value.email);
    // file
    formData.set('photo', fileRef.nativeElement.files[0]);

    return (
      this.http.post<any>('http://localhost:3000/user', formData)
        .toPromise()
    );
  }

  getNewsSource() {
    return this.http.get('http://localhost:3000/newsSource');
  }

  getnewsArticles() {
    return this.http.get('http://localhost:3000/newsArticles');
  }

  getnewsArticleById(source: string) {
    return this.http.get(`http://localhost:3000/newsArticleById?source=${source}`);
  }

  addCategory(form: NgForm, fileRef: ElementRef): Promise<any> {
    // multipart/form-data
    const formData = new FormData();
    // normal non file files
    formData.set('category', form.value.category);
    formData.set('colorCode', form.value.colorCode);
    // file
    formData.set('photo', fileRef.nativeElement.files[0]);

    return (
      this.http.post<any>('http://localhost:3000/category', formData)
        .toPromise()
    );
  }

  getCategory(): Promise<any> {
    return this.http.get<any>('http://localhost:3000/category').toPromise();
  }

  addEntry(formData) {
    return this.http.post<any>('http://localhost:3000/entry', formData);
  }

  getEntriesForCategory(category: string): Promise<any> {
    return this.http.get<any>(`http://localhost:3000/entries/${category}`).toPromise(); // sneak preview
  }

  getEntry(entryId: string): Promise<any> {
    return this.http.get<any>(`http://localhost:3000/entry/${entryId}`).toPromise(); // sneak preview
  }

  editEntry(formData, entryId: string) {
    return this.http.put<any>(`http://localhost:3000/entry/${entryId}/edit`, formData);
  }

  deleteEntry(formData, entryId: string) {
    return this.http.post<any>(`http://localhost:3000/entry/${entryId}/delete`, formData);
  }

  getSearchTerm(term: string, limit: string, offset: string): Promise<any> {
    return this.http.get<any>(`http://localhost:3000/search/${term}?limit=${limit}&offset=${offset}`).toPromise(); // sneak preview
  }

  getCount(): Promise<any> {
    return this.http.get<any>(`http://localhost:3000/count`).toPromise(); // sneak preview
  }

}

// editEntry(form: NgForm, fileRef: ElementRef, entryId: string): Promise<any> {
//   // multipart/form-data
//   const formData = new FormData();
//   // normal non file files
//   formData.set('title', form.value['title']);
//   formData.set('username', form.value['username']);
//   formData.set('description', form.value['description']);
//   formData.set('category', form.value['category']);
//   // file
//   formData.set('photo', fileRef.nativeElement.files[0]);

//   return (
//     this.http.post<any>(`http://localhost:3000/entry/edit/${entryId}`, formData)
//       .toPromise()
//   );
// }

  // addEntry(form, fileRef: ElementRef): Promise<any> {
  //   // multipart/form-data
  //   const formData = new FormData();
  //   // normal non file files
  //   formData.set('title', form.value['title']);
  //   formData.set('username', form.value['username']);
  //   formData.set('description', form.value['description']);
  //   formData.set('category', form.value['category']);
  //   // file
  //   formData.set('photo', fileRef.nativeElement.files[0]);

  //   return (
  //     this.http.post<any>('http://localhost:3000/entry', formData)
  //       .toPromise()
  //   );
  // }


  // deleteEntry(form: NgForm, fileRef: ElementRef, entryId: string): Promise<any> {
  //   // multipart/form-data
  //   const formData = new FormData();
  //   // normal non file files
  //   formData.set('title', form.value['title']);
  //   formData.set('username', form.value['username']);
  //   formData.set('description', form.value['description']);
  //   formData.set('category', form.value['category']);
  //   // file
  //   formData.set('photo', fileRef.nativeElement.files[0]);

  //   return (
  //     this.http.post<any>(`http://localhost:3000/entry/delete/${entryId}`, formData)
  //       .toPromise()
  //   );
  // }
