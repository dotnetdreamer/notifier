import {
    Component,
    Input,
    Host,
    forwardRef,
    Inject,
    ContentChild,
    ElementRef,
    ChangeDetectorRef,
    Output,
    EventEmitter
} from "@angular/core";
import {Accordion} from "./Accordion";
import {AccordionToggle} from "./AccordionToggle";

@Component({
    selector: "accordion-group",
    template: `
  <div class="panel panel-default" [class.dropup]="isOpened" [class.disabled]="disabled">
    <div class="panel-heading" role="tab" (click)="checkAndToggle()">
        <div class="panel-title ion-text-wrap">
            <a *ngIf="heading" role="button" data-toggle="collapse" [attr.aria-expanded]="isOpened">
                {{ heading }}
            </a>
            <ng-content select="accordion-heading"></ng-content>
        </div>
        <div class="caret" [style.display]="accordion.showArrows ? '' : 'none'">
            <ion-icon *ngIf="isOpened" class="animated animate-500ms rotateIn" ios="arrow-down" md="arrow-down"></ion-icon>
            <ion-icon *ngIf="!isOpened" class="animated animate-500ms rotateIn" ios="arrow-back" md="arrow-back"></ion-icon>
        </div>
    </div>
    <div *ngIf="isOpened" class="panel-collapse collapse in" role="tabpanel" [attr.aria-labelledby]="heading">
      <div class="panel-body">
        <ng-content></ng-content>
      </div>
    </div>
  </div>
`
})
export class AccordionGroup {
    @Input()
    heading: string;

    @Input()
    isOpened: boolean = false;

    @Output()
    onOpen = new EventEmitter();

    @Output()
    onClose = new EventEmitter();

    @Output()
    onToggle = new EventEmitter();

    @ContentChild(AccordionToggle, { static: false })
    toggler: ElementRef;

    @Input()
    disabled: boolean = false;

    constructor(@Host() @Inject(forwardRef(() => Accordion)) public accordion: Accordion,
        private cdr: ChangeDetectorRef) {
    }

    checkAndToggle() {
        // if custom toggle element is supplied, then do nothing, custom toggler will take care of it
        if (this.toggler)
            return;

        this.toggle();
    }

    toggle() {
        if (this.disabled)
            return;

        const isOpenedBeforeWeChange = this.isOpened;
        if (this.accordion.closeOthers)
            this.accordion.closeAll();

        this.isOpened = !isOpenedBeforeWeChange;
        if (this.isOpened) {
            this.onOpen.emit();
        } else {
            this.onClose.emit();
        }
        this.onToggle.emit(this.isOpened);
    }

    openOnInitialization() {
        this.isOpened = true;
        this.cdr.detectChanges();
    }

}