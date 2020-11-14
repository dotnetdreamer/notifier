import {Component, HostListener, forwardRef, Inject, Host} from "@angular/core";
import {AccordionGroup} from "./AccordionGroup";

@Component({
    selector: "accordion-toggle",
    template: `<ng-content></ng-content>`
})
export class AccordionToggle {

    constructor(@Host() @Inject(forwardRef(() => AccordionGroup)) private accordionGroup: AccordionGroup) {
    }

    @HostListener("click")
    onClick() {
        this.accordionGroup.toggle();
    }

}