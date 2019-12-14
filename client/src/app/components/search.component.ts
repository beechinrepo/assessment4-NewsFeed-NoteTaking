import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { myAppService } from '../myApp.service';
import { Router } from '@angular/router';
import {MatBottomSheet, MatBottomSheetRef} from '@angular/material/bottom-sheet';
import { CategoryComponent } from './category.component';

export interface LIMIT {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})

export class SearchComponent implements OnInit {

  limit: LIMIT[] = [
    {value: '5', viewValue: '5'},
    {value: '10', viewValue: '10'},
    {value: '15', viewValue: '15'}
  ];

  public categories: [];
  entries: [];
  search: [];

  @ViewChild('imageFile', { static: false })
  imageFile: ElementRef;

  constructor(private mySvc: myAppService,
              private router: Router,
              private bottomSheet: MatBottomSheet) {}

  ngOnInit() {
    this.mySvc.getCategory()
    .subscribe(data => this.categories = data['result']);
  }

  getEntries(category: string) {
    this.mySvc.getEntriesForCategory(category)
      .then(result => {
        this.entries =  result;
        console.info('category entries: ', this.entries);
      })
      .catch(error => {
        console.info('error: ', error);
      });
  }

  navigateToCategoryEntries(category: string) {
    this.router.navigate(['/entries/' + category]);
  }
  openBottomSheet(): void {
    this.bottomSheet.open(CategoryComponent);
  }

  navigateToViewEntry(entryId: string) {
    this.router.navigate(['/entry/' + entryId]);
  }

  navigateToAddEntry() {
    this.router.navigate(['/add']);
  }
 
  update() {
    this.mySvc.getCategory()
    .subscribe(data => this.categories = data['result']);
  }
  
  processForm(form: NgForm) {
    console.info('form values: ', form.value);
    const term = form.value.term;
    const limit = form.value.limit;
    const offset = form.value.offset;
    this.mySvc.getSearchTerm(term, limit, offset) .then(result => {
      this.search =  result.description;
      console.log('search terms: ', result);
      form.resetForm();
    });
  }
  
}
