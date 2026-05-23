import { useEffect, useState } from "react";
import { fetchEquipment } from "../../api/equipment";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function EquipmentBrowser({ eventDate, onAddToCart }) {
  const [equipment, setEquipment] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadEquipment = async () => {
      if (!eventDate) {
        setEquipment([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchEquipment({
          startDate: eventDate,
          endDate: eventDate,
          condition: "good",
        });

        if (active) {
          setEquipment(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load equipment.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadEquipment();

    return () => {
      active = false;
    };
  }, [eventDate]);

  const handleQuantityChange = (itemId, value) => {
    const nextValue = Math.max(1, Number(value) || 1);
    setQuantities((current) => ({
      ...current,
      [itemId]: nextValue,
    }));
  };

  const handleAdd = (item) => {
    const quantity = Math.max(1, Number(quantities[item.id]) || 1);

    onAddToCart({
      id: item.id,
      name: item.name,
      pricePerDay: Number(item.pricePerDay) || 0,
      quantity,
      totalPrice: (Number(item.pricePerDay) || 0) * quantity,
    });
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h3>Equipment Browser</h3>
      </div>

      {loading ? <p>Loading equipment...</p> : null}
      {error ? <p className="availability-bad">{error}</p> : null}

      {!loading && !error && equipment.length === 0 ? (
        <p>No equipment available for this date.</p>
      ) : null}

      {!loading && !error && equipment.length > 0 ? (
        <ul className="dashboard-list">
          {equipment.map((item) => {
            const available = Number(item.availableQuantity) || 0;
            const quantity = Math.max(1, Number(quantities[item.id]) || 1);

            return (
              <li key={item.id}>
                <strong>{item.name}</strong> — {formatPKR(item.pricePerDay)} / day
                <br />
                <small>Available: {available}</small>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <input
                    type="number"
                    min="1"
                    max={available}
                    value={quantity}
                    onChange={(event) =>
                      handleQuantityChange(item.id, event.target.value)
                    }
                    className="field-input"
                    disabled={!available}
                  />
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => handleAdd(item)}
                    disabled={!available}
                  >
                    Add
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
