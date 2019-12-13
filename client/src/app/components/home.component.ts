import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { myAppService } from '../myApp.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { SocialService } from 'ngx-social-button';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  mArticles: Array<any>;
  mSources: Array<any>;
  url: string;

  shareObj = {
    href: this.url
  };

  constructor(private mySvc: myAppService,
              private router: Router,
              private socialAuthService: SocialService) { }

  ngOnInit() {
    console.info('is authenticated: ', this.mySvc.isAuthenticated());
    this.reload();

    //load articles
    this.mySvc.getnewsArticles().subscribe(data => this.mArticles = data['data']);
    //load news sources
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

  getURL(URL:string) {
    this.url = URL;
    console.info('getURL: ', this.url);
  }

}

// appID: 441224926819771
// App Secret: aa4d284ef8a0f8bebb49b400d6669340
