rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Greebtown's current app uses one fixed shared room and stores one
    // complete snapshot per device at:
    // rooms/medway-massive/members/{deviceId}
    //
    // There is deliberately no Firebase Auth in this app, so this is not
    // an identity boundary. The room code acts as the shared access secret.
    // Keep it out of public posts and change it in BOTH this file and
    // js/app.js if the group code ever changes.

    match /rooms/medway-massive/members/{memberId} {
      allow read: if true;

      // The app replaces the whole member document on every sync. Only
      // these top-level fields are accepted, which stops arbitrary data
      // being written elsewhere in the document.
      allow create, update: if
        request.resource.data.keys().hasOnly([
          'v',
          'deviceId',
          'from',
          'clues',
          'characterNotes',
          'theories',
          'hiddenVenues',
          'involvedDone',
          'discoveries',
          'customSocials',
          'quotes',
          'sightings',
          'customLandmarks',
          'schedule',
          'bingo',
          'character',
          'status',
          'meeting',
          'decisions',
          'updatedAt'
        ])
        && request.resource.data.v == 1
        && request.resource.data.deviceId == memberId
        && request.resource.data.from is string
        && request.resource.data.updatedAt is int;

      // Needed for the app's old-room/device cleanup. Deleting a document
      // is safe here because only this fixed room is matched.
      allow delete: if true;
    }

    // Nothing else in the Firestore database is exposed to the public app.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
