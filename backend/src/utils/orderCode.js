module.exports = function orderCode() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`;
  const tail = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${String(d.getMilliseconds()).padStart(3,'0')}`;
  return `DOP${date}${tail}`;
};
