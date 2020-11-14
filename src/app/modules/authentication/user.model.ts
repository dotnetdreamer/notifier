export interface IUser {
    uuid?;
    name: string;
    role?: UserRole;
    email: string;
    photo?: string;
    mobile?: string;
    access_token?: string;
    status?: UserStatus;
    externalAuth?: IExternalAuth;
}

export interface IUserProfile extends IUser {
    photoStyle?: string;
}

export enum LoginType {
    STANDARD = 'standard',
    GOOGLE = 'google',
    APPLE = 'apple'
}

export interface ILoginParams {
    email? 
    password? 
    loginType: LoginType
    user: IUser
}

export interface IGoogleAuthResponse {
    email: string
    familyName: string
    givenName: string
    id: string
    imageUrl: string
    name: string
    authentication: { accessToken: string, idToken: string }
    serverAuthCode: string
}

export interface IExternalAuth {
    userId?: number
    email: string
    externalIdentifier: string
    oAuthAccessToken?: string
    providerSystemName: LoginType
}

export interface IRegistrationResponse {
    data: any;
    status: {  userStatus: '', alreadyExist: false, alreadyRegisteredWwithNormalAuth: false };
}

export enum UserStatus {
    Approved = "approved",
    Pending = "pending",
    Rejected = "rejected",
    Blocked = "blocked"
}

export enum UserRole {
    Admin = "admin",
    User = "user"
}