import { Component, Inject, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';

const { SplashScreen, StatusBar, Device } = Plugins;
import { Observable } from 'rxjs';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import * as moment from 'moment';

import { AppSettingService } from './modules/shared/app-setting.service';
import { SyncHelperService } from './modules/shared/sync/sync-helper.service';
import { HelperService } from './modules/shared/helper.service';
import { UserService } from './modules/authentication/user.service';
import { UserSettingService } from './modules/authentication/user-setting.service';
import { AppConstant } from './modules/shared/app-constant';
import { SyncConstant } from './modules/shared/sync/sync-constant';
import { UserConstant } from './modules/authentication/user-constant';
import { IUserProfile } from './modules/authentication/user.model';
import { debounceTime } from 'rxjs/operators';
import { LocalizationService } from './modules/shared/localization.service';
import { SystemNotificationListener, SystemNotification } from 'capacitor-notificationlistener';
import { INotification } from './modules/notification/notification.model';
import { NotificationService } from './modules/notification/notification.service';
import { SyncEntity } from './modules/shared/sync/sync.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  workingLanguage;
  appVersion;
  currentUser: IUserProfile;
  
  constructor(
    private router: Router, @Inject(DOCUMENT) private document: Document
    , private renderer: Renderer2, private platform: Platform
      , private pubsubSvc: NgxPubSubService
      , private appSettingSvc: AppSettingService, private syncHelperSvc: SyncHelperService
      , private helperSvc: HelperService
      , private authSvc: UserService, private userSettingSvc: UserSettingService
      , private localizationSvc: LocalizationService, private notificationSvc: NotificationService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this._subscribeToEvents();

    this.platform.ready().then(async () => {
      if(this.platform.is('android')) {
        await this._startListening();
      }
    });
  }

  private async _subscribeToEvents() {
    this.pubsubSvc.subscribe(AppConstant.EVENT_DB_INITIALIZED, async () => {
      if(AppConstant.DEBUG) {
        console.log('Event received: EVENT_DB_INITIALIZED');
      }

      await this._setDefaults();
    });

    this.pubsubSvc.subscribe(AppConstant.EVENT_LANGUAGE_CHANGED, async (params) => {
      if(AppConstant.DEBUG) {
        console.log('EVENT_LANGUAGE_CHANGED', params);
      }
      const { wkLangauge, reload } = params;
      if(reload) {
        SplashScreen.show();

        // make sure we are in root page before reoloading, just incase if user tries to change the language from inner page
        await this._navigateTo('/home', true);
        setTimeout(() => {
          this.document.location.reload(true);
        });
      } else {
        this.document.documentElement.dir = wkLangauge == 'en' ? 'ltr' : 'rtl';   
        this.workingLanguage = wkLangauge;
        
        setTimeout(() => {
          this.renderer.addClass(document.body, wkLangauge);
        });
      }
    });
    
    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH, async (table?) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_SYNC_DATA_PUSH: table:', table);
      }
      await this.syncHelperSvc.push(table);
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL, async (table?) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_SYNC_DATA_PULL: table:', table);
      }
      try {
        await this.syncHelperSvc.pull(table);
      } catch(e) {
        //ignore...
      }
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
      }

      const { appVersion } = await (await Device.getInfo());
      this.appVersion = appVersion;

      try {
        SplashScreen.hide();
      } catch(e) { }
    });

    this.pubsubSvc.subscribe(UserConstant.EVENT_USER_LOGGEDIN
      , async (params: { user: IUserProfile, redirectToHome: boolean, pull: boolean }) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_USER_LOGGEDIN: params', params);
      }

      this.currentUser = params.user;
      if(params.redirectToHome) {
        await this._navigateTo('/home', null, true);
      }

      //sync
      if(params.pull) {
        try {
          //first sync then pull
          // await this.syncHelperSvc.push();
          this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL);
        } catch (e) {
          //ignore
        }
      }
    });
    
    this.pubsubSvc.subscribe(UserConstant.EVENT_USER_LOGGEDOUT, async (args) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_USER_LOGGEDOUT: args', args);
      }
      this.currentUser = null;

      //redirect to login...
      // await this._navigateTo('/user/login', null, true);
    });

    //EVENT_SYNC_DATA_PUSH_COMPLETE is fired by multiple sources, we debounce subscription to execute this once
    const obv = new Observable(observer => {
      //next will call the observable and pass parameter to subscription
      const callback = (params) => observer.next(params);
      const subc = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, callback);
      //will be called when unsubscribe calls
      return () => subc.unsubscribe()
    }).pipe(debounceTime(500))
      .subscribe(async (totalTables) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_SYNC_DATA_PUSH_COMPLETE: totalTables', totalTables);
      }
    });
  }

  private async _setDefaults() {
    // await this._configureWeb();

    const res = await Promise.all([
      this.userSettingSvc.getUserProfileLocal()
      , this.appSettingSvc.getWorkingLanguage()
    ]);

    let wkl = res[1];
    if(!wkl) {
      wkl = 'en';
      await this.appSettingSvc.putWorkingLanguage(wkl);
    }
    this.pubsubSvc.publishEvent(AppConstant.EVENT_LANGUAGE_CHANGED, { wkLangauge: wkl, reload: false });
    this.workingLanguage = wkl;

    
    if(AppConstant.DEBUG) {
      console.log('AppComponent: _setDefaults: publishing EVENT_SYNC_DATA_PULL');
    }
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL);
    await this._navigateTo('/home');
    //user
    /*
    const cUser = res[0];
    if(cUser) {
      this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDIN, { user: cUser });
      await this._navigateTo('/home');
      // await this._navigateTo('/expense/expense-create-or-update', {
      //   groupId: 16
      // });  

      if(AppConstant.DEBUG) {
        console.log('AppComponent: _setDefaults: publishing EVENT_SYNC_DATA_PULL');
      }
      this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL);
    } else {
      // await this._navigateTo('/user/login');
      await this._navigateTo('/home');
    }*/
    // await this._navigateTo('/expense/expense-create-or-update');
    // await this._navigateTo('/expense/expense-listing');
    // await this._navigateTo('/category');
    // await this._navigateTo('/home');
  }

  private async _startListening() {
    const sn = new SystemNotificationListener();
    const isListening = await sn.isListening();

    if(!isListening) {
      try {
        await sn.requestPermission();
      } catch (e) {

      }     
    }
    
    await sn.startListening();

    sn.addListener('notificationReceivedEvent', async (info: SystemNotification) => {
      // console.log('notificationReceivedEvent', info);
      if(AppConstant.IGNORED_PACKAGES.includes(info.package)
        || (!info.text && !info.title)) {
        return;
      }

      const utcTime = moment(info.time).utc(true).format(AppConstant.DEFAULT_DATETIME_FORMAT);

      const notification: INotification = {
        title: info.title,
        text: info.text,
        package: info.package,
        receivedOnUtc: utcTime
      };

      if(AppConstant.DEBUG) {
        console.log('AppComponent: notificationReceivedEvent: notification', notification)
      }

      await this.notificationSvc.putLocal(notification);
      // await this.helperSvc.presentToastGenericSuccess();
  
      //fire after the page navigates away...
      this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION);
    });
    sn.addListener('notificationRemovedEvent', (info: SystemNotification) => {
      console.log('notificationRemovedEvent', info);
    });
  }

  private async _navigateTo(path, args?, replaceUrl = false) {
    if(!args) {
      await this.router.navigate([path], { replaceUrl: replaceUrl });
    } else {
      await this.router.navigate([path, args], { replaceUrl: replaceUrl });
    }
  }

}
