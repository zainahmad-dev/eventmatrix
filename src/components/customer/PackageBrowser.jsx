import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Users, UtensilsCrossed } from 'lucide-react';
import { fetchPackages } from '../../api/packages';
import './PackageBrowser.css';

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const tierLabels = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Standard',
};

export function PackageBrowser({ eventType, seats, selectedPackageId, onSelectPackage }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadPackages = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPackages({
          eventType,
          seats: seats || undefined,
        });
        if (active) {
          setPackages(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (eventType) {
      loadPackages();
    } else {
      setPackages([]);
    }

    return () => {
      active = false;
    };
  }, [eventType, seats]);

  const visiblePackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (!seats) return true;
      return seats >= pkg.minSeats && seats <= pkg.maxSeats;
    });
  }, [packages, seats]);

  if (!eventType) {
    return (
      <div className="package-browser-empty">
        <p>Select an event type to view available packages curated by our team.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="package-browser-empty">Loading event packages...</div>;
  }

  if (error) {
    return <div className="package-browser-empty package-browser-error">{error}</div>;
  }

  if (!visiblePackages.length) {
    return (
      <div className="package-browser-empty">
        <p>No packages match your guest count for this event type. Try adjusting seats or contact admin.</p>
      </div>
    );
  }

  return (
    <section className="package-browser">
      <div className="package-browser-header">
        <Sparkles size={20} />
        <div>
          <h3>Choose Your Event Package</h3>
          <p>All equipment, food, and services are bundled by our event team — no item-by-item selection needed.</p>
        </div>
      </div>

      <div className="package-grid">
        {visiblePackages.map((pkg) => {
          const total = Number(pkg.basePrice || 0) + Number(pkg.pricePerSeat || 0) * Number(seats || pkg.minSeats);
          const isSelected = selectedPackageId === pkg.id;

          return (
            <article
              key={pkg.id}
              className={`package-card ${isSelected ? 'package-card--selected' : ''}`}
              onClick={() => onSelectPackage?.(pkg)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectPackage?.(pkg);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              <div className="package-card-top">
                <span className="package-icon">{pkg.icon || '🎉'}</span>
                <span className={`package-tier package-tier--${pkg.tier}`}>
                  {tierLabels[pkg.tier] || pkg.tier}
                </span>
              </div>

              <h4>{pkg.name}</h4>
              <p className="package-description">{pkg.description}</p>

              <ul className="package-highlights">
                {(pkg.highlights || []).slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="package-meta">
                <span><Users size={14} /> {pkg.minSeats}–{pkg.maxSeats} guests</span>
                <span><UtensilsCrossed size={14} /> {pkg.menuPlan} menu</span>
              </div>

              <div className="package-pricing">
                <p className="package-price">{formatPKR(total)}</p>
                <p className="package-price-note">
                  {seats
                    ? `for ${seats} guests`
                    : `${formatPKR(pkg.basePrice)} base + ${formatPKR(pkg.pricePerSeat)}/guest`}
                </p>
              </div>

              {isSelected ? <span className="package-selected-badge">Selected</span> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
