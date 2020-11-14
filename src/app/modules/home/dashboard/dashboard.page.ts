import { Component, OnInit } from '@angular/core';

import { SystemNotification, SystemNotificationListener } from 'capacitor-notificationlistener';

@Component({
  selector: 'page-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss']
})
export class DashboardPage implements OnInit {

  constructor() {}

  
  ngOnInit() {
    console.log('starting...');
    const sn = new SystemNotificationListener();
    // sn.requestPermission();
    // sn.startListening();

    // sn.addListener('notificationReceivedEvent', (info: SystemNotification) => {
    //   console.log('notificationReceivedEvent', info);
    // });
    // sn.addListener('notificationRemovedEvent', (info: SystemNotification) => {
    //   console.log('notificationRemovedEvent', info);
    // });
  }
}
