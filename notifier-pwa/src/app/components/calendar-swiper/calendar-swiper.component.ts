import { Component, ViewEncapsulation, OnInit, ViewChild, AfterViewInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { IonSlides } from '@ionic/angular';

import * as moment from 'moment';
import { AppConstant } from 'src/app/modules/shared/app-constant';

@Component({
    selector: 'calendar-swiper',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./calendar-swiper.scss'],
    template: `
    <ion-button fill="clear" (click)="onNextPrevButtonClicked('prev')">
        <ion-icon name="arrow-back"></ion-icon>
    </ion-button>
    <ion-slides #calendarSwiper [options]="slideOpts" 
        (ionSlideDidChange)="onIonSlideDidChange($event)" *ngIf="viewLoaded">
    </ion-slides>
    <ion-button fill="clear" (click)="onNextPrevButtonClicked('next')">
        <ion-icon name="arrow-forward"></ion-icon>
    </ion-button>
    `
})
export class CalendarSwiperComponent implements AfterViewInit, OnDestroy {
    @ViewChild('calendarSwiper') calendarSwiper: IonSlides;
    @Output() monthChanged = new EventEmitter()

    viewLoaded = false;
    slideOpts = {
        slidesPerView: 5,
        centeredSlides: true,
        spaceBetween: 15,
        shortSwipes: true,
        longSwipes: false,
        // longSwipesRatio: 0.5,
        // touchRatio: 0.8
    };

    //do not fire change event first time...
    private _swiperLoaded = false;

    constructor() {

    }

    async ngAfterViewInit() {
        this.viewLoaded = true;

        //fix: quickly comming back to view sometimes breaks swiper
        setTimeout(async () => {
            await this._init();
        });
    }

    async onNextPrevButtonClicked(actionType: 'next' | 'prev') {
        if(actionType == 'next') {
            this.calendarSwiper.slideNext();
        } else if(actionType == 'prev') {
            this.calendarSwiper.slidePrev();
        }
    }

    async onIonSlideDidChange(ev: CustomEvent) {
        if(!this._swiperLoaded) {
            return;
        }

        const swiper = await this.calendarSwiper.getSwiper();
        const month = swiper.activeIndex;

        const d = moment().local().set('M', month);
        // const d = new Date();
        // d.setMonth(month);

        const start = d.startOf('month').format(AppConstant.DEFAULT_DATE_FORMAT);
        const end = d.endOf('month').format(AppConstant.DEFAULT_DATE_FORMAT);

        this.monthChanged.emit({ 
            start, 
            end, 
            month: (month + 1) 
        });
    }

    async ngOnDestroy() {
        this.viewLoaded = false;

        if(this.calendarSwiper) {
            const swiper = await this.calendarSwiper.getSwiper();
            swiper.destroy();
            this.calendarSwiper = null;
        }
    }

    private async _init() {
        const swiper = await this.calendarSwiper.getSwiper();
        const currentMonth = +moment().format('M');

        for(let i=0; i < 12; i++) {
            const month = i + 1;

            const html = `
            <ion-slide>
                <ion-button shape="round" fill="clear">
                    <ion-label>${month}</ion-label>
                </ion-button>
            </ion-slide>
            `;
            swiper.addSlide(i, html);        
        }

        setTimeout(() => {
            swiper.update();

            setTimeout(() => {
                //month starts from 1, let's make it index...
                swiper.slideTo(currentMonth - 1, 0);	
                setTimeout(() => {
                    this._swiperLoaded = true;
                }, 300)
            }, 300);
        });
    }
}