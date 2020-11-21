import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { NoDataModule } from './no-data/no-data.module';

@NgModule({
  imports: [
    NoDataModule,
    CommonModule,
    IonicModule
  ],
  declarations: [
  ],
  entryComponents: [

  ],
  exports: [
    NoDataModule,
    CommonModule,
    IonicModule
  ]
})
export class ComponentsWithOutFormsModule {}
