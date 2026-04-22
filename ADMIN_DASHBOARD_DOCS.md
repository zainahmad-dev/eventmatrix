# Admin Dashboard - Component Architecture Documentation

## Overview

The Admin Dashboard has been refactored from a single complex component into multiple focused, reusable components. This makes the code easier to understand, maintain, and explain to clients.

---

## 📁 Component Structure

```
components/
├── pages/
│   └── AdminDashboard.jsx          ← Main container component
├── admin/
│   ├── AdminMetricsHooks.jsx       ← Logic hooks (metrics calculations)
│   ├── EventCategoriesSection.jsx  ← Event type breakdown display
│   ├── BookingDetailsSection.jsx   ← Main booking display section
│   ├── BookingFilterTabs.jsx       ← Filter buttons (All, Pending, etc)
│   ├── BookingDetailCard.jsx       ← Individual booking card
│   ├── EmployeeManagement.jsx      ← Employee panel
│   ├── Inventory.jsx               ← Inventory panel
│   └── QuotationInvoicesPanel.jsx  ← Quotations/Invoices panel
└── common/
    └── AdminNavbar.jsx             ← Navigation tabs
```

---

## 🎯 Component Responsibilities

### 1. **AdminDashboard.jsx** (Main Container)
**Purpose:** Orchestrates the entire admin dashboard

**Responsibilities:**
- Manages all state (bookings, filter status, error messages)
- Fetches data from API
- Handles booking status updates (approve/reject)
- Passes data and callbacks to child components
- Handles animations

**Key Props Received:**
- `user` - Current admin user object

**Key Features:**
- Real-time data refresh (every 5 seconds)
- GSAP animations on load
- Error handling and messaging

---

### 2. **EventCategoriesSection.jsx** (Statistics Display)
**Purpose:** Shows breakdown of events by type

**Displays:**
- 💍 Wedding - Pink cards
- 🏢 Corporate - Blue cards
- 🎂 Birthday - Gold cards
- 🎉 Private/Social - Green cards

**Shows for Each Category:**
- Event count
- Percentage of total
- Visual progress bar

**Props:**
- `bookings` - Array of all bookings

---

### 3. **BookingDetailsSection.jsx** (Main Booking View)
**Purpose:** Main section for displaying and managing bookings

**Contains:**
- Filter tabs (All, Pending, Approved, Rejected, Completed)
- Grid of booking cards
- Error message display
- Empty state message

**Props:**
- `filteredBookings` - Filtered array to display
- `allBookings` - All bookings (for counts)
- `activeFilter` - Currently selected filter
- `onFilterChange` - Callback when filter changes
- `onApproveBooking` - Callback when approve clicked
- `onRejectBooking` - Callback when reject clicked
- `formatPKR` - Currency formatter function
- `errorMessage` - Error to display

---

### 4. **BookingFilterTabs.jsx** (Navigation)
**Purpose:** Filter buttons to view bookings by status

**Filters Available:**
- All Bookings
- Pending
- Approved
- Rejected
- Completed

**Shows:**
- Status name
- Count of bookings in that status

**Props:**
- `bookings` - All bookings (to calculate counts)
- `activeFilter` - Currently selected filter ID
- `onFilterChange` - Callback when filter selected

---

### 5. **BookingDetailCard.jsx** (Individual Card)
**Purpose:** Displays a single booking in compact card format

**Shows:**
- Event type with icon
- Customer name
- Event date
- Venue
- Number of seats and category
- Total price (gold)
- Advance payment (green)
- Remaining due (blue)
- Add-ons (decoration, lighting, catering)
- Status badge
- Approve/Reject buttons

**Props:**
- `booking` - Single booking object
- `onApprove` - Approve button callback
- `onReject` - Reject button callback
- `formatPKR` - Currency formatter

---

### 6. **AdminMetricsHooks.jsx** (Logic & Calculations)
**Purpose:** Contains custom hooks for data calculations

**Hooks Provided:**

#### `useBookingMetrics(bookings)`
Calculates key business metrics:
- Total revenue
- Net profit (28% margin estimate)
- Count of approved/pending bookings
- Seat utilization percentage
- Inventory status

**Returns:** Metrics object

#### `useOverviewCards(metrics, formatPKR)`
Generates 6 overview metric cards:
1. Total Revenue
2. Net Profit
3. Upcoming Events
4. Total Employees
5. Inventory Status
6. Seat Utilization

**Returns:** Array of card objects for display

#### `useEventManagementSummary(bookings)`
Creates summary text for event management:
- Total bookings count
- Pending/Approved/Rejected breakdown

