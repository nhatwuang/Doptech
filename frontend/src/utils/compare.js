const key = "doptech_compare";
export const getCompare = () => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};
export const addCompare = (id) => {
  const a = getCompare();
  if (a.includes(id)) return a;
  if (a.length >= 3) throw new Error("Chỉ được so sánh tối đa 3 sản phẩm");
  const n = [...a, id];
  localStorage.setItem(key, JSON.stringify(n));
  return n;
};
export const removeCompare = (id) => {
  const n = getCompare().filter((x) => x !== id);
  localStorage.setItem(key, JSON.stringify(n));
  return n;
};
