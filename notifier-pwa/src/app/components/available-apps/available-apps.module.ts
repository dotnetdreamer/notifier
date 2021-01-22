import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { AvailableAppsPage } from './available-apps.page';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    IonicModule,
    CommonModule
  ],
  declarations: [AvailableAppsPage],
  exports: [AvailableAppsPage]
})
export class AvailableAppsPageModule {}
