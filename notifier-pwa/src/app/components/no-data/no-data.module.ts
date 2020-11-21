import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IonicModule } from "@ionic/angular";

import { NoDataComponent } from './no-data.component';
import { PipesModule } from '../../pipes/pipes.module';


@NgModule({
    imports: [
        PipesModule,
        IonicModule,
        CommonModule
    ],
    declarations: [
      NoDataComponent
    ],
    entryComponents: [
  
    ],
    exports: [
        NoDataComponent
    ]
  })
  export class NoDataModule {}