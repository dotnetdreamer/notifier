import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { BackgroundTask } from '@robingenz/capacitor-background-task';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import './app/modules/shared/strings';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

if(Capacitor.getPlatform() === 'android') {
    let listener: PluginListenerHandle = null, notificationId = 987654321;
    App.addListener('appStateChange', async (state) => {
        listener = await LocalNotifications.addListener("localNotificationActionPerformed"
            , async (notificationAction) => {
            if(notificationAction.actionId == 'tap') {
                await LocalNotifications.cancel({ notifications: 
                    [
                        {
                            id: notificationAction.notification.id 
                        }
                    ]
                });
            }
        });

        if (!state.isActive) { // App has gone inactive or closed
            // Get some work done before the app closes completely.
            const taskId = await BackgroundTask.beforeExit(async () => {
                try {
                    const not: LocalNotificationSchema = {
                        id: notificationId,
                        title: "App is running in background",
                        // smallIcon: 'favicon',   //placed in res -> drawable folder
                        body: 'Please do not close',
                        ongoing: true
                    };
                    await LocalNotifications.schedule({ notifications: [not] });
                } catch(e) {
                    console.log("Unable to start background service: ", e);
                }
                // Let the app close.
                BackgroundTask.finish({ taskId: taskId });
            });
        } else { // App is now opening or resuming.
            // OK to close un-opened notification.
            LocalNotifications.cancel({ notifications: [{ id: notificationId }]})
                .catch(e => {
                    console.log("Trouble closing the persistent notification: ", e);
                });

            // remove the listener.
            if(listener != null) {
                listener.remove();
                listener = null;
            }
        }
    });
}