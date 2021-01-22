import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';

const { GetAppInfo } = Plugins;
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';
import { HelperService } from 'src/app/modules/shared/helper.service';

@Component({
  selector: 'app-available-apps',
  templateUrl: './available-apps.page.html',
  styleUrls: ['./available-apps.page.scss'],
})
export class AvailableAppsPage implements OnInit, OnDestroy {
  applications: any[] = [];

  constructor(private modalCtrl: ModalController
    , private helperSvc: HelperService) { 
    
  } 

  async ngOnInit() {
    await this._fet();
  }

  ngOnDestroy() {
    this.applications = null;
  }

  async onNotificationItemClicked(item) {
    const data = {
      name: item.name,
      package: item.package,
      image: item.image
    };

    await this.dismiss(data);
  }

  async dismiss(data?) {
    await this.modalCtrl.dismiss(data);
  }

  private async _fet() { 
    const loader = await this.helperSvc.loader;
    await loader.present();

    try {
      const result = await (<GetAppInfoPlugin>GetAppInfo).getAvailableApps();
      let apps = <any[]>JSON.parse(result.applications);
      apps = apps.sort((a, b ) => {
        if (a.name < b.name ) {
          return -1;
        }
        if (a.name > b.name ) {
          return 1;
        }
        return 0;
      });

      this.applications = apps;
    } catch(e) {
      this.helperSvc.presentToastGenericError();
    } finally {
      await loader.dismiss();
    }
  }
}
