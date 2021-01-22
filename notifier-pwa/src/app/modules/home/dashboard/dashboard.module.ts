import { NgModule } from '@angular/core';
import { DashboardPage } from './dashboard.page';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { CalendarSwiperModule } from 'src/app/components/calendar-swiper/calendar-swiper.module';
import { IgnoreOptionsModule } from '../../notification/ignore-options/ignore-options.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    CalendarSwiperModule,
    PipesModule,
    DashboardPageRoutingModule,
    IgnoreOptionsModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
