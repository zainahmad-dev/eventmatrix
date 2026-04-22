# Admin Dashboard - Visual Component Guide

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AdminDashboard.jsx                           │
│  (Main Container - Manages state & fetches data)               │
│                                                                  │
│  State:                                                         │
│  - bookings[]                                                   │
│  - bookingFilter (all/pending/approved/rejected/completed)    │
│  - eventSectionMessage                                         │
│                                                                  │
│  Functions:                                                     │
│  - loadBookings() → Fetches from API                          │
│  - handleStatusChange() → Updates booking status             │
└─────────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ EventCategories  │ │ BookingDetails   │ │ Overview Grid    │
│ Section.jsx      │ │ Section.jsx      │ │ (Built-in)       │
│                  │ │                  │ │                  │
│ Shows:           │ │ Contains:        │ │ Shows:           │
│ - Wedding 💍     │ │ - Filter Tabs    │ │ - Revenue        │
│ - Corporate 🏢   │ │ - Booking Cards  │ │ - Profit         │
│ - Birthday 🎂    │ │ - Empty state    │ │ - Events         │
│ - Private 🎉     │ │ - Error message  │ │ - Employees      │
│                  │ │                  │ │ - Inventory      │
│ Counts & %       │ │ Progress bars    │ │ - Utilization    │
└──────────────────┘ │ for each type    │ └──────────────────┘
                     └──────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
          ┌──────────────────┐  ┌──────────────────┐
          │ BookingFilter    │  │ BookingDetail    │
          │ Tabs.jsx         │  │ Card.jsx (x many)│
          │                  │  │                  │
          │ All (X)          │  │ Shows:           │
          │ Pending (X)      │  │ - Event type     │
          │ Approved (X)     │  │ - Customer       │
          │ Rejected (X)     │  │ - Date/Venue     │
          │ Completed (X)    │  │ - Seats          │
          │                  │  │ - Pricing        │
          │ Counts update    │  │ - Add-ons        │
          │ in real-time     │  │ - Approve btn    │
          │                  │  │ - Reject btn     │
          └──────────────────┘  └──────────────────┘
```

---

## 📱 Page Layout (Desktop View)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                          │
│                    Welcome Admin User                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NAVIGATION TABS                                                │
│  Overview | Intelligence | Events | Employees | Inventory ...  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 💍 WEDDINGS │ 🏢 CORPORATE │ 🎂 BIRTHDAY  │ 🎉 PRIVATE   │
│ 15 Events   │ 12 Events    │ 7 Events     │ 4 Events     │
│ 45%         │ 36%          │ 21%          │ 12%          │
│ ████░░░     │ ███░░░       │ ██░░░        │ █░░░         │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌────────────── BOOKING DETAILS OVERVIEW ─────────────────┐
│ Filter: [All] [Pending] [Approved] [Rejected] [Completed]│
│                                                          │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│ │ 📅 WEDDING   │  │ 📅 CORPORATE │  │ 📅 BIRTHDAY  │   │
│ │ [PENDING]    │  │ [APPROVED]   │  │ [REJECTED]   │   │
│ │              │  │              │  │              │   │
│ │ Ahmed Khan   │  │ Tech Corp    │  │ Fatima Ali   │   │
│ │ 2026-05-15   │  │ 2026-06-20   │  │ 2026-04-10   │   │
│ │ Marriott     │  │ Distt Hall   │  │ Garden Hall  │   │
│ │ 150 (P)      │  │ 200 (V)      │  │ 80 (S)       │   │
│ │              │  │              │  │              │   │
│ │ Total:       │  │ Total:       │  │ Total:       │   │
│ │ PKR 50K      │  │ PKR 120K     │  │ PKR 25K      │   │
│ │ Adv: 15K     │  │ Adv: 36K     │  │ Adv: 7.5K    │   │
│ │ Due: 35K     │  │ Due: 84K     │  │ Due: 17.5K   │   │
│ │              │  │              │  │              │   │
│ │ 🎨 💡 🍽️    │  │ 🎨           │  │              │   │
│ │ [✓] [✕]      │  │ [✓] [✕]      │  │ [✓] [✕]      │   │
│ └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│ ... (more cards in responsive grid)                    │
└──────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Revenue  │ Profit   │ Events   │Employee  │Inventory│
│ PKR 50K  │ PKR 14K  │ 15       │ --       │ Stable  │
│ ────     │ ────     │ ────     │ ────     │ ────    │
│ Status:  │ Status:  │ Status:  │ Status:  │ Status: │
│ Pending  │ Pending  │ 8 Pending│ Waiting  │ 20%Util │
└──────────┴──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────────────┐
│ BUSINESS INTELLIGENCE                                   │
│ Monthly Revenue | Seasonal Demand | Cost Per Seat |... │
└─────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┐
│ EVENT MGMT       │ EMPLOYEES        │ INVENTORY        │
│ • 15 total       │ • 8 Waiters      │ • VIP: 25/50     │
│ • 8 pending      │ • 5 Chefs        │ • Premium: 85/120│
│ • 4 approved     │ • 1 Manager      │ • Standard:200/250
│ • 3 rejected     │ • Total: 15      │                  │
└──────────────────┴──────────────────┴──────────────────┘

┌─────────────────────────────────────────────────────────┐
│ QUOTATIONS & INVOICES                                   │
│ Generate | Refresh | View Payments | Download Reports  │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile View

```
┌────────────────────────────────────┐
│    ADMIN DASHBOARD                 │
│  Welcome Admin User                │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ NAVIGATION TABS (scrollable)        │
│ Overview > Intelligence > Events   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 💍 WEDDINGS                        │
│ 15 Events                          │
│ 45%                                │
│ ████░░░░░░░░░░░░                 │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 🏢 CORPORATE                       │
│ 12 Events                          │
│ 36%                                │
│ ███░░░░░░░░░░░░░░░░              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 🎂 BIRTHDAY                        │
│ 7 Events                           │
│ 21%                                │
│ ██░░░░░░░░░░░░░░░░░░░░           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ BOOKING FILTERS                    │
│ [All] [Pend] [App] [Rej] [Comp]   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📅 WEDDING [PENDING]               │
│                                    │
│ Customer: Ahmed Khan               │
│ Date: 2026-05-15                   │
│ Venue: Marriott                    │
│ Seats: 150 (P)                     │
│                                    │
│ Total   Advance  Due                │
│ 50K     15K      35K                │
│                                    │
│ 🎨 💡 🍽️                          │
│ [✓] [✕]                            │
└────────────────────────────────────┘

