import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IonicModule } from "@ionic/angular";

import { PipesModule } from "src/app/pipes/pipes.module";
import { IgnoreOptionsComponent } from "./ignore-options.component";

@NgModule({ 
    imports: [
        PipesModule,
        IonicModule,
        CommonModule
    ],
    declarations: [
        IgnoreOptionsComponent
    ],
    entryComponents: [
  
    ],
    exports: [
        IgnoreOptionsComponent
    ]
  })
  export class IgnoreOptionsModule {}