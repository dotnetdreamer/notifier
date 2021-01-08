import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { App, Capacitor, Plugins } from '@capacitor/core';
import { AlertController, IonContent, IonItemSliding, ModalController, Platform } from '@ionic/angular';

const { GetAppInfo } = Plugins;
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';
import { Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as moment from 'moment';

import { INotification, INotificationIgnored } from '../../notification/notification.model';
import { NotificationService } from '../../notification/notification.service';
import { AppConstant } from '../../shared/app-constant';
import { HelperService } from '../../shared/helper.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { NotificationIgnoredService } from '../../notification/notification-ignored.service';
import { IgnoreOptionsComponent } from './ignore-options/ignore-options.component';


@Component({
  selector: 'page-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('listingContent') listingContent: IonContent;

  AppConstant = AppConstant;
  notifications: INotification[] = [];
  isAndroid = false;
  dates: { selectedDate?: { from, to, fromTime?, toTime? }, todayDate? } = {};
  dataLoaded = false;
  displayHeaderbar = true;

  private _syncDataPushCompleteSub: Subscription;
  private _syncDataPullCompleteSub: Subscription;

  constructor(private ngZone: NgZone
    , private alertCtrl: AlertController, private platform: Platform
    , private modalCtrl: ModalController
    , private pubSubSvc: NgxPubSubService
    , private notificationSvc: NotificationService, private notificationIgnoredSvc: NotificationIgnoredService
    , private helperSvc: HelperService) {

    this._subscribeToEvents();
  }

  
  async ngOnInit() {
    this.isAndroid = this.platform.is('android') && this.platform.is('capacitor');

    this.dates.todayDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.dates.selectedDate = <any>{};
    
    //show all current month expenses
    const fromDate = moment().startOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);
    const toDate = moment().endOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.dates.selectedDate.from = fromDate;
    this.dates.selectedDate.to = toDate;
  }

  ngAfterViewInit() {
    //fix: navigation lag
    setTimeout(async () => {
      await this._getAllNotifications();
    });
  }

  ngOnDestroy() {
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }

    if(this._syncDataPullCompleteSub) {
      this._syncDataPullCompleteSub.unsubscribe();
    }
  }

  async onIonRefreshed(ev) {
    const { detail } = ev;
    this.notifications = [];

    // //pull latest. Important as other members need to have lastest information
    // this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL, SyncEntity.NOTIFICATION);

    // //now push
    // this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION);

    await this._getAllNotifications();

    setTimeout(() => {
      detail.complete();
    }, 1000);
  }

  
  async onMonthChanged(args: { start, end, month }) {
    if(!args) {
      return;
    }

    this.dataLoaded = false;
    this.notifications = [];
    //reset scroll
    await this.listingContent.scrollToTop(0);

    const loader = await this.helperSvc.loader;
    await loader.present();

    try {
      this.dates.selectedDate =  {
        from: args.start,
        to: args.end
      };
      await this._getAllNotifications();
    } catch (e) {
      await this.helperSvc.presentToast(e, false);
    } finally {
      setTimeout(async () => {
        await loader.dismiss();
      }, 1000);
    }
  }

  onIonScrolling(ev: CustomEvent) {
    const { scrollTop } = ev.detail;
    const top = 180;
    if(scrollTop > top) {
      this.displayHeaderbar = false;
    } else if(scrollTop <= 0) {
      this.displayHeaderbar = true;
    }
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
          await this.notificationSvc.remove(notification.id);
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
      await (<GetAppInfoPlugin>GetAppInfo).launchApp({
        packageName: notification.package
      });
    } catch(e) {
      await this.helperSvc.presentToast(e);
    } finally {
      await slideItem.close();
    }
  }

  async onIgnoreClicked(slideItem: IonItemSliding, notification: INotification) {
    setTimeout(async () => {
      await slideItem.close();
    });

    const modal = await this.modalCtrl.create({
      component: IgnoreOptionsComponent,
      componentProps: {
        notification: notification
      },
      cssClass: 'ignore-options-modal',
      backdropDismiss: false
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if(!data) {
      return;
    }
    
    const value: 'app' | 'message' = data.value;
    const rule: 'exact' | 'startsWith' | 'contains' = data.rule;

    const item: INotificationIgnored = {
      text: value == 'app' ? notification.package : notification.text,
      package: notification.package,
      rule: value == 'app' ? null : rule,
      image: notification.image,
      appName: notification.appName,
      markedForAdd: true
    };
    //event must be fired so we can refresh blacklist in app.component
    await this.notificationIgnoredSvc.putLocal(item, false);

    //delete from notifications
    let toDeleteAll: INotification[] = [];
    if(value == 'app') {
      toDeleteAll = <INotification[]>await this.notificationSvc.getByPackageLocal(notification.package);
    } else if(value == 'message') {
      toDeleteAll = <INotification[]>await this.notificationSvc.getByTextLocal(notification.text);
    }
    toDeleteAll.forEach(p => p.markedForDelete = true);
    await this.notificationSvc.putAllLocal(toDeleteAll, true); 

    //sync
    this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH);
  }

  private async _getAllNotifications() {
    //reset
    await this.listingContent.scrollToTop();
    this.dataLoaded = false;

    const filters = {
      fromDate: this.dates.selectedDate.from,
      toDate: this.dates.selectedDate.to,
      // fromTime: this.dates.selectedDate.fromTime,
      // toTime: this.dates.selectedDate.toTime
    };

    // const notifications = await this.notificationSvc.getAllLocal(filters)
    // this.notifications = notifications;

    this.ngZone.run(async () => {
      const currentMonth = moment().format('M');
      const fromDateMonth = moment(filters.fromDate).format('M');
      const toDateMonth = moment(filters.toDate).format('M');

      try {
        //if changed month is not same as current month, then we don't have entries local..
        if(currentMonth != fromDateMonth || currentMonth != toDateMonth) {
          this.notifications = await this.notificationSvc.getNotifications(filters);
        } else {
          this.notifications = await this.notificationSvc.getAllLocal(filters);
        }
      } catch(e) {
        this.notifications = [];
      } finally {
        if(AppConstant.DEBUG) {
          console.log('DashboardPage: _getAllNotifications: notifications', this.notifications);
        }
        this.dataLoaded = true;
      }
    });
  }

  private _subscribeToEvents() {
    if(this.platform.is('capacitor')) {
      App.addListener('appStateChange', async (state: { isActive: boolean }) => {
        if(AppConstant.DEBUG) {
          console.log('DashboardPage: appStateChange', state);
        }
        //app came to foregroud...
        if(state.isActive) {
          await this._getAllNotifications();
        }
      });
    }


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
          console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
        }
        //force refresh...
        // this.expenses = [];
        setTimeout(async () => {
          await this._getAllNotifications();
        });
    });

    //important to add here since the application loads and the view will show but there will be no data...
    //this is needed only when the application runs first time (i.e startup)
    this._syncDataPullCompleteSub = this.pubSubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
      }
      await this._getAllNotifications();
      //we only need this first time...kill it!
      setTimeout(() => {
        this._syncDataPullCompleteSub.unsubscribe();
        this._syncDataPullCompleteSub = null;
      });
    });
  }
}
