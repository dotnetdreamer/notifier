import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NotificationIgnoredPage } from './notification-ignored.page';

const routes: Routes = [
  {
    path: '',
    component: NotificationIgnoredPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationIgnoredPageRoutingModule {}
