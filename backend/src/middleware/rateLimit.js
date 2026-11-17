// In-process limit for this single-server academic deployment.
module.exports = (limit, windowMs) => {
  const entries = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of entries) if (v.until <= now) entries.delete(k);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    const now = Date.now(),
      key = req.user?.userID ? `user:${req.user.userID}` : req.ip;
    let e = entries.get(key);
    if (!e || e.until <= now) {
      if (entries.size >= 10000) {
        res.status(429).json({
          success: false,
          message: 'Hệ thống đang bận. Vui lòng thử lại.'
        });
        return;
      }
      e = {
        until: now + windowMs,
        count: 0
      };
      entries.set(key, e);
    }
    if (++e.count > limit) {
      res.set('Retry-After', String(Math.ceil((e.until - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'
      });
    }
    next();
  };
};
