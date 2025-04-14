# memberOnly
Parish Member only website

- Login with Gmail account
- List and Search ALL unit data
- Annual Occasion list
- Local storage for performance along with expiration


### Here's a breakdown of what's happening and how everything ties together:

---

### 🔐 **Login Flow Overview**
1. **User clicks "Sign in with Google"**
   - Triggers `signInWithGoogle()` function.
2. **Firebase Authentication**
   - Firebase signs the user in with a popup using Google OAuth.
3. **Email Whitelist Check**
   - A GET request is made to a **Google Apps Script web app URL**, passing the signed-in user's email as a query parameter.
   - The script checks the Google Sheet for a match.
4. **Access Control**
   - If the user is found in the whitelist:
     - They are welcomed and redirected to `dashboard.html`.
   - If not:
     - They are signed out and shown an "Access Denied" alert.
     - Their info is stored in Firestore as `status: "pending"` for manual approval.

---

### 📋 **Firestore: Pending User Tracking**
Even if a user isn’t whitelisted, their data is captured via:
```javascript
await db.collection('pendingUsers').add(userInfo);
```
This allows admins to later review and approve or reject access requests.

---

### ✅ **Things That Are Working Well**
- **Secure by default**: No whitelist, no access.
- **Noindex/nofollow**: Page stays off search engines.
- **Polished UI**: The login screen is clean and styled nicely.
- **Dynamic control**: Google Sheets makes it easy to manage whitelisted emails.
- **Pending user queue**: Helps scale up access requests with admin review.

---

### 🛠️ Suggestions for Improvement
If you're looking to tighten things up or expand functionality, here are a few ideas:

#### 🔄 Redirect with a status flag
If access is denied, instead of just showing an alert, redirect to a separate info page:
```js
window.location.href = 'access-denied.html';
```

#### 🔐 Prevent console tampering
Obfuscate sensitive logic or move the Apps Script call to a **secure server-side function** (Cloud Functions or backend API) to avoid exposing the endpoint URL.

#### 📤 Email notification for new pending users
Hook into Firestore triggers with Firebase Cloud Functions to notify admins when someone new gets added to `pendingUsers`.

#### 💬 Display feedback visually
Rather than `alert()`, show a modal or message on the page itself for a smoother UX.

---
### Directory.html  
Used Google Apps Script Web App as a secured backend to fetch the Directory data, filter and group it into families.