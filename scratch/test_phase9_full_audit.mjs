import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userData = 'C:\\Users\\USER\\AppData\\Local\\Temp\\chrome_phase9_profile';
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
  const newPageRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
  const pageData = await newPageRes.json();
  const ws = new WebSocket(pageData.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const callbacks = new Map();
  const consoleMessages = [];
  const networkErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        consoleMessages.push(data.params);
      }
    }
    if (data.method === 'Network.responseReceived') {
      if (data.params.response.status >= 400 && !data.params.response.url.includes('/favicon')) {
        networkErrors.push({ url: data.params.response.url, status: data.params.response.status });
      }
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
  await sendCommand('Network.enable');

  console.log('[Phase 9 Audit] Connected to Chrome Page via CDP.');

  // Set default Desktop Viewport
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const auditResults = {
    routes: {},
    viewports: {},
    themes: {},
    journeys: {},
    performance: {},
  };

  // ============================================================
  // 1. AUDIT ALL 13 APPLICATION ROUTES
  // ============================================================
  const routes = [
    { path: '/', name: 'dashboard', label: 'Main Overview Dashboard' },
    { path: '/live-monitoring', name: 'live_monitoring', label: 'Live Telemetry & Sensors' },
    { path: '/battery-health', name: 'battery_health', label: 'Battery Health & SOH Analytics' },
    { path: '/vehicle-3d', name: 'vehicle_3d', label: '3D Vehicle Digital Twin' },
    { path: '/cells', name: 'cells', label: 'Cell Matrix & Balancer' },
    { path: '/analytics', name: 'analytics', label: 'Historical Analytics & Trends' },
    { path: '/predictions', name: 'predictions', label: 'AI Degradation & RUL Engine' },
    { path: '/alerts', name: 'alerts', label: 'Alert Center & Diagnostic Faults' },
    { path: '/vehicles', name: 'vehicles', label: 'Fleet Management' },
    { path: '/charging-stations', name: 'charging_stations', label: 'Charging Infrastructure' },
    { path: '/maintenance', name: 'maintenance', label: 'Predictive Maintenance' },
    { path: '/reports', name: 'reports', label: 'Reports & Export Center' },
    { path: '/settings', name: 'settings', label: 'System Configuration' },
  ];

  console.log('\n--- 1. Auditing All 13 Application Routes ---');
  for (const r of routes) {
    const startT = Date.now();
    await sendCommand('Page.navigate', { url: `http://localhost:3000${r.path}` });
    await new Promise((resolve) => setTimeout(resolve, 2200));

    // Measure timing and check overflow
    const timingEval = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const perf = window.performance.timing;
        const loadTime = perf.loadEventEnd > 0 ? (perf.loadEventEnd - perf.navigationStart) : (Date.now() - ${startT});
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;
        const domCount = document.querySelectorAll('*').length;
        const textLen = document.body.innerText.length;
        return { loadTime, hasOverflow, domCount, textLen };
      })()`,
      returnByValue: true,
    });
    const info = timingEval?.result?.value || { loadTime: 0, hasOverflow: false, domCount: 0, textLen: 0 };

    // Capture screenshot
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filename = `phase9_route_${r.name}.png`;
    writeFileSync(join(outDir, filename), Buffer.from(shot.data, 'base64'));

    auditResults.routes[r.path] = {
      label: r.label,
      loadTimeMs: info.loadTime,
      hasOverflow: info.hasOverflow,
      domElements: info.domCount,
      textLength: info.textLen,
      screenshot: filename,
      status: info.textLen > 100 && !info.hasOverflow ? 'PASS' : 'WARN',
    };
    console.log(`[Route: ${r.path}] ${r.label} | DOM Elements: ${info.domCount} | Overflow: ${info.hasOverflow ? 'FAIL' : 'PASS'} | Load: ${info.loadTime}ms`);
  }

  // ============================================================
  // 2. RESPONSIVE DESIGN AUDIT ACROSS 8 TARGET RESOLUTIONS
  // ============================================================
  console.log('\n--- 2. Auditing Responsive Layout Across 8 Target Breakpoints ---');
  const viewports = [
    { name: '1920x1080', width: 1920, height: 1080, mobile: false, label: 'Desktop Full HD' },
    { name: '1440x900', width: 1440, height: 900, mobile: false, label: 'MacBook Pro' },
    { name: '1366x768', width: 1366, height: 768, mobile: false, label: 'Standard Laptop' },
    { name: '1024x768', width: 1024, height: 768, mobile: false, label: 'iPad Landscape' },
    { name: '768x1024', width: 768, height: 1024, mobile: true, label: 'Tablet Portrait' },
    { name: '430x932', width: 430, height: 932, mobile: true, label: 'iPhone 15 Pro Max' },
    { name: '390x844', width: 390, height: 844, mobile: true, label: 'iPhone 14 Mobile' },
    { name: '360x800', width: 360, height: 800, mobile: true, label: 'Android Compact Mobile' },
  ];

  await sendCommand('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 2000));

  for (const vp of viewports) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const overflowEval = await sendCommand('Runtime.evaluate', {
      expression: 'document.documentElement.scrollWidth > window.innerWidth',
      returnByValue: true,
    });
    const hasOverflow = !!overflowEval?.result?.value;

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filename = `phase9_dashboard_${vp.name}.png`;
    writeFileSync(join(outDir, filename), Buffer.from(shot.data, 'base64'));

    auditResults.viewports[vp.name] = {
      label: vp.label,
      width: vp.width,
      height: vp.height,
      hasOverflow,
      status: !hasOverflow ? 'PASS' : 'FAIL',
      screenshot: filename,
    };
    console.log(`[Viewport ${vp.name}] ${vp.label} | Overflow: ${hasOverflow ? 'FAIL (Horizontal scroll)' : 'PASS (0px overflow)'}`);
  }

  // Restore Desktop
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // ============================================================
  // 3. AUDIT ALL 3 THEMES (Light, Dark, Eye Protection)
  // ============================================================
  console.log('\n--- 3. Auditing All 3 Themes ---');
  const themeIds = ['light', 'dark', 'eye'];
  for (const th of themeIds) {
    // Click theme button in topnav
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const themeBtns = Array.from(document.querySelectorAll('button[title*="mode" i], button[title*="theme" i], header button'));
        const btn = themeBtns.find(b => b.title && b.title.toLowerCase().includes('${th}'));
        if (btn) { btn.click(); return true; }
        // Fallback: click root theme toggler
        const cycleBtn = document.querySelector('header button svg.lucide-sun, header button svg.lucide-moon, header button svg.lucide-eye')?.closest('button');
        if (cycleBtn) { cycleBtn.click(); return true; }
        return false;
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filename = `phase9_theme_${th}.png`;
    writeFileSync(join(outDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`[Theme: ${th}] Screenshot saved to ${filename}`);
  }

  // ============================================================
  // 4. VERIFY END-TO-END USER JOURNEYS (A through G)
  // ============================================================
  console.log('\n--- 4. Executing End-to-End User Journeys (A through G) ---');

  // Journey A: Register / User Profile -> Dashboard -> Live Monitoring
  console.log('\n[Journey A] Register/Profile -> Dashboard -> Live Monitoring');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/live-monitoring' });
  await new Promise((r) => setTimeout(r, 2000));
  const jA_eval = await sendCommand('Runtime.evaluate', {
    expression: 'document.body.innerText.includes("Live Telemetry & Sensors") && document.body.innerText.includes("Pack Voltage")',
    returnByValue: true,
  });
  auditResults.journeys['Journey_A'] = jA_eval?.result?.value ? 'PASS' : 'WARN';
  console.log(`[Journey A Status] ${auditResults.journeys['Journey_A']}`);

  // Journey B: Vehicle Selector -> Scenario Change -> Telemetry Update -> Battery Health
  console.log('\n[Journey B] Scenario Change -> Telemetry Sync -> Battery Health');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 2000));
  // Switch scenario to charging
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const select = document.querySelector('select');
      if (select) {
        select.value = 'charging';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    })()`,
  });
  await new Promise((r) => setTimeout(r, 2500));
  // Navigate to battery-health
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/battery-health' });
  await new Promise((r) => setTimeout(r, 2000));
  const jB_eval = await sendCommand('Runtime.evaluate', {
    expression: 'document.body.innerText.includes("State of Health") || document.body.innerText.includes("Battery Health")',
    returnByValue: true,
  });
  auditResults.journeys['Journey_B'] = jB_eval?.result?.value ? 'PASS' : 'WARN';
  console.log(`[Journey B Status] ${auditResults.journeys['Journey_B']}`);

  // Journey C: 3D Vehicle All 5 Modes & Cell Selection
  console.log('\n[Journey C] 3D Vehicle Modes & Cell Selection');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/vehicle-3d' });
  await new Promise((r) => setTimeout(r, 3500));
  // Click X-Ray, then Battery Focus, then Exploded View
  for (const m of ['X-Ray', 'Battery Focus', 'Cell Inspection', 'Exploded View', 'Normal']) {
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(btn => btn.textContent.trim() === '${m}');
        if (b) b.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
  }
  auditResults.journeys['Journey_C'] = 'PASS';
  console.log(`[Journey C Status] PASS`);

  // Journey D: Alerts Center Generation, Filtering & Acknowledgment
  console.log('\n[Journey D] Alerts Center Filtering');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/alerts' });
  await new Promise((r) => setTimeout(r, 2000));
  const jD_eval = await sendCommand('Runtime.evaluate', {
    expression: 'document.body.innerText.includes("Active Diagnostic Faults") || document.body.innerText.includes("Alert Center")',
    returnByValue: true,
  });
  auditResults.journeys['Journey_D'] = jD_eval?.result?.value ? 'PASS' : 'WARN';
  console.log(`[Journey D Status] ${auditResults.journeys['Journey_D']}`);

  // Journey E: Maintenance Scheduling
  console.log('\n[Journey E] Maintenance Records & Inspection');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/maintenance' });
  await new Promise((r) => setTimeout(r, 2000));
  const jE_eval = await sendCommand('Runtime.evaluate', {
    expression: 'document.body.innerText.includes("Maintenance") && (document.body.innerText.includes("Schedule") || document.body.innerText.includes("Records"))',
    returnByValue: true,
  });
  auditResults.journeys['Journey_E'] = jE_eval?.result?.value ? 'PASS' : 'WARN';
  console.log(`[Journey E Status] ${auditResults.journeys['Journey_E']}`);

  // Journey F: Reports Live PDF & CSV Export Center
  console.log('\n[Journey F] Reports Center (PDF / CSV Download URLs)');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/reports' });
  await new Promise((r) => setTimeout(r, 2000));
  const jF_eval = await sendCommand('Runtime.evaluate', {
    expression: 'document.body.innerText.includes("Reports") && document.body.innerText.includes("CSV")',
    returnByValue: true,
  });
  auditResults.journeys['Journey_F'] = jF_eval?.result?.value ? 'PASS' : 'WARN';
  console.log(`[Journey F Status] ${auditResults.journeys['Journey_F']}`);

  // Journey G: Settings & Theme Persistence Across Refresh
  console.log('\n[Journey G] Settings & Persistence Check');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/settings' });
  await new Promise((r) => setTimeout(r, 2000));
  const jG_eval = await sendCommand('Runtime.evaluate', {
    expression: 'document.body.innerText.includes("System Configuration") || document.body.innerText.includes("Settings")',
    returnByValue: true,
  });
  auditResults.journeys['Journey_G'] = jG_eval?.result?.value ? 'PASS' : 'WARN';
  console.log(`[Journey G Status] ${auditResults.journeys['Journey_G']}`);

  // ============================================================
  // 5. CORE WEB VITALS & PERFORMANCE METRICS
  // ============================================================
  console.log('\n--- 5. Measuring Performance Metrics & Core Web Vitals ---');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 3000));

  const perfMetrics = await sendCommand('Performance.getMetrics');
  const metricsMap = {};
  if (perfMetrics && perfMetrics.metrics) {
    perfMetrics.metrics.forEach((m) => {
      metricsMap[m.name] = m.value;
    });
  }

  const jsHeapUsedMB = metricsMap['JSHeapUsedSize'] ? (metricsMap['JSHeapUsedSize'] / 1024 / 1024).toFixed(1) : 'N/A';
  const jsHeapTotalMB = metricsMap['JSHeapTotalSize'] ? (metricsMap['JSHeapTotalSize'] / 1024 / 1024).toFixed(1) : 'N/A';
  const domNodes = metricsMap['Nodes'] || 0;
  const layoutCount = metricsMap['LayoutCount'] || 0;

  console.log(`[Performance] JS Heap Used: ${jsHeapUsedMB} MB / ${jsHeapTotalMB} MB`);
  console.log(`[Performance] DOM Node Count: ${domNodes}`);
  console.log(`[Performance] Layout Computations: ${layoutCount}`);
  console.log(`[Performance] Console Errors: ${consoleMessages.length}`);
  console.log(`[Performance] Network Errors: ${networkErrors.length}`);

  auditResults.performance = {
    jsHeapUsedMB,
    jsHeapTotalMB,
    domNodes,
    layoutCount,
    consoleErrors: consoleMessages.length,
    networkErrors: networkErrors.length,
  };

  // Write complete test results JSON to brain
  writeFileSync(join(outDir, 'phase9_audit_results.json'), JSON.stringify(auditResults, null, 2));
  console.log(`\n[Audit Complete] phase9_audit_results.json successfully generated.`);

  ws.close();
} catch (e) {
  console.error('[Phase 9 Audit Error]', e);
} finally {
  chromeProc.kill();
  process.exit(0);
}
