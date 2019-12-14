import { Component, OnInit } from '@angular/core';
import { myAppService } from '../myApp.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // mArticles: Array<any>;
  mSources: Array<any>;
  public mArticles: Array<any>;
  
  constructor(private mySvc: myAppService,
              private router: Router) {
                this.mArticles = this.mySvc.data$.value;
                this.mySvc.data$.subscribe(res => this.mArticles = res['data']);
              }

  ngOnInit() {
    console.info('is authenticated: ', this.mySvc.isAuthenticated());
    this.reload();

    this.mySvc.getNewsSource().subscribe(data => this.mSources = data['data']);
  }

  reload() {
    this.mySvc.getHome()
      .then(result => {
        console.info('result: ', result);
      })
      .catch(error => {
        console.info('error: ', error);
      });
  }

  searchArticles(source) {
    console.log("selected source is: "+ source);
    this.mySvc.getnewsArticleById(source).subscribe(data => this.mArticles = data['data']);
  }

}
