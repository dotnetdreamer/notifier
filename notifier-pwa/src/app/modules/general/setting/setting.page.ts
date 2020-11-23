import { Component, OnInit, ViewEncapsulation, Inject, OnDestroy, ViewChild } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { DbService } from '../../shared/db/db-base.service';
import { AppInjector } from '../../shared/app-injector';
import { Platform, IonTextarea } from '@ionic/angular';
import { DbWebService } from '../../shared/db/db-web.service';
import { DOCUMENT } from '@angular/common';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { Subscription } from 'rxjs';
import { AppConstant } from '../../shared/app-constant';
import { SchemaService } from '../../shared/db/schema.service';
import { IUser, UserRole } from '../../authentication/user.model';
import { UserService } from '../../authentication/user.service';

@Component({
  selector: 'page-general-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingPage extends BasePage implements OnInit, OnDestroy {
  @ViewChild('tableDataTextArea') tableDataTextArea: IonTextarea;

  dbSvc: DbService;
  schemaSvc: SchemaService;

  isSyncInProgress = false;
  selectedTable;
  tables: string[] = [];

  currentUser: IUser;
  UserRole = UserRole;
  
  private _syncDataPushCompleteSub: Subscription;

  constructor(private platform: Platform, @Inject(DOCUMENT) private document: Document
    , private userSvc: UserService) { 
    super();

    this._subscribeToEvents();
    const injector = AppInjector.getInjector();
    // if(this.platform.is('cordova')) {
    //   this.dbService = injector.get(DbSqlService);
    // } else {
      this.dbSvc = injector.get(DbWebService);
    // }
    this.schemaSvc = injector.get(SchemaService);
  }

  async ngOnInit() {
    for(let tab in this.schemaSvc.tables) {
      this.tables.push(this.schemaSvc.tables[tab]);
    }

    this.currentUser = await this.userSettingSvc.getUserProfileLocal();
  }

  async onTableSelectionChanged() {
    const data = await this.dbSvc.getAll<any[]>(this.selectedTable);
    if(!data) {
      this.tableDataTextArea.value = '';
    } else {
      this.tableDataTextArea.value = JSON.stringify(data);
    }
  }

  async onTableActionClicked(action: 'update' | 'reset') {
    if(action == 'update') {
      const res = await this.helperSvc.presentConfirmDialog();
      if(!res) {
        return;
      }

      try {
        let data = this.tableDataTextArea.value;
        if(data && data.length) {
          data = JSON.parse(this.tableDataTextArea.value);

          //remove all first
          await this.dbSvc.removeAll(this.selectedTable);
          //now update it...
          await this.dbSvc.putLocal(this.selectedTable, data);
        } else {
          //remove it...
          await this.dbSvc.removeAll(this.selectedTable);
        }
      } catch (e) {
        await this.helperSvc.presentToast(e, false);
      }
    } else if(action == 'reset') {
      this.tableDataTextArea.value = null;

      setTimeout(async () => {
        await this.onTableSelectionChanged();
      });
    }
  }

  async onSyncButtonClicked() {
    this.isSyncInProgress = true;
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH);
  }

  async onDeleteDbClickec() {
    const res = await this.helperSvc.presentConfirmDialog();
    if(res) {
      await this.dbSvc.delete();
      await this._reload();
    }
  }

  async ngOnDestroy() {
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
  }

  async onItemClicked(url, timeout?) {
    setTimeout(async () => {
      switch(url) {
        default:
          await this.navigate({ path: url });
        break;
      }
    }, typeof timeout !== 'undefined' ? timeout : 300);
  }

  private _subscribeToEvents() {
    this._syncDataPushCompleteSub = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('SettingPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
      }
      setTimeout(async () => {
        this.isSyncInProgress = false;
      });
    });
  }

  private async _reload() {
    await this.navigateToHome();
    this.document.location.reload(true);
  }
}
