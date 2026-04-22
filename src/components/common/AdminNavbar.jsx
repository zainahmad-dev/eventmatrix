export function AdminNavbar({ items }) {
  const handleNavigate = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="admin-section-navbar admin-animate-card" aria-label="Admin section navigation">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => handleNavigate(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
