import { Component, ViewChild } from '@angular/core';
import { IonTabs } from '@ionic/angular';
import { AppConstant } from '../shared/app-constant';
import { BasePage } from '../shared/base.page';
import { EnvService } from '../shared/env.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage extends BasePage {
  @ViewChild('homeTabs') homeTabs : IonTabs;

  selectedTab = 'dashboard';
  
  constructor() {
    super();
  }

  async onTabClicked(selectedTab) {
    this.selectedTab = selectedTab;
    if(EnvService.DEBUG) {
      console.log('selectedTab', this.selectedTab);
    }

    if(selectedTab === 'home') {
      await this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      // const canActivate = await this.userSettingSvc.canActivate();
      // if(!canActivate) {
      //   return;
      // }
      
      this.homeTabs.select(selectedTab);
    }
  }
}
