# Firestore Security Rules Setup Guide

## Problem

You're getting "Missing or insufficient permissions" error because your Firestore security rules are blocking reads/writes.

## Solution

Go to **Firebase Console** → Select your project → **Firestore Database** → **Rules** tab

### Option 1: Test Mode (Development - Allow All Authenticated Users)

Copy and paste this in the Rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /clinicians/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /patients/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /caregivers/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

**Click "Publish"** button to save.

---

### Option 2: More Restrictive (Production - Role-Based Access)

For better security, use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId && request.resource.data.role in ['clinician', 'patient', 'caregiver'];
      allow update, delete: if request.auth.uid == userId;
    }

    // Clinicians can only read/write their own profile
    match /clinicians/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Patients can only read/write their own profile
    match /patients/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Caregivers can only read/write their own profile
    match /caregivers/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Step-by-Step Instructions

1. Open Firebase Console: https://console.firebase.google.com/
2. Select your project: **"alztwin-test"**
3. Left sidebar → **"Firestore Database"**
4. Click **"Rules"** tab at the top
5. Delete the existing rules
6. Paste one of the rules from above (I recommend Option 1 for development)
7. Click **"Publish"** button (top right)
8. Confirm the popup
9. Wait for rules to deploy (usually 1-2 minutes)

---

## Testing

After publishing rules:

1. Refresh your app at `http://localhost:3000/`
2. Sign in with Google
3. You should now see the **Role Selector** instead of permission error
4. Select your role (Clinician/Patient/Caregiver)
5. Dashboard should load! ✅

---

## Troubleshooting

**If you still get "Missing or insufficient permissions":**

- Make sure you clicked **"Publish"** button
- Wait 2-3 minutes for rules to propagate
- Refresh the page in browser
- Check browser console for exact error

**If collection doesn't exist error:**

- Don't worry! Firestore will create collections automatically when you write data
- The rules will allow creation on first write

---

## Rule Explanation

| Rule                         | Meaning                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `request.auth.uid == userId` | User can only access documents with their own UID as the ID |
| `allow read, write`          | User can both read and write                                |
| `allow create`               | User can only create new documents (with validation)        |
| `allow update, delete`       | User can update and delete existing documents               |

---

## Next Steps

Once rules are working:

1. ✅ Sign in with Google
2. ✅ Select your role
3. ✅ See the appropriate dashboard
4. ✅ Data is automatically saved to Firestore

Your multi-portal system is now complete! 🎉
