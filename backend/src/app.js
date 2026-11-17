const express=require('express');
const cors=require('cors');
require('dotenv').config();
const {checkDatabase}=require('./config/database');
const {notFound,errorHandler}=require('./middleware/errorHandler');

const app=express();
app.disable('x-powered-by');
app.use(cors({origin:process.env.FRONTEND_URL||'http://localhost:5173',credentials:true}));
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true}));
app.use((req,_res,next)=>{if(process.env.NODE_ENV!=='test')console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);next()});

app.get('/api/health',async(_req,res)=>{const connected=await checkDatabase();res.json({success:true,message:'DopTech API is running',database:connected?'connected':'disconnected'})});
app.get('/',(_req,res)=>res.json({success:true,message:'DopTech Backend',health:'/api/health'}));

app.use('/api/auth',require('./routes/authRoutes'));
app.use('/api/products',require('./routes/productRoutes'));
app.use('/api',require('./routes/catalogRoutes'));
app.use('/api/cart',require('./routes/cartRoutes'));
app.use('/api/wishlist',require('./routes/wishlistRoutes'));
app.use('/api/orders',require('./routes/orderRoutes'));
app.use('/api/payments',require('./routes/paymentRoutes'));
app.use('/api/reviews',require('./routes/reviewRoutes'));
app.use('/api/coupons',require('./routes/couponRoutes'));
app.use('/api/ai',require('./routes/aiRoutes'));
app.use('/api/admin',require('./routes/adminRoutes'));
app.use('/api/dashboard',require('./routes/dashboardRoutes'));
app.use('/api/inventory',require('./routes/inventoryRoutes'));
app.use('/api/notifications',require('./routes/notificationRoutes'));
app.use('/api/profile',require('./routes/profileRoutes'));

app.use(notFound);
app.use(errorHandler);
module.exports=app;
