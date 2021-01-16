package net.dotnetdreamer.notifierdev;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;
import ch.asinz.capacitornotificationlistener.NotificationListenerPlugin;
import com.flytesoft.persistent.notification.PersistentNotification;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      // Ex: add(TotallyAwesomePlugin.class);
            add(NotificationListenerPlugin.class);
          add(PersistentNotification.class);
            add(capacitor.plugin.get.app.info.GetAppInfo.class);
    }});
  }
}
