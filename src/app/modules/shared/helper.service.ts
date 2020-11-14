import { AppSettingService } from './app-setting.service';
import { Injectable } from '@angular/core';
import { LoadingController, ToastController, AlertController, ActionSheetController, ModalController } from '@ionic/angular';
import { LocalizationService } from './localization.service';
import { AppConstant } from './app-constant';

@Injectable({
    providedIn: 'root'
}) 
export class HelperService {
    constructor(private loadingCtrl: LoadingController, private toastCtrl: ToastController
        , private alertCtrl: AlertController, private actionSheetCtrl: ActionSheetController
        , private modalCtrl: ModalController, private appSettingSvc:AppSettingService
        , private localizationService: LocalizationService) {

    }
    get loader() {
        let _loader = this.loadingCtrl.create({
            cssClass: 'custom-loader',
            showBackdrop: true
        });
        return _loader;
    }

    presentToast(message, autoHide = true) {
        return new Promise(async (resolve, reject)=> {
            let closeBtnTxt = await this.localizationService.getResource('common.dismiss');            
            const toast = await this.toastCtrl.create({
                message: message,
                duration: autoHide ? 5000 : null,
                position: 'bottom',
                buttons: [{ text: closeBtnTxt }]
                // showCloseButton: true,
                // closeButtonText: closeBtnTxt
              });     
            
            await toast.present();
            resolve();
        });
    }

    async presentToastGenericError(autoHide = false) {
        const msg = await this.localizationService.getResource('common.genericerror');
        return this.presentToast(msg, autoHide);
    }

    async presentToastGenericSuccess() {
        const msg = await this.localizationService.getResource('common.success');
        return this.presentToast(msg);
    }
    
    async presentInfoDialog(message, title?, okButtonCallback?) {
        let okTxt = await this.localizationService.getResource('common.ok');
        const alert = await this.alertCtrl.create({
            message: message,
            header: title,
            buttons: [
                {
                    text: okTxt,
                    role: 'cancel',
                    handler: () => {
                        if(okButtonCallback) {
                            okButtonCallback();
                        }
                    }
                }
            ]
        });
        return alert.present();
    }

    async presentConfirmDialog(workingLanguage?, message?): Promise<boolean> {
        let yesPromise = this.localizationService.getResource('common.yes', workingLanguage);
        let noPromise = this.localizationService.getResource('common.no', workingLanguage);
        let genericMsg = message || this.localizationService.getResource('common.areyousure', workingLanguage);

        
        let buttonTexts = await Promise.all([yesPromise, noPromise, genericMsg]);
        
        return new Promise(async (resolve, reject) => {
            const alert = await this.alertCtrl.create({
                message: buttonTexts[2],
                cssClass: workingLanguage ? (workingLanguage == 'en' ? 'ltr' : 'rtl') : '',
                backdropDismiss: false,
                buttons: [
                    {
                        text: buttonTexts[1],
                        role: 'cancel',
                        handler: () => {
                            resolve(false);
                        }
                    },
                    {
                        text: buttonTexts[0],
                        handler: () => {
                            resolve(true);
                        }
                    }
                ]
            });
            await alert.present();
        });
    }

    async presentConfirmActionSheet(header?, subHeader?, isDeleteDialog = true) {
        return new Promise<boolean>(async (resolve, reject) => {
            const promises: Array<Promise<any>> = [];

            if(!header) {
                const ausPro = this.localizationService.getResource('common.areyousure');
                promises.push(ausPro);
            }
            
            let buttons = [];
            let txts;
            if(isDeleteDialog) {
                const canPro = this.localizationService.getResource('common.cancel');
                promises.push(canPro);
                const delPro = this.localizationService.getResource('common.delete');
                promises.push(delPro);
                txts = await Promise.all(promises);
                
                buttons.push({
                    text: txts[1],
                    role: 'destructive',
                    icon: 'trash',
                    handler: () => {
                        resolve(true);
                    }
                });
                buttons.push({
                    text: txts[0],
                    icon: 'close',
                    role: 'cancel',
                    handler: () => {
                        resolve(false);
                    }
                });
            } else {
                const canPro = this.localizationService.getResource('common.yes');
                promises.push(canPro);
                const delPro = this.localizationService.getResource('common.no');
                promises.push(delPro);
                txts = await Promise.all(promises);

                buttons.push({
                    text: txts[1],
                    role: 'checkmark',
                    icon: 'checkmark',
                    handler: () => {
                        resolve(true);
                    }
                });
                buttons.push({
                    text: txts[0],
                    icon: 'close',
                    role: 'cancel',
                    handler: () => {
                        resolve(false);
                    }
                });
            }
            const actionSheet = await this.actionSheetCtrl.create({
                header: header ? header : txts[0],
                subHeader: subHeader,
                buttons: buttons
            });
            await actionSheet.present();
        });
    }
    
    //https://stackoverflow.com/a/20285053/859968
    toDataURL(url) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onload = function() {
                const reader = new FileReader();
                reader.onloadend = function() {
                    resolve(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        });
    }
      
    //https://stackoverflow.com/a/2117523/859968
    generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }
    
    getRandomNumber() {
        const random = (new Date()).getTime() + Math.floor(Math.random() * 1000000);
        return random;
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    addZerosToDate(n) { 
        return n < 10 ? '0'+n:''+n;
    }

    getFormValidationErrors(formName) {
        Object.keys(formName.controls).forEach(key => {
            const controlErrors = formName.get(key).errors;
            if (controlErrors != null) {
                Object.keys(controlErrors).forEach(keyError => {
                    console.log('Key control: ' + key + ', keyError: ' + keyError + ', err value: ', controlErrors[keyError]);
                });
            }
        });
    }

    downloadCanvasAsImage(canvas: HTMLCanvasElement) {
        // const download = document.getElementById("download");
        const image = canvas.toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
        
        const link = document.createElement('a');
        link.setAttribute('href', image);
        link.download = `${this.generateGuid()}.png`;
        link.click();

        // setTimeout(() => {
        //     link.remove();
        // });
    }

    getUserCurrentLocation(): Promise<any>{
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((position: Position) => {
                let gpsAddress = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                resolve(gpsAddress);
            },async (error: PositionError) => {
                await this.handleLocationError(error);
                resolve();
            },{
                enableHighAccuracy: true,
                timeout: 5000
            });
        });
    }

    getParamsObjectsFromUrl(url) {
        let obj;
        if(url) {
            url = decodeURI(url);
        }
        let urlArr = url.split(';');
        if(urlArr.length) {
            urlArr.shift();
        }
        for(const urlItem of urlArr) {
            if(!obj) {
                obj = { };
            }
            //e.g key = value
            const urlItemObj = urlItem.split('=');
            obj[urlItemObj[0]] = urlItemObj[1];
        }
        return obj;
    }

    private handleLocationError(error) {
        return new Promise(async (resolve, reject) => {
            let msg = null;
            let title = await this.localizationService.getResource('geolocation.error');
            if (error) {
                if (error.PERMISSION_DENIED) {
                    msg = await this.localizationService.getResource('geolocation.permissiondenied');
                }
            }
            await this.presentToast(title);
            resolve();
        });
    }


    share(url?, message?, files?: Array<string>): Promise<{ completed: boolean, app }> {
        let options = {
            message: message, // not supported on some apps (Facebook, Instagram)
            url: url,
            files: files    // an array of filenames either locally or remotely
        };
        return new Promise((resolve, reject) => {
            (<any>window).plugins.socialsharing.shareWithOptions(options, 
            (result) => {
                resolve(result);
            }, (msg) => reject(msg));
        });
    }    
}