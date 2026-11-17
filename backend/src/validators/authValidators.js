const { body } = require('express-validator');
exports.registerRules = [
  body('fullName').trim().isLength({min:2,max:120}).withMessage('Họ tên không hợp lệ'),
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({min:6,max:72}).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('phone').optional({checkFalsy:true}).isLength({max:20})
];
exports.loginRules = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];