(More cards stacked vertically...)

┌────────────────────────────────────┐
│ OVERVIEW METRICS                   │
│ • Revenue: PKR 50K                 │
│ • Profit: PKR 14K                  │
│ • Events: 15                       │
│ • Inventory: Stable                │
└────────────────────────────────────┘
```

---

## 🔄 Data Update Flow

```
1. Component Mounts
   └─> useEffect calls loadBookings()

2. loadBookings() Function
   └─> API Call: fetch('/api/events')
       └─> Response: Array of booking objects
           └─> State Update: setBookings(data)

3. State Updates Trigger Re-renders
   └─> useBookingMetrics() recalculates metrics
   └─> EventCategoriesSection updates
   └─> BookingDetailsSection updates
   └─> Overview cards update

4. User Filters Bookings
   └─> setBookingFilter(status)
       └─> filteredBookings updates
           └─> BookingDetailCard components update

5. User Approves/Rejects Booking
   └─> handleStatusChange(id, status)
       └─> API Call: updateEventStatus()
           └─> loadBookings() called again
               └─> All data refreshes

6. Auto-refresh Every 5 Seconds
   └─> setInterval(loadBookings, 5000)
       └─> Keeps data current without user action
```

---

## 🎯 Component Props Reference

### EventCategoriesSection
```jsx
<EventCategoriesSection 
  bookings={bookings}  // Array of all bookings
/>
```

### BookingDetailsSection
```jsx
<BookingDetailsSection
  filteredBookings={filteredBookings}  // Filtered array
  allBookings={bookings}               // All bookings
  activeFilter={bookingFilter}         // Current filter
  onFilterChange={setBookingFilter}    // Filter callback
  onApproveBooking={approveFunc}       // Approve callback
  onRejectBooking={rejectFunc}         // Reject callback
  formatPKR={formatPKR}                // Currency formatter
  errorMessage={errorMsg}              // Error to display
/>
```

### BookingDetailCard
```jsx
<BookingDetailCard
  booking={bookingObj}      // Single booking
  onApprove={approveFunc}   // Approve click
  onReject={rejectFunc}     // Reject click
  formatPKR={formatPKR}     // Currency formatter
/>
```

---

## 🎨 Component Hierarchy

```
AdminDashboard (Container)
│
├─ Header
│  └─ Welcome message
│
├─ AdminNavbar
│  └─ Navigation tabs
│
├─ EventCategoriesSection
│  └─ 4 Category cards
│     ├─ Icon
│     ├─ Category name
│     ├─ Count
│     ├─ Percentage
│     └─ Progress bar
│
├─ BookingDetailsSection
│  ├─ Section header
│  ├─ BookingFilterTabs
│  │  └─ 5 Filter buttons
│  └─ BookingDetailCard (multiple)
│     ├─ Header
│     │  ├─ Event type badge
│     │  └─ Status badge
│     ├─ Quick info
│     │  ├─ Customer name
│     │  ├─ Date
│     │  ├─ Venue
│     │  └─ Seats
│     ├─ Pricing section
│     │  ├─ Total
│     │  ├─ Advance
│     │  └─ Due
│     ├─ Add-ons
│     │  ├─ Decoration 🎨
│     │  ├─ Lighting 💡
│     │  └─ Catering 🍽️
│     └─ Actions
│        ├─ Approve button ✓
│        └─ Reject button ✕
│
├─ Overview Grid
│  ├─ Total Revenue
│  ├─ Net Profit
│  ├─ Upcoming Events
│  ├─ Total Employees
│  ├─ Inventory Status
│  └─ Seat Utilization
│
├─ Business Intelligence
│  └─ 5 Insight cards
│
├─ Dashboard Grid
│  ├─ Event Management stats
│  ├─ Employee Management panel
│  ├─ Inventory panel
│  ├─ Notifications
│  └─ Performance snapshot
│
└─ Quotation & Invoices Panel
```

---

## ✅ Checklist for Understanding

- [ ] I understand the main AdminDashboard fetches and manages state
- [ ] I know EventCategoriesSection shows event type breakdown
- [ ] I understand BookingDetailsSection displays and filters bookings
- [ ] I can explain BookingFilterTabs functionality
- [ ] I know each BookingDetailCard shows one booking
- [ ] I understand the data flow from API to display
- [ ] I know how filtering works
- [ ] I understand how approve/reject updates data
- [ ] I can identify where each section appears on the page
- [ ] I know what props each component needs

---

## 🚀 Ready to Explain to Client!

You now have:
✅ Clean, modular code  
✅ Clear component separation  
✅ Easy-to-understand flow  
✅ Visual diagrams  
✅ Complete documentation  

**You can now explain this to your client with confidence!** 🎉
