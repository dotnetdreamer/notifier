import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [ 
    {
        path: 'setting',
        loadChildren: () => import('./setting/setting.module').then( m => m.SettingPageModule)
    } 
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class GeneralCommonModule {}
