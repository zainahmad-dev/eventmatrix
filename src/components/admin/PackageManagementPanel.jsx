import { useEffect, useMemo, useState } from 'react';
import { Gift, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { fetchEquipment } from '../../api/equipment';
import {
  createPackage,
  deletePackage,
  fetchPackages,
  initializePackages,
  updatePackage,
} from '../../api/packages';
import './PackageManagementPanel.css';

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const STAFF_ROLES = [
  { role: 'waiter', label: 'Waiters', dailyRate: 667 },
  { role: 'chef', label: 'Chefs', dailyRate: 1167 },
  { role: 'manager', label: 'Managers', dailyRate: 1667 },
  { role: 'team_lead', label: 'Team Leads', dailyRate: 1333 },
];

const emptyForm = {
  name: '',
  description: '',
  icon: '🎉',
  eventTypes: ['wedding'],
  tier: 'premium',
  menuPlan: 'classic',
  services: { decoration: true, lighting: false, cateringSupport: true },
  equipmentItems: [],
  staffRequired: STAFF_ROLES.map(({ role }) => ({ role, count: 0 })),
  otherCosts: 0,
  basePrice: 0,
  pricePerSeat: 0,
  minSeats: 20,
  maxSeats: 100,
  highlightsText: '',
  isActive: true,
};

export function PackageManagementPanel() {
  const [packages, setPackages] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgData, equipData] = await Promise.all([
        fetchPackages({ adminView: true }),
        fetchEquipment({ adminView: true }),
      ]);
      setPackages(pkgData);
      setEquipment(equipData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const existing = await fetchPackages({ adminView: true });
        if (!existing.length) {
          try {
            await initializePackages();
          } catch {
            // Equipment inventory may not be seeded yet.
          }
        }
      } catch {
        // Ignore bootstrap errors; manual init remains available.
      } finally {
        await loadData();
      }
    };

    bootstrap();
  }, []);

  const handleInit = async () => {
    try {
      setMessage('');
      const result = await initializePackages();
      setMessage(result.message || 'Packages initialized.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const previewCosts = useMemo(() => {
    const equipmentCost = form.equipmentItems.reduce(
      (sum, item) => sum + Number(item.pricePerDay || 0) * Number(item.quantity || 0),
      0,
    );
    const foodCostPerSeat = form.menuPlan === 'premium' ? 550 : form.menuPlan === 'basic' ? 180 : 320;
    const foodCost = foodCostPerSeat * Number(form.maxSeats || 0);
    const staffCost = form.staffRequired.reduce((sum, entry) => {
      const roleConfig = STAFF_ROLES.find((r) => r.role === entry.role);
      return sum + Number(entry.count || 0) * (roleConfig?.dailyRate || 0);
    }, 0);
    const otherCosts = Number(form.otherCosts || 0);
    const totalInternalCost = equipmentCost + foodCost + staffCost + otherCosts;
    const customerTotal =
      Number(form.basePrice || 0) + Number(form.pricePerSeat || 0) * Number(form.maxSeats || 0);
    const profit = customerTotal - totalInternalCost;

    return {
      equipmentCost,
      foodCost,
      staffCost,
      otherCosts,
      totalInternalCost,
      customerTotal,
      profit,
      profitMargin: customerTotal > 0 ? (profit / customerTotal) * 100 : 0,
    };
  }, [form]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description,
      icon: pkg.icon || '🎉',
      eventTypes: pkg.eventTypes || ['wedding'],
      tier: pkg.tier,
      menuPlan: pkg.menuPlan,
      services: pkg.services || emptyForm.services,
      equipmentItems: (pkg.equipmentItems || []).map((item) => ({
        equipment: item.equipmentId,
        name: item.name,
        quantity: item.quantity,
        pricePerDay: item.pricePerDay,
      })),
      staffRequired: STAFF_ROLES.map(({ role }) => {
        const existing = (pkg.staffRequired || []).find((entry) => entry.role === role);
        return { role, count: existing?.count || 0 };
      }),
      otherCosts: pkg.otherCosts || 0,
      basePrice: pkg.basePrice,
      pricePerSeat: pkg.pricePerSeat,
      minSeats: pkg.minSeats,
      maxSeats: pkg.maxSeats,
      highlightsText: (pkg.highlights || []).join('\n'),
      isActive: pkg.isActive,
    });
    setShowForm(true);
  };

  const toggleEquipment = (item) => {
    const exists = form.equipmentItems.find((entry) => entry.equipment === item.id);
    if (exists) {
      setForm((current) => ({
        ...current,
        equipmentItems: current.equipmentItems.filter((entry) => entry.equipment !== item.id),
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      equipmentItems: [
        ...current.equipmentItems,
        {
          equipment: item.id,
          name: item.name,
          quantity: 1,
          pricePerDay: item.pricePerDay,
        },
      ],
    }));
  };

  const updateEquipmentQty = (equipmentId, quantity) => {
    setForm((current) => ({
      ...current,
      equipmentItems: current.equipmentItems.map((entry) =>
        entry.equipment === equipmentId ? { ...entry, quantity: Number(quantity) } : entry,
      ),
    }));
  };

  const updateStaffCount = (role, count) => {
    setForm((current) => ({
      ...current,
      staffRequired: current.staffRequired.map((entry) =>
        entry.role === role ? { ...entry, count: Number(count) } : entry,
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      name: form.name,
      description: form.description,
      icon: form.icon,
      eventTypes: form.eventTypes,
      tier: form.tier,
      menuPlan: form.menuPlan,
      services: form.services,
      equipmentItems: form.equipmentItems.map(({ equipment, quantity }) => ({
        equipment,
        quantity,
      })),
      staffRequired: form.staffRequired.filter((entry) => entry.count > 0),
      otherCosts: Number(form.otherCosts || 0),
      basePrice: Number(form.basePrice || 0),
      pricePerSeat: Number(form.pricePerSeat || 0),
      minSeats: Number(form.minSeats || 1),
      maxSeats: Number(form.maxSeats || 1),
      highlights: form.highlightsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await updatePackage(editingId, payload);
        setMessage('Package updated successfully.');
      } else {
        await createPackage(payload);
        setMessage('Package created successfully.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (packageId) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await deletePackage(packageId);
      setMessage('Package deleted.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="package-management-panel admin-target-section">
      <div className="section-header">
        <h2><Gift size={22} /> Event Packages</h2>
        <p>Bundle equipment, food, and staff into packages for customers. Profit and salary costs are calculated automatically.</p>
      </div>

      <div className="package-panel-actions">
        <button type="button" className="secondary-action" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
        <button type="button" className="secondary-action" onClick={handleInit}>
          Auto-create sample packages
        </button>
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={15} /> New Package
        </button>
      </div>

      {message ? <p className="availability-ok">{message}</p> : null}
      {error ? <p className="availability-bad">{error}</p> : null}

      {showForm ? (
        <form className="package-form dashboard-card dashboard-card--wide" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Package' : 'Create Package'}</h3>

          <div className="package-form-grid">
            <label>
              Package name
              <input className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Icon
              <input className="field-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </label>
            <label>
              Tier
              <select className="field-input" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                <option value="vip">VIP</option>
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
              </select>
            </label>
            <label>
              Menu plan
              <select className="field-input" value={form.menuPlan} onChange={(e) => setForm({ ...form, menuPlan: e.target.value })}>
                <option value="basic">Basic</option>
                <option value="classic">Classic</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <label>
              Min guests
              <input className="field-input" type="number" min="1" value={form.minSeats} onChange={(e) => setForm({ ...form, minSeats: e.target.value })} />
            </label>
            <label>
              Max guests
              <input className="field-input" type="number" min="1" value={form.maxSeats} onChange={(e) => setForm({ ...form, maxSeats: e.target.value })} />
            </label>
            <label>
              Base price (equipment & setup)
              <input className="field-input" type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </label>
            <label>
              Price per guest
              <input className="field-input" type="number" min="0" value={form.pricePerSeat} onChange={(e) => setForm({ ...form, pricePerSeat: e.target.value })} />
            </label>
            <label>
              Other costs
              <input className="field-input" type="number" min="0" value={form.otherCosts} onChange={(e) => setForm({ ...form, otherCosts: e.target.value })} />
            </label>
          </div>

          <label>
            Description
            <textarea className="field-input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <label>
            Highlights (one per line)
            <textarea className="field-input" rows="3" value={form.highlightsText} onChange={(e) => setForm({ ...form, highlightsText: e.target.value })} />
          </label>

          <fieldset className="package-event-types">
            <legend>Event types</legend>
            {['wedding', 'corporate', 'birthday', 'private'].map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={form.eventTypes.includes(type)}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      eventTypes: e.target.checked
                        ? [...current.eventTypes, type]
                        : current.eventTypes.filter((value) => value !== type),
                    }));
                  }}
                />
                {type}
              </label>
            ))}
          </fieldset>

          <fieldset className="package-services">
            <legend>Included services</legend>
            {[
              ['decoration', 'Decoration'],
              ['lighting', 'Lighting'],
              ['cateringSupport', 'Catering support'],
            ].map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={form.services[key]}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      services: { ...current.services, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>

          <div className="package-staff-grid">
            <h4>Staff allocation (event-day salary cost)</h4>
            {STAFF_ROLES.map(({ role, label, dailyRate }) => {
              const entry = form.staffRequired.find((item) => item.role === role);
              return (
                <label key={role}>
                  {label} ({formatPKR(dailyRate)}/day)
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    value={entry?.count || 0}
                    onChange={(e) => updateStaffCount(role, e.target.value)}
                  />
                </label>
              );
            })}
          </div>

          <div className="package-equipment-picker">
            <h4>Included equipment (admin inventory)</h4>
            <div className="package-equipment-list">
              {equipment.map((item) => {
                const selected = form.equipmentItems.find((entry) => entry.equipment === item.id);
                return (
                  <div key={item.id} className={`package-equipment-item ${selected ? 'is-selected' : ''}`}>
                    <label>
                      <input type="checkbox" checked={Boolean(selected)} onChange={() => toggleEquipment(item)} />
                      {item.name} ({formatPKR(item.pricePerDay)}/day)
                    </label>
                    {selected ? (
                      <input
                        className="field-input qty-input"
                        type="number"
                        min="1"
                        value={selected.quantity}
                        onChange={(e) => updateEquipmentQty(item.id, e.target.value)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="package-cost-preview">
            <h4>Cost & profit preview (at max guests)</h4>
            <div className="cost-preview-grid">
              <span>Equipment: {formatPKR(previewCosts.equipmentCost)}</span>
              <span>Food: {formatPKR(previewCosts.foodCost)}</span>
              <span>Staff salary: {formatPKR(previewCosts.staffCost)}</span>
              <span>Other: {formatPKR(previewCosts.otherCosts)}</span>
              <span>Total cost: {formatPKR(previewCosts.totalInternalCost)}</span>
              <span>Customer price: {formatPKR(previewCosts.customerTotal)}</span>
              <strong>Profit: {formatPKR(previewCosts.profit)} ({previewCosts.profitMargin.toFixed(1)}%)</strong>
            </div>
          </div>

          <div className="package-form-actions">
            <button type="button" className="secondary-action" onClick={resetForm}>Cancel</button>
            <button type="submit" className="primary-action">{editingId ? 'Save Package' : 'Create Package'}</button>
          </div>
        </form>
      ) : null}

      <div className="package-admin-grid">
        {packages.map((pkg) => (
          <article key={pkg.id} className="package-admin-card dashboard-card">
            <div className="package-admin-card-header">
              <span>{pkg.icon}</span>
              <div>
                <h4>{pkg.name}</h4>
                <p>{pkg.eventTypes.join(', ')} · {pkg.minSeats}–{pkg.maxSeats} guests</p>
              </div>
            </div>
            <p>{pkg.description}</p>
            <div className="package-admin-stats">
              <span>Price: {formatPKR(pkg.basePrice)} + {formatPKR(pkg.pricePerSeat)}/guest</span>
              <span>Cost: {formatPKR(pkg.totalInternalCost)}</span>
              <span>Staff: {formatPKR(pkg.staffCost)}</span>
              <strong>Profit @ max: {formatPKR(pkg.costPreview?.profit || 0)}</strong>
            </div>
            <div className="package-admin-actions">
              <button type="button" className="secondary-action" onClick={() => handleEdit(pkg)}>Edit</button>
              <button type="button" className="secondary-action" onClick={() => handleDelete(pkg.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
