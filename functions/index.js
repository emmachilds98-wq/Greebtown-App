// Cloud Function: pushes a Web Push notification through FCM whenever a
// new chat message is written to Firestore, so people get it on their
// lock screen even with the app fully closed — the client-side
// Notification API (see notifyNewChatMessage in js/app.js) only ever
// fires while the tab/PWA is actually running. Runs entirely server-side
// via the Admin SDK, which bypasses firestore.rules by design (rules
// only ever gate client access, never Admin SDK calls from a trusted
// server environment like this).
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

// Keep in sync with CHAT_THREAD_GROUP / dmThreadId() in js/app.js — this
// function has no way to import from that file, so the two small
// conventions (group thread id, "dm:a|b" naming) are duplicated here.
const CHAT_THREAD_GROUP = "group";
const ROOM = "medway-massive";

// Same GitHub Pages URL convention as the repo's own README — update
// this if the app is actually hosted somewhere else.
const ICON_URL = "https://emmachilds98-wq.github.io/Greebtown-App/icons/icon-192.png";

exports.sendChatPush = onDocumentCreated(
  `rooms/${ROOM}/chatMessages/{messageId}`,
  async (event) => {
    const snap = event.data;
    const msg = snap && snap.data();
    if (!msg || !msg.text) return;

    const tokensSnap = await db.collection(`rooms/${ROOM}/pushTokens`).get();
    if (tokensSnap.empty) return;

    // A group-thread message reaches everyone; a 1:1 "dm:a|b" thread only
    // reaches the two people actually in it, matched by display name —
    // same name-is-identity trust model as the rest of this app (no
    // auth, so a name is the only thing that distinguishes recipients).
    let targetNames = null;
    if (typeof msg.thread === "string" && msg.thread.startsWith("dm:")) {
      targetNames = msg.thread.slice(3).split("|");
    }

    const tokens = [];
    const tokenRefs = [];
    tokensSnap.forEach((doc) => {
      const data = doc.data();
      if (!data.token || data.deviceId === msg.fromDeviceId) return;
      if (targetNames) {
        const name = (data.displayName || "").trim().toLowerCase();
        if (!targetNames.includes(name)) return;
      }
      tokens.push(data.token);
      tokenRefs.push(doc.ref);
    });
    if (!tokens.length) return;

    const title = msg.thread === CHAT_THREAD_GROUP ? `${msg.fromName} (Everyone)` : msg.fromName;
    const body = String(msg.text).slice(0, 200);

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: { icon: ICON_URL, tag: `chat-${msg.thread || "group"}` },
        fcmOptions: { link: "/" },
      },
      data: { thread: msg.thread || "" },
    });

    // Prune tokens FCM reports as dead (uninstalled, permission revoked,
    // or just expired) so this collection doesn't grow forever with
    // addresses nothing can reach.
    const deletions = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error && r.error.code === "messaging/registration-token-not-registered") {
        deletions.push(tokenRefs[i].delete());
      }
    });
    if (deletions.length) await Promise.all(deletions);
  }
);
