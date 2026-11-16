/**
 * =============================================================
 * EcoTrack ESG — Application Logic
 * IBM Sustainability AI & Cloud Innovation Challenge
 *
 * Modules:
 *   1. FACILITY_DATA  — per-facility metric snapshots
 *   2. AUDIT_EVENTS   — energy event log entries
 *   3. State          — mutable runtime state
 *   4. Clock          — UTC ticker
 *   5. KPI Renderer   — updates all KPI card DOM nodes
 *   6. Donut Chart    — SVG arc math + render
 *   7. Canvas Chart   — time-series data gen, draw, animate
 *   8. Tooltip        — canvas hover detection
 *   9. Simulator      — "What-If" slider calculations
 *  10. Audit Log      — table render, search, acknowledge, export
 *  11. Toast          — notification snack-bar
 *  12. Init           — bootstrap and event binding
 * =============================================================
 */

'use strict';

/* =============================================================
   1. FACILITY DATA
   Each facility key maps to all metrics consumed by the UI.
   baselineEmit: used as chart mid-value and simulator baseline.
============================================================= */
const FACILITY_DATA = {
  global: {
    label:              'Global Aggregated',
    emissions:          '1,248.6',
    emissionsNum:        1248.6,
    emissionsBadge:     '↓ 12.4% MoM',
    emissionsBadgeClass:'kpi-badge--down',
    s1pct:               62,
    renew:              '78.2%',
    renewNum:            78.2,
    renewBadge:         '↑ 3.1% QoQ',
    renewBadgeClass:    'kpi-badge--down',
    renewSrc:           'Solar 44% · Wind 34%',
    gridVal:            '4.82',
    gridWarnText:       'Peak load: 94% capacity',
    gridRiskClass:      'risk-high',
    gridRiskLabel:      'High',
    nzVal:               64,
    nzSub:              'On track · 6 yrs to target · SBTi aligned',
    s1t:                 462.5,  s1p: 37,
    s2t:                 786.1,  s2p: 63,
    s3t:                3210.0,
    intensity:          '0.82 tCO₂e / MWh',
    intensityDelta:     '↓ 8.2% vs prior year',
    intensityDeltaClass:'intensity-block__delta',
    baselineEmit:        1248.6,
    period:             'Jan 2025 – Nov 2025',
  },
  frankfurt: {
    label:              'Data Center Alpha — Frankfurt',
    emissions:          '318.4',
    emissionsNum:        318.4,
    emissionsBadge:     '↓ 9.1% MoM',
    emissionsBadgeClass:'kpi-badge--down',
    s1pct:               48,
    renew:              '91.5%',
    renewNum:            91.5,
    renewBadge:         '↑ 5.0% QoQ',
    renewBadgeClass:    'kpi-badge--down',
    renewSrc:           'Wind 61% · Solar 30%',
    gridVal:            '1.14',
    gridWarnText:       'Peak load: 71% capacity',
    gridRiskClass:      'risk-low',
    gridRiskLabel:      'Low',
    nzVal:               82,
    nzSub:              'Ahead of schedule · SBTi aligned',
    s1t:                 152.8,  s1p: 48,
    s2t:                 165.6,  s2p: 52,
    s3t:                 890.0,
    intensity:          '0.54 tCO₂e / MWh',
    intensityDelta:     '↓ 14.1% vs prior year',
    intensityDeltaClass:'intensity-block__delta',
    baselineEmit:        318.4,
    period:             'Jan 2025 – Nov 2025',
  },
  austin: {
    label:              'Silicon Fabrication Hub — Austin',
    emissions:          '584.2',
    emissionsNum:        584.2,
    emissionsBadge:     '↑ 3.2% MoM',
    emissionsBadgeClass:'kpi-badge--up',
    s1pct:               71,
    renew:              '61.0%',
    renewNum:            61.0,
    renewBadge:         '↓ 1.4% QoQ',
    renewBadgeClass:    'kpi-badge--up',
    renewSrc:           'Solar 55% · Grid 39%',
    gridVal:            '2.97',
    gridWarnText:       'Peak load: 98% capacity',
    gridRiskClass:      'risk-critical',
    gridRiskLabel:      'Critical',
    nzVal:               47,
    nzSub:              'At risk · Intervention required',
    s1t:                 414.8,  s1p: 71,
    s2t:                 169.4,  s2p: 29,
    s3t:                1540.0,
    intensity:          '1.21 tCO₂e / MWh',
    intensityDelta:     '↑ 2.1% vs prior year',
    intensityDeltaClass:'intensity-block__delta--red',
    baselineEmit:        584.2,
    period:             'Jan 2025 – Nov 2025',
  },
  singapore: {
    label:              'Logistics Terminal — Singapore',
    emissions:          '346.0',
    emissionsNum:        346.0,
    emissionsBadge:     '↓ 7.6% MoM',
    emissionsBadgeClass:'kpi-badge--down',
    s1pct:               55,
    renew:              '72.8%',
    renewNum:            72.8,
    renewBadge:         '↑ 2.0% QoQ',
    renewBadgeClass:    'kpi-badge--down',
    renewSrc:           'Solar 52% · Hydro 20%',
    gridVal:            '1.71',
    gridWarnText:       'Peak load: 82% capacity',
    gridRiskClass:      'risk-medium',
    gridRiskLabel:      'Medium',
    nzVal:               59,
    nzSub:              'On track · 6 yrs to target',
    s1t:                 190.3,  s1p: 55,
    s2t:                 155.7,  s2p: 45,
    s3t:                 780.0,
    intensity:          '0.96 tCO₂e / MWh',
    intensityDelta:     '↓ 5.5% vs prior year',
    intensityDeltaClass:'intensity-block__delta',
    baselineEmit:        346.0,
    period:             'Jan 2025 – Nov 2025',
  },
};

