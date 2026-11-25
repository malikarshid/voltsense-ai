import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userData = 'C:\\Users\\USER\\AppData\\Local\\Temp\\chrome_scenario_profile';
const outDir = 'C:\\Projects\\voltsense-ai\\frontend\\public\\screenshots';

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userData}`,
  '--disable-gpu',
  '--no-sandbox',
  'about:blank'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const newPageRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
  const pageData = await newPageRes.json();
  const ws = new WebSocket(pageData.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      cb(data.result);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('DOM.enable');

  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 2500));

  // Select CyberSUV by triggering click on vehicle selector dropdown
  await sendCommand('Runtime.evaluate', {
    expression: `
      const vehicleBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Model GT') || b.innerText.includes('KA05ER7777')));
      if (vehicleBtn) vehicleBtn.click();
    `
  });

  await new Promise(r => setTimeout(r, 800));

  await sendCommand('Runtime.evaluate', {
    expression: `
      const cyberItem = Array.from(document.querySelectorAll('button, div, span')).find(el => el.innerText && el.innerText.includes('CyberSUV'));
      if (cyberItem) cyberItem.click();
    `
  });

  await new Promise(r => setTimeout(r, 2500));

  // Query CyberSUV live telemetry
  const cyberTel = await (await fetch('http://127.0.0.1:8000/api/v1/monitoring/HWGHLDZ20842872FS/latest')).json();
  console.log('CyberSUV 400V Live Telemetry:');
  console.log(`  Pack Voltage: ${cyberTel.pack_voltage} V (Architecture: 400V HV)`);
  console.log(`  Pack Current: ${cyberTel.pack_current} A`);
  console.log(`  SOC: ${cyberTel.soc} % | SOH: ${cyberTel.soh} %`);
  console.log(`  Range: ${cyberTel.range_km} km`);

  // Screenshot CyberSUV
  const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(outDir, 'cybersuv_400v.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot: cybersuv_400v.png');

  ws.close();
} finally {
  chromeProc.kill();
}
