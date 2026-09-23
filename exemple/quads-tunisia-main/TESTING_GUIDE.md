# Testing Guide: Frontend to Admin Booking Flow

## Complete End-to-End Test

This guide will help you test the complete booking flow from customer booking to admin dashboard.

---

## Prerequisites

Make sure both servers are running:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Test Flow

### Step 1: Customer Books an Activity

1. **Open the website:**
   - URL: `http://localhost:5173`

2. **Navigate to Booking page:**
   - Click "Booking" in the navigation menu
   - Or go directly to: `http://localhost:5173/booking`

3. **Browse activities:**
   - You should see 6 activities loaded from the database:
     - Jet Skiing (€89.99)
     - Scuba Diving (€149.99)
     - Parasailing (€119.99)
     - Snorkeling Tour (€59.99)
     - Kayaking (€49.99)
     - Sunset Cruise (€199.99)

4. **Add activities to cart:**
   - Click "Book Now" on any activity
   - Cart modal should open automatically
   - Add more activities if desired
   - Adjust quantities using +/- buttons

5. **Fill in customer information:**
   - Full Name: `Test Customer`
   - Email: `test@customer.com`
   - Phone: `+1234567890`
   - Preferred Date: Select any future date
   - Special Requests: (Optional) `Testing the booking system`

6. **Submit booking:**
   - Click "Complete Booking" button
   - You should see a confirmation alert:
     ```
     🎉 Booking confirmed!

     X activities booked successfully!

     Total: €XXX.XX

     We will contact you at test@customer.com to confirm your reservation.
     ```
   - Click OK
   - Cart should be cleared
   - Form should be reset

---

### Step 2: Admin Views the Booking

1. **Open admin login:**
   - URL: `http://localhost:5173/admin/login`

2. **Login with admin credentials:**
   - Email: `admin@aquasports.com`
   - Password: `admin123`
   - Click "Sign In"

3. **Check Dashboard:**
   - You should be redirected to `/admin`
   - Stats should update to show the new booking
   - The booking should appear in "Recent Bookings" table at the bottom

4. **View all bookings:**
   - Click "Bookings" in the sidebar
   - Or go to: `http://localhost:5173/admin/bookings`

5. **Find your booking:**
   - Look for customer name: "Test Customer"
   - Email: "test@customer.com"
   - Status should be: "Pending"
   - Payment Status: "Unpaid"

6. **Update booking status:**
   - Change status dropdown to "Confirmed"
   - The database is automatically updated!

7. **Edit booking details:**
   - Click "Edit" button on the booking
   - Modify customer info or date
   - Click "Save Changes"

---

## What to Check

### ✅ On Booking Page

- [ ] Activities load from database (6 activities)
- [ ] Each activity shows: name, price, duration, location
- [ ] "Book Now" button adds to cart
- [ ] Cart counter updates correctly
- [ ] Cart modal shows correct items and prices
- [ ] Quantity can be increased/decreased
- [ ] Items can be removed from cart
- [ ] Total price calculates correctly
- [ ] Form validation works (required fields)
- [ ] Date picker doesn't allow past dates
- [ ] Success message appears after submission
- [ ] Cart clears after successful booking

### ✅ On Admin Dashboard

- [ ] Login works with admin credentials
- [ ] Dashboard shows updated statistics
- [ ] New booking appears in "Recent Bookings"
- [ ] Total bookings count increases
- [ ] Pending bookings count increases
- [ ] Revenue stats update (if payment status is set)

### ✅ On Admin Bookings Page

- [ ] New booking appears in the list
- [ ] All booking details are correct:
  - Customer name
  - Email
  - Phone
  - Activity name
  - Date
  - Participants (quantity)
  - Total price
  - Status (Pending)
- [ ] Status can be changed via dropdown
- [ ] Edit button opens modal with booking details
- [ ] Changes save to database
- [ ] Delete button removes booking

---

## Advanced Tests

### Test Multiple Bookings

1. Add multiple activities to cart (e.g., Jet Skiing + Scuba Diving)
2. Submit booking
3. Check admin - should see 2 separate bookings with same customer info

### Test Different Quantities

1. Add activity with quantity 3
2. Check admin - participants should show 3
3. Total price should be: activity price × 3

### Test Data Persistence

1. Make a booking
2. Refresh the page
3. Check admin - booking should still be there (stored in SQLite)
4. Restart backend server
5. Check admin - booking should STILL be there! (persistent database)

---

## Troubleshooting

### Activities don't load
- **Check:** Backend is running on port 5000
- **Check:** Browser console for errors
- **Fix:** Make sure you run `npm run dev` in backend directory

### Booking submission fails
- **Check:** Network tab in browser DevTools
- **Check:** Backend console for errors
- **Common issue:** CORS error - make sure backend has `cors()` middleware

### Bookings don't appear in admin
- **Check:** You're logged in as admin
- **Check:** Backend database has the booking (use sqlite3 to check)
- **Fix:** Refresh the admin bookings page

### "Failed to load activities" error
- **Cause:** Backend API not responding
- **Fix:** Check backend is running and accessible at `http://localhost:5000`

---

## Expected Results

After completing the test, you should have:

1. ✅ New booking in SQLite database (`backend/database/aquasports.db`)
2. ✅ Booking visible in admin dashboard
3. ✅ Booking visible in admin bookings page
4. ✅ Ability to edit/update booking from admin
5. ✅ Ability to change booking status
6. ✅ Persistent data (survives page refresh and server restart)

---

## Database Verification (Optional)

Want to see the data directly in the database?

```bash
cd backend/database
sqlite3 aquasports.db

# View all bookings
SELECT * FROM bookings ORDER BY createdAt DESC LIMIT 5;

# View booking with customer details
SELECT
  id,
  customerName,
  customerEmail,
  activityName,
  date,
  totalPrice,
  status
FROM bookings
WHERE customerEmail = 'test@customer.com';

# Exit
.exit
```

---

## Success Criteria

The integration is working correctly if:

1. ✅ Customer can browse activities from database
2. ✅ Customer can add activities to cart
3. ✅ Customer can submit booking with their info
4. ✅ Booking is saved to SQLite database
5. ✅ Admin can view booking in dashboard
6. ✅ Admin can update booking status
7. ✅ Admin can edit booking details
8. ✅ Data persists across refreshes and restarts

---

**You now have a fully functional booking system! 🎉**

Customers can book activities, and admins can manage everything from the admin dashboard!
