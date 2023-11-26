const admin = require("firebase-admin");

const serviceAccount = require("../firebase/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://fileupload-1389f.appspot.com",
});

const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};
