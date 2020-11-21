import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Plugins } from '@capacitor/core';

const { PersistentNotification, App, BackgroundTask } = Plugins;
import { SystemNotification, SystemNotificationListener } from 'capacitor-notificationlistener';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import './app/modules/shared/strings';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));


  let listener = null, intv = null;
 
  App.addListener('appStateChange', (state) => {
      // Listen for user clicks on the notification.  
      // OK to listen before opening.
      listener = PersistentNotification.addListener('notificationclick', ({ action }) => {
          console.log("Persistent notification click: ", action);
          if(!action) // A button was NOT clicked.
          {
              // Put the app in the foreground 
              // and close the notification, if desired.
              PersistentNotification.appToForeground();
              PersistentNotification.close();
          }
          else // A button was clicked by the user.
          {
              if(action === 'button-click2')
              {
                  console.log("Button 2 was clicked!");
              }
          }
      });
   
      if (!state.isActive) // App has gone inactive or closed
      {
          // Get some work done before the app closes completely.
          const taskId = BackgroundTask.beforeExit(async () => {
              try
              {
                  await PersistentNotification.open({
                      title: "App is running in background",
                      icon: "assets/icon/favicon.png",  
                      // Icon asset exist in www/icons/icon.png
                      // Icon asset always based upon TLD and 
                      // NOT the location of your code.
                      // body: "We can run continuously!",
                      // actions: [{
                      //         title: "button", 
                      //         action: "button-click", 
                      //     },
                      //     {
                      //         title: "button2",
                      //         action: "button-click2", 
                      //     }]
                  });
   
                  // See if the notification is open.
                  const { isOpen } = await PersistentNotification.getState();
   
                  console.log("Is open: ", isOpen);
              }
              catch(e)
              {
                  console.log("Unable to start background service: ", e);
              }
   
              // Let the app close.
              BackgroundTask.finish({
                  taskId
              });
          });
   
          /** 
           * It is recommended you stop any code that updates the DOM:  
           * The DOM will still be 'awake' but not visible to the user.  
           * So save CPU power.
           *
           * stopVisualTasks();
           * */
           
          // Now do your continuous background task.
          // Update the notification as necessary.
          // let interval = 1;
          // intv = setInterval(() => {
          //     PersistentNotification.update({
          //         body: `Seconds gone by: ${interval}`
          //     });
          //     interval++;
          // }, 1000);
      }
      else // App is now opening or resuming.
      {
          // OK to close un-opened notification.
          PersistentNotification.close().
              catch(e => {
                  console.log("Trouble closing the persistent notification: ", e);
              });
   
          // remove the listener.
          if(listener != null)
          {
              listener.remove();
              listener = null;
          }

          if(intv != null) {
            clearInterval(intv);
          }
      }
  });