/* =============================================================
   2. AUDIT EVENTS
   Static seed data — priority: 'normal' | 'warning' | 'critical'
============================================================= */
const AUDIT_EVENTS = [
  { ts:'2025-11-15 23:48:12', id:'EVT-9941', facility:'Austin',    dept:'Fabrication',   desc:'Chiller unit CHL-3 overconsumption detected',              impact:'+2.14', priority:'critical' },
  { ts:'2025-11-15 23:31:05', id:'EVT-9940', facility:'Frankfurt', dept:'IT Ops',         desc:'Server rack R07 idle power threshold exceeded',            impact:'+0.38', priority:'warning'  },
  { ts:'2025-11-15 23:15:44', id:'EVT-9939', facility:'Global',    dept:'Procurement',   desc:'Renewable energy certificate (REC) batch verified',         impact:'-18.0', priority:'normal'   },
  { ts:'2025-11-15 22:58:30', id:'EVT-9938', facility:'Singapore', dept:'Logistics',     desc:'Fleet EV charging cycle completed — off-peak',             impact:'-0.82', priority:'normal'   },
  { ts:'2025-11-15 22:44:18', id:'EVT-9937', facility:'Austin',    dept:'Facilities',    desc:'HVAC set-point drifted above optimal range (26°C)',         impact:'+1.07', priority:'warning'  },
  { ts:'2025-11-15 22:29:55', id:'EVT-9936', facility:'Frankfurt', dept:'Data Center',   desc:'Solar array output nominal — 4.2 MW generation',           impact:'-4.20', priority:'normal'   },
  { ts:'2025-11-15 22:11:40', id:'EVT-9935', facility:'Austin',    dept:'Fabrication',   desc:'Unplanned process restart: energy spike +18% above limit', impact:'+5.61', priority:'critical' },
  { ts:'2025-11-15 21:55:22', id:'EVT-9934', facility:'Global',    dept:'Sustainability',desc:'Monthly GHG inventory submission to CDP completed',         impact:'0.00',  priority:'normal'   },
  { ts:'2025-11-15 21:38:09', id:'EVT-9933', facility:'Singapore', dept:'IT Ops',        desc:'Network core temperature elevated — cooling requested',    impact:'+0.14', priority:'warning'  },
  { ts:'2025-11-15 21:20:51', id:'EVT-9932', facility:'Frankfurt', dept:'Grid Mgmt',     desc:'Grid import spiked during wind lull — gas backup active', impact:'+3.90', priority:'warning'  },
  { ts:'2025-11-15 21:05:34', id:'EVT-9931', facility:'Austin',    dept:'Fabrication',   desc:'Nitrogen purge system power normalised',                   impact:'0.00',  priority:'normal'   },
  { ts:'2025-11-15 20:48:12', id:'EVT-9930', facility:'Global',    dept:'Executive',     desc:'Board ESG report Q3 published to sustainability portal',   impact:'0.00',  priority:'normal'   },
];

