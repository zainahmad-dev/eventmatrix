# Admin Dashboard - Quick Reference Guide

## 📍 Component Quick Lookup

### Need to understand how something works? Start here!

---

## 🎯 By Feature

### "How does filtering work?"
1. File: `BookingFilterTabs.jsx`
2. Shows 5 buttons: All, Pending, Approved, Rejected, Completed
3. When clicked → calls `onFilterChange()` callback
4. Parent component (`AdminDashboard.jsx`) updates `bookingFilter` state
5. Filtered bookings displayed via `BookingDetailsSection.jsx`

### "How does approving/rejecting work?"
1. User clicks Approve ✓ or Reject ✕ on `BookingDetailCard.jsx`
2. Calls `onApprove()` or `onReject()` callback
3. Goes to `handleStatusChange()` in `AdminDashboard.jsx`
4. Calls `updateEventStatus()` API function
5. API updates database
6. `loadBookings()` fetches fresh data
7. Dashboard displays updated bookings

### "Why do numbers keep changing?"
- `useEffect()` in `AdminDashboard.jsx` calls `setInterval(loadBookings, 5000)`
- Fetches data every 5 seconds
- State updates trigger re-renders
- All components show latest data

### "Where do the event categories come from?"
1. File: `EventCategoriesSection.jsx`
2. Counts bookings by event type
3. Maps to 4 categories: Wedding, Corporate, Birthday, Private
4. Calculates percentage and shows progress bar
5. Updates whenever bookings data changes

### "Where is the booking data coming from?"
- File: `AdminDashboard.jsx` → `loadBookings()` function
- Calls: `fetch('/api/events')`
- Returns: Array of booking objects from MongoDB
- Stored in: `bookings` state
- Updated: Every 5 seconds automatically

---

## 🔍 By Component

### **AdminDashboard.jsx**
```
Purpose:     Main container & state manager
What it does: Fetches data, manages filters, handles updates
Key funcs:   loadBookings(), handleStatusChange()
Key state:   bookings[], bookingFilter, eventSectionMessage
```

### **EventCategoriesSection.jsx**
```
Purpose:     Show event type breakdown
What it does: Counts events by type, shows percentages
Props:       bookings[]
Shows:       💍 Wedding, 🏢 Corporate, 🎂 Birthday, 🎉 Private
```

### **BookingDetailsSection.jsx**
```
Purpose:     Main booking display & filter container
What it does: Shows filter tabs + booking cards grid
Props:       filteredBookings[], allBookings[], callbacks
Contains:    BookingFilterTabs + BookingDetailCard(s)
```

### **BookingFilterTabs.jsx**
```
Purpose:     Filter navigation
What it does: Shows filter buttons with counts
Props:       bookings[], activeFilter, onFilterChange()
Shows:       5 filter buttons + booking counts
```

### **BookingDetailCard.jsx**
```
Purpose:     Display single booking
What it does: Shows customer, date, venue, pricing, add-ons
Props:       booking, onApprove(), onReject(), formatPKR()
Shows:       Compact card with essential booking info
```

### **AdminMetricsHooks.jsx**
```
Purpose:     Business logic & calculations
What it does: Calculates metrics, generates card data
Exports:     3 custom hooks
Functions:   useBookingMetrics(), useOverviewCards(), useEventManagementSummary()
```

---

## 📊 Data Flow Diagram

```
API Database
    ↓
AdminDashboard.fetchEvents() 
    ↓
bookings[] state
    ↓
┌───────────────────────────────────────┐
│ EventCategories │ BookingDetails      │ Metrics
│ Section         │ Section             │ (Overview)
│                 │                     │
│ Counts events   │ ┌───────────┐       │ Calculates
│ Shows types     │ │Tabs       │       │ Revenue
│ Progress bars   │ │Filters    │       │ Profit
│                 │ └───────────┘       │ Counts
│                 │       ↓             │ Utils
│                 │  ┌──────────┐       │
│                 │  │Cards     │       │
│                 │  │Display   │       │
│                 │  └──────────┘       │
└───────────────────────────────────────┘
         ↓                ↓
    User clicks       Update data
    filter tabs   ↔   via API
    approve/
    reject
```

---

## 🛠️ Common Tasks

### Add a new filter button
**Where:** `BookingFilterTabs.jsx`
```jsx
const filters = [
  // ... existing filters
  { id: 'newstatus', label: 'New Status', count: getStatusCount('newstatus') },
];
```

### Change how bookings are sorted
**Where:** `AdminDashboard.jsx`, in `loadBookings()` → backend API

### Modify a booking card display
**Where:** `BookingDetailCard.jsx` → JSX return statement

### Add new metric calculation
**Where:** `AdminMetricsHooks.jsx` → `useBookingMetrics()` function

### Change refresh interval
**Where:** `AdminDashboard.jsx`, find `setInterval(loadBookings, 5000)`
- `5000` = 5 seconds
- Change to `10000` for 10 seconds, etc.

---

## 🐛 Debugging Tips

### "Bookings aren't showing?"
1. Check browser console for errors
2. Check API endpoint is running: `localhost:5000/api/events`
3. Verify database has data: `db.events.find()`
4. Check `eventSectionMessage` in AdminDashboard for errors

