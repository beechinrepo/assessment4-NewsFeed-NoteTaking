import { Component, OnInit } from '@angular/core';
import { myAppService } from '../myApp.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-contributors',
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.css']
})
export class ContributorsComponent implements OnInit {

  count: [];

  constructor(private mySvc: myAppService,
              private route: ActivatedRoute,
              private router: Router) {}

  ngOnInit() {
    this.mySvc.getCount()
    .then(result => {
      this.count =  result['result'];
      console.info('contributors: ', this.count);
    })
    .catch(error => {
      console.info('error: ', error);
    });
  }

  openCheckout() {
    var handler = (<any>window).StripeCheckout.configure({
      key: 'pk_test_wMPrYOOxluIkVcmxOjw6uVXb00orXVbFk5',
      locale: 'auto',
      token: function (token: any) {
        // You can access the token ID with `token.id`.
        // Get the token ID to your server-side code for use.
        console.info('token id: ', token.id)
      }
    });

    handler.open({
      name: 'Payment',
      amount: 2000
    });
  }
}

// NUMBER	BRAND	CVC	DATE
// 4242424242424242	Visa	Any 3 digits	Any future date
// 4000056655665556	Visa (debit)	Any 3 digits	Any future date