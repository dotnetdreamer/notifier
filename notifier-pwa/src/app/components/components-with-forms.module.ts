import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { NoDataModule } from './no-data/no-data.module';


@NgModule({
  imports: [
    NoDataModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule
  ],
  declarations: [

  ],
  entryComponents: [

  ],
  exports: [
    NoDataModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule

  ]
})
export class ComponentsWithFormsModule {}
