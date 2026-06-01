import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'node:http';
import morgan from 'morgan';
import contentRoutes from './routes/content.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1', contentRoutes);
app.use('/api', contentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.name === 'ZodError' ? 400 : 500;
  res.status(status).json({ error: error.message ?? 'Unexpected server error' });
});

createServer({ maxHeaderSize: 256 * 1024 }, app).listen(port, () => {
  console.log(`Portfolio CMS API listening on http://localhost:${port}`);
});
