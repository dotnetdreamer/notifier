import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'general',
    loadChildren: () => import('./modules/general/general.common.module').then( m => m.GeneralCommonModule)
  },
  {
    path: 'app-info',
    loadChildren: () => import('./modules/app-info/app-info.module').then( m => m.AppInfoPageModule)
  }
]; 
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
