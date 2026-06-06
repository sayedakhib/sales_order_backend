import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors()); // let the React app (different port) call us
app.use(express.json({ limit: '2mb' })); // parse JSON bodies
app.use(morgan('dev')); // log requests

// simple "is it alive" endpoint
app.get('/api/health', (req, res) =>
  res.json({ success: true, status: 'ok', service: 'sales-order-api', time: new Date().toISOString() })
);

// the actual routes
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/meta', metaRoutes);

// these go last so they catch anything the routes above didn't handle
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
