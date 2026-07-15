const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

// Fires whenever a new message is written to a private conversation.
// Sends a deliberately generic push to the OTHER device only.
exports.notifyOnNewMessage = onDocumentCreated(
  'conversations/{pairId}/messages/{msgId}',
  async (event) => {
    const { pairId } = event.params;
    const msg = event.data.data();

    const convoSnap = await db.doc(`conversations/${pairId}`).get();
    if (!convoSnap.exists) return;
    const { memberUids } = convoSnap.data();

    const recipientUid = memberUids.find((uid) => uid !== msg.senderId);
    if (!recipientUid) return;

    const recipientSnap = await db.doc(`users/${recipientUid}`).get();
    const token = recipientSnap.exists ? recipientSnap.data().fcmToken : null;
    if (!token) return;

    const isPing = msg.type === 'ping';

    const payload = {
      token,
      notification: {
        title: 'Delligen Technologies',
        body: isPing
          ? 'Priority flag raised on your report.'
          : 'Your worksheet was updated.'
      },
      data: {
        kind: isPing ? 'ping' : 'msg'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: isPing ? 'delligen_priority' : 'delligen_sync',
          tag: 'delligen-sync'
        }
      },
      apns: {
        payload: { aps: { sound: 'default' } }
      }
    };

    try {
      await getMessaging().send(payload);
    } catch (err) {
      console.error('FCM send failed', err);
    }
  }
);
