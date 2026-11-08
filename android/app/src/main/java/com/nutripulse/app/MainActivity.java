package com.nutripulse.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PhotoNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
