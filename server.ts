import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './server/routes/auth.js';
import classesRoutes from './server/routes/classes.js';
import studentsRoutes from './server/routes/students.js';
import materialsRoutes from './server/routes/materials.js';
import assignmentsRoutes from './server/routes/assignments.js';
import submissionsRoutes from './server/routes/submissions.js';
import gamificationRoutes from './server/routes/gamification.js';
import statsRoutes from './server/routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/assignments', assignmentsRoutes);
  app.use('/api/submissions', submissionsRoutes);
  app.use('/api/gamification', gamificationRoutes);
  app.use('/api/stats', statsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev server in middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 CHILL VĂN - CÔ YẾN THANH backend is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
