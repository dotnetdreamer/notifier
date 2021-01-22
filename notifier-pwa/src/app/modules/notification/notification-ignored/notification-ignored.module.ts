import { NgModule } from '@angular/core';

import { NotificationIgnoredPageRoutingModule } from './notification-ignored-routing.module';

import { NotificationIgnoredPage } from './notification-ignored.page';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { AvailableAppsPageModule } from 'src/app/components/available-apps/available-apps.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    NotificationIgnoredPageRoutingModule,
    AvailableAppsPageModule
  ],
  declarations: [NotificationIgnoredPage]
})
export class NotificationIgnoredPageModule {}
