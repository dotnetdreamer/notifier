import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';
import { HighlightSearchPipe } from './highlightsearch.pipe';
import { SafePipe } from './safe.pipe';
import { CommonModule } from '@angular/common';
import { TrimTextPipe } from './trimText.pipe';
import { AppIconPipe } from './appIcon.pipe';
import { AppNamePipe } from './appName.pipe';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe,
        TrimTextPipe,
        AppIconPipe,
        AppNamePipe
    ],
    imports: [
        CommonModule
    ],
    providers: [],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe,
        TrimTextPipe,
        AppIconPipe,
        AppNamePipe
    ]
})
export class PipesModule { }