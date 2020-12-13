import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { IonContent, IonItemSliding } from '@ionic/angular';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

import { Subscription } from 'rxjs';

import { AppConstant } from '../../shared/app-constant';
import { HelperService } from '../../shared/helper.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { NotificationIgnoredService } from '../notification-ignored.service';
import { INotificationIgnored } from '../notification.model';

@Component({
  selector: 'app-notification-ignored',
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
    , private notificationIgnoredSvc: NotificationIgnoredService, private helperSvc: HelperService
    , private pubSubSvc: NgxPubSubService) { }

  ngOnInit() {
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

        notification.markedForDelete = true;
        notification.updatedOn = null;

        await this.notificationIgnoredSvc.putLocal(notification);

        this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION_IGNORED);
        await this.helperSvc.presentToastGenericSuccess();
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
        if(AppConstant.DEBUG) {
          console.log('NotificationIgnoredPage: _getAllNotifications: notifications', this.notifications);
        }
        this.dataLoaded = true;
      }
    });
  }

}
