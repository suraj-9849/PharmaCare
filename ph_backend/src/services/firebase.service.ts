import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Initialize with the JSON key from environment or using service account file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Try loading from file (place firebase-service-account.json in backend root)
      const path = require('path');
      const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (fileError) {
        console.error(fileError);
        console.error('❌ Firebase service account file not found');
        console.log(
          '💡 Download from: https://console.firebase.google.com/project/pharmaapp-63c5b/settings/serviceaccounts/adminsdk'
        );
        console.log('💡 Save as: ph_backend/firebase-service-account.json');
        throw new Error('Firebase credentials not configured');
      }
    }

    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationOptions {
  tokens?: string[]; // FCM tokens of specific devices
  topic?: string; // Topic to send to (e.g., 'all-pharmacists')
  priority?: 'high' | 'normal';
}

/**
 * Send push notification to devices
 */
export const sendNotification = async (
  payload: NotificationPayload,
  options: NotificationOptions = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    const { title, body, data = {} } = payload;
    const { tokens, topic, priority = 'high' } = options;

    const baseMessage = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority,
        notification: {
          channelId: 'pharma_alerts',
          sound: 'default',
          priority: (priority === 'high' ? 'max' : 'default') as
            | 'default'
            | 'max'
            | 'min'
            | 'high'
            | 'low',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    let response;

    if (tokens && tokens.length > 0) {
      // Send to specific devices
      const multicastMessage: admin.messaging.MulticastMessage = {
        ...baseMessage,
        tokens,
      };

      response = await admin.messaging().sendEachForMulticast(multicastMessage);

      console.log(`✅ Notification sent to ${response.successCount} devices`);
      if (response.failureCount > 0) {
        console.error(`❌ Failed to send to ${response.failureCount} devices`);
      }

      return {
        success: response.successCount > 0,
        messageId: `${response.successCount} devices notified`,
      };
    } else if (topic) {
      // Send to topic
      const topicMessage: admin.messaging.TopicMessage = {
        ...baseMessage,
        topic,
      };
      const messageId = await admin.messaging().send(topicMessage);

      console.log(`✅ Notification sent to topic '${topic}':`, messageId);
      return {
        success: true,
        messageId,
      };
    } else {
      // Default: send to 'all-users' topic
      const topicMessage: admin.messaging.TopicMessage = {
        ...baseMessage,
        topic: 'all-users',
      };
      const messageId = await admin.messaging().send(topicMessage);

      console.log('✅ Notification sent to all users:', messageId);
      return {
        success: true,
        messageId,
      };
    }
  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send notification for sale completed
 */
export const sendSaleNotification = async (saleData: {
  saleId: string;
  totalAmount: number;
  itemCount: number;
  lowStockItems?: string[];
}) => {
  const { saleId, totalAmount, itemCount, lowStockItems = [] } = saleData;

  let body = `Sale completed! ${itemCount} item(s) sold for ₹${totalAmount.toFixed(2)}`;

  if (lowStockItems.length > 0) {
    body += `\n⚠️ Low stock alert: ${lowStockItems.join(', ')}`;
  }

  return await sendNotification(
    {
      title: '✅ Sale Completed',
      body,
      data: {
        type: 'SALE_COMPLETED',
        saleId,
        totalAmount: totalAmount.toString(),
        itemCount: itemCount.toString(),
        lowStockItems: lowStockItems.join(','),
      },
    },
    {
      topic: 'sales-alerts',
      priority: 'high',
    }
  );
};

/**
 * Send low stock alert notification
 */
export const sendLowStockNotification = async (
  items: Array<{ name: string; quantity: number }>
) => {
  const itemList = items.map((item) => `${item.name} (${item.quantity} left)`).join(', ');

  return await sendNotification(
    {
      title: '⚠️ Low Stock Alert',
      body: `The following items need reordering: ${itemList}`,
      data: {
        type: 'LOW_STOCK',
        items: JSON.stringify(items),
      },
    },
    {
      topic: 'inventory-alerts',
      priority: 'high',
    }
  );
};

/**
 * Send expiry alert notification
 */
export const sendExpiryNotification = async (
  batches: Array<{
    drugName: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }>
) => {
  const batchList = batches
    .map(
      (batch) =>
        `${batch.drugName} (Batch: ${batch.batchNumber}, expires in ${batch.daysUntilExpiry} days)`
    )
    .join(', ');

  return await sendNotification(
    {
      title: '⏰ Expiry Alert',
      body: `Items expiring soon: ${batchList}`,
      data: {
        type: 'EXPIRY_ALERT',
        batches: JSON.stringify(batches),
      },
    },
    {
      topic: 'inventory-alerts',
      priority: 'high',
    }
  );
};

/**
 * Subscribe device token to topic
 */
export const subscribeToTopic = async (token: string, topic: string) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    await admin.messaging().subscribeToTopic([token], topic);
    console.log(`✅ Device subscribed to topic: ${topic}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error subscribing to topic ${topic}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Unsubscribe device token from topic
 */
export const unsubscribeFromTopic = async (token: string, topic: string) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    await admin.messaging().unsubscribeFromTopic([token], topic);
    console.log(`✅ Device unsubscribed from topic: ${topic}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error unsubscribing from topic ${topic}:`, error);
    return { success: false, error: error.message };
  }
};

export default {
  initializeFirebase,
  sendNotification,
  sendSaleNotification,
  sendLowStockNotification,
  sendExpiryNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
};
