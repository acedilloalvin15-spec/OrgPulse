# OrgPulse: Publishing Guide (GitHub + Firebase + Vercel)

Stack: GitHub stores the code, Firebase provides login and the database, Vercel hosts the website.
OrgPulse is built on Firebase, so use Firebase (not Supabase). Supabase would require rewriting the data layer.

## 0. Files in your project folder

    index.html      the app (the only page)
    sw.js           offline support (service worker)
    manifest.json   install-to-home-screen settings
    icon.svg        app icon
    vercel.json     cache rules so updates reach phones
    firebase.json   tells Firebase where the rules are
    firestore.rules security rules for the database
    .gitignore      files Git should ignore

## 1. Firebase

1. Go to console.firebase.google.com, click "Create a project", and name it (for example, orgpulse).
2. Authentication: open Build > Authentication > Get started. Under Sign-in method, enable
   Email/Password. Enable Google too if you want the Google button.
3. Firestore: open Build > Firestore Database > Create database. Choose Production mode and
   the location closest to your users.
4. Web config: open Project settings (gear icon) > Your apps > Add app > Web (</>).
   Register the app and copy the firebaseConfig object.
5. In index.html, replace this line:

       const FIREBASE_WEB_CONFIG = null;

   with your config, for example:

       const FIREBASE_WEB_CONFIG = {
         apiKey: "...",
         authDomain: "...",
         projectId: "...",
         storageBucket: "...",
         messagingSenderId: "...",
         appId: "..."
       };

   The web config is public by design. Security comes from the rules in step 8, not from hiding this.

6. Create your own account in the app (Create Account, role Member). Then copy your User UID from
   Authentication > Users.
7. Create the access list in Firestore (this decides who has officer and President powers).
   Click "Start collection" and build this path, alternating collections and documents:

       artifacts (collection) > orgpulse-default-app (document) > public (collection) > data (document) > settings (collection) > access (document)

   In the access document, add:
   - officerUids (array): paste every officer's UID as a string
   - presidentUid (string): the President's UID

   Only UIDs listed here get officer and President powers in the database.
   Keep this list short and up to date.

8. Deploy the security rules. Choose one option:
   - Easiest: Firestore > Rules > paste the contents of firestore.rules > Publish.
   - Or use the command line (see step 3 of the GitHub part for the folder):

         npm install -g firebase-tools
         firebase login
         firebase use --add        (pick your project)
         firebase deploy --only firestore:rules

   Test the rules in Firestore > Rules > Rules Playground before you rely on them.

9. Plan: Firestore's free tier may not cover about 1,000 active users, because each login reads the
   full roster and lists. Upgrade to the Blaze (pay-as-you-go) plan and set a budget alert in
   Google Cloud Billing (for example, $10/month). Check current pricing on Firebase's pricing page.

## 2. GitHub

1. Go to github.com > New repository. Name it orgpulse. Choose Private if you don't want the code public.
   Don't add a README.
2. Upload the files: click "uploading an existing file", drag in all files from step 0, and commit.
   Or, with Git installed, run in the project folder:

       git init
       git add .
       git commit -m "OrgPulse v1"
       git branch -M main
       git remote add origin https://github.com/YOUR-USER/orgpulse.git
       git push -u origin main

3. Never commit secret keys, service-account files, or .env files. The .gitignore already excludes .env.

## 3. Vercel

1. Go to vercel.com and sign up with GitHub.
2. Click Add New > Project, then import the orgpulse repository.
3. Framework Preset: Other. Leave the build command and output directory empty. Click Deploy.
4. Vercel gives you a link such as https://orgpulse.vercel.app.
5. In Firebase, go to Authentication > Settings > Authorized domains and add your Vercel domain.
   Without this, sign-in can fail.
6. Open the link on a phone and test. Then use "Add to Home screen" to install it.

## 4. Updating the app later

1. Edit the files on GitHub (or push from your computer). Vercel redeploys automatically.
2. Change the cache name in sw.js (for example, orgpulse-v2 to orgpulse-v3) every time you ship a change,
   so phones pick up the new version.

## 5. Final checklist before sharing the link

- [ ] Sign in with email and password works on a phone
- [ ] Only the President sees "+ Post Announcement"
- [ ] A member can comment, reply, and report a comment
- [ ] Officers can remove a reported comment
- [ ] A direct message appears on the other person's phone
- [ ] Turn on airplane mode: the app opens, and a message sends after you reconnect
- [ ] Theme toggle works in Settings
- [ ] The Firebase authorized domain includes your Vercel domain
- [ ] The rules are published, and Rules Playground shows allowed and denied cases as expected
- [ ] The access document has the correct officerUids and presidentUid

## 6. Known limits

- Officer powers in the database come only from the access list in step 1.7. The role shown in the app
  does not grant database power, so someone who forges a role in the app still can't change the database.
- Check-ins are writable by any signed-in user. Tighten this later with per-member accounts.
- Admin sign-up uses an invite code stored in the database. Keep it empty and promote officers from the
  roster, or set it only for the first sign-up and then clear it.
- The rules were written carefully but not run in the Firebase emulator. Test them before launch.
