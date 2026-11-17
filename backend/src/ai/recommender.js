const normalize = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
function analyze(message, previous = {}) {
  const t = normalize(message),
    fresh = /\b(laptop|may tinh|dien thoai|iphone|tablet|ipad|ssd|ram|tai nghe|chuot|ban phim|man hinh|cpu|gpu)\b/.test(t);
  let category = null;
  for (const [pattern, slug] of [[/laptop|may tinh xach tay|may tinh(?! bang)/, 'laptop'], [/dien thoai|iphone/, 'dien-thoai'], [/tablet|ipad|may tinh bang/, 'tablet'], [/\bssd\b/, 'ssd'], [/\bram\b/, 'ram'], [/card man hinh|\bgpu\b/, 'gpu'], [/man hinh/, 'man-hinh'], [/ban phim/, 'ban-phim'], [/tai nghe/, 'tai-nghe'], [/chuot/, 'chuot'], [/\bcpu\b/, 'cpu']]) if (pattern.test(t)) {
    category = slug;
    break;
  }
  if (['ram', 'ssd'].includes(category) && ['laptop', 'pc-gaming'].includes(previous.category) && !/(mua|thanh|doi sang)\s+(ram|ssd)/.test(t)) category = previous.category;
  const changed = category && previous.category && category !== previous.category;
  const base = changed ? {} : previous;
  const b = t.match(/(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)(?=\s|$|[,.?!])/);
  const dong = t.match(/(\d[\d.,]*)\s*(?:dong|vnd|đ)\b/);
  const budget = b ? Math.round(Number(b[1].replace(',', '.')) * 1e6) : dong ? Number(dong[1].replace(/[.,]/g, '')) : base.budget || null;
  const ram = t.match(/ram\s*(\d+)\s*(?:gb)?/),
    ssd = t.match(/ssd\s*(\d+(?:[.,]\d+)?)\s*(tb|gb)/);
  const weight = t.match(/(?:duoi|toi da)\s*(\d+(?:[.,]\d+)?)\s*kg/),
    battery = t.match(/(?:pin\s*(?:tu|tren|toi thieu)?\s*)(\d+)\s*mah/);
  const keywords = ['android studio', 'java', 'lap trinh', 'hoc it', 'gaming', 'choi game', 'do hoa', 'camera', 'pin', 'nhe'].filter(k => t.includes(k));
  return {
    category: category || base.category || null,
    budget,
    ramGB: ram ? Number(ram[1]) : base.ramGB || null,
    ssdGB: ssd ? Number(ssd[1].replace(',', '.')) * (ssd[2] === 'tb' ? 1024 : 1) : base.ssdGB || null,
    maxWeight: weight ? Number(weight[1].replace(',', '.')) : base.maxWeight || null,
    minBattery: battery ? Number(battery[1]) : base.minBattery || null,
    keywords: [...new Set([...(base.keywords || []), ...keywords])].slice(-12),
    preferLight: /nhe hon|nhe/.test(t) || !!base.preferLight,
    fresh
  };
}
function specsOf(product) {
  const specs = typeof product.Specifications === 'string' ? JSON.parse(product.Specifications || '[]') : product.specifications || [];
  const result = {};
  for (const s of specs) {
    const name = normalize(s.SpecName || s.name),
      v = normalize(s.SpecValue || s.value),
      n = v.match(/\d+(?:[.,]\d+)?/);
    if (!n) continue;
    let amount = Number(n[0].replace(',', '.'));
    if (/ram/.test(name)) result.ramGB = amount;
    if (/ssd|o cung|storage/.test(name) && (/ssd/.test(v) || /ssd/.test(name))) result.ssdGB = amount * (/tb/.test(v) ? 1024 : 1);
    if (/trong luong|weight/.test(name)) result.weight = amount * (/\bkg\b/.test(v) ? 1 : /\bg\b/.test(v) ? 0.001 : 1);
    if (/pin|battery/.test(name) && /mah/.test(v)) result.battery = amount;
  }
  return result;
}
function rank(products, intent) {
  return products.map(p => ({
    ...p,
    normalized: specsOf(p)
  })).filter(p => {
    const s = p.normalized;
    return (!intent.category || p.CategorySlug === intent.category) && (!intent.budget || Number(p.EffectivePrice) <= intent.budget) && (!intent.ramGB || s.ramGB >= intent.ramGB) && (!intent.ssdGB || s.ssdGB >= intent.ssdGB) && (!intent.maxWeight || s.weight <= intent.maxWeight) && (!intent.minBattery || s.battery >= intent.minBattery);
  }).map(p => {
    const text = normalize([p.ProductName, p.Description, p.ShortDescription, p.Specifications].join(' '));
    const matched = intent.keywords.filter(k => text.includes(k));
    return {
      ...p,
      matched,
      score: matched.length * 10 + Number(p.AverageRating || 0),
      reasons: [intent.budget ? 'Trong ngân sách' : null, intent.ramGB ? `RAM ${p.normalized.ramGB} GB` : null, intent.ssdGB ? `SSD ${p.normalized.ssdGB} GB` : null, p.normalized.weight ? `${p.normalized.weight} kg` : null, ...matched.map(k => `Mô tả có từ khóa: ${k}`)].filter(Boolean)
    };
  }).sort((a, b) => intent.preferLight ? (a.normalized.weight ?? Infinity) - (b.normalized.weight ?? Infinity) || b.score - a.score : b.score - a.score || Number(a.EffectivePrice) - Number(b.EffectivePrice)).slice(0, 5);
}
function fallbackAnswer(intent, products) {
  if (!products.length) return 'Chưa có sản phẩm khớp các điều kiện bắt buộc hoặc dữ liệu thông số chưa đủ. Bạn muốn đổi ngân sách hay tiêu chí nào?';
  const unmet = intent.keywords.filter(k => !products.some(p => p.matched?.includes(k)));
  return products.slice(0, 3).map((p, i) => `${i + 1}. ${p.ProductName} — ${Number(p.EffectivePrice).toLocaleString('vi-VN')}đ\n${p.reasons?.join('; ') || 'Còn hàng; xếp theo đánh giá và giá.'}`).join('\n\n') + (unmet.length ? `\nChưa xác minh từ dữ liệu: ${unmet.join(', ')}. Cần xem cấu hình chi tiết trước khi quyết định.` : '') + '\nGiá và tồn kho được kiểm tra lại khi đặt hàng.';
}
module.exports = {
  analyze,
  rank,
  specsOf,
  fallbackAnswer,
  normalize
};

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const categoryRules = [
//   ["laptop", "laptop"],
//   ["máy tính xách tay", "laptop"],
//   ["điện thoại", "dien-thoai"],
//   ["iphone", "dien-thoai"],
//   ["tablet", "tablet"],
//   ["ipad", "tablet"],
//   ["pc", "pc-gaming"],
//   ["cpu", "cpu"],
//   ["gpu", "gpu"],
//   ["card màn hình", "gpu"],
//   ["ram", "ram"],
//   ["ssd", "ssd"],
//   ["mainboard", "mainboard"],
//   ["màn hình", "man-hinh"],
//   ["bàn phím", "ban-phim"],
//   ["chuột", "chuot"],
//   ["tai nghe", "tai-nghe"],
//   ["webcam", "webcam"],
//   ["loa", "loa"],
//   ["sạc", "sac"],
//   ["cáp", "cap"],
// ];
// function parseBudget(text) {
//   const t = text.toLowerCase().replace(/,/g, ".");
//   let m = t.match(
//     /(?:dưới|tầm|khoảng|budget|giá)?\s*(\d+(?:\.\d+)?)\s*(triệu|tr|m)/i,
//   );
//   if (m) return Math.round(Number(m[1]) * 1000000);
//   m = t.match(/(\d[\d.]*)\s*(?:đ|vnd|dong|đồng)/i);
//   if (m) return Number(m[1].replace(/\./g, ""));
//   return null;
// }
// function analyze(text) {
//   const t = text.toLowerCase();
//   const category = categoryRules.find(([k]) => t.includes(k))?.[1] || null;
//   const budget = parseBudget(text);
//   const keywords = [];
//   for (const k of [
//     "android studio",
//     "java",
//     "lập trình",
//     "học it",
//     "gaming",
//     "chơi game",
//     "đồ họa",
//     "camera",
//     "pin",
//     "nhẹ",
//     "1tb",
//     "16gb",
//     "32gb",
//   ])
//     if (t.includes(k)) keywords.push(k);
//   return { category, budget, keywords };
// }
// function fallbackAnswer(intent, products) {
//   if (!products.length)
//     return "Mình chưa tìm thấy sản phẩm DopTech phù hợp với tiêu chí này. Bạn có thể tăng ngân sách hoặc thử mô tả nhu cầu rộng hơn.";
//   const names = products
//     .slice(0, 3)
//     .map(
//       (p, i) =>
//         `${i + 1}. ${p.ProductName} (${Number(p.EffectivePrice || p.DiscountPrice || p.Price).toLocaleString("vi-VN")}đ)`,
//     )
//     .join("\n");
//   const why = intent.keywords.length
//     ? ` theo nhu cầu ${intent.keywords.join(", ")}`
//     : "";
//   return `DopTech AI đã lọc từ dữ liệu sản phẩm thật${why}. Gợi ý nổi bật:\n${names}\nBạn có thể mở chi tiết để so sánh thông số và tồn kho.`;
// }
// module.exports = { analyze, fallbackAnswer };
// 
// ===== HET MA CU =====