/* =============================================================
   3. MUTABLE STATE
============================================================= */
const State = {
  currentFacility: 'global',   // active facility key
  currentRange:    '24h',       // chart time range
  chartData:       [],          // array of {t: timestamp, v: value}
  ackedSet:        new Set(),   // acknowledged event IDs
  animFrame:       null,        // requestAnimationFrame handle
  livePhase:       0,           // phase for live-dot pulse animation
  toastTimer:      null,        // debounce timer for toast
};

/* =============================================================
   4. UTC CLOCK
============================================================= */
function updateClock() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const clockEl = document.getElementById('utcClock');
  if (clockEl) {
    clockEl.textContent =
      `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
  }
}

/* =============================================================
   5. KPI RENDERER
   Reads from FACILITY_DATA[key] and updates every KPI DOM node.
============================================================= */
function renderKPIs(key) {
  const d = FACILITY_DATA[key];
  if (!d) return;

  /* ---- Scope 1 & 2 Emissions ---- */
  document.getElementById('kpi-emissions-val').textContent   = d.emissions;
  const emBadge = document.getElementById('kpi-emissions-badge');
  emBadge.textContent = d.emissionsBadge;
  emBadge.className   = 'kpi-badge ' + d.emissionsBadgeClass;

  const s1bar = document.getElementById('kpi-s1bar');
  s1bar.style.width = d.s1pct + '%';
  document.getElementById('kpi-s1pct').textContent = d.s1pct + '%';

  /* ---- Renewable Energy Mix ---- */
  const circumference = 2 * Math.PI * 28; // r = 28, matches SVG
  const offset = circumference * (1 - d.renewNum / 100);

  const ring = document.getElementById('renewRing');
  ring.style.strokeDashoffset = offset.toFixed(2);
  document.getElementById('renewRingLabel').textContent = Math.round(d.renewNum) + '%';
  document.getElementById('kpi-renew-val').textContent   = d.renew;

  const rBadge = document.getElementById('kpi-renew-badge');
  rBadge.textContent = d.renewBadge;
  rBadge.className   = 'kpi-badge ' + d.renewBadgeClass;
  document.getElementById('kpi-renew-src').textContent   = d.renewSrc;

  /* ---- Grid Power Consumption ---- */
  document.getElementById('kpi-grid-val').textContent      = d.gridVal;
  document.getElementById('kpi-grid-warn-text').textContent = d.gridWarnText;

  const gridSub = document.getElementById('kpi-grid-sub');
  gridSub.innerHTML =
    'Demand charge risk: <span class="' + d.gridRiskClass + '">' + d.gridRiskLabel + '</span>';

  /* ---- Net-Zero Progress ---- */
  document.getElementById('kpi-nz-val').textContent   = d.nzVal;
  document.getElementById('kpi-nz-label').textContent = d.nzVal + ' / 100';

  const nzBar = document.getElementById('kpi-nz-bar');
  nzBar.style.width = d.nzVal + '%';

  const nzBarWrap = document.getElementById('kpi-nz-bar-wrap');
  nzBarWrap.setAttribute('aria-valuenow', d.nzVal);
  document.getElementById('kpi-nz-sub').textContent = d.nzSub;

  /* ---- Scope Breakdown sidebar ---- */
  document.getElementById('donut-total').textContent = d.emissions;
  document.getElementById('s1-label').textContent    = `${d.s1t.toFixed(1)} tCO₂e (${d.s1p}%)`;
  document.getElementById('s2-label').textContent    = `${d.s2t.toFixed(1)} tCO₂e (${d.s2p}%)`;
  document.getElementById('s3-label').textContent    = `${d.s3t.toFixed(1)} tCO₂e`;

  document.getElementById('intensityVal').textContent   = d.intensity;
  const intensityDeltaEl = document.getElementById('intensityDelta');
  intensityDeltaEl.textContent = d.intensityDelta;
  intensityDeltaEl.className   = d.intensityDeltaClass;

  /* ---- Chart facility label ---- */
  document.getElementById('chartFacilityLabel').textContent = d.label + ' — Live Feed';

  /* ---- Reporting period ---- */
  document.getElementById('reportingPeriod').textContent = d.period;

  /* ---- Update donut SVG ---- */
  renderDonut(d.s1p, d.s2p);
}

/* =============================================================
   6. DONUT CHART (SVG arc segments)
   Draws Scope 1 and Scope 2 arcs around a 50-radius circle.
   Full circle circumference ≈ 314.16 (2π × 50).
============================================================= */
function renderDonut(s1p, s2p) {
  const r    = 50;
  const circ = 2 * Math.PI * r; // ≈ 314.159

  /* Scope 1 arc */
  const s1len = circ * (s1p / 100);
  const s1Gap = circ - s1len;
  document.getElementById('donut-s1').setAttribute(
    'stroke-dasharray', `${s1len.toFixed(2)} ${s1Gap.toFixed(2)}`
  );
  document.getElementById('donut-s1').setAttribute('stroke-dashoffset', '0');

  /* Scope 2 arc — starts where Scope 1 ends */
  const s2len = circ * (s2p / 100);
  const s2Gap = circ - s2len;
  document.getElementById('donut-s2').setAttribute(
    'stroke-dasharray', `${s2len.toFixed(2)} ${s2Gap.toFixed(2)}`
  );
  document.getElementById('donut-s2').setAttribute(
    'stroke-dashoffset', (-s1len).toFixed(2)
  );

  /* Scope 3 — tiny indicator dot only */
  document.getElementById('donut-s3').setAttribute(
    'stroke-dasharray', `2 ${circ.toFixed(2)}`
  );
  document.getElementById('donut-s3').setAttribute(
    'stroke-dashoffset', (-(s1len + s2len)).toFixed(2)
  );
}

/* =============================================================
   7. CANVAS CHART — TIME-SERIES
============================================================= */

/* --- 7a. Data Generation ---
   Produces an array of {t: epochMs, v: float} data points.
   Noise amplitude and point spacing vary by range.
*/
function generateChartData(range, baseVal) {
  const config = {
    '24h': { count: 24,  stepMin: 60,   noiseAmp: 0.11 },
    '7d':  { count: 28,  stepMin: 360,  noiseAmp: 0.17 },
    '30d': { count: 30,  stepMin: 1440, noiseAmp: 0.22 },
  };
  const { count, stepMin, noiseAmp } = config[range] || config['24h'];
  const now  = Date.now();
  const pts  = [];
  let val    = baseVal * 0.92;

  for (let i = 0; i < count; i++) {
    // Random walk with drift back toward baseline
    val += (Math.random() - 0.47) * noiseAmp * baseVal;
    val  = Math.max(baseVal * 0.52, Math.min(baseVal * 1.42, val));
    pts.push({
      t: now - (count - 1 - i) * stepMin * 60 * 1000,
      v: parseFloat(val.toFixed(2)),
    });
  }
  return pts;
}

/* --- 7b. Timestamp Formatter ---
   Returns a human-readable label for a data point's timestamp.
*/
function formatChartLabel(ts, range) {
  const d = new Date(ts);
  if (range === '24h') {
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  }
  if (range === '7d') {
    return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

/* --- 7c. Canvas Sizing ---
   Scales canvas backing store to device pixel ratio.
*/
const canvas = document.getElementById('emissionsCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  const wrap = canvas.parentElement;
  const dpr  = window.devicePixelRatio || 1;
  canvas.width  = wrap.clientWidth  * dpr;
  canvas.height = wrap.clientHeight * dpr;
  canvas.style.width  = wrap.clientWidth  + 'px';
  canvas.style.height = wrap.clientHeight + 'px';
}

/* --- 7d. Main Draw Routine ---
   Renders grid, area fill, line, data points, and animated live dot.
   highlightIdx: optional index to emphasise on hover.
*/
function drawChart(highlightIdx) {
  const data = State.chartData;
  if (!data.length) return;

  resizeCanvas();
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.width;
  const H   = canvas.height;
  const pad = {
    top:    20 * dpr,
    right:  20 * dpr,
    bottom: 38 * dpr,
    left:   54 * dpr,
  };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top  - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  /* Value range */
  const vals = data.map((p) => p.v);
  const minV = Math.min(...vals) * 0.92;
  const maxV = Math.max(...vals) * 1.07;

  /* Coordinate transforms */
  const xOf = (i) => pad.left + (i / (data.length - 1)) * plotW;
  const yOf = (v) => pad.top  + (1 - (v - minV) / (maxV - minV)) * plotH;

  /* -- Grid lines -- */
  const gridCount = 5;
  ctx.strokeStyle = 'rgba(57, 57, 57, 0.7)';
  ctx.lineWidth   = 1;
  for (let g = 0; g <= gridCount; g++) {
    const y     = pad.top + (g / gridCount) * plotH;
    const label = (maxV - (g / gridCount) * (maxV - minV)).toFixed(1);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    /* Y-axis labels */
    ctx.fillStyle  = 'rgba(141, 141, 141, 0.9)';
    ctx.font       = `${10 * dpr}px -apple-system, sans-serif`;
    ctx.textAlign  = 'right';
    ctx.fillText(label, pad.left - 6 * dpr, y + 4 * dpr);
  }

  /* -- X-axis labels -- */
  const xLabelStep = Math.max(1, Math.floor(data.length / 6));
  ctx.fillStyle = 'rgba(141, 141, 141, 0.9)';
  ctx.textAlign = 'center';
  ctx.font      = `${9 * dpr}px -apple-system, sans-serif`;
  for (let i = 0; i < data.length; i += xLabelStep) {
    ctx.fillText(
      formatChartLabel(data[i].t, State.currentRange),
      xOf(i),
      H - 8 * dpr
    );
  }

  /* -- Area fill -- */
  const areaGrad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  areaGrad.addColorStop(0, 'rgba(15, 98, 254, 0.28)');
  areaGrad.addColorStop(1, 'rgba(15, 98, 254, 0.02)');

  ctx.beginPath();
  data.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.v);
    if (i === 0) ctx.moveTo(x, y);
    else         ctx.lineTo(x, y);
  });
  ctx.lineTo(xOf(data.length - 1), H - pad.bottom);
  ctx.lineTo(xOf(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  /* -- Line -- */
  ctx.beginPath();
  ctx.strokeStyle = '#0f62fe';
  ctx.lineWidth   = 2.2 * dpr;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  data.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.v);
    if (i === 0) ctx.moveTo(x, y);
    else         ctx.lineTo(x, y);
  });
  ctx.stroke();

  /* -- Hover highlight dot -- */
  if (highlightIdx !== undefined && highlightIdx < data.length - 1) {
    const hx = xOf(highlightIdx);
    const hy = yOf(data[highlightIdx].v);
    ctx.beginPath();
    ctx.arc(hx, hy, 4.5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle   = '#0f62fe';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5 * dpr;
    ctx.stroke();
  }

  /* -- Animated live dot (always last data point) -- */
  const li    = data.length - 1;
  const lx    = xOf(li);
  const ly    = yOf(data[li].v);
  const pulse = (Math.sin(State.livePhase) + 1) / 2; // 0..1

  /* Outer pulse rings */
  ctx.beginPath();
  ctx.arc(lx, ly, (8 + 5 * pulse) * dpr, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(15, 98, 254, ${0.16 * pulse})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(lx, ly, (5 + 3 * pulse) * dpr, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(15, 98, 254, ${0.26 * pulse})`;
  ctx.fill();

  /* Core green dot */
  ctx.beginPath();
  ctx.arc(lx, ly, 4.5 * dpr, 0, Math.PI * 2);
  ctx.fillStyle   = '#42be65';
  ctx.fill();
  ctx.strokeStyle = '#161616';
  ctx.lineWidth   = 1.5 * dpr;
  ctx.stroke();

  /* "LIVE" badge text */
  ctx.fillStyle  = 'rgba(66, 190, 101, 0.95)';
  ctx.font       = `bold ${9 * dpr}px -apple-system, sans-serif`;
  ctx.textAlign  = 'left';
  ctx.fillText('● LIVE', lx + 8 * dpr, ly - 7 * dpr);
}

