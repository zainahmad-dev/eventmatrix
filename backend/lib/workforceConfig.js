const WORKFORCE_CONFIG = {
  waiter: { limit: 8, salary: 20000, label: 'Waiter' },
  chef: { limit: 5, salary: 35000, label: 'Chef' },
  manager: { limit: 1, salary: 50000, label: 'Manager' },
  team_lead: { limit: 1, salary: 40000, label: 'Team Lead' },
};

const EVENT_DAYS_PER_MONTH = 30;

function getEventDayRate(role) {
  const config = WORKFORCE_CONFIG[role];
  if (!config) return 0;
  return Math.round(config.salary / EVENT_DAYS_PER_MONTH);
}

function calculateStaffCost(staffRequired = []) {
  return staffRequired.reduce((sum, entry) => {
    const count = Number(entry.count || 0);
    return sum + count * getEventDayRate(entry.role);
  }, 0);
}

module.exports = {
  WORKFORCE_CONFIG,
  EVENT_DAYS_PER_MONTH,
  getEventDayRate,
  calculateStaffCost,
};
