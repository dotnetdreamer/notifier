import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardPage } from './dashboard.page';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { CalendarSwiperModule } from 'src/app/components/calendar-swiper/calendar-swiper.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    CalendarSwiperModule,
    PipesModule,
    DashboardPageRoutingModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
