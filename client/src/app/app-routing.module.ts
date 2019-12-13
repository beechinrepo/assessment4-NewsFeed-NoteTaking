import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { myAppService } from './myApp.service';

import { HomeComponent } from './components/home.component';
import { CategoryComponent } from './components/category.component';
import { SearchComponent } from './components/search.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { EntryComponent } from './components/entry.component';
import { EntriesComponent } from './components/entries.component';
import { AddComponent } from './components/add.component';
import { ContributorsComponent } from './components/contributors.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent,
      // route guard has to be a service
      canActivate: [ myAppService ]
  },
  { path: 'category', component: CategoryComponent,
      canActivate: [ myAppService ]
  },
  { path: 'search', component: SearchComponent,
    canActivate: [ myAppService ]
  },
  { path: 'entry/:entryId', component: EntryComponent,
    canActivate: [ myAppService ]
  },
  { path: 'entries/:category', component: EntriesComponent,
    canActivate: [ myAppService ]
  },
  { path: 'add', component: AddComponent,
    canActivate: [ myAppService ]
  },
  { path: 'contributors', component: ContributorsComponent,
    canActivate: [ myAppService ]
  },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
