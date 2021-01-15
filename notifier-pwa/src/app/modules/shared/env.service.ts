export class EnvService {
    // The values that are defined here are the default values that can
    // be overridden by env.js
  
    // Whether or not to enable debug mode
    public static DEBUG = true;

    public static BASE_URL = "http://192.168.1.97:3000/";
    public static BASE_API_URL = `${EnvService.BASE_URL}api/`;

    constructor() {
    }
  }


  export const EnvServiceFactory = () => {  
    // Create env
    const env = new EnvService();
  
    // Read environment variables from browser window
    const browserWindow = window || {};
    const browserWindowEnv = browserWindow['__env'] || {};
  
    // Assign environment variables from browser window to env
    // In the current implementation, properties from env.js overwrite defaults from the EnvService.
    // If needed, a deep merge can be performed here to merge properties instead of overwriting them.
    for (const key in browserWindowEnv) {
      if (browserWindowEnv.hasOwnProperty(key)) {
        EnvService[key] = window['__env'][key];
      }
    }
  
    return EnvService;
  };
  
  export const EnvServiceProvider = {  
    provide: EnvService,
    useFactory: EnvServiceFactory,
    deps: [],
  };