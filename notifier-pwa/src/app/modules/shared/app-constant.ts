
export class AppConstant {
    public static readonly DB_NAME = "notifier";

    public static readonly DEFAULT_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
    public static readonly DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
    public static readonly DEFAULT_TIME_FORMAT = "HH:mm";
    public static readonly DEFAULT_TIME_FORMAT_WITH_AM_PM = "h:mm A";
    public static readonly MAX_PAGE_SIZE = Number.MAX_SAFE_INTEGER;;

    public static readonly GOOGLE_SIGNIN_CLIENT_ID = "";
    
    public static readonly EVENT_DB_INITIALIZED = "event:dbInitialized"; 
    public static readonly EVENT_LANGUAGE_CHANGED = "event:languageChanged";

    public static readonly KEY_WORKING_LANGUAGE = "key:workingLanguage";

    public static readonly IGNORED_PACKAGES = [
        'com.android.vending',  //google play
        'android',
        'com.android.systemui',
        'com.microsoft.skydrive',
        'com.samsung.accessory',
        'com.samsung.android.app.routines',
        'com.samsung.android.incallui',
        'com.samsung.android.geargplugin',
        'com.samsung.android.themestore',
        'com.sec.android.desktopmode.uiservice',    //DeX
        'com.sec.android.app.samsungapps',
        'com.sec.android.app.sbrowser', //browser
        'com.samsung.android.app.smartcapture', //gallery screenshot
        'com.sec.android.app.clockpackage', //alarm
        'com.google.android.apps.maps',
        'org.torproject.torbrowser'
    ];

}