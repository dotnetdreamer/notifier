import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { AlertController, IonItemSliding, Platform } from '@ionic/angular';

const { GetAppInfo } = Plugins;
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';
import { NotificationConstant } from '../../notification/notification.constant';

import { INotification } from '../../notification/notification.model';
import { NotificationService } from '../../notification/notification.service';
import { AppConstant } from '../../shared/app-constant';
import { HelperService } from '../../shared/helper.service';


@Component({
  selector: 'page-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage implements OnInit {
  AppConstant = AppConstant;
  notifications: INotification[];
  isAndroid = false;

  constructor(private alertCtrl: AlertController, private platform: Platform
    , private pubSubSvc: NgxPubSubService
    , private notificationSvc: NotificationService, private helperSvc: HelperService) {

    this.pubSubSvc.subscribe(NotificationConstant.EVENT_NOTIFICATION_CREATED_OR_UPDATED, 
      async (notification: INotification) => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage: EVENT_NOTIFICATION_CREATED_OR_UPDATED: notification', notification);
      }

      await this._getAllNotifications();
    });
  }

  
  async ngOnInit() {
    this.isAndroid = this.platform.is('android');

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

  async onNotificationItemClicked(notification: INotification) {
    const txt = notification.text || notification.title;
    await this.helperSvc.presentInfoDialog(txt, notification.title);
  }

  async onLaunchAppClicked(slideItem: IonItemSliding, notification: INotification) {
    if(!this.isAndroid) {
      return;
    }

    try {
      const imgRslt = await (<GetAppInfoPlugin>GetAppInfo).launchApp({
        packageName: notification.package
      });
    } catch(e) {
      await this.helperSvc.presentToast(e);
    } finally {
      await slideItem.close();
    }
  }

  async onIgnoreClicked(slideItem: IonItemSliding, notification: INotification) {
    const alert = await this.alertCtrl.create({
      header: notification.title || notification.text,
      inputs: [
        {
          name: 'message',
          type: 'radio',
          label: 'Similar Message',
          value: 'message',
          checked: true
        },
        {
          name: 'app',
          type: 'radio',
          label: `This App (${notification.package})`,
          value: 'app'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            // console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: (val: 'app' | 'message') => {
            // console.log('Confirm Ok', val);
          }
        }
      ]
    });

    await alert.present();

    setTimeout(async () => {
      await slideItem.close();
    });
  }

  private async _getAllNotifications() {
    const notifications = await this.notificationSvc.getAllLocal();
    this.notifications = notifications;
  }
}