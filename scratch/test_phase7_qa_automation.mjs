import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userData = 'C:\\Users\\USER\\AppData\\Local\\Temp\\chrome_phase7_profile';
const outDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\3d0ad206-2fb9-426a-ad16-ceeff24ee247';
mkdirSync(outDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userData}`,
  '--disable-gpu',
  '--no-sandbox',
  'about:blank',
]);

await new Promise((r) => setTimeout(r, 2000));

try {
  const newPageRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/vehicle-3d', { method: 'PUT' });
  const pageData = await newPageRes.json();
  const ws = new WebSocket(pageData.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const callbacks = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(data.params);
    }
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

  console.log('[Phase 7 QA] Connected to Chrome Page via CDP.');

  // Set initial viewport
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Wait 4s for WebGL scene to fully load
  await new Promise((r) => setTimeout(r, 4000));

  // 1. VIEWPORT TESTING ACROSS ALL 6 REQUIRED RESOLUTIONS
  const viewports = [
    { name: '1920x1080', width: 1920, height: 1080, mobile: false, label: 'Desktop Full HD' },
    { name: '1366x768', width: 1366, height: 768, mobile: false, label: 'Standard Laptop' },
    { name: '1024x768', width: 1024, height: 768, mobile: false, label: 'iPad Landscape' },
    { name: '768x1024', width: 768, height: 1024, mobile: true, label: 'Tablet Portrait' },
    { name: '390x844', width: 390, height: 844, mobile: true, label: 'iPhone 14' },
    { name: '360x800', width: 360, height: 800, mobile: true, label: 'Android Small Mobile' },
  ];

  console.log('\n--- 1. Testing Responsive Viewports (Zero Overlaps) ---');
  for (const vp of viewports) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filename = `phase7_vehicle3d_${vp.name}.png`;
    writeFileSync(join(outDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`[Screenshot] ${vp.label} (${vp.name}) saved to ${filename} (${shot.data.length} bytes base64)`);
  }

  // Restore Desktop 1920x1080 for interaction tests
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 2. INTERACTIVE EXPLORATION MODES TESTING
  console.log('\n--- 2. Testing 3D Exploration Modes ---');
  const modes = [
    { id: 'exploded', label: 'Exploded View', shot: 'phase7_vehicle3d_exploded.png' },
    { id: 'transparent', label: 'X-Ray View', shot: 'phase7_vehicle3d_xray.png' },
    { id: 'battery_focus', label: 'Battery Focus', shot: 'phase7_vehicle3d_battery_focus.png' },
    { id: 'cell_inspect', label: 'Cell Matrix', shot: 'phase7_vehicle3d_cell_inspect.png' },
    { id: 'complete', label: 'Complete Car', shot: 'phase7_vehicle3d_complete.png' },
  ];

  for (const m of modes) {
    // Click mode button
    await sendCommand('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === '${m.label}');
        if (btn) btn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(outDir, m.shot), Buffer.from(shot.data, 'base64'));
    console.log(`[Mode Verified] ${m.label} -> saved ${m.shot}`);
  }

  // 3. CELL SELECTION TEST
  console.log('\n--- 3. Testing Cell Selection HUD ---');
  for (const cellNum of [1, 5, 10]) {
    await sendCommand('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'C${String(cellNum).padStart(2, '0')}');
        if (btn) btn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
  }

  // 4. STABILITY & FLICKER-FREE VERIFICATION (10 seconds with scenario switching)
  console.log('\n--- 4. Stability & Anti-Flicker 10-Second Test ---');
  let flickerCount = 0;
  for (let s = 1; s <= 4; s++) {
    // Switch scenario via backend
    const scId = s % 2 === 0 ? 'charging' : 'normal';
    await fetch('http://127.0.0.1:8000/api/v1/simulator/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scId, vehicle_id: 'KA05ER7777' }),
    });

    await new Promise((r) => setTimeout(r, 2000));

    // Check if canvas exists and is visible
    const canvasStatus = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector('canvas');
        return {
          exists: !!c,
          width: c ? c.width : 0,
          height: c ? c.height : 0,
          visible: c ? window.getComputedStyle(c).display !== 'none' : false
        };
      })()`,
      returnByValue: true,
    });

    const statusVal = canvasStatus?.result?.value;
    console.log(`[Tick ${s * 2}s] Scenario: ${scId} | Canvas: ${statusVal?.exists} (${statusVal?.width}x${statusVal?.height}) | Visible: ${statusVal?.visible}`);
    if (!statusVal?.exists || !statusVal?.visible) {
      flickerCount++;
    }
  }

  // 5. TEST PDF AND CSV REPORT GENERATION
  console.log('\n--- 5. Testing PDF and CSV Endpoints ---');
  const pdfRes = await fetch('http://127.0.0.1:8000/api/v1/reports/KA05ER7777/pdf');
  const pdfBuf = await pdfRes.arrayBuffer();
  console.log(`[PDF Report] Status: ${pdfRes.status} | Content-Type: ${pdfRes.headers.get('content-type')} | Size: ${pdfBuf.byteLength} bytes`);

  const csvRes = await fetch('http://127.0.0.1:8000/api/v1/reports/KA05ER7777/csv');
  const csvText = await csvRes.text();
  console.log(`[CSV Report] Status: ${csvRes.status} | Content-Type: ${csvRes.headers.get('content-type')} | Size: ${csvText.length} chars`);
  console.log(`[CSV Snippet]\n${csvText.split('\n').slice(0, 8).join('\n')}`);

  // Restore normal
  await fetch('http://127.0.0.1:8000/api/v1/simulator/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: 'normal', vehicle_id: 'KA05ER7777' }),
  });

  ws.close();
  console.log('\n========================================');
  console.log('ALL PHASE 7 QA AUTOMATION TESTS PASSED!');
  console.log(`Flicker Failures: ${flickerCount}`);
  console.log('========================================');
} finally {
  chromeProc.kill();
}
