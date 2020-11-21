import { Pipe, PipeTransform} from '@angular/core'
import { DomSanitizer} from '@angular/platform-browser'

@Pipe({
    name: 'highlightsearch'
})
export class HighlightSearchPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer){}
    transform(originalText: any, term: any, searchType = 'contains'): any {
        if (!term) {
            return originalText;
        }

        if(!originalText) {
            return;
        }

        if(term.length < 3) {
            return originalText;
        }

        // if(typeof originalText === 'Object') {
        //     return originalText;
        // }

        let match = false;
        let re = null;
        switch(searchType) {
            case 'startsWith':
                re = new RegExp('^' + term, 'i');
                match = originalText.match(re);
            break;
            case 'contains':
                // Match in a case insensitive maneer
                re = new RegExp(term, 'gi');
                match = originalText.match(re);
            break;
        }
        // If there's no match, just return the original value.
        if (!match) {
            return originalText;
        }

        const finalValue = originalText.replace(re, "<mark>" + match[0] + "</mark>");
        return this.sanitizer.bypassSecurityTrustHtml(finalValue);
    }
}
