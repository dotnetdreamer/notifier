import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { 

  }

  transform(data, type: any) {
    if(!data) {
      return;
    }
    
    let result;
    const context = <SecurityContext>type;
    switch(context) {
        case SecurityContext.URL:
            result = this.sanitizer.bypassSecurityTrustResourceUrl(data);
        break;
        case SecurityContext.STYLE:
            result = this.sanitizer.bypassSecurityTrustStyle(data);
        break;
        case SecurityContext.HTML:
            result = this.sanitizer.bypassSecurityTrustHtml(data);
        break;
        default:
        break;
    }
    return result;
  }
}

export enum SecurityContext {
    NONE = 'none',
    HTML = 'html',
    STYLE = 'style',
    SCRIPT = 'script',
    URL = 'url',
    RESOURCE_URL = 'resource'
}