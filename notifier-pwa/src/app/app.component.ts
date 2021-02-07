import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@ionic/angular';
import { DeviceInfo, Plugins } from '@capacitor/core';

const { GetAppInfo } = Plugins;
const { SplashScreen, StatusBar, Device } = Plugins;
import { Observable } from 'rxjs';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import * as moment from 'moment';
import { debounceTime } from 'rxjs/operators';
import { SystemNotificationListener, SystemNotification } from 'capacitor-notificationlistener';
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';

import { AppSettingService } from './modules/shared/app-setting.service';
import { SyncHelperService } from './modules/shared/sync/sync-helper.service';
import { HelperService } from './modules/shared/helper.service';
import { UserService } from './modules/authentication/user.service';
import { UserSettingService } from './modules/authentication/user-setting.service';
import { AppConstant } from './modules/shared/app-constant';
import { SyncConstant } from './modules/shared/sync/sync-constant';
import { UserConstant } from './modules/authentication/user-constant';
import { IUserProfile } from './modules/authentication/user.model';
import { LocalizationService } from './modules/shared/localization.service';
import { INotification, INotificationIgnored } from './modules/notification/notification.model';
import { NotificationService } from './modules/notification/notification.service';
import { SyncEntity } from './modules/shared/sync/sync.model';
import { NotificationIgnoredService } from './modules/notification/notification-ignored.service';
import { NotificationSettingService } from './modules/notification/notification-setting.service';
import { NotificationConstant } from './modules/notification/notification.constant';
import { EnvService } from './modules/shared/env.service';
import { AppInfoService } from './modules/app-info/app-info.service';
import { IAppInfo } from './modules/app-info/app-info.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  workingLanguage;
  appVersion;
  currentUser: IUserProfile;
  
  private _deviceInfo: DeviceInfo;
  private _systemNotificationListener: SystemNotificationListener;
  
  constructor(
    private router: Router, @Inject(DOCUMENT) private document: Document
    , private renderer: Renderer2, private platform: Platform
      , private pubsubSvc: NgxPubSubService
      , private appSettingSvc: AppSettingService, private syncHelperSvc: SyncHelperService
      , private helperSvc: HelperService
      , private authSvc: UserService, private userSettingSvc: UserSettingService
      , private localizationSvc: LocalizationService, private notificationSvc: NotificationService
      , private notificationIgnoredSvc: NotificationIgnoredService
      , private notificationSettingSvc: NotificationSettingService
      , private appInfoSvc: AppInfoService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this._subscribeToEvents();

    this.platform.ready().then(async () => {
    });
  }

  async ngOnInit() {
    this._deviceInfo = await Device.getInfo();
  }

  private async _subscribeToEvents() {
    this.pubsubSvc.subscribe(AppConstant.EVENT_DB_INITIALIZED, async () => {
      if(EnvService.DEBUG) {
        console.log('Event received: EVENT_DB_INITIALIZED');
      }
      
      await this._setDefaults();

      if(this.platform.is('capacitor')) {
        if(EnvService.DEBUG) {
          console.log('AppComponent: _subscribeToEvents: Ignoring BatteryOptimizations');
        }

        const sn = new SystemNotificationListener();
        if(EnvService.DEBUG) {
          console.log('AppComponent: _subscribeToEvents: Requesting permission');
        }
        this._requestPermission(sn)
        .then(async (pResult) => {
          if(pResult) {
            if(EnvService.DEBUG) {
              console.log('AppComponent: _subscribeToEvents: Starting listening');
            }
            await this._startListening(sn);
            this._systemNotificationListener = sn;

            //request overlay permission for reboot receiver
            await this._requestSystemAlertWindowPermission(sn);
          }
        });
      }

    });

    this.pubsubSvc.subscribe(AppConstant.EVENT_LANGUAGE_CHANGED, async (params) => {
      if(EnvService.DEBUG) {
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
    
    this.pubsubSvc.subscribe(NotificationConstant.EVENT_NOTIFICATION_IGNORED_CREATED_OR_UPDATED
      , async (args: INotificationIgnored) => {
      if(EnvService.DEBUG) {
        console.log('AppComponent:EVENT_NOTIFICATION_IGNORED_CREATED_OR_UPDATED', args);
      }

      //refresh blacklist...
      if(!this._systemNotificationListener) {
        return;
      }

      const bList = await this.notificationIgnoredSvc.getBlackList();
      this._systemNotificationListener.setBlackList(bList);
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH, async (table?) => {
      if(EnvService.DEBUG) {
        console.log('AppComponent: EVENT_SYNC_DATA_PUSH: table:', table);
      }
      await this.syncHelperSvc.push(table);
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL, async (table?) => {
      if(EnvService.DEBUG) {
        console.log('AppComponent: EVENT_SYNC_DATA_PULL: table:', table);
      }
      try {
        await this.syncHelperSvc.pull(table);
      } catch(e) {
        //ignore...
      }
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async (table?) => {
      if(EnvService.DEBUG) {
        console.log('AppComponent:Event received: EVENT_SYNC_DATA_PULL_COMPLETE: table', table);
      }
      const { appVersion } = await (await Device.getInfo());
      this.appVersion = appVersion;

      try {
        SplashScreen.hide();
      } catch(e) { }
    });

    this.pubsubSvc.subscribe(UserConstant.EVENT_USER_LOGGEDIN
      , async (params: { user: IUserProfile, redirectToHome: boolean, pull: boolean }) => {
      if(EnvService.DEBUG) {
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
      if(EnvService.DEBUG) {
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
      if(EnvService.DEBUG) {
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

      //should be done only from mobile
      if(this.platform.is('capacitor')) {
        //ignore system notifications
        this.notificationSettingSvc.putIgnoreSystemAppsNotificationEnabled(true);
        //ignore empty messages
        this.notificationSettingSvc.putIgnoreEmptyMessagesEnabled(true);

        //put sample data
        this.syncHelperSvc.syncSampleData();
      }
    }
    this.pubsubSvc.publishEvent(AppConstant.EVENT_LANGUAGE_CHANGED, { wkLangauge: wkl, reload: false });
    this.workingLanguage = wkl;
    
    if(EnvService.DEBUG) {
      console.log('AppComponent: _setDefaults: publishing EVENT_SYNC_DATA_PULL');
    }    
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL);
    //user
    /*
    const cUser = res[0];
    if(cUser) {
      this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDIN, { user: cUser });
      await this._navigateTo('/home');
      // await this._navigateTo('/expense/expense-create-or-update', {
      //   groupId: 16
      // });  

      if(EnvService.DEBUG) {
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
    await this._navigateTo('/home');
  }

  private async _requestPermission(sn: SystemNotificationListener) {
    return new Promise<boolean>((resolve, reject) => {
      let isFirstTime = true;
      const tim = 50;

      let t = setTimeout(async function check() {
        const hasPermission = await sn.hasPermission();
        if(!hasPermission) {
          if(isFirstTime) {
            await sn.requestPermission();  
            isFirstTime = false;
          }

          t = setTimeout(check, tim);  
        } else {
          clearTimeout(t);
          resolve(true);
        }
      }, tim);
    });
  }

  private async _requestSystemAlertWindowPermission(sn: SystemNotificationListener) {
    return new Promise<boolean>(async (resolve, reject) => {
      const hasPm = await sn.hasSystemAlertWindowPermission();
      if(!hasPm) {
        await sn.requestSystemAlertWindowPermission();
      }

      resolve();
    });
  }

  private async _startListening(sn: SystemNotificationListener) {
    // const isListening = await sn.isListening();
    // if(!isListening) {
      await sn.startListening();
    // }

    //blacklist/ignored  
    const bList = await this.notificationIgnoredSvc
      .getBlackList();
    sn.setBlackList(bList);

    sn.addListener('notificationReceivedEvent', async (info: SystemNotification) => {
      //ignore current app...
      if(this._deviceInfo.appId == info.package) {
        if(EnvService.DEBUG) {
          console.log(`Ignoring: ${info.package} is same as ${this._deviceInfo.appId}`);
        }
        return;
      }
     
      const result = await Promise.all([
        this.notificationSettingSvc.getIgnoreEmptyMessagesEnabled()
        , this.notificationSettingSvc.getIgnoreSystemAppsNotificationEnabled()
        , this.notificationIgnoredSvc.getByTextLocal(info.package)
        , this.notificationIgnoredSvc.getByTextLocal(info.text)
        , this.notificationSvc.getByTextLocal(info.text)
      ]);
      const ignoreEmptyMessages = result[0];
      if(ignoreEmptyMessages && !(info.text?.length || info.text?.trim().length)) {
        return;
      }

      const ignoreSystemApps = result[1];
      if(ignoreSystemApps) {
        //check if it can be launched
        let canLaunchApp = true;
        try {
          await (<GetAppInfoPlugin>GetAppInfo).canLaunchApp({
            packageName: info.package
          });
        } catch(e) {
          canLaunchApp = false;
        }

        if(!canLaunchApp) {
          if(EnvService.DEBUG) {
            console.log(`Ignoring: ${info.package} is cannot be launched and is system app`);
          }
          //nope! ignore and return!
          return;
        }
      }

      const packageIgnored = result[2];
      if(packageIgnored) {
        if(EnvService.DEBUG) {
          console.log(`Ignoring: ${info.package} is added to ignore list via package`);
        }
        return;
      }

      const textIgnored = result[3];
      if(textIgnored && textIgnored.package == info.package) {
        if(EnvService.DEBUG) {
          console.log(`Ignoring: ${info.package} is added to ignore list via text: ${info.text}`);
        }
        return;
      }

      //duplicate check. Do not capture same messages arrived in 5min
      let exitingNots = <INotification[]>result[4];
      if(exitingNots.length) {
        //check recent one
        exitingNots = exitingNots.sort((a, b) => b.id - a.id);
        const exitingNotForCurrentPkg = exitingNots.filter(n => n.package == info.package)[0];
        //if not is there for same package, then make sure there is at least 5min time difference
        if(exitingNotForCurrentPkg) {
          const start = moment.utc(exitingNotForCurrentPkg.createdOn).local(false);
          const end =  moment(info.time);
          const duration = moment.duration(end.diff(start));
          const minsOfDifference = duration.asMinutes();
          if(minsOfDifference < 5) {
            return;
          }
        }
      }

      const utcTime = moment(info.time).utc(true).format(AppConstant.DEFAULT_DATETIME_FORMAT);
      const notification: INotification = {
        title: info.title,
        text: info.text,
        package: info.package,
        receivedOnUtc: utcTime
      };

      let image, appName;
      try {
        const iconAppNameRslt = await Promise.all([
          (<GetAppInfoPlugin>GetAppInfo).getAppIcon({ packageName: notification.package })
          , (<GetAppInfoPlugin>GetAppInfo).getAppLabel({ packageName: notification.package })
        ]);

        //icon
        if(iconAppNameRslt[0].value) {
          image = iconAppNameRslt[0].value;
        }

        //app name
        if(iconAppNameRslt[1].value) {
          appName = iconAppNameRslt[1].value;
        }
      } catch(e) {
        //ignore...
      }
 
      const promises = [];
      if(image && appName) {
        const appInfo: IAppInfo = {
          appName: appName,
          image: image,
          package: notification.package
        };
        //for now no need to fire event
        promises.push(this.appInfoSvc.addOrUpdate(appInfo, true));
      }

      if(EnvService.DEBUG) {
        console.log('AppComponent: notificationReceivedEvent: notification', notification)
      }
      promises.push(this.notificationSvc.putLocal(notification));

      //save all
      await Promise.all(promises);
  
      //fire after the page navigates away...
      this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.APP_INFO);
      this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.NOTIFICATION);
    });

    sn.addListener('notificationRemovedEvent', async (info: SystemNotification) => {
      //ignore current app...
      if(this._deviceInfo.appId == info.package) {
        return;
      }

      if(EnvService.DEBUG) {
        console.log(`notificationRemovedEvent`, info);
      }
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
