import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-available-apps',
  templateUrl: './available-apps.page.html',
  styleUrls: ['./available-apps.page.scss'],
})
export class AvailableAppsPage implements OnInit {

  constructor(private modalCtrl: ModalController) { 
    
  }

  ngOnInit() {
  }

  async dismiss(data?) {
    await this.modalCtrl.dismiss(data);
  }
}
