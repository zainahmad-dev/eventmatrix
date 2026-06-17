import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileText,
  HandPlatter,
  MapPin,
} from "lucide-react";
import { createEventBooking, fetchEvents } from "../../api/events";
import { CustomerNavbar } from "../common/CustomerNavbar";
import { EquipmentBrowser } from "../customer/EquipmentBrowser";
import { EquipmentCart } from "../customer/EquipmentCart";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const seatPrices = {
  vip: 1500,
  premium: 1200,
  standard: 800,
};

const seatLimits = {
  vip: 50,
  premium: 120,
  standard: 250,
};

const menuAddons = {
  basic: 250,
  classic: 500,
  premium: 900,
};

const defaultForm = {
  eventType: "wedding",
  eventDate: "",
  venue: "",
  seatCategory: "premium",
  seats: 50,
  menuPlan: "classic",
  decoration: true,
  lighting: false,
  cateringSupport: true,
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
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [equipmentCart, setEquipmentCart] = useState([]);
  const sectionItems = [
    { id: "customer-overview", label: "Overview" },
    { id: "customer-booking-interface", label: "Booking Interface" },
    { id: "customer-equipment", label: "Equipment Rental" },
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
    const seatCost = seatPrices[form.seatCategory] || 0;
    const menuCost = menuAddons[form.menuPlan] || 0;
    const addOnCost =
      (form.decoration ? 15000 : 0) +
      (form.lighting ? 8000 : 0) +
      (form.cateringSupport ? 250 * Number(form.seats) : 0);
    const perSeat = seatCost + menuCost;
    const subtotal = Number(form.seats) * perSeat + addOnCost;
    const advance = subtotal * 0.3;
    const remaining = subtotal * 0.7;
    const limit = seatLimits[form.seatCategory] || 0;
    const available = Number(form.seats) <= limit;
    return {
      subtotal,
      advance,
      remaining,
      available,
      limit,
    };
  }, [form]);

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
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : name === "seats"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage("");
    setSubmitError("");

    if (!calculator.available) {
      setSubmitError(
        `Selected seats exceed available ${form.seatCategory.toUpperCase()} capacity (${calculator.limit}).`,
      );
      return;
    }

    const equipmentTotal = equipmentCart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const bookingTotal = calculator.subtotal + equipmentTotal;

    const booking = {
      customerName: user?.name || "Customer",
      customerEmail: user?.email || "unknown@local",
      eventType: form.eventType,
      eventDate: form.eventDate,
      venue: form.venue,
      seatCategory: form.seatCategory,
      seats: Number(form.seats),
      menuPlan: form.menuPlan,
      decoration: form.decoration,
      lighting: form.lighting,
      cateringSupport: form.cateringSupport,
      equipment: equipmentCart,
      total: bookingTotal,
      advance: bookingTotal * 0.3,
      remaining: bookingTotal * 0.7,
      status: "pending",
    };

    try {
      await createEventBooking(booking);
      await loadBookings();
      setSubmitMessage(
        "Booking submitted successfully. Admin can now review it in real time.",
      );
      setForm((current) => ({ ...defaultForm, eventDate: current.eventDate }));
      setEquipmentCart([]);
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const handleAddEquipmentToCart = (equipment) => {
    const existingIndex = equipmentCart.findIndex((item) => item.id === equipment.id);

    if (existingIndex >= 0) {
      const updatedCart = [...equipmentCart];
      updatedCart[existingIndex].quantity += equipment.quantity;
      updatedCart[existingIndex].totalPrice = updatedCart[existingIndex].pricePerDay * updatedCart[existingIndex].quantity;
      setEquipmentCart(updatedCart);
    } else {
      setEquipmentCart([...equipmentCart, equipment]);
    }
  };

  const handleRemoveEquipment = (index) => {
    setEquipmentCart(equipmentCart.filter((_, i) => i !== index));
  };

  const handleUpdateEquipmentQuantity = (index, quantity) => {
    const updatedCart = [...equipmentCart];
    updatedCart[index].quantity = quantity;
    updatedCart[index].totalPrice = updatedCart[index].pricePerDay * quantity;
    setEquipmentCart(updatedCart);
  };

  return (
    <section className="dashboard-shell" aria-label="Customer dashboard">
      <div className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <p>
          Welcome {user?.name || "Customer"}. Create a booking request, see
          instant pricing, and submit it for admin approval.
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
                  onChange={handleChange}
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
                Seat category
                <select
                  className="field-input"
                  name="seatCategory"
                  value={form.seatCategory}
                  onChange={handleChange}
                >
                  <option value="vip">VIP</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                </select>
              </label>

              <label className="booking-field">
                Number of seats
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

              <label className="booking-field">
                Menu plan
                <select
                  className="field-input"
                  name="menuPlan"
                  value={form.menuPlan}
                  onChange={handleChange}
                >
                  <option value="basic">Basic</option>
                  <option value="classic">Classic</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
            </div>

            <div className="booking-addons">
              <label>
                <input
                  type="checkbox"
                  name="decoration"
                  checked={form.decoration}
                  onChange={handleChange}
                />{" "}
                Decoration service
              </label>
              <label>
                <input
                  type="checkbox"
                  name="lighting"
                  checked={form.lighting}
                  onChange={handleChange}
                />{" "}
                Lighting setup
              </label>
              <label>
                <input
                  type="checkbox"
                  name="cateringSupport"
                  checked={form.cateringSupport}
                  onChange={handleChange}
                />{" "}
                Catering support
              </label>
            </div>

            <div className="price-panel">
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
                  ? `Seats available for selected category (limit ${calculator.limit}).`
                  : `Selected seats exceed limit ${calculator.limit}.`}
              </p>
            </div>

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

        {/* Equipment Rental Section */}
        <article
          id="customer-equipment"
          className="customer-target-section"
          style={{ marginTop: "2rem" }}
        >
          {form.eventDate ? (
            <>
              <EquipmentBrowser
                eventDate={form.eventDate}
                onAddToCart={handleAddEquipmentToCart}
              />
              <EquipmentCart
                items={equipmentCart}
                onRemove={handleRemoveEquipment}
                onUpdateQuantity={handleUpdateEquipmentQuantity}
              />
            </>
          ) : (
            <div className="empty-state">
              <p>📅 Please select an event date first to browse available equipment.</p>
            </div>
          )}
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
            ? `${latestBooking.eventType.toUpperCase()} on ${latestBooking.eventDate} at ${latestBooking.venue}. Status: ${latestBooking.status}.`
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
