import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { AlertController, IonItemSliding, Platform } from '@ionic/angular';

const { GetAppInfo } = Plugins;
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';
import { Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NotificationConstant } from '../../notification/notification.constant';

import { INotification } from '../../notification/notification.model';
import { NotificationService } from '../../notification/notification.service';
import { AppConstant } from '../../shared/app-constant';
import { HelperService } from '../../shared/helper.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';


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

  private _syncDataPushCompleteSub: Subscription;

  constructor(private alertCtrl: AlertController, private platform: Platform
    , private pubSubSvc: NgxPubSubService
    , private notificationSvc: NotificationService, private helperSvc: HelperService) {

    this._subscribeToEvents();
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

  ngOnDestroy() {
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
  }

  async onIonRefreshed(ev) {
    const { detail } = ev;

    await this._getAllNotifications();

    setTimeout(() => {
      detail.complete();
    }, 300);
  }

  async onNotificationItemClicked(ev: CustomEvent, notification: INotification
    , action: 'detail' | 'edit' | 'delete', slideItem?: IonItemSliding) {
    ev.stopImmediatePropagation();
    
    if(slideItem) {
      await slideItem.close();
    }

    try {
      if(action == 'detail') {
        const txt = notification.text || notification.title;
        await this.helperSvc.presentInfoDialog(txt, notification.title);
      } else if(action == 'delete') {
        const confirm = await this.helperSvc.presentConfirmDialog();
        if(!confirm) {
          return;
        }

        if(notification.markedForAdd) {
          this.notificationSvc.remove(notification.id);
        } else {
          notification.markedForDelete = true;
          notification.updatedOn = null;

          await this.notificationSvc.putLocal(notification);
        }

        this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION);
        await this.helperSvc.presentToastGenericSuccess();
      }
    } catch(e) {
      await this.helperSvc.presentToastGenericError();
    }
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

  private _subscribeToEvents() {
    //EVENT_SYNC_DATA_PUSH_COMPLETE is fired by multiple sources, we debounce subscription to execute this once
    const obv = new Observable(observer => {
      //next will call the observable and pass parameter to subscription
      const callback = (params) => observer.next(params);
      const subc = this.pubSubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, callback);
      //will be called when unsubscribe calls
      return () => subc.unsubscribe()
    });
    this._syncDataPushCompleteSub = obv.pipe(debounceTime(500))
    .subscribe(() => {
        if(AppConstant.DEBUG) {
          console.log('ExpenseListingPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
        }
        //force refresh...
        // this.expenses = [];
        setTimeout(async () => {
          await this._getAllNotifications();
        });
    });

    //important to add here since the application loads and the view will show but there will be no data...
    //this is needed only when the application runs first time (i.e startup)
    // this._syncInitSub = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
    //   if(AppConstant.DEBUG) {
    //     console.log('ExpenseListingPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
    //   }
    //   await this._getExpenses();
    // });
  }
}
