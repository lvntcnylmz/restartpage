// ── CLOCK and DATE ────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById("clock-time").textContent = now.toLocaleTimeString(
    "en-GB",
    { hour12: false },
  );
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  document.getElementById("clock-date").textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function drawCalendar() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const today = now.getDate();

  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  document.getElementById("cal-month").textContent =
    `${monthNames[month]} ${year}`;

  // Pazartesi başlangıçlı ilk gün hesabı (JS 0:Pazar, 1:Pzt)
  let firstDay = new Date(year, month, 1).getDay();
  let shift = firstDay === 0 ? 6 : firstDay - 1; // Pazar ise 6 kaydır, değilse 1 eksilt

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  const dayHeads = ["M", "T", "W", "T", "F", "S", "S"];
  dayHeads.forEach(
    (d) => (grid.innerHTML += `<div class="cal-day-head">${d}</div>`),
  );

  for (let i = 0; i < shift; i++) grid.innerHTML += `<div></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today ? "cal-today" : "";
    grid.innerHTML += `<div class="cal-day ${isToday}">${d}</div>`;
  }
}

setInterval(updateClock, 1000);
updateClock();
drawCalendar();

// ── WEATHER ────────────────────────────────────────────
async function loadWeather() {
  try {
    const lat = 41.4,
      lon = 27.35;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&forecast_days=1&wind_speed_unit=kmh&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const c = data.current;

    document.getElementById("w-temp").textContent =
      Math.round(c.temperature_2m) + "°";
    document.getElementById("w-desc").textContent = wmoDesc(
      c.weather_code,
    ).label;
    document.getElementById("w-humi").textContent = c.relative_humidity_2m;
    document.getElementById("w-wind").textContent = Math.round(
      c.wind_speed_10m,
    );
    document.getElementById("w-prec").textContent =
      c.precipitation_probability ?? "--";
    document.getElementById("w-feel").textContent = Math.round(
      c.apparent_temperature,
    );

    const now = new Date();
    let count = 0;
    let html = "";
    for (let i = 0; i < data.hourly.time.length && count < 5; i++) {
      const t = new Date(data.hourly.time[i]);
      if (t <= now) continue;
      const wd = wmoDesc(data.hourly.weather_code[i]);
      html += `<div><span class="fc-time">${String(t.getHours()).padStart(2, "0")}:00</span><span class="fc-temp">${Math.round(data.hourly.temperature_2m[i])}°</span><span class="fc-desc ${wd.cls}">${wd.label}</span></div>`;
      count++;
    }
    document.getElementById("w-forecast").innerHTML = html;
  } catch (e) {
    document.getElementById("w-desc").textContent = "unavailable";
  }
}

function wmoDesc(code) {
  if (code === 0) return { label: "clear sky", cls: "wc-sunny" };
  if (code <= 3) return { label: "cloudy", cls: "wc-cloud" };
  if (code <= 67) return { label: "rain", cls: "wc-rain" };
  return { label: "mainly sunny", cls: "wc-sunny" };
}
loadWeather();

// ── POMODORO ───────────────────────────────────────────
let pomo = {
  session: 1,
  mode: "FOCUS",
  total: 25 * 60,
  elapsed: 0,
  running: false,
  timer: null,
};

function renderPomo() {
  const remaining = Math.max(pomo.total - pomo.elapsed, 0);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const pct = Math.round((pomo.elapsed * 100) / pomo.total);

  document.getElementById("pomo-time").textContent =
    `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  document.getElementById("pomo-bar-fill").style.width = pct + "%";
  document.getElementById("pomo-pct").textContent = pct + "%";

  const label = document.getElementById("pomo-mode-label");
  label.textContent = `[${pomo.mode.replace("_", " ")}]`;
  label.className = `pomo-mode ${pomo.mode === "FOCUS" ? "focus" : pomo.mode === "SHORT_BREAK" ? "short" : "long"}`;

  document.getElementById("pomo-sess-num").textContent = String(
    pomo.session,
  ).padStart(2, "0");
  const dotPos = pomo.session % 4 === 0 ? 4 : pomo.session % 4;
  document.getElementById("pomo-dots").innerHTML = Array.from(
    { length: 4 },
    (_, i) =>
      i < dotPos
        ? '<span class="pomo-dot-filled">●</span>'
        : '<span class="pomo-dot-empty">○</span>',
  ).join(" ");
}

function pomoToggle() {
  if (pomo.running) {
    clearInterval(pomo.timer);
    pomo.running = false;
  } else {
    pomo.running = true;
    pomo.timer = setInterval(() => {
      pomo.elapsed++;
      if (pomo.elapsed >= pomo.total) pomoAdvance();
      renderPomo();
    }, 1000);
  }
  renderPomo();
}

function pomoAdvance() {
  clearInterval(pomo.timer);
  pomo.running = false;
  if (pomo.mode === "FOCUS") {
    if (pomo.session % 4 === 0) {
      pomo.mode = "LONG_BREAK";
      pomo.total = 15 * 60;
    } else {
      pomo.mode = "SHORT_BREAK";
      pomo.total = 5 * 60;
    }
    pomo.session++;
  } else {
    pomo.mode = "FOCUS";
    pomo.total = 25 * 60;
  }
  pomo.elapsed = 0;
}

function pomoSkip() {
  pomoAdvance();
  renderPomo();
}
function pomoReset() {
  clearInterval(pomo.timer);
  pomo.session = 1;
  pomo.mode = "FOCUS";
  pomo.total = 25 * 60;
  pomo.elapsed = 0;
  pomo.running = false;
  renderPomo();
}

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    pomoToggle();
  }
  if (e.key === "s") pomoSkip();
  if (e.key === "r") pomoReset();
});

renderPomo();
