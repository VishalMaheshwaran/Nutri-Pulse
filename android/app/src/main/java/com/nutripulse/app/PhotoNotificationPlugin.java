package com.nutripulse.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.util.Base64;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PhotoNotification")
public class PhotoNotificationPlugin extends Plugin {
    private static final String CHANNEL_ID = "nutripulse_photo_tracker";
    private static final int NOTIFICATION_ID = 9001;

    @PluginMethod
    public void showPhotoNotification(PluginCall call) {
        String title = call.getString("title", "NutriPulse Live Tracker");
        String body = call.getString("body", "");
        String summaryText = call.getString("summaryText", "");
        String imageBase64 = call.getString("imageBase64", "");
        boolean ongoing = call.getBoolean("ongoing", true);

        Context context = getContext();
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Ensure high-priority notification channel exists on Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = notificationManager.getNotificationChannel(CHANNEL_ID);
            if (channel == null) {
                channel = new NotificationChannel(
                    CHANNEL_ID,
                    "NutriPulse Live Photo Tracker",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Spotify-style live macro rings photo background tracker");
                channel.enableLights(true);
                channel.setLightColor(Color.parseColor("#10b981"));
                channel.setShowBadge(true);
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(channel);
            }
        }

        Bitmap bitmap = null;
        if (imageBase64 != null && !imageBase64.isEmpty()) {
            try {
                String cleanBase64 = imageBase64;
                if (cleanBase64.contains(",")) {
                    cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                }
                byte[] decoded = Base64.decode(cleanBase64, Base64.DEFAULT);
                bitmap = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Open app when notification clicked
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (intent == null) {
            intent = new Intent();
        }
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            intent,
            pendingFlags
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSubText(summaryText)
            .setContentIntent(pendingIntent)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(ongoing)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(Color.parseColor("#10b981"))
            .setColorized(true);

        if (bitmap != null) {
            // 1. Set photo as largeIcon (Spotify album artwork thumbnail)
            builder.setLargeIcon(bitmap);

            // 2. Set BigPictureStyle so the photo renders full-width in the notification shade!
            NotificationCompat.BigPictureStyle bigPicStyle = new NotificationCompat.BigPictureStyle()
                .bigPicture(bitmap)
                .setBigContentTitle(title)
                .setSummaryText(summaryText);

            builder.setStyle(bigPicStyle);
        }

        // Action Buttons like Spotify player controls
        builder.addAction(R.mipmap.ic_launcher, "🍽️ Log Meal", pendingIntent);
        builder.addAction(R.mipmap.ic_launcher, "💧 +250ml", pendingIntent);
        builder.addAction(R.mipmap.ic_launcher, "📊 AI Report", pendingIntent);

        notificationManager.notify(NOTIFICATION_ID, builder.build());

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void dismissPhotoNotification(PluginCall call) {
        NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancel(NOTIFICATION_ID);
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
