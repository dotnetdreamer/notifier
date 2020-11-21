import { UserService } from './user.service';
import { Injectable, NgZone } from '@angular/core';

import { Plugins } from '@capacitor/core';

import { IUser, IGoogleAuthResponse, LoginType } from './user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationGoogleService {
    constructor(private ngZone: NgZone) {
    }

    login(): Promise<IUser> {
        // Plugins.GoogleAuth.addListener('userChange', (googleUser) => {
        //     alert(JSON.stringify(googleUser))
        //     // console.log("userChange:", googleUser);
        // });
        
        return new Promise(async (resolve, reject) => {
            try {
                const result: IGoogleAuthResponse = await Plugins.GoogleAuth.signIn();
                const user: IUser = {
                    uuid: result.id,
                    email: result.email,
                    name: result.name,
                    photo: result.imageUrl,
                    externalAuth: {
                        email: result.email,
                        externalIdentifier: result.id,
                        providerSystemName: LoginType.GOOGLE
                    }
                };
                resolve(user);
            } catch (e) {
                const exp = <{ error: 'popup_closed_by_user' }>e;
                reject(exp);
            }
        });
    }

    async logout() {
        await Plugins.GoogleAuth.signOut();
    }
}