import { Injectable, ElementRef } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { NgForm, FormGroup } from '@angular/forms';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class myAppService implements CanActivate {

  private authenticated = false;
  private token = '';
  public data$: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(private http: HttpClient, private router: Router) {
    this.http.get('/api/newsArticles').subscribe(res => this.data$.next(res));
   }

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
      this.http.get('/api/home', { headers })
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
      this.http.post('/api/authenticate',
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
      this.http.post<any>('/api/user', formData)
        .toPromise()
    );
  }

  getNewsSource() {
    return this.http.get('/api/newsSource');
  }

  getnewsArticleById(source: string) {
    return this.http.get(`/api/newsArticleById?source=${source}`);
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
      this.http.post<any>('/api/category', formData)
        .toPromise()
    );
  }

  getCategory() {
    return this.http.get<any>('/api/category');
  }

  addEntry(formData) {
    return this.http.post<any>('/api/entry', formData);
  }

  getEntriesForCategory(category: string): Promise<any> {
    return this.http.get<any>(`/api/entries/${category}`).toPromise(); // sneak preview
  }

  getEntry(entryId: string): Promise<any> {
    return this.http.get<any>(`/api/entry/${entryId}`).toPromise();
  }

  editEntry(formData, entryId: string) {
    return this.http.put<any>(`/api/entry/${entryId}/edit`, formData);
  }

  deleteEntry(formData, entryId: string) {
    return this.http.post<any>(`/api/entry/${entryId}/delete`, formData);
  }

  getSearchTerm(term: string, limit: string, offset: string): Promise<any> {
    return this.http.get<any>(`/api/search/${term}?limit=${limit}&offset=${offset}`).toPromise();
  }

  getCount(): Promise<any> {
    return this.http.get<any>(`/api/count`).toPromise();
  }

}