### "Filters aren't working?"
1. Verify `bookingFilter` state is changing
2. Check `filteredBookings` calculation
3. Verify filter callback is being called
4. Check browser DevTools React tab

### "Approve/Reject not working?"
1. Check browser console for errors
2. Verify API endpoint: `PATCH /api/events/:id/status`
3. Confirm `loadBookings()` is called after update
4. Check database for status change

### "Data not updating?"
1. Check if `setInterval` is running
2. Verify API returns latest data
3. Check if state updates are triggering re-renders
4. Verify no errors in `loadBookings()` function

---

## 📁 File Summary Table

| File | Lines | Purpose | Key Code |
|------|-------|---------|----------|
| AdminDashboard.jsx | ~400 | Main orchestrator | Fetch, filter, update |
| EventCategories.jsx | ~70 | Event breakdown | Count, display, %age |
| BookingDetails.jsx | ~80 | Booking container | Filter + cards |
| BookingTabs.jsx | ~35 | Filter buttons | Tabs with counts |
| BookingCard.jsx | ~90 | Single booking | Display + actions |
| AdminMetrics.jsx | ~120 | Logic | Calculations |

---

## 🚀 Quick Start for New Developer

1. **Read**: This quick reference (you are here!)
2. **Explore**: Open `AdminDashboard.jsx` and follow imports
3. **Understand**: How data flows from API to display
4. **Find**: A component that interests you
5. **Read**: Its JSDoc comments
6. **Try**: Add a small feature

---

## 📞 How to Show Client

### "The Dashboard is Organized Like This:"
- **Event Categories** section (top) - Shows event types
- **Booking Details** section (middle) - Shows all bookings with filter
- **Overview Cards** (below) - Shows metrics
- **Other Panels** (bottom) - Employees, inventory, quotes

### "Here's How Users Interact:"
1. See booking categories at top
2. Filter by status using tabs
3. View compact booking cards
4. Approve or reject with buttons
5. Data updates automatically every 5 seconds

### "Here's How It Works Behind the Scenes:"
- Dashboard fetches bookings every 5 seconds
- Splits them by status and category
- Calculates business metrics
- Displays everything in a clean layout
- Updates instantly when you approve/reject

---

## ✨ Component Communication

```
Props Flow (Data Down):
AdminDashboard
├─ bookings → EventCategories
├─ filteredBookings → BookingDetails
├─ overview → Overview Cards
└─ etc...

Callback Flow (Events Up):
BookingCard
├─ onApprove() → AdminDashboard → handleStatusChange()
└─ onReject() → AdminDashboard → handleStatusChange()

Filter Flow (State Change):
BookingTabs
└─ onFilterChange() → AdminDashboard → setBookingFilter()
```

---

## 🎓 Learning Paths

### For Understanding the Code:
1. AdminDashboard.jsx (main)
2. AdminMetricsHooks.jsx (logic)
3. EventCategoriesSection.jsx (simple display)
4. BookingDetailsSection.jsx (container)
5. BookingFilterTabs.jsx (interaction)
6. BookingDetailCard.jsx (detailed display)

### For Adding Features:
1. Start with AdminDashboard.jsx
2. Identify where your feature fits
3. Create new component file
4. Import it in AdminDashboard
5. Wire up props and callbacks

### For Debugging:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check React DevTools extension
5. Trace state and prop values

---

## 🎯 Most Important Files

### If you can only remember 3 files:
1. **AdminDashboard.jsx** - The brain, manages everything
2. **BookingDetailsSection.jsx** - The main display area
3. **AdminMetricsHooks.jsx** - The calculations

### If you can only remember 1 thing:
**Everything flows from AdminDashboard.jsx → it fetches data and passes it to child components → child components display and handle user clicks → clicks callback to AdminDashboard → AdminDashboard updates and refreshes**

---

## 📚 Document Reference

| Document | Read When | Length |
|----------|-----------|--------|
| This file | First time learning | Quick |
| REFACTORING_SUMMARY.md | Want big picture | Medium |
| ADMIN_DASHBOARD_DOCS.md | Need technical details | Long |
| ADMIN_DASHBOARD_VISUAL_GUIDE.md | Visual learner | Medium |

---

## ✅ Confidence Checklist

- [ ] I can explain the 6 main components
- [ ] I know where data comes from (API)
- [ ] I understand how filtering works
- [ ] I know how approve/reject works
- [ ] I can find a specific feature in the code
- [ ] I know what each file is responsible for
- [ ] I can add a simple feature
- [ ] I can debug basic issues

**If you checked all? You're ready! 🎉**

---

## 🆘 Need Help?

| Problem | Check This |
|---------|-----------|
| Can't find something | Use Ctrl+F to search |
| Confused by a component | Read its JSDoc comments |
| Don't understand flow | Check ADMIN_DASHBOARD_VISUAL_GUIDE.md |
| Need full details | Read ADMIN_DASHBOARD_DOCS.md |
| Error in console | Check what function error mentions |

---

**Happy Coding! You've got this! 🚀**
