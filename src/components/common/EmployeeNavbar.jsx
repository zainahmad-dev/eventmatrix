export function EmployeeNavbar({ items }) {
  const handleNavigate = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="employee-section-navbar" aria-label="Employee section navigation">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => handleNavigate(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
