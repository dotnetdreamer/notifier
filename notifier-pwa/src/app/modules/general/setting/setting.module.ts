import { NgModule } from '@angular/core';


import { SettingPageRoutingModule } from './setting-routing.module';

import { SettingPage } from './setting.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';

@NgModule({
  imports: [
    PipesModule,
    ComponentsWithFormsModule,
    SettingPageRoutingModule
  ],
  declarations: [SettingPage]
})
export class SettingPageModule {}
