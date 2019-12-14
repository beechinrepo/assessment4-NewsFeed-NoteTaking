import { Component, OnInit} from '@angular/core';
import { myAppService } from '../myApp.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-entries',
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css']
})
export class EntriesComponent implements OnInit {

  entries: [];

  constructor(private mySvc: myAppService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
    const selectedCategory = this.route.snapshot.paramMap.get('category');
    this.mySvc.getEntriesForCategory(selectedCategory)
      .then(result => {
        this.entries = result['entries'];
        console.info('category entries: ', this.entries);
      })
      .catch(error => {
        console.info('error: ', error);
      });
  }

  navigateToViewEntry(entryId: string) {
    this.router.navigate(['/entry/' + entryId]);
  }
}