/* --- 7e. Animation Loop ---
   Increments livePhase and schedules next frame.
*/
function animateChart() {
  State.livePhase += 0.065;
  drawChart();
  State.animFrame = requestAnimationFrame(animateChart);
}

/* --- 7f. Reload Chart ---
   Regenerates data for the current facility + range, resets animation.
*/
function reloadChart() {
  const d = FACILITY_DATA[State.currentFacility];
  State.chartData = generateChartData(State.currentRange, d.baselineEmit);
  cancelAnimationFrame(State.animFrame);
  animateChart();
}

/* =============================================================
   8. CHART TOOLTIP (hover detection)
============================================================= */
const tooltip  = document.getElementById('chartTooltip');
const ttLabel  = document.getElementById('tt-label');
const ttVal    = document.getElementById('tt-val');

canvas.addEventListener('mousemove', (e) => {
  const data = State.chartData;
  if (!data.length) return;

  const rect = canvas.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;
  const W    = canvas.width;
  const H    = canvas.height;
  const pad  = { top: 20 * dpr, right: 20 * dpr, bottom: 38 * dpr, left: 54 * dpr };
  const mx   = (e.clientX - rect.left) * dpr;

  /* Outside plot area */
  if (mx < pad.left || mx > W - pad.right) {
    tooltip.style.display = 'none';
    tooltip.setAttribute('aria-hidden', 'true');
    return;
  }

  const fraction = (mx - pad.left) / (W - pad.left - pad.right);
  const idx      = Math.round(fraction * (data.length - 1));
  const safeIdx  = Math.max(0, Math.min(data.length - 1, idx));
  const pt       = data[safeIdx];

  ttLabel.textContent = formatChartLabel(pt.t, State.currentRange);
  ttVal.textContent   = pt.v.toFixed(2) + ' tCO₂e';

  /* Position tooltip — keep it inside the wrapper */
  const tooltipX = e.clientX - rect.left + 14;
  const tooltipY = e.clientY - rect.top  - 12;
  tooltip.style.left    = Math.min(tooltipX, rect.width - 160) + 'px';
  tooltip.style.top     = Math.max(4, tooltipY) + 'px';
  tooltip.style.display = 'block';
  tooltip.setAttribute('aria-hidden', 'false');

  drawChart(safeIdx);
});

canvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
  tooltip.setAttribute('aria-hidden', 'true');
  drawChart();
});

/* Keyboard accessibility: hide tooltip on focus loss */
canvas.addEventListener('blur', () => {
  tooltip.style.display = 'none';
});

/* =============================================================
   9. ESG SCENARIO SIMULATOR
============================================================= */
const sliderIdle  = document.getElementById('sliderIdle');
const sliderHVAC  = document.getElementById('sliderHVAC');
const sliderSolar = document.getElementById('sliderSolar');

/**
 * Recalculates and renders all simulator output fields.
 * Uses a simplified linear reduction model based on three levers:
 *   - Idle Cap:   up to 15% baseline reduction at 100%
 *   - HVAC:       up to 12% at minimum set-point (18°C)
 *   - Solar:      up to 40% at 100% allocation
 * Cost saving assumes $48/tCO₂e abatement cost.
 */
function updateSimulator() {
  const idle  = parseInt(sliderIdle.value,  10);
  const hvac  = parseInt(sliderHVAC.value,  10);
  const solar = parseInt(sliderSolar.value, 10);
  const d     = FACILITY_DATA[State.currentFacility];
  const base  = d.baselineEmit;

  /* Update slider value labels */
  document.getElementById('sliderIdleVal').textContent  = idle  + '%';
  document.getElementById('sliderHVACVal').textContent  = hvac  + '°C';
  document.getElementById('sliderSolarVal').textContent = solar + '%';

  /* Update parameter summary pills */
  document.getElementById('paramIdle').textContent  = idle  + '%';
  document.getElementById('paramHVAC').textContent  = hvac  + '°C';
  document.getElementById('paramSolar').textContent = solar + '%';

  /* Reduction calculations */
  const idleReduction  = base * 0.15 * (idle / 100);
  const hvacFactor     = Math.max(0, (26 - hvac) / 8); // 1 at 18°C, 0 at 26°C
  const hvacReduction  = base * 0.12 * hvacFactor;
  const solarReduction = base * 0.40 * (solar / 100);

  const totalReduction  = idleReduction + hvacReduction + solarReduction;
  const costSavings     = totalReduction * 48; // $48 / tCO₂e
  const projectedRenew  = Math.min(100, d.renewNum + solar * 0.18);

  /* Render outputs */
  document.getElementById('simCarbonSaving').textContent =
    totalReduction.toFixed(0) + ' tCO₂e';
  document.getElementById('simCostSaving').textContent =
    '$' + costSavings.toLocaleString('en-US', { maximumFractionDigits: 0 });
  document.getElementById('simRenewMix').textContent =
    projectedRenew.toFixed(1) + '%';
  document.getElementById('simRenewBase').textContent =
    'up from current ' + d.renew;

  /* Contextual insight message */
  let insight = '';
  const pct = totalReduction / base;
  if (pct > 0.40) {
    insight = 'Transformative impact. This scenario reduces emissions by over 40% — consistent with a 1.5 °C aligned pathway. Prioritise capital allocation toward solar deployment.';
  } else if (pct > 0.25) {
    insight = 'Strong progress. A 25–40% reduction positions this facility on a credible SBTi trajectory. Focus on HVAC automation for quick wins.';
  } else if (pct > 0.10) {
    insight = 'Moderate gains. 10–25% reduction achievable with current settings. Increase server idle cap and renewable allocation for greater impact.';
  } else {
    insight = 'Incremental improvement. Adjust sliders to explore higher-impact decarbonisation scenarios for this facility.';
  }
  document.getElementById('simInsight').textContent = insight;
}

