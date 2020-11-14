import { Component, OnInit } from '@angular/core';
import { INotification } from '../../notification/notification.model';

import { NotificationService } from '../../notification/notification.service';

// import { SystemNotification, SystemNotificationListener } from 'capacitor-notificationlistener';

@Component({
  selector: 'page-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss']
})
export class DashboardPage implements OnInit {

  notifications: INotification[];
  constructor(private notificationSvc: NotificationService) {

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

  private async _getAllNotifications() {
    const notifications = await this.notificationSvc.getAllLocal();
    this.notifications = notifications;
  }
}
