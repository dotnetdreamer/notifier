import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IonicModule } from "@ionic/angular";

import { PipesModule } from "src/app/pipes/pipes.module";
import { IgnoreOptionsComponent } from "./ignore-options.component";
import { FormsModule } from "@angular/forms";

@NgModule({ 
    imports: [
        PipesModule,
        IonicModule,
        CommonModule,
        FormsModule
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