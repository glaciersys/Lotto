# Lotto PWA — สารบัญไฟล์

เอกสารนี้สรุปว่าไฟล์ไหนทำหน้าที่อะไร ใช้เป็นจุดเริ่มต้นก่อนแก้ไขโค้ด
**โครงสร้างเป็นไฟล์แบน (ไม่มีแบ่งโฟลเดอร์) อยู่ root ของ repo ทั้งหมด**

## โครงสร้างโปรเจกต์

```
/
├── index.html         โครง HTML + หน้าจอรหัสผ่านร้าน
├── firebase-init.js   ตั้งค่า Firebase + ระบบรหัสผ่านร้าน (login)
├── app.js             logic หลักของแอป (sync กับ Firebase Realtime DB)
├── special.js         จัดการกลุ่มเลข (sync กับ Firebase)
├── style.css          สไตล์ทั้งหมดของแอป
├── manifest.json
├── icon-192.png
└── icon-512.png
```

## รายละเอียดไฟล์

| ไฟล์ | หน้าที่ | แก้ตอนไหน |
|---|---|---|
| `index.html` | โครงหน้าเว็บ (HTML structure) + gate รหัสผ่าน | เพิ่ม/ลบ section, เปลี่ยนโครงหน้า |
| `firebase-init.js` | ตั้งค่า Firebase config, รหัสผ่านร้าน, login แบบ anonymous auth | เปลี่ยนรหัสผ่านร้าน, เปลี่ยน Firebase project |
| `app.js` | logic หลักของแอป — ผู้ซื้อ/ยอดหวย/ตรวจผล/พิมพ์ใบโพย ทั้งหมด sync ผ่าน Firebase Realtime Database | เพิ่ม feature, แก้ flow การทำงานหลัก |
| `special.js` | จัดการกลุ่มเลข (เลขชุดพิเศษ/หมวดหมู่เลข) sync ผ่าน Firebase | แก้การแสดง/จัดกลุ่มเลขหวย |
| `style.css` | สไตล์ทั้งหมดของแอป (สี ฟอนต์ ระยะห่าง) | ปรับหน้าตา เช่น เปลี่ยนสี topbar |
| `manifest.json` | ชื่อแอป, ไอคอน, theme color, การติดตั้งเป็นแอป | เปลี่ยนชื่อ/สี ตอน install |
| `icon-192.png` / `icon-512.png` | ไอคอนแอป (สำหรับ PWA install) | เปลี่ยนไอคอน |

## ระบบ Realtime Multi-user (Firebase)

- **Firebase Project:** `lotto-f64dc` (Realtime Database, region: Singapore)
- **Auth:** Anonymous Sign-in — ปลดล็อกด้วยรหัสผ่านร้านที่หน้าจอแรก (ตั้งไว้ใน `firebase-init.js` ตัวแปร `SHOP_PASSWORD`)
- **Security Rules:** อนุญาตอ่าน/เขียนเฉพาะผู้ที่ login แล้ว (`auth != null`)
- **โครงสร้างข้อมูลใน Realtime Database:**
  ```
  /buyers/{buyerId}                  → {name}
  /data/{mode}/{buyerId}/{number}    → {top, bot}
  /entries/{mode}/{buyerId}/{key}    → {n, t, a, ts}   (log รายการล่าสุด)
  /specialGroups/{groupId}           → {name, nums:[...]}
  ```
- เปิดแอปพร้อมกันหลายเครื่อง/หลายคน ข้อมูลจะอัปเดตอัตโนมัติแบบ realtime ทุกเครื่อง
- ข้อมูลเก่าที่เคยเก็บไว้ใน localStorage จะถูกย้ายเข้า Firebase อัตโนมัติครั้งแรกที่เปิดแอปเวอร์ชันนี้ (ทำครั้งเดียว)
- **หมายเหตุด้านความปลอดภัย:** รหัสผ่านร้านเป็นแค่ gate ฝั่ง client เพื่อกันคนนอกทั่วไป ไม่ใช่ระดับความปลอดภัยสูงสุด เหมาะกับการใช้งานภายในร้าน/ทีมที่ไว้ใจกัน

## วิธีหาไฟล์ที่ต้องแก้ (เร็วๆ)

1. **เปลี่ยนหน้าตา/สี** → `style.css`
2. **เปลี่ยน logic หลัก** → `app.js`
3. **แก้เรื่องกลุ่มเลข** → `special.js`
4. **แก้โครง HTML** → `index.html`
5. **ไม่แน่ใจ** → Inspect element ใน Chrome DevTools เพื่อดู class/id แล้ว search ในไฟล์
6. **มี error** → เปิด Console (F12) จะบอกชื่อไฟล์ + เลขบรรทัดตรงๆ

## เวลาขอให้ Claude แก้ไข

บอกตรงๆ ว่าแก้ไฟล์ไหน Claude จะอ่านแค่ไฟล์นั้น ไม่ต้องอ่านทั้งโปรเจกต์ ทำให้เร็วและแม่นยำขึ้น เช่น:
- "แก้ app.js — เพิ่ม feature X"
- "แก้ style.css — เปลี่ยนสี topbar"
- "แก้ special.js — เพิ่มกลุ่มเลขใหม่"
