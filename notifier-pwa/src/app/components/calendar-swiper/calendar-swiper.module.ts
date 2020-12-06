import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IonicModule } from "@ionic/angular";

import { PipesModule } from '../../pipes/pipes.module';
import { CalendarSwiperComponent } from './calendar-swiper.component';


@NgModule({
    imports: [
        PipesModule,
        IonicModule,
        CommonModule
    ],
    declarations: [
        CalendarSwiperComponent
    ],
    entryComponents: [
  
    ],
    exports: [
        CalendarSwiperComponent
    ]
  })
  export class CalendarSwiperModule {}