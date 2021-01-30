import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { IonContent, IonItemSliding, ModalController, Platform } from '@ionic/angular';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

import { Subscription } from 'rxjs';
import { AvailableAppsPage } from 'src/app/components/available-apps/available-apps.page';

import { AppConstant } from '../../shared/app-constant';
import { EnvService } from '../../shared/env.service';
import { HelperService } from '../../shared/helper.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { IgnoreOptionsComponent } from '../ignore-options/ignore-options.component';
import { NotificationIgnoredService } from '../notification-ignored.service';
import { INotification, INotificationIgnored } from '../notification.model';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'page-notification-ignored',
  templateUrl: './notification-ignored.page.html',
  styleUrls: ['./notification-ignored.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationIgnoredPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('listingNotificationIgnoredContent') listingContent: IonContent;

  AppConstant = AppConstant;
  notifications: INotificationIgnored[] = [];
  isAndroid = false;
  dataLoaded = false;
  displayHeaderbar = true;

  private _syncDataPushCompleteSub: Subscription;

  constructor(private ngZone: NgZone
    , private modalCtrl: ModalController, private platform: Platform
    , private notificationIgnoredSvc: NotificationIgnoredService, private helperSvc: HelperService
    , private notificationSvc: NotificationService
    , private pubSubSvc: NgxPubSubService) { 

      this._subscribeToEvents();
    }

  ngOnInit() {
    this.isAndroid = this.platform.is('android') && this.platform.is('capacitor');
  }

  ngAfterViewInit() {
    //fix: navigation lag
    setTimeout(async () => {
      await this._getAllNotifications();
    }, 300);
  }

  ngOnDestroy() {
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
  }

  async onAddNewClicked() { 
    if(!this.isAndroid) {
      return;
    }

    const modalAp = await this.modalCtrl.create({
      component: AvailableAppsPage,
      cssClass: 'available-apps-modal',
      backdropDismiss: false
    });
    await modalAp.present();
    const resultAp = await modalAp.onDidDismiss();
    if(!resultAp.data) {
      return;
    }
    
    const modalIo = await this.modalCtrl.create({
      component: IgnoreOptionsComponent,
      componentProps: {
        notification: {
          title: resultAp.data.name,
          package: resultAp.data.package,
          text: `Type your message here...`
        }
      },
      cssClass: 'ignore-options-modal',
      backdropDismiss: false
    });
    await modalIo.present();
    const resultIo = await modalIo.onDidDismiss();
    if(!resultIo.data) {
      return;
    }

    const value: 'app' | 'message' = resultIo.data.value;
    const rule: 'exact' | 'startsWith' | 'contains' = resultIo.data.rule;
    const silent = resultIo.data.silent;
    const item: INotificationIgnored = {
      text: value == 'app' ? resultAp.data.package : resultIo.data.text,
      package: resultAp.data.package,
      silent: silent,
      rule: value == 'app' ? null : rule,
      markedForAdd: true
    };

    //event must be fired so we can refresh blacklist in app.component
    await this.notificationIgnoredSvc.putLocal(item, false);

    //delete from notifications
    let toDeleteAll: INotification[] = [];
    if(value == 'app') {
      toDeleteAll = <INotification[]>await this.notificationSvc.getByPackageLocal(item.package);
    } else if(value == 'message') {
      toDeleteAll = <INotification[]>await this.notificationSvc.getByTextLocal(item.text);
    }
    toDeleteAll.forEach(p => p.markedForDelete = true);
    await this.notificationSvc.putAllLocal(toDeleteAll, true); 

    //sync
    this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH);
  }
  
  async onNotificationItemClicked(ev: CustomEvent, notification: INotificationIgnored
    , action: 'detail' | 'edit' | 'delete', slideItem?: IonItemSliding) {
    ev.stopImmediatePropagation();

    if(slideItem) {
      await slideItem.close();
    }

    try {
      if(action == 'detail') {
        const txt = notification.text;
        await this.helperSvc.presentInfoDialog(txt);
      } else if(action == 'delete') {
        const confirm = await this.helperSvc.presentConfirmDialog();
        if(!confirm) {
          return;
        }

        if(notification.markedForAdd) {
          await this.notificationIgnoredSvc.remove(notification.id);
        } else {
          notification.markedForDelete = true;
          notification.updatedOn = null;

          await this.notificationIgnoredSvc.putLocal(notification);
        }
        await this.helperSvc.presentToastGenericSuccess();
        
        setTimeout(() => {
          this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION_IGNORED);
        });
      }
    } catch(e) {
      await this.helperSvc.presentToastGenericError();
    }
  }


  private async _getAllNotifications() {
    //reset
    await this.listingContent.scrollToTop();
    this.dataLoaded = false;

    this.ngZone.run(async () => {
      try {
        this.notifications = await this.notificationIgnoredSvc.getAllLocal();
      } catch(e) {
        this.notifications = [];
      } finally {
        if(EnvService.DEBUG) {
          console.log('NotificationIgnoredPage: _getAllNotifications: notifications', this.notifications);
        }
        this.dataLoaded = true;
      }
    });
  }

  private _subscribeToEvents() {
    this._syncDataPushCompleteSub = this.pubSubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, async (table?) => {
      if(EnvService.DEBUG) {
        console.log('NotificationIgnoredPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE: table', table);
      }
      await this._getAllNotifications();
    });
  }
}
