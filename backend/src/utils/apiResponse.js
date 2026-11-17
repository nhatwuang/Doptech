exports.ok = (res, data = null, message = 'Thành công', status = 200, extra = {}) => res.status(status).json({ success: true, message, data, ...extra });
exports.fail = (res, message = 'Có lỗi xảy ra', status = 500, errors) => res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
