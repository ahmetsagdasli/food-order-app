// backend/src/server.js
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ---- Basit ortam logu (gizli bilgi sızdırmadan) ----
console.log('Environment variables:', {
  PORT: String(PORT),
  MONGO_URI: MONGO_URI ? 'MongoDB URI is set' : 'MongoDB URI is MISSING',
});

// ---- MongoDB bağlan ----
async function connectMongo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      // modern mongoose sürümlerinde bu opsiyonlar genellikle gerekmez
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Mongo connection error:', err?.stack || err);
    process.exit(1);
  }
}

// ---- HTTP server ----
const server = http.createServer(app);

async function start() {
  await connectMongo();

  console.log('Starting HTTP server...');
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Listening event **parametre almaz**; err yoktur.
server.on('listening', () => {
  const addr = server.address();
  const bind =
    typeof addr === 'string' ? addr : `${addr?.address ?? '0.0.0.0'}:${addr?.port}`;
  console.log(`✅ Listening on ${bind}`);
});

// Sunucu hataları
server.on('error', (err) => {
  console.error('Server "error" event:', err?.stack || err);
  shutdown(1);
});

// ---- Global error handlers ----
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err?.stack || err);
  console.error('uncaughtException received. Closing...');
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason?.stack || reason);
  console.error('unhandledRejection received. Closing...');
  shutdown(1);
});

// ---- Graceful shutdown ----
let isShuttingDown = false;

function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // HTTP server'ı kapat
  server.close(async () => {
    console.log('HTTP server closed');

    // Mongo bağlantısını kapat
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('✅ Mongo disconnected');
      }
    } catch (e) {
      console.error('Error while disconnecting Mongo:', e?.stack || e);
    } finally {
      process.exit(code);
    }
  });

  // 5 sn sonra zorla çık
  setTimeout(() => {
    console.warn('Forcing process exit after timeout');
    process.exit(code);
  }, 5000).unref();
}

// SIGINT/SIGTERM için yakalama
process.on('SIGINT', () => {
  console.log('SIGINT received. Closing...');
  shutdown(0);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing...');
  shutdown(0);
});

// ---- Başlat ----
start();
