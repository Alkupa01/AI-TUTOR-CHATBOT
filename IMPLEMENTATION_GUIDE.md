# 🛠️ Panduan Implementasi Teknis - Sistem Autentikasi

## 📚 Daftar Isi
1. [File-File yang Berubah](#file-file-yang-berubah)
2. [Penjelasan Component Baru](#penjelasan-component-baru)
3. [Perubahan di App.jsx](#perubahan-di-appjsx)
4. [CSS Styling yang Ditambah](#css-styling-yang-ditambah)
5. [Flow Diagram](#flow-diagram)
6. [Testing](#testing)

---

## 📁 File-File yang Berubah

### **BARU:**
1. ✨ `src/Login.jsx` - Component untuk login & register
2. ✨ Styling di `src/styles/main.css` untuk `.login-*` classes

### **DIMODIFIKASI:**
1. 🔄 `src/App.jsx` - Tambah state `authState` dan flow logic
2. 🔄 `src/styles/main.css` - Tambah CSS untuk login UI

### **TIDAK BERUBAH:**
- `src/Onboarding.jsx` - Tetap sama, hanya menerima input nama & grade
- `src/main.jsx` - Tetap sama
- `src/index.css` - Tetap sama

---

## 🧩 Penjelasan Component Baru: Login.jsx

### **Props:**
```javascript
Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired
}
```

### **State Management:**
```javascript
const [isLogin, setIsLogin] = useState(true);      // Toggle login/register mode
const [username, setUsername] = useState("");       // Username input
const [password, setPassword] = useState("");       // Password input
const [confirmPassword, setConfirmPassword] = ""; // Register only
const [error, setError] = useState("");             // Error message
const [loading, setLoading] = useState(false);      // Loading state
```

### **Key Functions:**

#### **handleAuth(e)**
- Validasi input (username min 3 char, password min 6 char)
- Jika mode LOGIN: cek di localStorage apakah user ada & password match
- Jika mode REGISTER: cek duplikasi username, buat userId baru
- Simpan ke localStorage dengan struktur user database
- Call `onLoginSuccess` dengan `{ userId, username }`

```javascript
const handleAuth = async (e) => {
  e.preventDefault();
  // 1. Validasi input
  // 2. Simulate API call (1 detik delay)
  // 3. Cek/create di localStorage
  // 4. Set session
  // 5. Call onLoginSuccess callback
}
```

#### **toggleMode()**
- Toggle antara LOGIN dan REGISTER mode
- Clear semua input & error saat switching

### **Struktur User Database di localStorage:**

```javascript
// localStorage key: "tutor_users"
{
  "username1": {
    userId: "user_1704110400000_abc123",
    username: "username1",
    password: "password123",        // ⚠️ Harus di-hash di production!
    registeredAt: "2024-01-02T10:00:00.000Z"
  }
}
```

### **Struktur Session Data:**

```javascript
// localStorage key: "tutor_currentUser"
{
  userId: "user_1704110400000_abc123",
  username: "username1",
  loginTime: "2024-01-02T11:00:00.000Z"
}
```

---

## 🔄 Perubahan di App.jsx

### **Penambahan State Baru:**
```javascript
const [authState, setAuthState] = useState(null); // null | { userId, username }
```

### **Penambahan useEffect untuk Session Recovery:**
```javascript
useEffect(() => {
  try {
    const savedAuthState = localStorage.getItem("tutor_currentUser");
    const savedUserSession = localStorage.getItem("mentorku-active-session");
    
    if (savedAuthState && savedUserSession) {
      const authData = JSON.parse(savedAuthState);
      const userData = JSON.parse(savedUserSession);
      
      // Validasi userId match antara auth dan user data
      if (authData.userId === userData.userId) {
        setAuthState(authData);
        loadUserSpecificData(userData);
      }
    }
  } catch (error) {
    // Clear corrupted data
  }
}, []);
```

### **Modifikasi loadUserSpecificData():**
```javascript
const loadUserSpecificData = (userData) => {
  const processedUser = calculateCurrentStatus(userData);
  setUser(processedUser);
  
  // SEBELUM: const storageKey = `mentorku-data-${processedUser.name.toLowerCase()...}`
  // SESUDAH: Gunakan userId sebagai kunci
  const storageKey = `mentorku-data-${userData.userId}`;
  // ... rest of function
}
```

### **Handler Baru: handleLoginSuccess():**
```javascript
const handleLoginSuccess = (loginData) => {
  // loginData = { userId, username } dari Login component
  setAuthState(loginData);
  localStorage.setItem("tutor_currentUser", JSON.stringify(loginData));
  // Flow berlanjut ke Onboarding karena user masih null
}
```

### **Handler Modifikasi: handleRegister():**
```javascript
const handleRegister = (inputData) => {
  // Enriched dengan userId dari authState
  const enrichedData = {
    ...inputData,
    userId: authState.userId
  };
  loadUserSpecificData(enrichedData);
}
```

### **Handler Modifikasi: handleLogout():**
```javascript
const handleLogout = () => {
  localStorage.removeItem("tutor_currentUser");
  localStorage.removeItem("mentorku-active-session");
  setAuthState(null);  // Clear auth state
  setUser(null);       // Clear user profile
  // ... rest
}
```

### **Handler Modifikasi: handleDeleteAccount():**
```javascript
const handleDeleteAccount = () => {
  const storageKey = `mentorku-data-${authState.userId}`;
  localStorage.removeItem(storageKey);
  // ... rest
}
```

### **Rendering Conditional (3-Step Flow):**
```javascript
// STEP 1: Belum login
if (!authState) {
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

// STEP 2: Login tapi belum complete profile
if (!user) {
  return <Onboarding onSave={handleRegister} />;
}

// STEP 3: Login & profile complete, tampilkan chat
return <app shell dengan chat interface>;
```

---

## 🎨 CSS Styling yang Ditambah

### **Container & Card:**
```css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0891b2, #06b6d4, #3b82f6);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  max-width: 400px;
  position: relative;
  overflow: hidden;
}
```

### **Form Elements:**
```css
.login-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
  background-color: #ffffff;
  color: #1f2937;
}

.login-input:focus {
  border-color: #0891b2;
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
}

.login-btn {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: white;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
  transition: transform 0.1s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(8, 145, 178, 0.4);
}
```

### **Error Message:**
```css
.login-error {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 4px solid #ef4444;
  margin-bottom: 20px;
}
```

---

## 📊 Flow Diagram

### **Overall App Flow:**
```
┌─────────────────────────────────────────┐
│ App Component Mounts                    │
│ - Check localStorage untuk session lama │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Is authState set?                       │
├──────────┬──────────────────────────────┤
│ NO       │ YES                          │
│          │                              │
▼          ▼                              ▼
┌────────────────┐     ┌─────────────────────────┐
│ <Login />      │     │ Is user profile set?    │
│                │     ├──────────┬──────────────┤
│ - Register new │     │ NO       │ YES          │
│ - Or login     │     │          │              │
│   existing     │     ▼          ▼              ▼
│                │  ┌────────────┐    ┌─────────────────┐
│ onLoginSuccess │  │<Onboarding>│    │ <ChatLayout />  │
│ → authState    │  │            │    │                 │
│   set          │  │ - Fill     │    │ - Show chat     │
│                │  │   name     │    │ - Per-user data │
└────────────────┘  │ - Fill     │    │ - Settings menu │
                    │   grade    │    │ - Logout btn    │
                    │            │    │                 │
                    │ onSave     │    │                 │
                    │ → user set │    │                 │
                    └────────────┘    └─────────────────┘
```

### **Login Process Sequence:**
```
USER FILLS FORM
       │
       ▼
handleAuth() called
       │
       ├─ Validate input
       │ ├─ username.length >= 3 ✓
       │ ├─ password.length >= 6 ✓
       │ └─ (if register) password === confirmPassword ✓
       │
       ├─ Get "tutor_users" from localStorage
       │
       ├─ IF LOGIN:
       │ ├─ Check if username exists
       │ ├─ Verify password match
       │ └─ ✅ Create session
       │
       ├─ IF REGISTER:
       │ ├─ Check username not exists
       │ ├─ Create new userId
       │ ├─ Save to "tutor_users"
       │ └─ ✅ Create session
       │
       ▼
Set localStorage:
  - "tutor_currentUser" = { userId, username }
       │
       ▼
Call onLoginSuccess(loginData)
       │
       ▼
App state updated:
  - setAuthState(loginData)
       │
       ▼
Render Onboarding (since user still null)
```

---

## 🧪 Testing Scenarios

### **Test 1: Register & Login Flow**
```javascript
// 1. Klik "Daftar di sini"
// 2. Input:
//    - Username: testuser123
//    - Password: test1234
//    - Confirm: test1234
// 3. Klik "Daftar"
// 4. Should proceed to Onboarding
// 5. Fill name & grade
// 6. Should enter chat interface
// 7. Check localStorage: tutor_users & tutor_currentUser set
```

### **Test 2: Session Persistence**
```javascript
// 1. Login & fill profile
// 2. In DevTools Console:
//    - localStorage.getItem("tutor_currentUser") → should show data
//    - localStorage.getItem("mentorku-active-session") → should show profile
// 3. Refresh page (F5)
// 4. Should auto-load user & go straight to chat
```

### **Test 3: Per-User Data Isolation**
```javascript
// 1. Login as User A
// 2. Send message: "Hello from A"
// 3. Note the chat ID
// 4. Check localStorage:
//    - localStorage.getItem("mentorku-data-<userA-id>") → has message
// 5. Logout
// 6. Login as User B (register new)
// 7. Chat should be empty
// 8. Logout & Login A again
// 9. Previous message should still be there
```

### **Test 4: Input Validation**
```javascript
// Test cases:
// 1. Username < 3 chars → Error: "Username minimal 3 karakter!"
// 2. Password < 6 chars → Error: "Password minimal 6 karakter!"
// 3. Register: password ≠ confirm → Error: "Password tidak sesuai!"
// 4. Register: username exists → Error: "Username sudah terdaftar..."
// 5. Login: username not found → Error: "Username tidak ditemukan..."
// 6. Login: wrong password → Error: "Password salah!"
```

---

## 🚨 Common Issues & Fixes

### **Issue 1: Users data tidak tersimpan setelah reload**
**Cause:** localStorage belum diinisialisasi saat pertama kali
**Fix:** Cek di localStorage di DevTools terlebih dahulu sebelum test

### **Issue 2: Login berhasil tapi langsung logout**
**Cause:** userId mismatch antara authState dan user profile
**Fix:** Pastikan enrichedData di handleRegister() include userId

### **Issue 3: Multiple users bisa login simultaneous**
**Current:** Hanya 1 session per localStorage (browser/tab)
**If multiple needed:** Perlu backend + session token management

### **Issue 4: Password tidak di-hash**
**Security Risk:** ⚠️ Password tersimpan plaintext di localStorage!
**Solution:** 
- Gunakan `bcryptjs` library untuk hashing
- Replace di `handleAuth()` sebelum localStorage save

---

## 📈 Migration Path to Backend

Untuk migrasi ke backend API:

### **Step 1: Setup Backend**
```javascript
// backend/routes/auth.js
POST /api/auth/register
  body: { username, password, email }
  return: { userId, token }

POST /api/auth/login
  body: { username, password }
  return: { userId, token }

GET /api/auth/validate
  header: { Authorization: "Bearer token" }
  return: { valid: true/false }
```

### **Step 2: Create Auth Service**
```javascript
// src/services/authService.js
export const registerUser = async (username, password) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

export const loginUser = async (username, password) => {
  // Similar to registerUser
}
```

### **Step 3: Update Login.jsx**
Replace localStorage calls dengan API calls ke `authService.js`

### **Step 4: Update App.jsx**
Replace localStorage checks dengan API calls untuk session validation

---

## 📝 Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `src/Login.jsx` | ✨ NEW | Login/Register interface |
| `src/App.jsx` | 🔄 MODIFIED | Add authState flow |
| `src/styles/main.css` | 🔄 MODIFIED | Add login CSS |
| `src/Onboarding.jsx` | ✔️ UNCHANGED | Still same |
| `src/main.jsx` | ✔️ UNCHANGED | Still same |

---

**Dibuat dengan ❤️ untuk dokumentasi lengkap system authentication!**
