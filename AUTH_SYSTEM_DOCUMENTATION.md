# 🔐 Sistem Autentikasi & Login - AI Tutor Chatbot

## 📋 Ringkasan Fitur yang Ditambahkan

Saya telah mengintegrasikan **sistem login dan autentikasi** ke dalam aplikasi AI Tutor Chatbot. Sekarang setiap user harus melakukan **3 tahap** sebelum bisa menggunakan chatbot:

### **Alur Pengguna:**
1. **Login/Register** (Username & Password)
2. **Onboarding** (Isi Nama & Jenjang)
3. **Chat Interface** (Mulai belajar)

---

## 🎯 Fitur-Fitur Baru

### ✅ **1. Halaman Login & Register**
- **Login**: User dengan akun yang sudah ada bisa masuk
- **Register**: User baru bisa membuat akun dengan username & password
- **Validasi Input**:
  - Username minimal 3 karakter
  - Password minimal 6 karakter
  - Password confirmation saat register
  - Cek duplikasi username

### ✅ **2. Unique User ID**
- Setiap user mendapat **ID unik** saat registrasi: `user_<timestamp>_<random>`
- Data setiap user disimpan berdasarkan **userId**, bukan nama
- Memastikan 1 username = 1 akun yang unik

### ✅ **3. Session Management**
- User session disimpan di **localStorage**:
  - `tutor_currentUser`: Data autentikasi (userId, username)
  - `mentorku-active-session`: Data profil user
  - `mentorku-data-{userId}`: Chat history & riwayat per user
  
- Jika user **refresh halaman**, session tetap terjaga

### ✅ **4. Per-User Data Isolation**
- Setiap user punya **chat history terpisah**
- History disimpan berdasarkan **userId**, bukan nama
- Ketika user login dengan akun berbeda, data chat mereka berbeda

### ✅ **5. Logout & Security**
- Tombol **Logout** di menu settings
- Logout akan menghapus semua session data dari localStorage
- User harus login ulang untuk akses akun mereka

### ✅ **6. Hapus Data Akun**
- Fitur **"Hapus Data Permanen"** di halaman Profil
- Akan menghapus semua chat history milik user tersebut
- User masih bisa membuat akun baru dengan username yang sama (jika perlu)

---

## 🏗️ Struktur File yang Ditambahkan

### **Baru:**
- `src/Login.jsx` - Component halaman login/register
- `src/styles/main.css` - Styling untuk login (ditambah, bukan replace)

### **Dimodifikasi:**
- `src/App.jsx` - Integrasi flow login → onboarding → chat
- `src/styles/main.css` - Tambahan CSS untuk login UI

---

## 🔄 Alur Autentikasi (Technical)

```
┌─────────────────────────────────────────────────────────────┐
│ USER MASUK APLIKASI                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Cek localStorage│
        │ tutor_currentUser
        │ mentorku-active-session
        └────────┬────────┘
                 │
          ┌──────┴──────┐
          │             │
       Ada Session?  Tidak Ada
          │             │
          ▼             ▼
      User sudah  ┌──────────────┐
      login,      │ Tampilkan    │
      cek apakah  │ Halaman Login│
      sudah fill  └──────┬───────┘
      profil           │
          │            ├─ LOGIN dengan username+password
          │            │  → Validasi di localStorage
          │            │  → Set tutor_currentUser
          │            │
          │            └─ REGISTER username baru+password
          │               → Buat userId unik
          │               → Simpan ke localStorage (tutor_users)
          │               → Auto-login
          │
          ├─── Profile sudah lengkap?
          │    │
          │    ├─ YA  → Tampilkan CHAT INTERFACE
          │    │
          │    └─ TIDAK → Tampilkan ONBOARDING
          │               (isi nama & jenjang)
          │               │
          │               └─ Setelah submit
          │                  → Set profil lengkap
          │                  → Tampilkan CHAT
          │
          └─ Simpan data dengan kunci userId
             untuk isolasi per-user
```

---

## 💾 Struktur Data di LocalStorage

### **1. `tutor_users` (Database User)**
```javascript
{
  "alice": {
    "userId": "user_1704110400000_abc123def",
    "username": "alice",
    "password": "hashed_password123",  // ⚠️ Dalam prod, harus di-hash!
    "registeredAt": "2024-01-02T10:00:00.000Z"
  },
  "bob": {
    "userId": "user_1704110500000_xyz789uvw",
    "username": "bob",
    "password": "hashed_password456",
    "registeredAt": "2024-01-02T10:05:00.000Z"
  }
}
```

### **2. `tutor_currentUser` (Session Aktif)**
```javascript
{
  "userId": "user_1704110400000_abc123def",
  "username": "alice",
  "loginTime": "2024-01-02T11:30:00.000Z"
}
```

### **3. `mentorku-active-session` (Profil User)**
```javascript
{
  "userId": "user_1704110400000_abc123def",
  "name": "Alice Wonderland",
  "grade": 10,
  "currentGrade": 10,
  "level": "SMA",
  "registeredAt": "2024-01-02T10:00:00.000Z"
}
```

### **4. `mentorku-data-{userId}` (Chat History)**
```javascript
{
  "chats": [
    {
      "id": 1,
      "title": "Belajar Matematika",
      "messages": [
        { "id": 123, "sender": "user", "text": "Berapa hasil 2+2?", "fileName": null },
        { "id": 124, "sender": "ai", "text": "Hasil dari 2+2 adalah 4", "fileName": null }
      ]
    }
  ],
  "selectedChatId": 1
}
```

