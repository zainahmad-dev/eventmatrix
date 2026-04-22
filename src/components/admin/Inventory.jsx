import { Package } from 'lucide-react';

const categoryCapacity = {
  vip: 50,
  premium: 120,
  standard: 250,
};

export function InventoryPanel({ bookings }) {
  const usage = bookings.reduce(
    (acc, booking) => {
      const category = booking.seatCategory;
      if (acc[category] !== undefined) {
        acc[category] += Number(booking.seats || 0);
      }
      return acc;
    },
    { vip: 0, premium: 0, standard: 0 },
  );

  return (
    <article className="dashboard-card admin-animate-card">
      <div className="dashboard-card-header">
        <Package size={18} />
        <h3>Inventory Management</h3>
      </div>
      <ul className="dashboard-list">
        <li>VIP seats used: {usage.vip} / {categoryCapacity.vip}</li>
        <li>Premium seats used: {usage.premium} / {categoryCapacity.premium}</li>
        <li>Standard seats used: {usage.standard} / {categoryCapacity.standard}</li>
        <li>Lighting, decoration, and catering inventory module.</li>
      </ul>
    </article>
  );
}
