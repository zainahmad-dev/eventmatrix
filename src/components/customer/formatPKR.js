export const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