---

## 🔒 Security Notes

⚠️ **PENTING: Implementasi Saat Ini adalah Demo/Development**

Fitur keamanan yang perlu ditambahkan untuk **PRODUCTION**:

1. **Password Hashing** - Gunakan library seperti `bcryptjs` untuk hash password
2. **Backend API** - Jangan simpan user data di localStorage saja
3. **JWT Token** - Gunakan JWT untuk session management
4. **HTTPS** - Pastikan koneksi encrypted
5. **CORS** - Validasi request dari frontend yang authorized
6. **Rate Limiting** - Proteksi dari brute force login attempts
7. **Email Verification** - Validasi email saat register
8. **2FA (Two-Factor Auth)** - Tambahan keamanan dengan OTP/authenticator

Untuk saat ini, sistem ini cocok untuk **demo/prototype** tapi perlu upgrade untuk production!

---

## 🧪 Testing Checklist

Coba fitur-fitur ini untuk memastikan semuanya bekerja:

### **Test Register**
- [ ] Klik "Daftar di sini"
- [ ] Isi username, password, confirm password
- [ ] Tekan Register
- [ ] Seharusnya otomatis login & masuk ke Onboarding

### **Test Login**
- [ ] Logout dari akun saat ini
- [ ] Klik "Masuk di sini"
- [ ] Isi username & password yang sudah dibuat
- [ ] Seharusnya berhasil login

### **Test Session Persistence**
- [ ] Login dengan akun A
- [ ] Isi profil (nama & jenjang)
- [ ] Refresh halaman (F5)
- [ ] Seharusnya session tetap & masih login

### **Test Data Isolation**
- [ ] Login dengan akun A, buat chat beberapa pertanyaan
- [ ] Logout
- [ ] Login dengan akun B
- [ ] Chat history dari A tidak ada (terisolasi)
- [ ] Logout & login A lagi
- [ ] Chat history A masih ada

### **Test Logout**
- [ ] Login dengan akun
- [ ] Klik ⚙️ (settings) → Logout
- [ ] Seharusnya kembali ke halaman Login

### **Test Delete Account**
- [ ] Login dengan akun
- [ ] Klik ⚙️ (settings) → Profil Saya
- [ ] Klik "Hapus Data Permanen"
- [ ] Chat history harus terhapus

---

## 🚀 Cara Menggunakan

### **Pertama Kali (Register)**
1. Buka aplikasi
2. Klik "Daftar di sini"
3. Isi username & password baru
4. Klik "Daftar"
5. Auto-login & lanjut ke Onboarding
6. Isi nama & jenjang, klik "Mulai Belajar"
7. Selesai! Bisa mulai chatting

### **Login Berikutnya**
1. Buka aplikasi
2. Isi username & password yang sudah terdaftar
3. Klik "Masuk"
4. Langsung masuk ke chat interface
5. Data & riwayat chat sudah tersimpan

### **Logout & Ganti Akun**
1. Klik ⚙️ (settings) di kanan atas
2. Klik "Logout"
3. Kembali ke halaman login
4. Login dengan akun berbeda

---

## 📝 Contoh Skenario Penggunaan

**Skenario: Keluarga Dengan 3 Anak**

```
👨‍👩‍👧‍👦 Keluarga Indonesia

├─ 👦 Rafi (Kelas 6 SD)
│  └─ Username: rafi_123
│     Password: rahasia456
│     History: Tanya tentang Matematika SD
│
├─ 👧 Aini (Kelas 9 SMP)
│  └─ Username: aini_cuteee
│     Password: aini2024
│     History: Tanya tentang Bahasa Inggris SMP
│
└─ 👨 Dito (Kelas 11 SMA)
   └─ Username: dito_ipa
      Password: dito_password
      History: Tanya tentang Fisika SMA
```

Setiap anak punya akun sendiri:
- Masing-masing punya **username & password unik**
- Masing-masing punya **userId unik** di system
- Masing-masing punya **profil & chat history terpisah**
- Jika satu anak logout & anak lain login, data terpisah sempurna
- Jika anak login ulang di kemudian hari, datanya tetap ada

---

## 🔧 Troubleshooting

### **Masalah: "Username sudah terdaftar"**
- Gunakan username yang belum pernah didaftar sebelumnya

### **Masalah: "Password tidak sesuai"**
- Pastikan password benar (case-sensitive)
- Coba reset dengan logout & register ulang jika lupa

### **Masalah: Logout tapi data masih ada**
- Refresh halaman setelah logout
- LocalStorage mungkin belum clear sempurna

### **Masalah: Chat history hilang setelah logout**
- Yakin sudah login dengan akun yang benar?
- Cek localStorage di DevTools (F12 → Application → Local Storage)

---

## 📞 Next Steps (Untuk Development Lanjutan)

Fitur yang bisa ditambahkan di masa depan:

1. **Backend API & Database**
   - Replace localStorage dengan API backend
   - Gunakan database seperti MongoDB/PostgreSQL

2. **Email Verification**
   - Validasi email saat register
   - Password reset via email

3. **Profile Customization**
   - Pilih avatar/foto profil
   - Edit nama & jenjang kapan saja

4. **Social Features**
   - Share chat/soal dengan teman
   - Collaborative learning

5. **Advanced Analytics**
   - Tracking progress per topik
   - Rekomendasi materi berdasarkan history

6. **Mobile App**
   - React Native version

---

**Dibuat dengan ❤️ untuk membantu setiap siswa belajar lebih baik!**
