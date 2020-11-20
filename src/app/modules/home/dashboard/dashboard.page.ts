import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { NotificationConstant } from '../../notification/notification.constant';

import { INotification } from '../../notification/notification.model';
import { NotificationService } from '../../notification/notification.service';
import { AppConstant } from '../../shared/app-constant';


@Component({
  selector: 'page-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage implements OnInit {
  AppConstant = AppConstant;
  notifications: INotification[];

  constructor(private pubSubSvc: NgxPubSubService
    , private notificationSvc: NotificationService) {

    this.pubSubSvc.subscribe(NotificationConstant.EVENT_NOTIFICATION_CREATED_OR_UPDATED, 
      async (notification: INotification) => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage: EVENT_NOTIFICATION_CREATED_OR_UPDATED: notification', notification);
      }

      await this._getAllNotifications();
    });
  }

  
  async ngOnInit() {
    await this._getAllNotifications();
    // console.log('starting...');
    // const sn = new SystemNotificationListener();
    // sn.isListening();
    // // sn.requestPermission();
    // // sn.startListening();

    // // sn.addListener('notificationReceivedEvent', (info: SystemNotification) => {
    // //   console.log('notificationReceivedEvent', info);
    // // });
    // // sn.addListener('notificationRemovedEvent', (info: SystemNotification) => {
    // //   console.log('notificationRemovedEvent', info);
    // // });
  }

  async onIonRefreshed(ev) {
    const { detail } = ev;

    await this._getAllNotifications();

    setTimeout(() => {
      detail.complete();
    }, 300);
  }

  private async _getAllNotifications() {
    const notifications = await this.notificationSvc.getAllLocal();
    this.notifications = notifications;
  }
}
