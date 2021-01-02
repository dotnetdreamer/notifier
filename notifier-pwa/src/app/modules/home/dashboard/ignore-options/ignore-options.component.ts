import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { IonList, ModalController } from "@ionic/angular";
import { INotification } from "src/app/modules/notification/notification.model";
import { HelperService } from "src/app/modules/shared/helper.service";

@Component({
    selector: 'ignore-options',
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-title>{{ notification.title || notification.text }}</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-radio-group [value]="selectedValue" 
                    (ionChange)="onMessageTypeChanged($event)">
                    <ion-item *ngFor="let opt of options">
                        <ion-label class="ion-text-wrap">{{opt.label}}</ion-label>
                        <ion-radio slot="start" [value]="opt.value" mode="ios"></ion-radio>
                    </ion-item>
                </ion-radio-group>
            </ion-list>
            <ion-list *ngIf="selectedValue == 'message'" #matchingRuleList>
                <ion-radio-group [value]="selectedRule" 
                    (ionChange)="onMessageRuleChanged($event)">
                    <ion-list-header>
                        <ion-label>
                            Matching Rule
                        </ion-label>
                    </ion-list-header>
                    <ion-item>
                        <ion-label>Exactly this message</ion-label>
                        <ion-radio value="exact" mode="ios"></ion-radio>
                    </ion-item>
                    <ion-item>
                        <ion-label>Starts With this message</ion-label>
                        <ion-radio value="startsWith" mode="ios"></ion-radio>
                    </ion-item>
                    <ion-item>
                        <ion-label>Contains this message</ion-label>
                        <ion-radio value="contains" mode="ios"></ion-radio>
                    </ion-item>
                </ion-radio-group>
            </ion-list>
        </ion-content>
        <ion-footer>
            <ion-toolbar>
                <ion-buttons slot="end">
                    <ion-button (click)="onOkButtonClicked()">
                        <ion-label>OK</ion-label>
                    </ion-button>
                    <ion-button (click)="dismiss(null)">
                        <ion-label>Cancel</ion-label>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-footer>
    `,
    styles: [`
        .ignore-options-modal {
            --width: calc(100% - 40px);
            --height: 280px;
        }
    `],
    encapsulation: ViewEncapsulation.None
})
export class IgnoreOptionsComponent implements OnInit {
    @ViewChild('matchingRuleList') matchingRuleList: IonList;
    @Input() notification: INotification;

    options: any[] = [];
    selectedValue = 'app';
    selectedRule = "exact"

    constructor(private modalCtrl: ModalController
        , private helperSvc: HelperService) {

    }

    ngOnInit() {
        this.options = [{
            label: `This App (${this.notification.package})`,
            value: 'app'
        }];
        if(this.notification.text) {
            this.options.push({
                label: 'Similar Message',
                value: 'message'
            });
        }
    }

    onMessageTypeChanged(ev: CustomEvent) {
        const { value } = ev.detail;
        this.selectedValue = value;

        if(this.selectedValue != 'message') {
            return;
        }

        setTimeout(() => {
            const { el } = <any>this.matchingRuleList;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    onMessageRuleChanged(ev: CustomEvent) {
        const { value } = ev.detail;
        this.selectedRule = value;
    }


    async onOkButtonClicked() {
        if(!this.selectedValue) {
            return;
        }

        if(this.selectedValue == 'message' && !this.selectedRule) {
            const msg = 'You must select a matching rule';
            await this.helperSvc.presentToast(msg);
            return;
        }

        const data = {
            value: this.selectedValue,
            rule: this.selectedValue == 'app' ? null : this.selectedRule
        };
        await this.dismiss(data);
    }

    async dismiss(data?) {
        await this.modalCtrl.dismiss(data);
    }
}