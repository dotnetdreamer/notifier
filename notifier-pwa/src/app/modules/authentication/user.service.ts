import { Injectable } from "@angular/core";


import { IUser, IUserProfile, LoginType, ILoginParams, IGoogleAuthResponse, IExternalAuth, IRegistrationResponse } from './user.model';
import { UserSettingService } from './user-setting.service';
import { BaseService } from '../shared/base.service';
import { AuthenticationGoogleService } from './authentication-google.service';
import { UserConstant } from './user-constant';

@Injectable({
    providedIn: 'root'
})
export class UserService extends BaseService {
  private readonly BASE_URL = "user";

  constructor(private googleAuthSvc: AuthenticationGoogleService) {
    super();
  }

  getAll(args?: { email?, name? }) {
    return this.getData<IUser[]>({ 
      url: `${this.BASE_URL}/getAll`, 
      body: args
    }); 
  }

  getUserByEmailWithExternalAuth(email) {
    return this.getData<IUser>({ 
      url: `${this.BASE_URL}/getUserByEmailWithExternalAuth`, 
      body: {
        email: email
      }
    });
  }

  changePassword(email, newPassword) {
    return this.postData<boolean>({ 
      url: `${this.BASE_URL}/changePassword`, 
      body: {
        email: email,
        newPassword: newPassword
      }
    });
  }

  authenticate(args: { email, password }) {
    return this.postData<any>({ 
      url: `app/authenticate`,
      body: {
        email: args.email,
        password: args.password
      }
    });
  }

  async login(loginType: LoginType, args?: { email, password }) {   
    let loader = await this.helperSvc.loader;
    await loader.present();

    try {
      let user: IUser;

      switch(loginType) {
        case LoginType.STANDARD:
          user = await this.authenticate({ email: args.email, password: args.password });
        break;
        case LoginType.GOOGLE:
          user = await this.googleAuthSvc.login();
        break;
      }

      if(!user) {
        return null;
      }

      if(loginType != LoginType.STANDARD) {
        // //if user is registered as normal, notify
        // const existingUser = await this.getByEmail(user.email);
        // if(!existingUser) {
        //   //external auth: check if user not exist, register it

        // }
        const regRes = await this.register({ 
          email: user.email, 
          name: user.name, 
          externalAuth: user.externalAuth
        });

        //grab the updated user
        if(regRes.data) {
          user = regRes.data;
        } else {
          return null;
        }
      }

      return this._handleLoginResponse({ loginType: loginType, user: user });
    } catch (e) {
      let msg = e.toString();
      if(e.message) {
        msg = e.message;
      } else if(e.error) {
        msg = e.error.toString();
      }
      if(e.error.error_description) {
        msg += "\n" + e.error.error_description;
      }
      await this.helperSvc.presentToast(msg, false);
    } finally {
      if(loader) {
        await loader.dismiss();
      }
    }
  }

  register(args: { email, name, mobile?, password?, externalAuth?: IExternalAuth })
    : Promise<IRegistrationResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.postData<IRegistrationResponse> ({ 
          url: `app/register`,
          body: args
        });

        if(res.status) {
          let msg;
          if(res.status.alreadyExist) {
            msg = await this.localizationSvc.getResource('user.already_exist');
          } else if(res.status.alreadyRegisteredWwithNormalAuth) {
            msg = await this.localizationSvc.getResource('user.already_registered_normal_auth');
          } else if(res.status.userStatus) {
            msg = await this.localizationSvc.getResource('user.cannot_register');
            msg = msg.format(res.status.userStatus);
          }
          await this.helperSvc.presentToast(msg, false);
        }
        resolve(res);
      } catch(e) {
        reject(e);
      }
    });
  }

  update(args: { email?, name?, mobile?, status, role }) {
    return this.postData<IUser>({ 
      url: `${this.BASE_URL}/update`, 
      body: args
    });
  }

  logout(username?) {
      return new Promise(async (resolve, reject) => {
          const loginType = await this.userSettingSvc.getLoggedInMethod();
          switch(loginType) {
              case LoginType.GOOGLE:
                  await this.googleAuthSvc.logout();
              break;
          }
          
          if(!username) {
              username = await this.userSettingSvc.getCurrentUser();
          }
      
          if(!username) {
              return;
          }

          await Promise.all([
              this.userSettingSvc.removeUserProfileLocal(username), 
              this.userSettingSvc.removeCurrentUser(), 
              this.userSettingSvc.removeLoggedInMethod(),
              this.userSettingSvc.removeCurrentUserPassword()
          ]);

          //clear dbs
          // await Promise.all([
          //   this.groupSvc.removeAll(), 
          //   this.expenseSvc.removeAll(),
          //   this.attachmentSvc.removeAll()
          // ]);

          this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDOUT);
          resolve(null);
      });
  }

  private async _handleLoginResponse(args: ILoginParams) {
    const promises = [];

    let profilePromise = this.userSettingSvc.putUserProfileLocal(args.user);
    promises.push(profilePromise);

    let loginTypePromise = this.userSettingSvc.putLoggedInMethod(args.loginType);
    promises.push(loginTypePromise);

    if(args.loginType == LoginType.STANDARD) {
      //TODO: need to remvoe storing password
      // let passwordPromise =  this.userSettingSvc.putCurrentUserPassword(args.password);
      // promises.push(passwordPromise);
    }

    let currentUserPromise = this.userSettingSvc.putCurrentUser(args.user.email);
    promises.push(currentUserPromise);

    try {
      await Promise.all(promises);

      //fire the user loggedin event
      const profile = this.userSettingSvc.setUserDefaults(args.user);
      return profile;
    } catch(e) {
      throw e;
    }
  }
}