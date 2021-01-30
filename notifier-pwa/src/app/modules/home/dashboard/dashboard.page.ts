import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { App, Capacitor, Plugins } from '@capacitor/core';
import { AlertController, IonContent, IonItemSliding, IonVirtualScroll, ModalController, Platform } from '@ionic/angular';

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
import { EnvService } from '../../shared/env.service';
import { IgnoreOptionsComponent } from '../../notification/ignore-options/ignore-options.component';


@Component({
  selector: 'page-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('notificationsContent') listingContent: IonContent;
  @ViewChild('virtualScroll') virtualScroll: IonVirtualScroll;

  AppConstant = AppConstant;
  notifications: INotification[] = [];
  totalAvailableNotifications = 0;
  isAndroid = false;
  dates: { _maindDate: { from, to }, selectedDate?: { from, to }, todayDate? } = <any>{};
  dataLoaded = false;
  startupSyncCompleted = false;
  displayHeaderbar = true;
  pageIndex = 1;
  pageSize = 20;
  
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
    this.dates._maindDate = <any>{};
    this.dates.selectedDate = <any>{};
    
    //show all current month expenses
    const fromDate = moment().startOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);
    const toDate = moment().endOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.dates._maindDate.from = fromDate;
    this.dates._maindDate.to = toDate;
    this.dates.selectedDate.from = fromDate;
    this.dates.selectedDate.to = toDate;
  }

  async ngAfterViewInit() {
    await this.listingContent.scrollToTop();

    //fix: navigation lag
    setTimeout(async () => {
      await this._getAllNotifications({ resetDefaults: true });
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
    // //pull latest. Important as other members need to have lastest information
    // this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL, SyncEntity.NOTIFICATION);

    // //now push
    // this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION);

    await this._getAllNotifications({ resetDefaults: true });

    setTimeout(() => {
      detail.complete();
    }, 1000);
  }

  async onLoadMoreClicked() { 
    this.pageIndex++;

    await this._getAllNotifications();
  }

  
  async onMonthChanged(args: { start, end, month }) {
    if(!args) {
      return;
    }

    this.notifications = [];
    this.pageIndex = 1;
    this.totalAvailableNotifications = 0;

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
        
        await this.helperSvc.presentToastGenericSuccess();
        setTimeout(() => {
          this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION);
        });
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

    const loader = await this.helperSvc.loader;
    await loader.present();
  
    try {
      const value: 'app' | 'message' = data.value;
      const rule: 'exact' | 'startsWith' | 'contains' = data.rule;
      const silent = data.silent;

      const item: INotificationIgnored = {
        text: value == 'app' ? notification.package : data.text,
        package: notification.package,
        silent: silent,
        rule: value == 'app' ? null : rule,
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

      toDeleteAll.forEach(p => {
        p.markedForDelete = true;

        const idx = this.notifications.findIndex(n => n.id == p.id);
        if(idx == -1) {
          //notification not visible in screen...
          return;
        }

        this.notifications[idx].markedForDelete = true;
      });
      await this.notificationSvc.putAllLocal(toDeleteAll, true); 

      //sync
      this.pubSubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH);
    }catch(e) {

    } finally {
      await loader.dismiss();
    }
  }

  private async _getAllNotifications(args?: { virtualScrollCheckEnd?, resetDefaults? }) {
    if(!args) {
      args = {};
    }

    if(typeof args.virtualScrollCheckEnd === 'undefined') {
      args.virtualScrollCheckEnd = true;
    }

    if(typeof args.resetDefaults === 'undefined') {
      args.resetDefaults = false;
    }

    //reset
    this.dataLoaded = false;

    if(args.resetDefaults) {
      //force refresh...
      this.totalAvailableNotifications = 0;
      this.pageIndex = 1;
      this.notifications = [];
      this.dates.selectedDate.from = this.dates._maindDate.from;
      this.dates.selectedDate.to = this.dates._maindDate.to;
    }

    const filters = {
      fromDate: this.dates.selectedDate.from,
      toDate: this.dates.selectedDate.to,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };

    this.ngZone.run(async () => {
      const currentMonth = moment().format('M');
      const fromDateMonth = moment(filters.fromDate).format('M');
      const toDateMonth = moment(filters.toDate).format('M');

      try { 
        let result: { data, total };
        //if changed month is not same as current month, then we don't have entries local..
        if(currentMonth != fromDateMonth || currentMonth != toDateMonth) {
          result = <any>await this.notificationSvc.getNotifications(filters);
        } else {
          result = await this.notificationSvc.getAllLocal(filters);
        }

        this.totalAvailableNotifications = result.total;
        this.notifications.push(...result.data);
        // this.notifications = this.notifications.concat(res);
      } catch(e) {
        await this.helperSvc.presentToastGenericError(true);
        // this.notifications = [];
      } finally {
        if(EnvService.DEBUG) {
          console.log('DashboardPage: _getAllNotifications: notifications', this.notifications);
        }

        setTimeout(() => {
          if(args.virtualScrollCheckEnd) {
            this.virtualScroll.checkEnd();
          }
  
          this.dataLoaded = true;
        }, 300);
      }
    });
  }

  private _subscribeToEvents() {
    if(this.platform.is('capacitor')) {
      App.addListener('appStateChange', async (state: { isActive: boolean }) => {
        if(EnvService.DEBUG) {
          console.log('DashboardPage: appStateChange', state);
        }
        //app came to foreground...
        if(state.isActive) {
          await this._getAllNotifications({ 
            virtualScrollCheckEnd: state.isActive,
            resetDefaults: true
          });
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
    .subscribe(async () => {
        if(EnvService.DEBUG) {
          console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
        }
        await this._getAllNotifications({ 
          resetDefaults: true
        });
    });

    //important to add here since the application loads and the view will show but there will be no data...
    //this is needed only when the application runs first time (i.e startup)
    this._syncDataPullCompleteSub = this.pubSubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async (table?) => {
      if(EnvService.DEBUG) {
        console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE: table', table);
      }
      await this._refreshVisibleItems();
      
      //we only need this first time...kill it!
      setTimeout(() => {
        this._syncDataPullCompleteSub.unsubscribe();
        this._syncDataPullCompleteSub = null;
        this.startupSyncCompleted = true;
      });
    });
  }

  //https://stackoverflow.com/a/21988185/15076581
  private _comparer(otherArray: INotification[]) {
    return function(current: INotification){
      return otherArray.filter(function(other){
        return other.text == current.text && other.title == current.title;
      }).length == 0;
    }
  }

  private async _refreshVisibleItems() {
    if(!this.notifications.length) {
      //fetch all
      await this._getAllNotifications({ 
        resetDefaults: true
      });
      return;
    }

    const all = this.notifications.map(async n => {
      const newNot = await this.notificationSvc.getByIdLocal(n.id)
      n = {
        ...newNot
      };
      return n;
    });
    this.notifications = await Promise.all(all);
    this.virtualScroll.checkEnd();
  }
}
