
import { environment } from '../../../environments/environment';

export class AppConstant {
    public static readonly DEBUG = !environment.production;

    public static readonly BASE_URL = !environment.production 
        ? "http://localhost:3000/" : "https://nest.dotnetdreamer2.net/";
    public static readonly BASE_API_URL = `${AppConstant.BASE_URL}`;
    public static readonly DB_NAME = "expense-tracker";

    public static readonly DEFAULT_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
    public static readonly DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
    public static readonly DEFAULT_TIME_FORMAT = "HH:mm";

    public static readonly GOOGLE_SIGNIN_CLIENT_ID = "481765426823-3c4gmsn2bbk3mrghqm0q6ng70d7mrqbl.apps.googleusercontent.com";
    
    public static readonly EVENT_DB_INITIALIZED = "event:dbInitialized"; 
    public static readonly EVENT_CATEGORY_CREATED_OR_UPDATED = "event:categoryCreatedOrUpdated"; 
    public static readonly EVENT_EXPENSE_CREATED_OR_UPDATED = "event:expenseCreatedOrUpdated"; 
    public static readonly EVENT_GROUP_CREATED_OR_UPDATED = "event:groupCreatedOrUpdated"; 
    public static readonly EVENT_ATTACHMENT_CREATED_OR_UPDATED = "event:attachmentCreatedOrUpdated"; 
    public static readonly EVENT_LANGUAGE_CHANGED = "event:languageChanged";

    public static readonly KEY_WORKING_LANGUAGE = "key:workingLanguage";

}