import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';
import { HighlightSearchPipe } from './highlightsearch.pipe';
import { SafePipe } from './safe.pipe';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe
    ],
    imports: [
        CommonModule
    ],
    providers: [],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe
    ]
})
export class PipesModule { }