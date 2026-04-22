import { useMemo } from 'react';


export function EventCategoriesSection({ bookings }) {
  // Calculate event categories and their statistics
  const eventCategories = useMemo(() => {
    const categories = {
      wedding: { name: 'Wedding', icon: '💍', count: 0, color: '#ec4899' },
      corporate: { name: 'Corporate', icon: '🏢', count: 0, color: '#3b82f6' },
      birthday: { name: 'Birthday', icon: '🎂', count: 0, color: '#f59e0b' },
      private: { name: 'Private/Social', icon: '🎉', count: 0, color: '#22c55e' },
    };

    // Count each event type
    bookings.forEach((booking) => {
      const type = booking?.eventType?.toLowerCase() || 'private';
      if (categories[type]) {
        categories[type].count += 1;
      } else if (type.includes('corp')) {
        categories.corporate.count += 1;
      } else if (type.includes('birth')) {
        categories.birthday.count += 1;
      } else if (type.includes('wedding')) {
        categories.wedding.count += 1;
      } else {
        categories.private.count += 1;
      }
    });

    // Calculate percentages
    const total = bookings.length || 1;
    return Object.entries(categories).map(([key, cat]) => ({
      key,
      ...cat,
      percentage: Math.round((cat.count / total) * 100),
    }));
  }, [bookings]);

  return (
    <section className="event-categories-section admin-target-section" aria-label="Event categories breakdown">
      <div className="section-header">
        <h2>📊 Event Categories</h2>
        <p>Breakdown of all events by type</p>
      </div>

      <div className="categories-grid">
        {eventCategories.map((cat) => (
          <div key={cat.key} className="category-card">
            <div className="category-icon">{cat.icon}</div>
            <div className="category-info">
              <h3 className="category-name">{cat.name}</h3>
              <div className="category-stats">
                <span className="category-count">{cat.count} Events</span>
                <span className="category-percent">{cat.percentage}%</span>
              </div>
              <div className="category-bar">
                <div
                  className="category-bar-fill"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
