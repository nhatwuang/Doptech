export const money = (v) =>
  Number(v || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
export const dateTime = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "");
