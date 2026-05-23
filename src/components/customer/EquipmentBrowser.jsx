import { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchEquipment } from "../../api/equipment";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const clampQuantity = (value, maxAvailable) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, Math.max(1, Number(maxAvailable) || 1));
};

export function EquipmentBrowser({ eventDate, onAddToCart }) {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const data = await fetchCategories();

        if (!cancelled) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!eventDate) {
      setEquipment([]);
      setError("");
      return undefined;
    }

    let cancelled = false;

    const loadEquipment = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchEquipment({
          startDate: eventDate,
          endDate: eventDate,
          ...(selectedCategory !== "all" ? { category: selectedCategory } : {}),
        });

        if (!cancelled) {
          setEquipment(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setEquipment([]);
          setError(loadError.message || "Unable to load equipment.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEquipment();

    return () => {
      cancelled = true;
    };
  }, [eventDate, selectedCategory]);

  const availableEquipment = useMemo(
    () =>
      equipment.filter(
        (item) =>
          Number(item.availableQuantity) > 0 &&
          item.condition !== "damaged" &&
          item.condition !== "under-maintenance",
      ),
    [equipment],
  );

  const handleQuantityChange = (itemId, value, maxAvailable) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: clampQuantity(value, maxAvailable),
    }));
  };

  const handleAddToCart = (item) => {
    const quantity = clampQuantity(
      quantities[item.id] ?? 1,
      item.availableQuantity,
    );

    onAddToCart({
      id: item.id,
      name: item.name,
      categoryName: item.category?.name || "Equipment",
      quantity,
      pricePerDay: Number(item.pricePerDay || 0),
      totalPrice: Number(item.pricePerDay || 0) * quantity,
    });

    setQuantities((current) => ({
      ...current,
      [item.id]: 1,
    }));
  };

  return (
    <article className="dashboard-card dashboard-card--wide">
      <div className="dashboard-card-header">
        <h3>Equipment Browser</h3>
      </div>

      <p className="dashboard-copy">
        Browse available rental items for {eventDate}.
      </p>

      {categories.length ? (
        <label className="booking-field">
          Category
          <select
            className="field-input"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? <p className="availability-bad">{error}</p> : null}

      {loading ? (
        <p>Loading equipment...</p>
      ) : availableEquipment.length ? (
        <div className="dashboard-list">
          {availableEquipment.map((item) => {
            const quantity = quantities[item.id] ?? 1;

            return (
              <div key={item.id}>
                <p>
                  <strong>{item.name}</strong>
                </p>
                <p>
                  {item.category?.name || "Equipment"} · Available:{" "}
                  {item.availableQuantity} · {formatPKR(item.pricePerDay)} / day
                </p>
                {item.description ? <p>{item.description}</p> : null}
                <label>
                  Quantity
                  <input
                    className="field-input"
                    aria-label={`Quantity for ${item.name}`}
                    type="number"
                    min="1"
                    max={Math.max(1, Number(item.availableQuantity) || 1)}
                    value={quantity}
                    onChange={(event) =>
                      handleQuantityChange(
                        item.id,
                        event.target.value,
                        item.availableQuantity,
                      )
                    }
                  />
                </label>
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => handleAddToCart(item)}
                >
                  Add to cart
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>📭 No rental equipment is available for the selected date.</p>
        </div>
      )}
    </article>
  );
}
