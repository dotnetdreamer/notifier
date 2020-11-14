import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";

@Component({
    selector: 'no-data',
    template: `
        <div class="data-empty">
            <ion-icon ios="data-empty" md="data-empty"></ion-icon>
            <p>{{'common.nodata' | localizedresource | async}}</p>
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        .data-empty {
            text-align: center;
            padding-top: 20%;
        }
        
        .data-empty ion-icon {
            color: #efefef;
            font-size: 100px;
        }
    `],
    encapsulation: ViewEncapsulation.None
})
export class NoDataComponent implements OnInit {
    constructor() {

    }

    ngOnInit() {

    }




}