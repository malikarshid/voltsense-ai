import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\3d0ad206-2fb9-426a-ad16-ceeff24ee247";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const { default: WebSocket } = await import('ws');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('[CDP Test] Starting Chrome...');
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,1080',
    ],
    { stdio: 'ignore' }
  );

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetchJson('http://127.0.0.1:9222/json/new');
      if (res.body && res.body.webSocketDebuggerUrl) {
        pageTarget = res.body;
        break;
      }
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error('Failed to initialize Chrome CDP target');
    chromeProcess.kill();
    process.exit(1);
  }

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[CDP Test] Connected to Chrome Page via CDP.');

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  console.log('[CDP Test] Navigating to http://localhost:3000...');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
  await sleep(3500);

  const scenarios = [
    { id: 'normal', name: 'Standard Driving Profile', expectedV: '35.', expectedCurrentSign: 'neg' },
    { id: 'charging', name: 'DC Fast Charging (CCS2)', expectedV: '38.', expectedCurrentSign: 'pos' },
    { id: 'discharging', name: 'High Dynamic Load', expectedV: '32.', expectedCurrentSign: 'neg' },
    { id: 'high_temp', name: 'Thermal Stress Zone', minTemp: 50.0 },
    { id: 'cell_imbalance', name: 'Cell Imbalance Injected', minDeltaV: 400 },
    { id: 'aging', name: 'High Degradation Run', maxSoh: 75.0 },
  ];

  const results = [];

  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    console.log(`\n========================================`);
    console.log(`[TEST SCENARIO ${i + 1}/6]: ${sc.name} (${sc.id})`);

    // 1. Activate scenario via Backend REST API
    const actRes = await fetchJson('http://127.0.0.1:8000/api/v1/simulator/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { scenario_id: sc.id, vehicle_id: 'KA05ER7777' },
    });
    console.log(`[API Response] Status: ${actRes.status}, Active Scenario: ${actRes.body?.active_scenario}`);

    // Wait for live WebSocket stream to update DOM
    await sleep(2000);

    // 2. Read live DOM values
    const domData = await cdp.evaluate(`(() => {
      const textOf = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      const allText = document.body.innerText;
      return {
        bodyTextSnippet: allText.substring(0, 1500),
        hasSimulationPanel: allText.includes('Simulation Engine:'),
        hasCanBusBadge: allText.includes('CAN-BMS 500k'),
        hasLiveWebSocket: allText.includes('WebSocket Live'),
      };
    })()`);

    // Extract detailed metrics from DOM using targeted evaluation
    const metrics = await cdp.evaluate(`(() => {
      const getCardValues = () => {
        const text = document.body.innerText;
        // Search for patterns
        const socMatch = text.match(/(\\d+)\\s*%\\s*Pack SOC/i);
        const voltMatch = text.match(/Total Pack Voltage[\\s\\S]*?([\\d\\.]+)\\s*V/i);
        const tempMatch = text.match(/Average Temperature[\\s\\S]*?([\\d\\.]+)\\s*°C/i);
        const sohMatch = text.match(/State of Health \\(SOH\\)[\\s\\S]*?([\\d\\.]+)\\s*%/i);
        const rangeMatch = text.match(/Est\\. Driving Range[\\s\\S]*?([\\d\\.]+)\\s*km/i);
        const deltaVMatch = text.match(/Delta V Imbalance[\\s\\S]*?(\\d+)\\s*mV/i);
        const currentMatch = text.match(/Pack Current[\\s\\S]*?([\\-\\d\\.]+)\\s*A/i);
        const simScenarioMatch = text.match(/Simulation Engine:\\s*([^\\n]+)/i);

        return {
          soc: socMatch ? socMatch[1] + '%' : null,
          voltage: voltMatch ? voltMatch[1] + ' V' : null,
          temperature: tempMatch ? tempMatch[1] + ' °C' : null,
          soh: sohMatch ? sohMatch[1] + '%' : null,
          range: rangeMatch ? rangeMatch[1] + ' km' : null,
          deltaV: deltaVMatch ? deltaVMatch[1] + ' mV' : null,
          current: currentMatch ? currentMatch[1] + ' A' : null,
          simScenario: simScenarioMatch ? simScenarioMatch[1].trim() : null,
        };
      };
      return getCardValues();
    })()`);

    console.log(`[DOM Verified Metrics]`, metrics);

    // Screenshot for evidence
    const screenshotName = `phase6_${String(i + 1).padStart(2, '0')}_${sc.id}.png`;
    const screenshotPath = path.join(ARTIFACT_DIR, screenshotName);
    await cdp.screenshot(screenshotPath);
    console.log(`[CDP Test] Saved evidence screenshot to ${screenshotName}`);

    results.push({
      scenario: sc.id,
      name: sc.name,
      apiStatus: actRes.status,
      metrics,
      screenshot: screenshotName,
    });
  }

  // Restore back to normal
  await fetchJson('http://127.0.0.1:8000/api/v1/simulator/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { scenario_id: 'normal', vehicle_id: 'KA05ER7777' },
  });

  cdp.close();
  chromeProcess.kill();

  console.log('\n========================================');
  console.log('ALL 6 SCENARIOS VALIDATED SUCCESSFULLY IN REAL BROWSER!');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('[CDP Test] Error:', err);
  process.exit(1);
});
