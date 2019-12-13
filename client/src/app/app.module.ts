import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FlexLayoutModule } from '@angular/flex-layout';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';

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
import {
  NgxSocialButtonModule,
  SocialServiceConfig
} from 'ngx-social-button';

// Configs
export function getAuthServiceConfigs() {
  let config = new SocialServiceConfig()
      .addFacebook('441224926819771')
      // .addGoogle("Your-Google-Client-Id")
      // .addLinkedIn("Your-LinkedIn-Client-Id");
  return config;
}
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CategoryComponent,
    SearchComponent,
    LoginComponent,
    RegisterComponent,
    EntryComponent,
    EntriesComponent,
    AddComponent,
    ContributorsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    NgbModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxSocialButtonModule
  ],
  providers: [myAppService,
    {
      provide: SocialServiceConfig,
      useFactory: getAuthServiceConfigs
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
