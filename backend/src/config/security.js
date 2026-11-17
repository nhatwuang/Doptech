exports.jwtSecret = () => {
  const key = process.env.JWT_SECRET;
  if (!key || key.length < 32 || /change_me|change_this|your_secret/i.test(key)) throw new Error('JWT_SECRET phải là khóa riêng ngẫu nhiên, ít nhất 32 ký tự.');
  return key;
};
