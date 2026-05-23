export const formatNaira = (amount: number) => {
  return `₦${Math.abs(amount).toLocaleString()}`;
};
