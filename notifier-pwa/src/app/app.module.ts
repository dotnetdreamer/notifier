import { Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { NgxPubSubModule } from '@pscoped/ngx-pub-sub';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppInjector } from './modules/shared/app-injector';
import { HttpClientModule } from '@angular/common/http';
import { PipesModule } from './pipes/pipes.module';
import { EnvService, EnvServiceProvider } from './modules/shared/env.service';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [ 
    BrowserModule,
    HttpClientModule,
    PipesModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    NgxPubSubModule,
    // AccordionModule, 
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    EnvServiceProvider
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  //avoid multiple instance of injector in case of inheritance
  //https://blogs.msdn.microsoft.com/premier_developer/2018/06/17/angular-how-to-simplify-components-with-typescript-inheritance/
  //https://stackoverflow.com/a/53185632

  //envService read env.js file
  constructor(injector: Injector, private envService: EnvService) {
    AppInjector.setInjector(injector);
  }
}
