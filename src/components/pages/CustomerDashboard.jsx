import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileText,
  HandPlatter,
  MapPin,
  Package,
} from "lucide-react";
import { createEventBooking, fetchEvents } from "../../api/events";
import { calculatePackageTotal } from "../../api/packages";
import { CustomerNavbar } from "../common/CustomerNavbar";
import { PackageBrowser } from "../customer/PackageBrowser";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const defaultForm = {
  eventType: "wedding",
  eventDate: "",
  venue: "",
  seats: 50,
};

const payments = [
  "Advance payment: 30%",
  "Remaining payment: 70%",
  "Invoices and payment history are generated from approved bookings.",
];

const notifications = [
  "Booking submission and approval alerts",
  "Payment reminder alerts",
  "Event reminder alerts",
];

function FeatureCard({ icon, title, items }) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card-header">
        {icon}
        <h3>{title}</h3>
      </div>
      <ul className="dashboard-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function CustomerDashboard({ user }) {
  const [form, setForm] = useState(defaultForm);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [bookings, setBookings] = useState([]);
  const sectionItems = [
    { id: "customer-overview", label: "Overview" },
    { id: "customer-booking-interface", label: "Booking Interface" },
    { id: "customer-packages", label: "Event Packages" },
    { id: "customer-payment-interface", label: "Payment Interface" },
    { id: "customer-notifications", label: "Notifications" },
    { id: "customer-booking-snapshot", label: "Booking Snapshot" },
  ];

  const myBookings = useMemo(
    () => bookings.filter((booking) => booking.customerEmail === user?.email),
    [bookings, user?.email],
  );

  const loadBookings = async () => {
    try {
      const data = await fetchEvents();
      setBookings(data);
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  useEffect(() => {
    loadBookings();
    const timer = window.setInterval(loadBookings, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const latestBooking = myBookings[0];

  const calculator = useMemo(() => {
    if (!selectedPackage) {
      return { subtotal: 0, advance: 0, remaining: 0, available: false, limit: 0 };
    }

    const subtotal = calculatePackageTotal(selectedPackage, form.seats);
    const limit = selectedPackage.maxSeats || 0;
    const minSeats = selectedPackage.minSeats || 1;
    const available =
      Number(form.seats) >= minSeats && Number(form.seats) <= limit;

    return {
      subtotal,
      advance: subtotal * 0.3,
      remaining: subtotal * 0.7,
      available,
      limit,
      minSeats,
    };
  }, [form.seats, selectedPackage]);

  const overview = useMemo(() => {
    const approvedCount = myBookings.filter(
      (booking) => booking.status === "approved",
    ).length;
    const pendingCount = myBookings.filter(
      (booking) => booking.status === "pending",
    ).length;
    const dueAmount = myBookings.reduce(
      (sum, booking) => sum + (booking.remaining || 0),
      0,
    );
    return [
      { label: "Upcoming Events", value: String(myBookings.length) },
      {
        label: "Booking Status",
        value: `${approvedCount} Approved, ${pendingCount} Pending`,
      },
      {
        label: "Payment Status",
        value: myBookings.length ? "Linked to booking totals" : "--",
      },
      {
        label: "Remaining Due",
        value: myBookings.length ? formatPKR(dueAmount) : "--",
      },
    ];
  }, [myBookings]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "seats" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage("");
    setSubmitError("");

    if (!selectedPackage) {
      setSubmitError("Please select an event package curated by our team.");
      return;
    }

    if (!calculator.available) {
      setSubmitError(
        `Guest count must be between ${calculator.minSeats} and ${calculator.limit} for this package.`,
      );
      return;
    }

    const booking = {
      customerName: user?.name || "Customer",
      customerEmail: user?.email || "unknown@local",
      eventType: form.eventType,
      eventDate: form.eventDate,
      venue: form.venue,
      seats: Number(form.seats),
      packageId: selectedPackage.id,
      total: calculator.subtotal,
      advance: calculator.advance,
      remaining: calculator.remaining,
      status: "pending",
    };

    try {
      await createEventBooking(booking);
      await loadBookings();
      setSubmitMessage(
        "Booking submitted successfully. Our team will review your selected package.",
      );
      setForm((current) => ({ ...defaultForm, eventDate: current.eventDate }));
      setSelectedPackage(null);
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  return (
    <section className="dashboard-shell" aria-label="Customer dashboard">
      <div className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <p>
          Welcome {user?.name || "Customer"}. Choose a complete event package
          prepared by our team — equipment, food, and services included.
        </p>
      </div>

      <CustomerNavbar items={sectionItems} />

      <section
        id="customer-overview"
        className="overview-grid customer-target-section"
        aria-label="Customer overview"
      >
        {overview.map((item) => (
          <article className="overview-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article
          id="customer-booking-interface"
          className="dashboard-card dashboard-card--wide customer-target-section"
        >
          <div className="dashboard-card-header">
            <CalendarDays size={18} />
            <h3>Event Booking Interface</h3>
          </div>
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-grid">
              <label className="booking-field">
                Event type
                <select
                  className="field-input"
                  name="eventType"
                  value={form.eventType}
                  onChange={(event) => {
                    handleChange(event);
                    setSelectedPackage(null);
                  }}
                >
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="private">Private / Social Event</option>
                </select>
              </label>

              <label className="booking-field">
                Event date
                <input
                  className="field-input"
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="booking-field">
                Venue
                <input
                  className="field-input"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="Venue name"
                  required
                />
              </label>

              <label className="booking-field">
                Number of guests
                <input
                  className="field-input"
                  type="number"
                  min="1"
                  name="seats"
                  value={form.seats}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {selectedPackage ? (
              <div className="price-panel">
                <p>
                  Selected package: <strong>{selectedPackage.name}</strong>
                </p>
                <p>
                  Total estimate:{" "}
                  <strong>{formatPKR(calculator.subtotal)}</strong>
                </p>
                <p>
                  Advance (30%): <strong>{formatPKR(calculator.advance)}</strong>
                </p>
                <p>
                  Remaining (70%):{" "}
                  <strong>{formatPKR(calculator.remaining)}</strong>
                </p>
                <p
                  className={
                    calculator.available ? "availability-ok" : "availability-bad"
                  }
                >
                  {calculator.available
                    ? `Guest count fits this package (${calculator.minSeats}–${calculator.limit}).`
                    : `Guest count must be ${calculator.minSeats}–${calculator.limit} for this package.`}
                </p>
              </div>
            ) : (
              <p className="dashboard-copy">
                Select a package below to see your all-inclusive price.
              </p>
            )}

            {submitError ? (
              <p className="availability-bad">{submitError}</p>
            ) : null}
            {submitMessage ? (
              <p className="availability-ok">{submitMessage}</p>
            ) : null}

            <button className="primary-action" type="submit">
              Submit Booking Request
            </button>
          </form>
        </article>

        <article
          id="customer-packages"
          className="dashboard-card dashboard-card--wide customer-target-section"
        >
          <div className="dashboard-card-header">
            <Package size={18} />
            <h3>Event Packages</h3>
          </div>
          <PackageBrowser
            eventType={form.eventType}
            seats={form.seats}
            selectedPackageId={selectedPackage?.id}
            onSelectPackage={setSelectedPackage}
          />
        </article>

        <div
          id="customer-payment-interface"
          className="customer-target-section"
        >
          <FeatureCard
            icon={<CreditCard size={18} />}
            title="Payment Interface"
            items={payments}
          />
        </div>
        <div id="customer-notifications" className="customer-target-section">
          <FeatureCard
            icon={<Bell size={18} />}
            title="Notifications"
            items={notifications}
          />
        </div>
      </section>

      <article
        id="customer-booking-snapshot"
        className="dashboard-card dashboard-card--wide customer-target-section"
      >
        <div className="dashboard-card-header">
          <MapPin size={18} />
          <h3>Current Booking Snapshot</h3>
        </div>
        <p className="dashboard-copy">
          {latestBooking
            ? `${latestBooking.eventType.toUpperCase()} on ${latestBooking.eventDate} at ${latestBooking.venue}. Package: ${latestBooking.packageName || "N/A"}. Status: ${latestBooking.status}.`
            : "No booking submitted yet."}
        </p>
        <div className="quick-actions">
          <button type="button">
            <HandPlatter size={15} /> Open Booking Module
          </button>
          <button type="button">
            <FileText size={15} /> Open Invoice Module
          </button>
          <button type="button">
            <CreditCard size={15} /> Open Payment Module
          </button>
        </div>
      </article>
    </section>
  );
}
