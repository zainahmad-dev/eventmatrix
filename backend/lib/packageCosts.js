const { calculateStaffCost } = require('./workforceConfig');

const MENU_FOOD_COST = {
  basic: 180,
  classic: 320,
  premium: 550,
};

const MENU_FOOD_PRICE = {
  basic: 250,
  classic: 500,
  premium: 900,
};

function calculateEquipmentCost(equipmentItems = []) {
  return equipmentItems.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.pricePerDay || 0);
    return sum + qty * rate;
  }, 0);
}

function calculatePackageCosts(pkg, seats = 0) {
  const equipmentCost = Number(pkg.equipmentCost || calculateEquipmentCost(pkg.equipmentItems));
  const foodCostPerSeat = Number(
    pkg.foodCostPerSeat || MENU_FOOD_COST[pkg.menuPlan] || MENU_FOOD_COST.classic,
  );
  const foodCost = foodCostPerSeat * Number(seats || pkg.maxSeats || 0);
  const staffCost = Number(pkg.staffCost || calculateStaffCost(pkg.staffRequired));
  const otherCosts = Number(pkg.otherCosts || 0);
  const totalInternalCost = equipmentCost + foodCost + staffCost + otherCosts;

  const basePrice = Number(pkg.basePrice || 0);
  const pricePerSeat = Number(pkg.pricePerSeat || MENU_FOOD_PRICE[pkg.menuPlan] || 500);
  const customerTotal = basePrice + pricePerSeat * Number(seats || 0);
  const profit = customerTotal - totalInternalCost;
  const profitMargin = customerTotal > 0 ? (profit / customerTotal) * 100 : 0;

  return {
    equipmentCost,
    foodCostPerSeat,
    foodCost,
    staffCost,
    otherCosts,
    totalInternalCost,
    basePrice,
    pricePerSeat,
    customerTotal,
    profit,
    profitMargin,
  };
}

function calculateCustomerTotal(pkg, seats) {
  const basePrice = Number(pkg.basePrice || 0);
  const pricePerSeat = Number(pkg.pricePerSeat || 0);
  return basePrice + pricePerSeat * Number(seats || 0);
}

module.exports = {
  MENU_FOOD_COST,
  MENU_FOOD_PRICE,
  calculateEquipmentCost,
  calculatePackageCosts,
  calculateCustomerTotal,
};