**Returns:** Array of summary strings

---

## 🔄 Data Flow

```
AdminDashboard.jsx (Main Component)
    ↓
    ├→ Fetch bookings from API
    ├→ Calculate metrics (useBookingMetrics)
    ├→ Generate overview cards (useOverviewCards)
    ├→ Filter bookings by status
    │
    ├→ EventCategoriesSection
    │   └→ Shows event type breakdown
    │
    ├→ BookingDetailsSection
    │   ├→ BookingFilterTabs
    │   │   └→ Filter buttons with counts
    │   │
    │   └→ BookingDetailCard (multiple)
    │       └→ Individual booking displays
    │
    ├→ EmployeeManagementPanel
    ├→ InventoryPanel
    └→ QuotationInvoicesPanel
```

---

## 📊 How Each Section Works

### Event Categories Section
1. Counts bookings by event type
2. Calculates percentage of total
3. Displays in 4 color-coded cards with progress bars
4. Updates in real-time

### Booking Filter System
1. Shows 5 filter buttons (All, Pending, Approved, Rejected, Completed)
2. Each button shows count of bookings in that status
3. Clicking button filters the booking cards below
4. Only matching bookings display

### Booking Detail Cards
1. Compact 320px width cards (3-4 per row)
2. Shows essential info only (no clutter)
3. Pricing displayed as 3 separate values
4. Add-ons shown as tiny emoji icons
5. Two action buttons: Approve (✓) and Reject (✕)

### Metrics & Overview
1. Calculates from ALL bookings
2. Shows business KPIs (revenue, profit, utilization)
3. Updates when bookings change
4. Context messages explain what's happening

---

## 🎨 Component Communication

```
State Management:
- bookings[]          ← Fetched from API
- bookingFilter       ← Filter tab selection
- eventSectionMessage ← Error/status messages

Functions:
- loadBookings()      ← Fetch from API
- handleStatusChange()← Update approval status
```

---

## 🔧 How to Explain to Client

### 1. **Overview Section**
"This shows all key business metrics at a glance - revenue, profit, events, and inventory status."

### 2. **Event Categories**
"This breaks down all bookings by event type - you can see how many weddings, corporate events, birthdays, and social events you have."

### 3. **Booking Details**
"This is where you manage all customer bookings. You can filter by status (pending, approved, rejected) and approve or reject bookings with one click."

### 4. **Booking Cards**
"Each card shows important booking information - customer, date, venue, seats, and pricing. Green is advance payment, blue is remaining payment."

### 5. **Employee & Inventory**
"These panels show your staffing levels and inventory usage to help with planning."

---

## ✨ Key Improvements

✅ **Modularity** - Each component has one responsibility  
✅ **Reusability** - Components can be used elsewhere  
✅ **Testability** - Each component can be tested independently  
✅ **Readability** - Clear, focused code that's easy to understand  
✅ **Maintainability** - Easy to update or fix specific features  
✅ **Scalability** - Easy to add new sections or features  
✅ **Performance** - Optimized with React hooks and memoization  

---

## 📝 Adding New Features

To add a new section to the dashboard:

1. Create new component file in `components/admin/`
2. Build your JSX and styling
3. Import it in `AdminDashboard.jsx`
4. Add it to the return JSX
5. Done! No need to modify other components

**Example:**
```jsx
// components/admin/NewSection.jsx
export function NewSection({ bookings }) {
  return <section>...</section>;
}

// In AdminDashboard.jsx
import { NewSection } from '../admin/NewSection';

// In render:
<NewSection bookings={bookings} />
```

---

## 🐛 Debugging

If something isn't working:

1. Check the console for error messages
2. Verify API is returning data
3. Check that props are being passed correctly
4. Verify component imports are correct
5. Check CSS classes are applied

---

## 📚 Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| AdminDashboard.jsx | ~400 | Main orchestrator |
| EventCategoriesSection.jsx | ~60 | Event breakdown |
| BookingDetailsSection.jsx | ~80 | Main booking view |
| BookingFilterTabs.jsx | ~35 | Filter buttons |
| BookingDetailCard.jsx | ~90 | Single card |
| AdminMetricsHooks.jsx | ~120 | Calculation logic |

**Total lines: ~785** (vs previous ~500 with much less clarity)

---

## 🎯 Next Steps

To use this refactored dashboard:

1. Update imports if components moved
2. Check CSS is loaded correctly
3. Test all filter buttons work
4. Verify approve/reject functions
5. Check real-time updates work
6. Test responsive design on mobile

That's it! The dashboard is now clean, modular, and easy to maintain! 🎉
