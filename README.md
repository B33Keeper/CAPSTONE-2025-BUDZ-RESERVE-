# 🏸 Budz Reserve - Complete Project Documentation

A comprehensive badminton court booking system with full-stack React/NestJS implementation, Docker containerization, and Paymongo payment integration.

---

## 🚨 CRITICAL: READ THIS FIRST!

> **⚠️ PAYMENT SYSTEM WILL NOT WORK WITHOUT NGROK!**
> 
> **ALL TEAMMATES MUST COMPLETE THE NGROK SETUP BEFORE TESTING PAYMENTS!**
> 
> **Scroll down to the "🚨 IMPORTANT: ngrok Setup for Payment Integration" section and follow ALL steps!**
> 
> **Without ngrok:**
> - ❌ Payments will process but reservations won't be saved
> - ❌ No email receipts will be sent
> - ❌ Webhook processing will fail
> - ❌ Incomplete payment flow

---

## 📋 WORKING PAGES AND FUNCTIONALITIES

### 📅 Booking Page
- Payment integration
- Time constraint validation
- Webhook integration

### 📊 remove individual side bars each admin page
-- used the component feature of the react app
-- the side bar is reusable in any page

### 🏸 Admin Manage Courts
- Dynamic court management interface
- Automatic sheet creation when the last sheet's court number is maxed/capped to "6"

### 🏠 Home Page
- "Get in Touch" section is now dynamic

### 📊 Admin Sales Report
- Proper UI/UX implementation
- Dynamic reporting functionality

### 💬 Admin View Suggestion
- View suggestion is now dynamic

## 💬  Admin Announcement
- Only the latest announcement is shown
- added announcement history 

### 🗄️ Database
- Added `equipment_rentals` table
- Added `equipment_rental_items` table
- Exported the updated database named `database_export.sql`

---
