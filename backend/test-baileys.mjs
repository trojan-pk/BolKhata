import { imageSync } from 'qr-image';
import fs from 'fs';
import path from 'path';
import * as baileysModule from 'baileys';
import pino from 'pino';

const baileys = baileysModule.default || baileysModule.makeWASocket;
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = baileysModule;

async function test() {
  const testDir = path.join(process.cwd(), 'wa', 'test-user');
  fs.mkdirSync(testDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(testDir);
  const { version } = await fetchLatestBaileysVersion();

  console.log('Baileys version:', version);
  const sock = baileys({
    version,
    logger: pino({ level: 'debug' }),
    browser: Browsers.windows('Chrome'),
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    console.log('connection.update keys:', Object.keys(update));
    if (update.qr) {
      console.log('QR received! Length:', update.qr.length);
      const img = imageSync(update.qr).toString('base64');
      console.log('Base64 image length:', img.length);
      fs.rmSync(testDir, { recursive: true, force: true });
      process.exit(0);
    }
    if (update.connection === 'close') {
      console.log('connection closed:', update.lastDisconnect);
    }
  });
}
test().catch(e => { console.error('Error:', e); process.exit(1); });
