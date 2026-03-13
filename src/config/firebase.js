const admin = require("firebase-admin");

if (!admin.apps.length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey && privateKey !== "your_private_key") {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✅ Firebase initialized");
    } catch (err) {
      console.warn("⚠️  Firebase failed to initialize:", err.message);
    }
  } else {
    console.warn("⚠️  Firebase not configured - push notifications disabled");
  }
}

module.exports = admin;