/* =============================================================
   10. AUDIT LOG
============================================================= */

/** Returns the CSS class for a priority level. */
function priorityClass(p) {
  if (p === 'critical') return 'tag-critical';
  if (p === 'warning')  return 'tag-warning';
  return 'tag-normal';
}

/** Returns the CSS class for a tCO₂e impact value. */
function impactClass(impact) {
  if (impact.startsWith('+')) return 'ev-pos';
  if (impact.startsWith('-')) return 'ev-neg';
  return 'ev-zero';
}

/**
 * Renders the audit table, filtered by an optional keyword.
 * Re-binds acknowledge button handlers after each render.
 */
function renderAudit(filter) {
  const tbody  = document.getElementById('auditTbody');
  const empty  = document.getElementById('auditEmpty');
  const q      = (filter || '').toLowerCase().trim();

  const rows = AUDIT_EVENTS.filter((ev) =>
    !q ||
    ev.id.toLowerCase().includes(q)        ||
    ev.facility.toLowerCase().includes(q)  ||
    ev.dept.toLowerCase().includes(q)      ||
    ev.desc.toLowerCase().includes(q)      ||
    ev.priority.toLowerCase().includes(q)
  );

  if (!rows.length) {
    tbody.innerHTML  = '';
    empty.hidden     = false;
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = rows.map((ev) => {
    const acked = State.ackedSet.has(ev.id);
    return `
      <tr>
        <td>${ev.ts}</td>
        <td class="ev-id">${ev.id}</td>
        <td>${ev.facility}</td>
        <td>${ev.dept}</td>
        <td style="max-width:300px">${ev.desc}</td>
        <td class="${impactClass(ev.impact)}" style="text-align:right">${ev.impact}</td>
        <td><span class="priority-tag ${priorityClass(ev.priority)}">${ev.priority}</span></td>
        <td>
          <button class="ack-btn${acked ? ' acked' : ''}"
                  data-id="${ev.id}"
                  aria-label="Acknowledge event ${ev.id}">
            ${acked ? '✓ Acked' : 'Acknowledge'}
          </button>
        </td>
      </tr>`;
  }).join('');

  /* Bind acknowledge buttons */
  tbody.querySelectorAll('.ack-btn').forEach((btn) => {
    btn.addEventListener('click', function handleAck() {
      const id = this.dataset.id;
      State.ackedSet.add(id);
      this.textContent  = '✓ Acked';
      this.classList.add('acked');
      showToast(`Event ${id} acknowledged`, 'green');
    });
  });
}

/** Triggers a real CSV download of the full audit log. */
function exportAuditCSV() {
  const headers = [
    'Timestamp (UTC)', 'Event ID', 'Facility', 'Department',
    'Description', 'Impact (tCO2e)', 'Priority',
  ];
  const rows = AUDIT_EVENTS.map((ev) =>
    [ev.ts, ev.id, ev.facility, ev.dept, `"${ev.desc}"`, ev.impact, ev.priority].join(',')
  );
  const csv    = [headers.join(','), ...rows].join('\n');
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href     = url;
  anchor.download = 'ecotrack_audit_log.csv';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Audit log exported as CSV', 'blue');
}

/* =============================================================
   11. TOAST NOTIFICATION
============================================================= */

/**
 * Displays a slide-in snack-bar for 3.2 s.
 * @param {string} msg   — message text
 * @param {'blue'|'green'|'red'} type — dot colour
 */
function showToast(msg, type) {
  const toast  = document.getElementById('toast');
  const dot    = document.getElementById('toastDot');
  const msgEl  = document.getElementById('toastMsg');

  msgEl.textContent = msg;
  dot.style.background =
    type === 'green' ? 'var(--green-light)' :
    type === 'red'   ? 'var(--red-light)'   :
                       'var(--blue-light)';

  toast.classList.add('show');

  if (State.toastTimer) clearTimeout(State.toastTimer);
  State.toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* =============================================================
   12. DASHBOARD ORCHESTRATOR
   Calls renderKPIs, reloads chart, recalculates simulator.
============================================================= */
function updateDashboard(key) {
  State.currentFacility = key;
  renderKPIs(key);
  reloadChart();
  updateSimulator();
}

/* =============================================================
   13. INIT — BOOTSTRAP & EVENT BINDING
============================================================= */
function init() {
  /* -- Initial render -- */
  updateDashboard('global');
  renderAudit('');

  /* -- UTC clock -- */
  updateClock();
  setInterval(updateClock, 1000);

  /* -- Canvas resize listener -- */
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawChart();
  });

  /* -- Facility switcher -- */
  document.getElementById('facilitySelect').addEventListener('change', function () {
    updateDashboard(this.value);
    showToast('Facility: ' + FACILITY_DATA[this.value].label, 'blue');
  });

  /* -- Time-range buttons -- */
  document.querySelectorAll('.time-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.time-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      State.currentRange = this.dataset.range;
      reloadChart();
    });
  });

  /* -- Simulator sliders -- */
  [sliderIdle, sliderHVAC, sliderSolar].forEach((slider) => {
    slider.addEventListener('input', updateSimulator);
  });

  /* -- Audit search -- */
  document.getElementById('auditSearch').addEventListener('input', function () {
    renderAudit(this.value);
  });

  /* -- Export audit log -- */
  document.getElementById('exportBtn').addEventListener('click', exportAuditCSV);

  /* -- Refresh audit log -- */
  document.getElementById('refreshAuditBtn').addEventListener('click', () => {
    document.getElementById('auditSearch').value = '';
    renderAudit('');
    showToast('Audit log refreshed', 'green');
  });

  /* -- Simulated live data tick (every 8 s) --
     Appends a new jittered data point to simulate streaming telemetry.
     Trims the buffer to 60 points to avoid memory growth.
  */
  setInterval(() => {
    const data = State.chartData;
    if (!data.length) return;
    const d      = FACILITY_DATA[State.currentFacility];
    const last   = data[data.length - 1].v;
    const jitter = (Math.random() - 0.47) * 0.09 * d.baselineEmit;
    const newVal = Math.max(
      d.baselineEmit * 0.52,
      Math.min(d.baselineEmit * 1.42, last + jitter)
    );
    data.push({ t: Date.now(), v: parseFloat(newVal.toFixed(2)) });
    if (data.length > 60) data.shift();
  }, 8000);
}

/* -- DOMContentLoaded guard --
   Ensures init runs after the DOM is fully parsed
   (script tag is at end of body, but guard is best practice).
*/
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
