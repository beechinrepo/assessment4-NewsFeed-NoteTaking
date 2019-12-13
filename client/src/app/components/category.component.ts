import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {MatBottomSheet, MatBottomSheetRef} from '@angular/material/bottom-sheet';
import { NgForm } from '@angular/forms';
import { myAppService } from '../myApp.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {

  selectedColor = '';
  // colors = [
  //   {
  //     name: 'yellow',
  //     value: '#ffff00'
  //   },
  //   {
  //     name: 'red',
  //     value: '#ff3300'
  //   },
  //   {
  //     name: 'blue',
  //     value: '#0000ff'
  //   }
  // ];

  @ViewChild('imageFile', { static: false })
  imageFile: ElementRef;

  constructor(private bottomSheetRef: MatBottomSheetRef<CategoryComponent>,
              private mySvc: myAppService) { }

  ngOnInit() {
  }

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  onChange(value) {
    this.selectedColor = value;
  }

  submit(form: NgForm) {
  console.info('#imageFile: ', this.imageFile.nativeElement.files);
  console.info('form values: ', form);
  this.mySvc.addCategory(form, this.imageFile)
    .then(() => {
      console.info('added new category')
      form.resetForm();
      // window.location.reload();
    })
    .catch(error => console.error(error));
}


}
