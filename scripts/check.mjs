#!/usr/bin/env node
// Bellchain check for templates and custom nodes: node scripts/check.mjs --help
// Generated from the Bellchain node specification and the official nodes. Do not edit; changes come with the next sync.
// MIT License, Copyright (c) 2026 Bellchain. https://bellchain.app
var __defProp = Object.defineProperty;
var __export = (target, all2) => {
  for (var name4 in all2)
    __defProp(target, name4, { get: all2[name4], enumerable: true });
};

// packages/community/src/cli.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// packages/node-spec/src/types.ts
var CATEGORIES = ["src", "ind", "cond", "logic", "data", "act", "tool"];
var PIN_TYPES = ["series", "signal", "text"];
var NOTIFY_CHANNELS = ["push", "email", "telegram", "webhook", "discord", "pushover", "ntfy", "bot", "slack", "teams", "googlechat"];
var FIXTURE_COLUMNS = ["open", "high", "low", "close", "volume"];

// packages/node-spec/src/time.ts
var TIMEFRAMES = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"];
var MINUTE = 6e4;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var NOMINAL_MS = {
  "1m": MINUTE,
  "3m": 3 * MINUTE,
  "5m": 5 * MINUTE,
  "15m": 15 * MINUTE,
  "30m": 30 * MINUTE,
  "1h": HOUR,
  "2h": 2 * HOUR,
  "4h": 4 * HOUR,
  "6h": 6 * HOUR,
  "8h": 8 * HOUR,
  "12h": 12 * HOUR,
  "1d": DAY,
  "3d": 3 * DAY,
  "1w": 7 * DAY,
  "1M": 30 * DAY
};
function isTimeframe(value) {
  return typeof value === "string" && TIMEFRAMES.includes(value);
}
function timeframeMs(timeframe) {
  return NOMINAL_MS[timeframe];
}
function nextOpenTime(openTime, timeframe) {
  if (timeframe !== "1M") return openTime + NOMINAL_MS[timeframe];
  const date = new Date(openTime);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}
var UTC_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/;
function parseUtcTime(value) {
  if (!UTC_TIME.test(value)) return void 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : void 0;
}
var zoneCheck = /* @__PURE__ */ new Map();
function isValidTimeZone(timeZone) {
  let ok = zoneCheck.get(timeZone);
  if (ok === void 0) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
      ok = timeZone.length > 0;
    } catch {
      ok = false;
    }
    zoneCheck.set(timeZone, ok);
  }
  return ok;
}
var WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
var partFormats = /* @__PURE__ */ new Map();
function partFormat(timeZone) {
  let format = partFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short"
    });
    partFormats.set(timeZone, format);
  }
  return format;
}
function zonedParts(ms, timeZone) {
  const values = {};
  for (const part of partFormat(timeZone).formatToParts(new Date(ms))) values[part.type] = part.value;
  return {
    year: Number(values["year"]),
    month: Number(values["month"]),
    day: Number(values["day"]),
    hour: Number(values["hour"]) % 24,
    minute: Number(values["minute"]),
    second: Number(values["second"]),
    weekday: WEEKDAYS[values["weekday"] ?? "Sun"] ?? 0
  };
}
function zoneOffsetMs(ms, timeZone) {
  const seconds = Math.floor(ms / 1e3) * 1e3;
  const p = zonedParts(seconds, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - seconds;
}
function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const first = wall - zoneOffsetMs(wall, timeZone);
  const offset = zoneOffsetMs(first, timeZone);
  return wall - offset;
}
function weekdayOf(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// packages/node-spec/src/i18n.ts
var LOCALES = ["de", "en"];
function missingLocales(value) {
  if (typeof value !== "object" || value === null) return [...LOCALES];
  const record = value;
  return LOCALES.filter((locale) => {
    const text = record[locale];
    return typeof text !== "string" || text.trim() === "";
  });
}
function l(de, en) {
  return { de, en };
}
var INTL_LOCALE = { de: "de-DE", en: "en-US" };
var numberFormats = /* @__PURE__ */ new Map();
function numberFormat(locale, options) {
  const key = locale + JSON.stringify(options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(INTL_LOCALE[locale], options);
    numberFormats.set(key, format);
  }
  return format;
}
function autoFractionDigits(value) {
  const abs = Math.abs(value);
  if (abs >= 1e3) return 0;
  if (abs >= 100) return 1;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  return 6;
}
function formatNumber(value, locale, maximumFractionDigits) {
  if (!Number.isFinite(value)) return "–";
  const digits = maximumFractionDigits ?? autoFractionDigits(value);
  return numberFormat(locale, { maximumFractionDigits: digits }).format(value);
}
function formatFactor(factor, locale) {
  if (!Number.isFinite(factor)) return "–";
  const percent = Number(((factor - 1) * 100).toFixed(6));
  if (Math.abs(percent) > 50) return `× ${formatNumber(factor, locale)}`;
  return `${percent < 0 ? "−" : "+"}${formatNumber(Math.abs(percent), locale)} %`;
}
var dateFormats = /* @__PURE__ */ new Map();
function formatDateTime(ms, locale, timeZone, withYear = true) {
  const key = `${locale}|${timeZone}|${withYear}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = locale === "de" ? new Intl.DateTimeFormat("de-DE", {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      ...withYear ? { year: "numeric" } : {},
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }) : new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
      day: "numeric",
      ...withYear ? { year: "numeric" } : {},
      hour: "numeric",
      minute: "2-digit"
    });
    dateFormats.set(key, format);
  }
  const text = format.format(new Date(ms));
  return locale === "de" ? text.replace(",", "") : text;
}

// packages/node-spec/src/exchanges.ts
var EXCHANGES = [
  {
    id: "binance",
    label: "Binance",
    help: l(
      "Spot-Markt von Binance mit rund 500 Paaren gegen USDT, rund 250 gegen USDC und rund 30 gegen Euro.",
      "Binance spot market with about 500 pairs against USDT, about 250 against USDC and about 30 against the euro."
    ),
    timeframes: TIMEFRAMES,
    examples: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BTC/EUR"]
  },
  {
    id: "bitstamp",
    label: "Bitstamp",
    help: l(
      "Spot-Markt von Bitstamp mit je rund 110 Paaren gegen US-Dollar und Euro. Minuten ohne Handel kommen als Kerze ohne Volumen, und Alarme kommen einige Sekunden nach dem Kerzenschluss.",
      "Bitstamp spot market with about 110 pairs each against the US dollar and the euro. Minutes without trades arrive as a candle with no volume, and alerts arrive a few seconds after the candle closes."
    ),
    timeframes: ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "12h", "1d", "3d"],
    examples: ["BTC/EUR", "BTC/USD", "ETH/EUR"]
  },
  {
    id: "bitvavo",
    label: "Bitvavo",
    help: l(
      "Spot-Markt von Bitvavo mit rund 430 Paaren gegen Euro und gut 10 gegen USDC. In Minuten ohne Handel gibt es keine Kerze.",
      "Bitvavo spot market with about 430 pairs against the euro and just over 10 against USDC. Minutes without trades have no candle."
    ),
    timeframes: ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "1w", "1M"],
    examples: ["BTC/EUR", "ETH/EUR", "SOL/EUR"],
    gaps: true
  },
  {
    id: "bybit",
    label: "Bybit",
    help: l(
      "Spot-Markt von Bybit mit rund 390 Paaren gegen USDT, rund 80 gegen USDC und knapp 20 gegen Euro.",
      "Bybit spot market with about 390 pairs against USDT, about 80 against USDC and just under 20 against the euro."
    ),
    timeframes: ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "12h", "1d", "1w", "1M"],
    examples: ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
  },
  {
    id: "coinbase",
    label: "Coinbase",
    help: l(
      "Spot-Markt von Coinbase mit rund 400 Paaren gegen US-Dollar und rund 30 gegen Euro. In Minuten ohne Handel gibt es keine Kerze, und Alarme kommen einige Sekunden nach dem Kerzenschluss.",
      "Coinbase spot market with about 400 pairs against the US dollar and about 30 against the euro. Minutes without trades have no candle, and alerts arrive a few seconds after the candle closes."
    ),
    timeframes: ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "1d"],
    examples: ["BTC/USD", "ETH/USD", "BTC/EUR"],
    gaps: true
  },
  {
    id: "kraken",
    label: "Kraken",
    help: l(
      "Spot-Markt von Kraken mit rund 630 Paaren gegen US-Dollar und rund 500 gegen Euro.",
      "Kraken spot market with about 630 pairs against the US dollar and about 500 against the euro."
    ),
    timeframes: ["1m", "5m", "15m", "30m", "1h", "4h", "1d"],
    examples: ["BTC/EUR", "ETH/EUR", "BTC/USD"],
    historyBars: 720
  },
  {
    id: "okx",
    label: "OKX",
    help: l(
      "Spot-Markt von OKX mit rund 440 Paaren gegen USDT, rund 300 gegen USDC und rund 270 gegen Euro.",
      "OKX spot market with about 440 pairs against USDT, about 300 against USDC and about 270 against the euro."
    ),
    timeframes: ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "12h", "1d", "3d", "1w", "1M"],
    examples: ["BTC/USDT", "ETH/USDT", "BTC/EUR"]
  }
];
var DEFAULT_EXCHANGE = "binance";
var BY_ID = new Map(EXCHANGES.map((exchange) => [exchange.id, exchange]));
function exchangeInfo(id) {
  return BY_ID.get(id);
}
function exchangeLabel(id) {
  return BY_ID.get(id)?.label ?? id;
}
function historyNote(exchange) {
  const bars = exchange.historyBars;
  if (bars === void 0) return void 0;
  const count2 = new Intl.NumberFormat("de-DE").format(bars);
  const hours = Math.round(bars / 60);
  const days = Math.round(bars / 24);
  const years = Math.round(bars / 365);
  return l(
    `Rückwirkend liefert die Börse nur die letzten ${count2} Kerzen: bei 1 Minute ${hours} Stunden, bei 1 Stunde ${days} Tage, bei 1 Tag rund ${years} Jahre. Weiter reicht ein Replay erst, wenn Bellchain die Kerzen selbst gesammelt hat.`,
    `The exchange only provides the last ${new Intl.NumberFormat("en-US").format(bars)} candles: ${hours} hours at 1 minute, ${days} days at 1 hour, about ${years} years at 1 day. A replay reaches further back only once Bellchain has collected the candles itself.`
  );
}
function unsupportedTimeframeMessage(exchange, timeframe) {
  const offered = exchange.timeframes.join(", ");
  return l(`Die gewählte Börse hat keine Kerzen in ${timeframe}. Möglich sind ${offered}.`, `The chosen exchange has no ${timeframe} candles. Available: ${offered}.`);
}

// packages/node-spec/src/message.ts
var PLACEHOLDERS = {
  kette: { alias: "chain", description: l("Name der Chain", "Name of the chain") },
  werte: { alias: "values", description: l("Werte der beteiligten Bausteine zum Zeitpunkt des Alarms", "Values of the involved nodes when it fired") },
  kurs: { alias: "price", description: l("Schlusskurs der Kerze", "Closing price of the candle") },
  paar: { alias: "pair", description: l("Handelspaar, etwa BTC/USDT", "Trading pair such as BTC/USDT") },
  coin: { description: l("Basiswährung, etwa BTC", "Base currency such as BTC") },
  boerse: { alias: "exchange", description: l("Börse der Kerze, etwa Binance", "Exchange of the candle such as Binance") },
  zeit: { alias: "time", description: l("Zeitpunkt des Kerzenschlusses", "Time of the candle close") },
  a: { description: l("Wert an Eingang A der Nachrichtenvorlage", "Value at input A of the message template") },
  b: { description: l("Wert an Eingang B", "Value at input B") },
  c: { description: l("Wert an Eingang C", "Value at input C") },
  d: { description: l("Wert an Eingang D", "Value at input D") }
};
var ALIASES = new Map(
  Object.entries(PLACEHOLDERS).flatMap(([name4, spec]) => [[name4, name4], ...spec.alias ? [[spec.alias, name4]] : []])
);
var PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;
function placeholderName(name4) {
  return ALIASES.get(name4.toLowerCase());
}
function templatePlaceholders(template) {
  return [...template.matchAll(PATTERN)].map((match) => match[1] ?? "");
}
function unknownPlaceholders(template) {
  return templatePlaceholders(template).filter((name4) => placeholderName(name4) === void 0);
}

// packages/node-spec/src/settings.ts
var SETTING_KEY_PATTERN = /^[a-z][a-zA-Z0-9]{0,31}$/;
var URL_PATTERN = /^https:\/\/[^\s/$.?#][^\s]*$/;
function checkSettingValue(spec, value) {
  switch (spec.type) {
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return { severity: "error", message: l("muss eine Zahl sein", "must be a number") };
      }
      if (spec.integer && !Number.isInteger(value)) {
        return { severity: "error", message: l("muss eine ganze Zahl sein", "must be a whole number") };
      }
      if (spec.min !== void 0 && value < spec.min) {
        return { severity: "error", message: l(`muss mindestens ${spec.min} sein`, `must be at least ${spec.min}`) };
      }
      if (spec.max !== void 0 && value > spec.max) {
        return { severity: "error", message: l(`darf höchstens ${spec.max} sein`, `must be at most ${spec.max}`) };
      }
      return null;
    }
    case "select": {
      if (typeof value !== "string" || !spec.options.some((option) => option.value === value)) {
        const allowed = spec.options.map((option) => option.value).join(", ");
        return { severity: "error", message: l(`muss einer dieser Werte sein: ${allowed}`, `must be one of: ${allowed}`) };
      }
      return null;
    }
    case "text": {
      if (typeof value !== "string") {
        return { severity: "error", message: l("muss ein Text sein", "must be text") };
      }
      if (spec.maxLength !== void 0 && value.length > spec.maxLength) {
        return { severity: "error", message: l(`ist länger als ${spec.maxLength} Zeichen`, `is longer than ${spec.maxLength} characters`) };
      }
      if (value === "") {
        if (spec.required) return { severity: "warning", message: l("muss noch ausgefüllt werden", "still needs a value") };
        return null;
      }
      if (spec.minLength !== void 0 && value.length < spec.minLength) {
        return { severity: "error", message: l(`braucht mindestens ${spec.minLength} Zeichen`, `needs at least ${spec.minLength} characters`) };
      }
      if (spec.pattern !== void 0 && !new RegExp(spec.pattern).test(value)) {
        return { severity: "error", message: l("hat nicht das erwartete Format", "does not have the expected format") };
      }
      if (spec.format === "timezone" && !isValidTimeZone(value)) {
        return { severity: "error", message: l("ist keine bekannte Zeitzone (etwa Europe/Berlin)", "is not a known time zone (such as Europe/Berlin)") };
      }
      if (spec.format === "url" && !URL_PATTERN.test(value)) {
        return { severity: "error", message: l("muss eine https-Adresse sein", "must be an https address") };
      }
      if (spec.format === "datetime" && parseUtcTime(value) === void 0) {
        return { severity: "error", message: l("ist kein Zeitpunkt in UTC (etwa 2026-10-14T08:00:00Z)", "is not a time in UTC (such as 2026-10-14T08:00:00Z)") };
      }
      return null;
    }
  }
}
function normalizeSettings(spec, raw) {
  const values = {};
  const issues = [];
  const input = raw ?? {};
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(spec, key)) {
      issues.push({
        key,
        code: "unknown-setting",
        severity: "error",
        message: l(`unbekannte Einstellung „${key}“`, `unknown setting "${key}"`)
      });
    }
  }
  for (const [key, setting] of Object.entries(spec)) {
    const value = Object.hasOwn(input, key) ? input[key] : setting.default;
    const problem = checkSettingValue(setting, value);
    if (problem && problem.severity === "error") {
      issues.push({ key, code: "invalid-setting", ...problem });
      values[key] = setting.default;
    } else {
      if (problem) issues.push({ key, code: "required-setting", ...problem });
      values[key] = value;
    }
  }
  return { values, issues };
}

// packages/node-spec/src/define.ts
var NODE_ID_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;
var PIN_ID_PATTERN = /^[a-z][a-zA-Z0-9]{0,31}$/;
var SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
var MAX_VARIADIC_PINS = 16;
var NodeDefinitionError = class extends Error {
  nodeId;
  problems;
  constructor(nodeId, problems) {
    super(`Ungültige Node-Definition ${nodeId || "(ohne id)"}:
- ${problems.join("\n- ")}`);
    this.name = "NodeDefinitionError";
    this.nodeId = nodeId;
    this.problems = problems;
  }
};
function expandInputs(definition) {
  const pins = [];
  for (const spec of definition.inputs) {
    if (spec.variadic) {
      for (let index = 0; index < spec.variadic.max; index++) pins.push({ name: `${spec.id}${index}`, spec, index });
    } else {
      pins.push({ name: spec.id, spec });
    }
  }
  return pins;
}
function findInputPin(definition, name4) {
  return expandInputs(definition).find((pin) => pin.name === name4);
}
function findOutputPin(definition, name4) {
  return definition.outputs.find((pin) => pin.id === name4);
}
function checkLocalized(problems, where, value, required = true) {
  if (value === void 0 && !required) return;
  const missing = missingLocales(value);
  if (missing.length > 0) problems.push(`${where}: Text fehlt auf ${missing.join(", ")}`);
}
function checkPins(problems, kind, pins) {
  if (!Array.isArray(pins)) {
    problems.push(`${kind} muss eine Liste sein`);
    return;
  }
  const names = /* @__PURE__ */ new Set();
  for (const pin of pins) {
    const where = `${kind}.${pin.id}`;
    if (!PIN_ID_PATTERN.test(pin.id)) problems.push(`${where}: ungültige Pin-id`);
    if (!PIN_TYPES.includes(pin.type)) problems.push(`${where}: unbekannter Pin-Typ ${String(pin.type)}`);
    checkLocalized(problems, `${where}.label`, pin.label);
    const concrete = [];
    if ("variadic" in pin && pin.variadic) {
      const { min, max } = pin.variadic;
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 1 || min > max || max > MAX_VARIADIC_PINS) {
        problems.push(`${where}: variadic braucht ganze Zahlen 0 ≤ min ≤ max, 1 ≤ max ≤ ${MAX_VARIADIC_PINS}`);
      }
      if (pin.optional) problems.push(`${where}: mitwachsende Eingänge sind immer optional, optional weglassen`);
      for (let index = 0; index < Math.min(max, MAX_VARIADIC_PINS); index++) concrete.push(`${pin.id}${index}`);
    } else {
      concrete.push(pin.id);
    }
    for (const name4 of concrete) {
      if (names.has(name4)) problems.push(`${kind}: Pin ${name4} ist doppelt`);
      names.add(name4);
    }
  }
}
function checkSettings(problems, settings, inputs2) {
  if (typeof settings !== "object" || settings === null) {
    problems.push("settings muss ein Objekt sein");
    return;
  }
  for (const [key, spec] of Object.entries(settings)) {
    const where = `settings.${key}`;
    if (!SETTING_KEY_PATTERN.test(key)) problems.push(`${where}: ungültiger Name`);
    checkLocalized(problems, `${where}.label`, spec.label);
    checkLocalized(problems, `${where}.help`, spec.help, false);
    if (spec.type === "number") {
      if (spec.min !== void 0 && spec.max !== void 0 && spec.min > spec.max) problems.push(`${where}: min ist größer als max`);
      checkLocalized(problems, `${where}.unit`, spec.unit, false);
      if (spec.input !== void 0) {
        const pin = Array.isArray(inputs2) ? inputs2.find((input) => input.id === spec.input) : void 0;
        if (!pin || pin.type !== "series" || !pin.optional || pin.variadic) problems.push(`${where}: input braucht einen optionalen Eingang vom Typ series`);
      }
    } else if (spec.type === "select") {
      if (!Array.isArray(spec.options) || spec.options.length === 0) {
        problems.push(`${where}: Auswahl ohne Optionen`);
      } else {
        const values = /* @__PURE__ */ new Set();
        for (const option of spec.options) {
          if (typeof option.value !== "string" || option.value === "") problems.push(`${where}: Option ohne Wert`);
          if (values.has(option.value)) problems.push(`${where}: Option ${option.value} ist doppelt`);
          values.add(option.value);
          checkLocalized(problems, `${where}.options.${option.value}`, option.label);
          checkLocalized(problems, `${where}.options.${option.value}.help`, option.help, false);
        }
      }
    } else if (spec.type === "text") {
      if (spec.pattern !== void 0) {
        try {
          new RegExp(spec.pattern);
        } catch {
          problems.push(`${where}: pattern ist kein gültiger regulärer Ausdruck`);
        }
      }
      if (spec.secret && spec.default !== "") problems.push(`${where}: secret braucht einen leeren Standardwert`);
      checkLocalized(problems, `${where}.placeholder`, spec.placeholder, false);
    } else {
      problems.push(`${where}: unbekannter Typ ${String(spec.type)}`);
      continue;
    }
    const problem = checkSettingValue(spec, spec.default);
    if (problem && problem.severity === "error") problems.push(`${where}: Standardwert ${problem.message.de}`);
  }
}
function checkBehaviour(problems, def) {
  const hasCompute = typeof def.compute === "function";
  const hasState = def.state !== void 0;
  if (hasCompute && hasState) problems.push("compute und state schließen sich aus");
  if (hasState && (typeof def.state?.init !== "function" || typeof def.state?.step !== "function")) {
    problems.push("state braucht init() und step()");
  }
  if (def.category === "act") {
    if (!def.effect) problems.push("Aktionen brauchen effect");
    if (def.outputs.length > 0) problems.push("Aktionen haben keine Ausgänge");
    if (hasCompute || hasState) problems.push("Aktionen rechnen nicht, sie deklarieren nur einen Effekt");
    const trigger = def.inputs.find((pin) => pin.id === "in");
    if (!trigger || trigger.type !== "signal" || trigger.optional || trigger.variadic) {
      problems.push("Aktionen brauchen den Pflicht-Eingang in vom Typ signal");
    }
    const cooldown3 = def.settings["cooldown"];
    if (cooldown3 && cooldown3.type !== "number") problems.push("settings.cooldown muss eine Zahl (Stunden) sein");
  } else if (def.effect) {
    problems.push("nur Aktionen (category act) dürfen effect haben");
  }
  if (def.effect) {
    if (def.effect.kind === "notify" && !NOTIFY_CHANNELS.includes(def.effect.channel)) {
      problems.push(`effect.channel ${String(def.effect.channel)} ist unbekannt`);
    } else if (def.effect.kind !== "notify" && def.effect.kind !== "log") {
      problems.push(`effect.kind ${String(def.effect.kind)} ist unbekannt`);
    }
  }
  if (def.outputs.length > 0 && !hasCompute && !hasState) problems.push("Nodes mit Ausgängen brauchen compute() oder state");
  if (def.source) {
    if (def.source.kind === "candles" && typeof def.source.market !== "function") problems.push("source candles braucht market()");
    if (def.source.kind !== "candles" && def.source.kind !== "manual") problems.push("source.kind ist unbekannt");
    if (!hasCompute) problems.push("Quellen brauchen compute()");
  }
}
function checkVisual(problems, def) {
  const visual = def.visual;
  if (visual === void 0) return;
  const seriesPin = (ref, where) => {
    const pin = ref && "input" in ref ? def.inputs.find((input) => input.id === ref.input && !input.variadic) : ref && "output" in ref ? def.outputs.find((output) => output.id === ref.output) : void 0;
    if (!pin || pin.type !== "series") problems.push(`visual.${where}: braucht einen Eingang oder Ausgang vom Typ series`);
  };
  const numberSetting = (key, where) => {
    const spec = key === void 0 ? void 0 : def.settings[key];
    if (!spec || spec.type !== "number") problems.push(`visual.${where}: braucht eine Zahl-Einstellung`);
    return spec?.type === "number" ? spec : void 0;
  };
  const widthSetting = (key, positive) => {
    const width = numberSetting(key, "width");
    if (width && !(width.min !== void 0 && (positive ? width.min > 0 : width.min >= 0))) problems.push(`visual.width: Breite braucht min ${positive ? ">" : "≥"} 0`);
  };
  const optionalPin = (ref, where) => {
    if (ref !== void 0) seriesPin(ref, where);
  };
  if (visual.kind !== "levels" || visual.series !== void 0 || !visual.high || !visual.low) seriesPin(visual.series, "series");
  switch (visual.kind) {
    case "band":
      seriesPin(visual.line, "line");
      widthSetting(visual.width, false);
      break;
    case "zone":
      numberSetting(visual.low, "low");
      numberSetting(visual.high, "high");
      if (visual.low === visual.high) problems.push("visual: low und high brauchen zwei verschiedene Einstellungen");
      optionalPin(visual.price, "price");
      break;
    case "level":
      numberSetting(visual.level, "level");
      optionalPin(visual.price, "price");
      break;
    case "channel":
      seriesPin(visual.middle, "middle");
      seriesPin(visual.upper, "upper");
      seriesPin(visual.lower, "lower");
      widthSetting(visual.width, true);
      optionalPin(visual.high, "high");
      optionalPin(visual.low, "low");
      break;
    case "levels": {
      const levels = Array.isArray(visual.levels) ? visual.levels : [];
      if (levels.length === 0) problems.push("visual.levels: braucht mindestens einen Ausgang");
      for (const id of levels) if (def.outputs.find((output) => output.id === id)?.type !== "series") problems.push(`visual.levels: ${id} ist kein Ausgang vom Typ series`);
      if (new Set(levels).size !== levels.length) problems.push("visual.levels: Ausgänge doppelt");
      const level = def.settings[visual.level];
      if (!level || level.type !== "select") problems.push("visual.level: braucht eine Auswahl-Einstellung");
      else if (level.options.some((option) => !levels.includes(option.value))) problems.push("visual.level: jede Option muss ein Ausgang aus levels sein");
      widthSetting(visual.width, false);
      optionalPin(visual.high, "high");
      optionalPin(visual.low, "low");
      break;
    }
    case "factor": {
      seriesPin(visual.line, "line");
      const factor = numberSetting(visual.factor, "factor");
      if (factor && !(factor.min !== void 0 && factor.min >= 0)) problems.push("visual.factor: Faktor braucht min ≥ 0");
      break;
    }
    case "overlay":
      if (typeof visual.draw !== "function") problems.push("visual.draw: braucht eine Funktion");
      optionalPin(visual.lower, "lower");
      (visual.handles ?? []).forEach((handle, n) => {
        const where = `handles[${n}]`;
        if (handle.kind === "swing") {
          for (const key of [handle.left, handle.right]) {
            const spec = numberSetting(key, `${where}.${key === handle.left ? "left" : "right"}`);
            if (spec && !spec.integer) problems.push(`visual.${where}: Kerzen brauchen ganze Zahlen`);
          }
          if (handle.left === handle.right) problems.push(`visual.${where}: left und right brauchen zwei verschiedene Einstellungen`);
        } else if (handle.kind === "size" || handle.kind === "center") {
          const spec = numberSetting(handle.setting, `${where}.setting`);
          if (spec && !(spec.min !== void 0 && spec.min >= 0)) problems.push(`visual.${where}: braucht min ≥ 0`);
        } else {
          problems.push(`visual.${where}: Art ${String(handle.kind)} ist unbekannt`);
        }
      });
      break;
    case "line": {
      seriesPin(visual.line, "line");
      const points = Array.isArray(visual.points) ? visual.points : [];
      if (points.length !== 2) problems.push("visual.points: braucht genau zwei Punkte");
      points.forEach((point, n) => {
        const time = def.settings[point.time];
        if (!time || time.type !== "text" || time.format !== "datetime") problems.push(`visual.points[${n}].time: braucht eine Text-Einstellung im Format datetime`);
        numberSetting(point.value, `points[${n}].value`);
      });
      const keys = points.flatMap((point) => [point.time, point.value]);
      if (new Set(keys).size !== keys.length) problems.push("visual.points: Einstellungen doppelt");
      break;
    }
    default:
      problems.push(`visual.kind ${String(visual.kind)} ist unbekannt`);
  }
  if ("signal" in visual && visual.signal !== void 0) {
    const pins = typeof visual.signal === "string" ? [visual.signal] : Array.isArray(visual.signal) ? visual.signal : [void 0];
    if (pins.length === 0 || pins.some((pin) => def.outputs.find((output) => output.id === pin)?.type !== "signal")) problems.push("visual.signal: braucht einen Ausgang vom Typ signal");
  }
}
function checkTests(problems, def) {
  if (def.tests === void 0) return;
  const inputs2 = new Set(expandInputs(def).map((pin) => pin.name));
  const outputs = new Set(def.outputs.map((pin) => pin.id));
  def.tests.forEach((test, n) => {
    const where = `tests[${n}]`;
    if (typeof test.fixture !== "string" || test.fixture === "") problems.push(`${where}: fixture fehlt`);
    for (const key of Object.keys(test.settings ?? {})) {
      if (!Object.hasOwn(def.settings, key)) problems.push(`${where}: unbekannte Einstellung ${key}`);
    }
    for (const [pin, column] of Object.entries(test.inputs ?? {})) {
      if (!inputs2.has(pin)) problems.push(`${where}: unbekannter Eingang ${pin}`);
      if (!FIXTURE_COLUMNS.includes(column)) problems.push(`${where}: unbekannte Spalte ${column}`);
    }
    const expectations = [test.expectLast ?? {}, ...Object.values(test.expectAt ?? {})];
    if (expectations.every((e) => Object.keys(e).length === 0)) problems.push(`${where}: erwartet nichts`);
    for (const expectation of expectations) {
      for (const pin of Object.keys(expectation)) if (!outputs.has(pin)) problems.push(`${where}: unbekannter Ausgang ${pin}`);
    }
    if (test.tolerance !== void 0 && !(test.tolerance >= 0)) problems.push(`${where}: tolerance muss ≥ 0 sein`);
  });
}
function checkNodeDefinition(def) {
  const problems = [];
  if (typeof def.id !== "string" || !NODE_ID_PATTERN.test(def.id) || def.id.length > 64) {
    problems.push("id braucht einen Namensraum, etwa core.rsi oder community.hull-ma");
  }
  if (typeof def.version !== "string" || !SEMVER_PATTERN.test(def.version)) problems.push("version muss semver sein, etwa 1.0.0");
  if (!CATEGORIES.includes(def.category)) problems.push(`unbekannte category ${String(def.category)}`);
  checkLocalized(problems, "label", def.label);
  checkLocalized(problems, "description", def.description);
  checkLocalized(problems, "help", def.help, false);
  checkLocalized(problems, "technical", def.technical, false);
  if (def.keywords) {
    for (const locale of LOCALES) if (!Array.isArray(def.keywords[locale])) problems.push(`keywords.${locale} fehlt`);
  }
  checkPins(problems, "inputs", def.inputs);
  checkPins(problems, "outputs", def.outputs);
  checkSettings(problems, def.settings, def.inputs);
  checkBehaviour(problems, def);
  checkVisual(problems, def);
  checkTests(problems, def);
  if (def.permissions?.network?.some((domain) => typeof domain !== "string" || !/^[a-z0-9.-]+$/.test(domain))) {
    problems.push("permissions.network darf nur Domains enthalten");
  }
  return problems;
}
function defineNode(definition) {
  const problems = checkNodeDefinition(definition);
  if (problems.length > 0) throw new NodeDefinitionError(String(definition.id ?? ""), problems);
  return Object.freeze(definition);
}

// packages/node-spec/src/registry.ts
function parseSemver(version) {
  if (!SEMVER_PATTERN.test(version)) return void 0;
  const [core = "", prerelease = ""] = version.split("+")[0]?.split(/-(.*)/s) ?? [];
  const [major = 0, minor = 0, patch = 0] = core.split(".").map(Number);
  return { major, minor, patch, prerelease };
}
function compareSemver(a, b) {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) return a.localeCompare(b);
  if (x.major !== y.major) return x.major - y.major;
  if (x.minor !== y.minor) return x.minor - y.minor;
  if (x.patch !== y.patch) return x.patch - y.patch;
  if (x.prerelease === y.prerelease) return 0;
  if (x.prerelease === "") return 1;
  if (y.prerelease === "") return -1;
  return x.prerelease.localeCompare(y.prerelease);
}
var TYPE_REF_PATTERN = /^([a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+)(?:@(\d+(?:\.\d+){0,2}))?$/;
function parseTypeRef(ref) {
  const match = TYPE_REF_PATTERN.exec(ref);
  if (!match || match[1] === void 0) return void 0;
  return match[2] === void 0 ? { id: match[1] } : { id: match[1], pin: match[2] };
}
function matchesPin(version, pin) {
  if (pin === void 0) return true;
  const parsed = parseSemver(version);
  if (!parsed) return false;
  const parts = pin.split(".").map(Number);
  const actual = [parsed.major, parsed.minor, parsed.patch];
  return parts.every((part, i) => actual[i] === part);
}
var NodeRegistry = class _NodeRegistry {
  #byId = /* @__PURE__ */ new Map();
  constructor(definitions = []) {
    for (const definition of definitions) this.register(definition);
  }
  register(definition) {
    const problems = checkNodeDefinition(definition);
    if (problems.length > 0) throw new NodeDefinitionError(definition.id, problems);
    if (!NODE_ID_PATTERN.test(definition.id)) throw new NodeDefinitionError(definition.id, ["ungültige id"]);
    const versions = this.#byId.get(definition.id) ?? [];
    if (versions.some((existing) => existing.version === definition.version)) {
      throw new Error(`${definition.id}@${definition.version} ist schon registriert`);
    }
    versions.push(definition);
    versions.sort((a, b) => compareSemver(b.version, a.version));
    this.#byId.set(definition.id, versions);
    return this;
  }
  /**
   * Eine neue Registry mit allen Typen dieser Registry und zusätzlich den gegebenen, etwa den eigenen Bausteinen einer
   * Chain. Gibt es eine Kennung schon, gilt nur die neue Definition: Was eine Chain mitbringt, geht vor.
   */
  extend(definitions) {
    const next = new _NodeRegistry();
    for (const [id, versions] of this.#byId) next.#byId.set(id, [...versions]);
    for (const definition of definitions) {
      next.#byId.delete(definition.id);
      next.register(definition);
    }
    return next;
  }
  /** Löst `core.rsi`, `core.rsi@1` oder `core.rsi@1.0.0` auf. */
  resolve(ref) {
    const parsed = parseTypeRef(ref);
    if (!parsed) return void 0;
    const versions = this.#byId.get(parsed.id) ?? [];
    const candidates = versions.filter((d) => matchesPin(d.version, parsed.pin));
    return candidates.find((d) => parseSemver(d.version)?.prerelease === "") ?? candidates[0];
  }
  has(ref) {
    return this.resolve(ref) !== void 0;
  }
  /** Neueste Version jedes Node-Typs. */
  list() {
    return [...this.#byId.keys()].map((id) => this.resolve(id)).filter((d) => d !== void 0);
  }
  /** Alle registrierten Versionen. */
  all() {
    return [...this.#byId.values()].flat();
  }
};

// packages/node-spec/src/chain-schema-validator.js
var chain_schema_validator_default = validate20;
var schema31 = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "https://bellchain.app/schema/chain-1.json", "title": "Bellchain-Kette", "description": "Eine Rule Chain aus Nodes und Verbindungen. Version 1 des Kettenformats.", "type": "object", "required": ["name", "version", "nodes", "edges"], "additionalProperties": false, "properties": { "$schema": { "type": "string", "description": "Optionaler Verweis auf dieses Schema, für Editoren." }, "name": { "type": "string", "minLength": 1, "maxLength": 120, "description": "Name der Kette, erscheint in Nachrichten als {{kette}}." }, "version": { "const": 1, "description": "Version des Kettenformats." }, "description": { "type": "string", "maxLength": 2e3 }, "meta": { "$ref": "#/$defs/meta" }, "pauseAfterAlert": { "type": "boolean", "description": "Einmalig: Nach dem ersten Alarm pausiert die Kette, etwa bei einem Preisalarm. Aktivieren schaltet sie wieder scharf." }, "scanner": { "$ref": "#/$defs/scanner" }, "nodes": { "type": "array", "maxItems": 200, "items": { "$ref": "#/$defs/node" } }, "edges": { "type": "array", "maxItems": 1e3, "items": { "$ref": "#/$defs/edge" } }, "customNodes": { "type": "array", "maxItems": 20, "description": "Eigene Bausteine, die diese Kette nutzt. Nodes verweisen mit ihrer id (custom.…) darauf.", "items": { "$ref": "#/$defs/customNode" } } }, "$defs": { "nodeId": { "type": "string", "pattern": "^[A-Za-z][A-Za-z0-9_-]{0,31}$", "description": "Eindeutig innerhalb der Kette, ohne Punkt." }, "nodeType": { "type": "string", "pattern": "^[a-z][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)+(@[0-9]+(\\.[0-9]+){0,2})?$", "description": "Node-Typ mit Namensraum, optional mit festgehaltener Version: core.rsi oder core.rsi@1." }, "scanner": { "type": "object", "required": ["node"], "additionalProperties": false, "description": "Scanner: Die Kette läuft für jeden Coin einmal, die Kerze „node“ bekommt dabei sein Paar. Börse und Zeiteinheit bleiben die der Kerze. Die Coins sind entweder eine eigene Liste („pairs“) oder Top N nach Volumen („top“).", "properties": { "node": { "$ref": "#/$defs/nodeId" }, "pairs": { "type": "array", "minItems": 1, "maxItems": 100, "items": { "type": "string", "pattern": "^[A-Z0-9]{1,15}/[A-Z0-9]{2,10}$", "description": "Handelspaar wie in der Kerze, etwa ETH/USDT." } }, "top": { "type": "object", "required": ["count", "quote"], "additionalProperties": false, "description": "Top N nach Volumen: die „count“ Paare mit dem höchsten Umsatz der letzten 24 Stunden gegen „quote“ an der Börse der Kerze, ohne Stablecoins, Gold-, Hebel- und Aktien-Token. Die Liste kommt jeden Tag um 00:05 UTC neu.", "properties": { "count": { "type": "integer", "minimum": 1, "maximum": 100 }, "quote": { "type": "string", "pattern": "^[A-Z0-9]{2,10}$", "description": "Gegenwährung wie im Paar, etwa USDT." } } } }, "oneOf": [{ "type": "object", "required": ["pairs"], "properties": { "pairs": true } }, { "type": "object", "required": ["top"], "properties": { "top": true } }] }, "pinRef": { "type": "string", "pattern": "^[A-Za-z][A-Za-z0-9_-]{0,31}\\.[a-z][A-Za-z0-9]{0,31}$", "description": "Node und Pin als id.pin, etwa c1.close." }, "localized": { "type": "object", "additionalProperties": false, "properties": { "de": { "type": "string", "maxLength": 2e3 }, "en": { "type": "string", "maxLength": 2e3 } } }, "meta": { "type": "object", "additionalProperties": false, "description": "Angaben für die Vorlagen-Galerie.", "properties": { "title": { "$ref": "#/$defs/localized" }, "description": { "$ref": "#/$defs/localized" }, "tags": { "type": "array", "maxItems": 12, "items": { "type": "string", "minLength": 1, "maxLength": 40 } }, "author": { "type": "string", "maxLength": 80 }, "source": { "type": "string", "maxLength": 200 }, "notes": { "type": "object", "description": "Text der Notizen je Sprache, nach Node-id. Wer die Vorlage verwendet, bekommt ihn als settings.text in der Sprache der Oberfläche.", "maxProperties": 200, "propertyNames": { "$ref": "#/$defs/nodeId" }, "additionalProperties": { "$ref": "#/$defs/localized" } }, "messages": { "type": "object", "description": "Nachricht je Sprache, nach Node-id: settings.message einer Aktion oder settings.text einer Nachrichtenvorlage. Wer die Vorlage verwendet, bekommt sie in der Sprache der Oberfläche.", "maxProperties": 200, "propertyNames": { "$ref": "#/$defs/nodeId" }, "additionalProperties": { "$ref": "#/$defs/localized" } }, "tips": { "type": "array", "description": "Tipps zum Anpassen der Vorlage, je Sprache.", "maxItems": 8, "items": { "$ref": "#/$defs/localized" } }, "test": { "type": "object", "description": "Replay mit den Beispielkursen: so viele Alarme in so vielen Tagen bis zum Ende der Beispielkurse (Datum, UTC).", "required": ["alerts", "days", "until"], "additionalProperties": false, "properties": { "alerts": { "type": "integer", "minimum": 0, "maximum": 1e6 }, "days": { "type": "integer", "minimum": 1, "maximum": 3650 }, "until": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" } } } } }, "node": { "type": "object", "required": ["id", "type", "position", "settings"], "additionalProperties": false, "properties": { "id": { "$ref": "#/$defs/nodeId" }, "type": { "$ref": "#/$defs/nodeType" }, "position": { "type": "object", "required": ["x", "y"], "additionalProperties": false, "properties": { "x": { "type": "number" }, "y": { "type": "number" } } }, "settings": { "type": "object", "propertyNames": { "pattern": "^[a-z][a-zA-Z0-9]{0,31}$" }, "additionalProperties": { "type": ["number", "string", "boolean"] } } } }, "edge": { "type": "object", "required": ["from", "to"], "additionalProperties": false, "properties": { "from": { "$ref": "#/$defs/pinRef" }, "to": { "$ref": "#/$defs/pinRef" } } }, "text": { "description": "Text in einer Sprache oder in beiden; fehlt eine, gilt die andere.", "oneOf": [{ "type": "string", "maxLength": 1500 }, { "$ref": "#/$defs/localized" }] }, "customPinId": { "type": "string", "pattern": "^[a-z][a-zA-Z0-9]{0,31}$", "description": "Name, unter dem Formeln den Eingang, die Einstellung oder den Ausgang lesen." }, "customPinType": { "enum": ["price", "number", "signal"], "description": "price = Kursreihe, number = Zahl, signal = wahr/falsch." }, "customInput": { "type": "object", "required": ["id", "type"], "additionalProperties": false, "properties": { "id": { "$ref": "#/$defs/customPinId" }, "type": { "$ref": "#/$defs/customPinType" }, "label": { "$ref": "#/$defs/text" } } }, "customSetting": { "type": "object", "required": ["id", "default"], "additionalProperties": false, "description": "Eine Zahl, die man auf dem Board einstellt, etwa die Länge in Kerzen.", "properties": { "id": { "$ref": "#/$defs/customPinId" }, "label": { "$ref": "#/$defs/text" }, "help": { "$ref": "#/$defs/text" }, "default": { "type": "number" }, "min": { "type": "number" }, "max": { "type": "number" }, "step": { "type": "number" }, "integer": { "type": "boolean" } } }, "customOutput": { "type": "object", "required": ["id", "type", "formula"], "additionalProperties": false, "properties": { "id": { "$ref": "#/$defs/customPinId" }, "type": { "$ref": "#/$defs/customPinType" }, "label": { "$ref": "#/$defs/text" }, "unit": { "const": "percent" }, "formula": { "type": "string", "minLength": 1, "maxLength": 1e3, "description": "Formel, etwa (price - ema(price, length)) / ema(price, length) * 100" } } }, "customNode": { "type": "object", "required": ["id", "version", "label", "inputs", "outputs"], "additionalProperties": false, "description": "Ein eigener Baustein: Eingänge, Einstellungen und Ausgänge mit Formeln. Format 1, siehe docs/node-spec.md.", "properties": { "$schema": { "type": "string" }, "format": { "const": 1 }, "id": { "type": "string", "pattern": "^custom\\.[a-z0-9][a-z0-9-]{0,47}$" }, "version": { "type": "string", "maxLength": 40 }, "label": { "$ref": "#/$defs/text" }, "description": { "$ref": "#/$defs/text" }, "help": { "$ref": "#/$defs/text" }, "sentence": { "$ref": "#/$defs/text" }, "category": { "enum": ["ind", "cond", "logic"] }, "icon": { "type": "string", "pattern": "^[a-z0-9-]{1,40}$" }, "author": { "type": "string", "maxLength": 80 }, "inputs": { "type": "array", "maxItems": 8, "items": { "$ref": "#/$defs/customInput" } }, "settings": { "type": "array", "maxItems": 8, "items": { "$ref": "#/$defs/customSetting" } }, "outputs": { "type": "array", "minItems": 1, "maxItems": 8, "items": { "$ref": "#/$defs/customOutput" } } } } } };
var func1 = Object.prototype.hasOwnProperty;
var func2 = ucs2length;
var schema32 = { "type": "object", "additionalProperties": false, "description": "Angaben für die Vorlagen-Galerie.", "properties": { "title": { "$ref": "#/$defs/localized" }, "description": { "$ref": "#/$defs/localized" }, "tags": { "type": "array", "maxItems": 12, "items": { "type": "string", "minLength": 1, "maxLength": 40 } }, "author": { "type": "string", "maxLength": 80 }, "source": { "type": "string", "maxLength": 200 }, "notes": { "type": "object", "description": "Text der Notizen je Sprache, nach Node-id. Wer die Vorlage verwendet, bekommt ihn als settings.text in der Sprache der Oberfläche.", "maxProperties": 200, "propertyNames": { "$ref": "#/$defs/nodeId" }, "additionalProperties": { "$ref": "#/$defs/localized" } }, "messages": { "type": "object", "description": "Nachricht je Sprache, nach Node-id: settings.message einer Aktion oder settings.text einer Nachrichtenvorlage. Wer die Vorlage verwendet, bekommt sie in der Sprache der Oberfläche.", "maxProperties": 200, "propertyNames": { "$ref": "#/$defs/nodeId" }, "additionalProperties": { "$ref": "#/$defs/localized" } }, "tips": { "type": "array", "description": "Tipps zum Anpassen der Vorlage, je Sprache.", "maxItems": 8, "items": { "$ref": "#/$defs/localized" } }, "test": { "type": "object", "description": "Replay mit den Beispielkursen: so viele Alarme in so vielen Tagen bis zum Ende der Beispielkurse (Datum, UTC).", "required": ["alerts", "days", "until"], "additionalProperties": false, "properties": { "alerts": { "type": "integer", "minimum": 0, "maximum": 1e6 }, "days": { "type": "integer", "minimum": 1, "maximum": 3650 }, "until": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" } } } } };
var pattern4 = new RegExp("^[A-Za-z][A-Za-z0-9_-]{0,31}$", "u");
var pattern6 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$", "u");
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate21.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      if (!func1.call(schema32.properties, key0)) {
        const err0 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
    if (data.title !== void 0) {
      let data0 = data.title;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          if (!(key1 === "de" || key1 === "en")) {
            const err1 = { instancePath: instancePath + "/title", schemaPath: "#/$defs/localized/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
        }
        if (data0.de !== void 0) {
          let data1 = data0.de;
          if (typeof data1 === "string") {
            if (func2(data1) > 2e3) {
              const err2 = { instancePath: instancePath + "/title/de", schemaPath: "#/$defs/localized/properties/de/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          } else {
            const err3 = { instancePath: instancePath + "/title/de", schemaPath: "#/$defs/localized/properties/de/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
        }
        if (data0.en !== void 0) {
          let data2 = data0.en;
          if (typeof data2 === "string") {
            if (func2(data2) > 2e3) {
              const err4 = { instancePath: instancePath + "/title/en", schemaPath: "#/$defs/localized/properties/en/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          } else {
            const err5 = { instancePath: instancePath + "/title/en", schemaPath: "#/$defs/localized/properties/en/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
      } else {
        const err6 = { instancePath: instancePath + "/title", schemaPath: "#/$defs/localized/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.description !== void 0) {
      let data3 = data.description;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        for (const key2 in data3) {
          if (!(key2 === "de" || key2 === "en")) {
            const err7 = { instancePath: instancePath + "/description", schemaPath: "#/$defs/localized/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
        if (data3.de !== void 0) {
          let data4 = data3.de;
          if (typeof data4 === "string") {
            if (func2(data4) > 2e3) {
              const err8 = { instancePath: instancePath + "/description/de", schemaPath: "#/$defs/localized/properties/de/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
          } else {
            const err9 = { instancePath: instancePath + "/description/de", schemaPath: "#/$defs/localized/properties/de/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
        }
        if (data3.en !== void 0) {
          let data5 = data3.en;
          if (typeof data5 === "string") {
            if (func2(data5) > 2e3) {
              const err10 = { instancePath: instancePath + "/description/en", schemaPath: "#/$defs/localized/properties/en/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
          } else {
            const err11 = { instancePath: instancePath + "/description/en", schemaPath: "#/$defs/localized/properties/en/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
      } else {
        const err12 = { instancePath: instancePath + "/description", schemaPath: "#/$defs/localized/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.tags !== void 0) {
      let data6 = data.tags;
      if (Array.isArray(data6)) {
        if (data6.length > 12) {
          const err13 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/maxItems", keyword: "maxItems", params: { limit: 12 }, message: "must NOT have more than 12 items" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        const len0 = data6.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data7 = data6[i0];
          if (typeof data7 === "string") {
            if (func2(data7) > 40) {
              const err14 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/maxLength", keyword: "maxLength", params: { limit: 40 }, message: "must NOT have more than 40 characters" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func2(data7) < 1) {
              const err15 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
      } else {
        const err17 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.author !== void 0) {
      let data8 = data.author;
      if (typeof data8 === "string") {
        if (func2(data8) > 80) {
          const err18 = { instancePath: instancePath + "/author", schemaPath: "#/properties/author/maxLength", keyword: "maxLength", params: { limit: 80 }, message: "must NOT have more than 80 characters" };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
      } else {
        const err19 = { instancePath: instancePath + "/author", schemaPath: "#/properties/author/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
    if (data.source !== void 0) {
      let data9 = data.source;
      if (typeof data9 === "string") {
        if (func2(data9) > 200) {
          const err20 = { instancePath: instancePath + "/source", schemaPath: "#/properties/source/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
      } else {
        const err21 = { instancePath: instancePath + "/source", schemaPath: "#/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
    if (data.notes !== void 0) {
      let data10 = data.notes;
      if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
        if (Object.keys(data10).length > 200) {
          const err22 = { instancePath: instancePath + "/notes", schemaPath: "#/properties/notes/maxProperties", keyword: "maxProperties", params: { limit: 200 }, message: "must NOT have more than 200 properties" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
        for (const key3 in data10) {
          const _errs28 = errors;
          if (typeof key3 === "string") {
            if (!pattern4.test(key3)) {
              const err23 = { instancePath: instancePath + "/notes", schemaPath: "#/$defs/nodeId/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z][A-Za-z0-9_-]{0,31}$" }, message: 'must match pattern "^[A-Za-z][A-Za-z0-9_-]{0,31}$"', propertyName: key3 };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
          } else {
            const err24 = { instancePath: instancePath + "/notes", schemaPath: "#/$defs/nodeId/type", keyword: "type", params: { type: "string" }, message: "must be string", propertyName: key3 };
            if (vErrors === null) {
              vErrors = [err24];
            } else {
              vErrors.push(err24);
            }
            errors++;
          }
          var valid7 = _errs28 === errors;
          if (!valid7) {
            const err25 = { instancePath: instancePath + "/notes", schemaPath: "#/properties/notes/propertyNames", keyword: "propertyNames", params: { propertyName: key3 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
        for (const key4 in data10) {
          let data11 = data10[key4];
          if (data11 && typeof data11 == "object" && !Array.isArray(data11)) {
            for (const key5 in data11) {
              if (!(key5 === "de" || key5 === "en")) {
                const err26 = { instancePath: instancePath + "/notes/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/localized/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key5 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
            }
            if (data11.de !== void 0) {
              let data12 = data11.de;
              if (typeof data12 === "string") {
                if (func2(data12) > 2e3) {
                  const err27 = { instancePath: instancePath + "/notes/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/de", schemaPath: "#/$defs/localized/properties/de/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
              } else {
                const err28 = { instancePath: instancePath + "/notes/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/de", schemaPath: "#/$defs/localized/properties/de/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
            }
            if (data11.en !== void 0) {
              let data13 = data11.en;
              if (typeof data13 === "string") {
                if (func2(data13) > 2e3) {
                  const err29 = { instancePath: instancePath + "/notes/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/en", schemaPath: "#/$defs/localized/properties/en/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
                  if (vErrors === null) {
                    vErrors = [err29];
                  } else {
                    vErrors.push(err29);
                  }
                  errors++;
                }
              } else {
                const err30 = { instancePath: instancePath + "/notes/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/en", schemaPath: "#/$defs/localized/properties/en/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err30];
                } else {
                  vErrors.push(err30);
                }
                errors++;
              }
            }
          } else {
            const err31 = { instancePath: instancePath + "/notes/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/localized/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err31];
            } else {
              vErrors.push(err31);
            }
            errors++;
          }
        }
      } else {
        const err32 = { instancePath: instancePath + "/notes", schemaPath: "#/properties/notes/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
    }
    if (data.messages !== void 0) {
      let data14 = data.messages;
      if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
        if (Object.keys(data14).length > 200) {
          const err33 = { instancePath: instancePath + "/messages", schemaPath: "#/properties/messages/maxProperties", keyword: "maxProperties", params: { limit: 200 }, message: "must NOT have more than 200 properties" };
          if (vErrors === null) {
            vErrors = [err33];
          } else {
            vErrors.push(err33);
          }
          errors++;
        }
        for (const key6 in data14) {
          const _errs42 = errors;
          if (typeof key6 === "string") {
            if (!pattern4.test(key6)) {
              const err34 = { instancePath: instancePath + "/messages", schemaPath: "#/$defs/nodeId/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z][A-Za-z0-9_-]{0,31}$" }, message: 'must match pattern "^[A-Za-z][A-Za-z0-9_-]{0,31}$"', propertyName: key6 };
              if (vErrors === null) {
                vErrors = [err34];
              } else {
                vErrors.push(err34);
              }
              errors++;
            }
          } else {
            const err35 = { instancePath: instancePath + "/messages", schemaPath: "#/$defs/nodeId/type", keyword: "type", params: { type: "string" }, message: "must be string", propertyName: key6 };
            if (vErrors === null) {
              vErrors = [err35];
            } else {
              vErrors.push(err35);
            }
            errors++;
          }
          var valid12 = _errs42 === errors;
          if (!valid12) {
            const err36 = { instancePath: instancePath + "/messages", schemaPath: "#/properties/messages/propertyNames", keyword: "propertyNames", params: { propertyName: key6 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err36];
            } else {
              vErrors.push(err36);
            }
            errors++;
          }
        }
        for (const key7 in data14) {
          let data15 = data14[key7];
          if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
            for (const key8 in data15) {
              if (!(key8 === "de" || key8 === "en")) {
                const err37 = { instancePath: instancePath + "/messages/" + key7.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/localized/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key8 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err37];
                } else {
                  vErrors.push(err37);
                }
                errors++;
              }
            }
            if (data15.de !== void 0) {
              let data16 = data15.de;
              if (typeof data16 === "string") {
                if (func2(data16) > 2e3) {
                  const err38 = { instancePath: instancePath + "/messages/" + key7.replace(/~/g, "~0").replace(/\//g, "~1") + "/de", schemaPath: "#/$defs/localized/properties/de/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
                  if (vErrors === null) {
                    vErrors = [err38];
                  } else {
                    vErrors.push(err38);
                  }
                  errors++;
                }
              } else {
                const err39 = { instancePath: instancePath + "/messages/" + key7.replace(/~/g, "~0").replace(/\//g, "~1") + "/de", schemaPath: "#/$defs/localized/properties/de/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err39];
                } else {
                  vErrors.push(err39);
                }
                errors++;
              }
            }
            if (data15.en !== void 0) {
              let data17 = data15.en;
              if (typeof data17 === "string") {
                if (func2(data17) > 2e3) {
                  const err40 = { instancePath: instancePath + "/messages/" + key7.replace(/~/g, "~0").replace(/\//g, "~1") + "/en", schemaPath: "#/$defs/localized/properties/en/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
                  if (vErrors === null) {
                    vErrors = [err40];
                  } else {
                    vErrors.push(err40);
                  }
                  errors++;
                }
              } else {
                const err41 = { instancePath: instancePath + "/messages/" + key7.replace(/~/g, "~0").replace(/\//g, "~1") + "/en", schemaPath: "#/$defs/localized/properties/en/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err41];
                } else {
                  vErrors.push(err41);
                }
                errors++;
              }
            }
          } else {
            const err42 = { instancePath: instancePath + "/messages/" + key7.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/localized/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err42];
            } else {
              vErrors.push(err42);
            }
            errors++;
          }
        }
      } else {
        const err43 = { instancePath: instancePath + "/messages", schemaPath: "#/properties/messages/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err43];
        } else {
          vErrors.push(err43);
        }
        errors++;
      }
    }
    if (data.tips !== void 0) {
      let data18 = data.tips;
      if (Array.isArray(data18)) {
        if (data18.length > 8) {
          const err44 = { instancePath: instancePath + "/tips", schemaPath: "#/properties/tips/maxItems", keyword: "maxItems", params: { limit: 8 }, message: "must NOT have more than 8 items" };
          if (vErrors === null) {
            vErrors = [err44];
          } else {
            vErrors.push(err44);
          }
          errors++;
        }
        const len1 = data18.length;
        for (let i1 = 0; i1 < len1; i1++) {
          let data19 = data18[i1];
          if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
            for (const key9 in data19) {
              if (!(key9 === "de" || key9 === "en")) {
                const err45 = { instancePath: instancePath + "/tips/" + i1, schemaPath: "#/$defs/localized/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key9 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err45];
                } else {
                  vErrors.push(err45);
                }
                errors++;
              }
            }
            if (data19.de !== void 0) {
              let data20 = data19.de;
              if (typeof data20 === "string") {
                if (func2(data20) > 2e3) {
                  const err46 = { instancePath: instancePath + "/tips/" + i1 + "/de", schemaPath: "#/$defs/localized/properties/de/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
                  if (vErrors === null) {
                    vErrors = [err46];
                  } else {
                    vErrors.push(err46);
                  }
                  errors++;
                }
              } else {
                const err47 = { instancePath: instancePath + "/tips/" + i1 + "/de", schemaPath: "#/$defs/localized/properties/de/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err47];
                } else {
                  vErrors.push(err47);
                }
                errors++;
              }
            }
            if (data19.en !== void 0) {
              let data21 = data19.en;
              if (typeof data21 === "string") {
                if (func2(data21) > 2e3) {
                  const err48 = { instancePath: instancePath + "/tips/" + i1 + "/en", schemaPath: "#/$defs/localized/properties/en/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
                  if (vErrors === null) {
                    vErrors = [err48];
                  } else {
                    vErrors.push(err48);
                  }
                  errors++;
                }
              } else {
                const err49 = { instancePath: instancePath + "/tips/" + i1 + "/en", schemaPath: "#/$defs/localized/properties/en/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err49];
                } else {
                  vErrors.push(err49);
                }
                errors++;
              }
            }
          } else {
            const err50 = { instancePath: instancePath + "/tips/" + i1, schemaPath: "#/$defs/localized/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err50];
            } else {
              vErrors.push(err50);
            }
            errors++;
          }
        }
      } else {
        const err51 = { instancePath: instancePath + "/tips", schemaPath: "#/properties/tips/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err51];
        } else {
          vErrors.push(err51);
        }
        errors++;
      }
    }
    if (data.test !== void 0) {
      let data22 = data.test;
      if (data22 && typeof data22 == "object" && !Array.isArray(data22)) {
        if (data22.alerts === void 0) {
          const err52 = { instancePath: instancePath + "/test", schemaPath: "#/properties/test/required", keyword: "required", params: { missingProperty: "alerts" }, message: "must have required property 'alerts'" };
          if (vErrors === null) {
            vErrors = [err52];
          } else {
            vErrors.push(err52);
          }
          errors++;
        }
        if (data22.days === void 0) {
          const err53 = { instancePath: instancePath + "/test", schemaPath: "#/properties/test/required", keyword: "required", params: { missingProperty: "days" }, message: "must have required property 'days'" };
          if (vErrors === null) {
            vErrors = [err53];
          } else {
            vErrors.push(err53);
          }
          errors++;
        }
        if (data22.until === void 0) {
          const err54 = { instancePath: instancePath + "/test", schemaPath: "#/properties/test/required", keyword: "required", params: { missingProperty: "until" }, message: "must have required property 'until'" };
          if (vErrors === null) {
            vErrors = [err54];
          } else {
            vErrors.push(err54);
          }
          errors++;
        }
        for (const key10 in data22) {
          if (!(key10 === "alerts" || key10 === "days" || key10 === "until")) {
            const err55 = { instancePath: instancePath + "/test", schemaPath: "#/properties/test/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key10 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err55];
            } else {
              vErrors.push(err55);
            }
            errors++;
          }
        }
        if (data22.alerts !== void 0) {
          let data23 = data22.alerts;
          if (!(typeof data23 == "number" && (!(data23 % 1) && !isNaN(data23)) && isFinite(data23))) {
            const err56 = { instancePath: instancePath + "/test/alerts", schemaPath: "#/properties/test/properties/alerts/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err56];
            } else {
              vErrors.push(err56);
            }
            errors++;
          }
          if (typeof data23 == "number" && isFinite(data23)) {
            if (data23 > 1e6 || isNaN(data23)) {
              const err57 = { instancePath: instancePath + "/test/alerts", schemaPath: "#/properties/test/properties/alerts/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1e6 }, message: "must be <= 1000000" };
              if (vErrors === null) {
                vErrors = [err57];
              } else {
                vErrors.push(err57);
              }
              errors++;
            }
            if (data23 < 0 || isNaN(data23)) {
              const err58 = { instancePath: instancePath + "/test/alerts", schemaPath: "#/properties/test/properties/alerts/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err58];
              } else {
                vErrors.push(err58);
              }
              errors++;
            }
          }
        }
        if (data22.days !== void 0) {
          let data24 = data22.days;
          if (!(typeof data24 == "number" && (!(data24 % 1) && !isNaN(data24)) && isFinite(data24))) {
            const err59 = { instancePath: instancePath + "/test/days", schemaPath: "#/properties/test/properties/days/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err59];
            } else {
              vErrors.push(err59);
            }
            errors++;
          }
          if (typeof data24 == "number" && isFinite(data24)) {
            if (data24 > 3650 || isNaN(data24)) {
              const err60 = { instancePath: instancePath + "/test/days", schemaPath: "#/properties/test/properties/days/maximum", keyword: "maximum", params: { comparison: "<=", limit: 3650 }, message: "must be <= 3650" };
              if (vErrors === null) {
                vErrors = [err60];
              } else {
                vErrors.push(err60);
              }
              errors++;
            }
            if (data24 < 1 || isNaN(data24)) {
              const err61 = { instancePath: instancePath + "/test/days", schemaPath: "#/properties/test/properties/days/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err61];
              } else {
                vErrors.push(err61);
              }
              errors++;
            }
          }
        }
        if (data22.until !== void 0) {
          let data25 = data22.until;
          if (typeof data25 === "string") {
            if (!pattern6.test(data25)) {
              const err62 = { instancePath: instancePath + "/test/until", schemaPath: "#/properties/test/properties/until/pattern", keyword: "pattern", params: { pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" }, message: 'must match pattern "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"' };
              if (vErrors === null) {
                vErrors = [err62];
              } else {
                vErrors.push(err62);
              }
              errors++;
            }
          } else {
            const err63 = { instancePath: instancePath + "/test/until", schemaPath: "#/properties/test/properties/until/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err63];
            } else {
              vErrors.push(err63);
            }
            errors++;
          }
        }
      } else {
        const err64 = { instancePath: instancePath + "/test", schemaPath: "#/properties/test/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err64];
        } else {
          vErrors.push(err64);
        }
        errors++;
      }
    }
  } else {
    const err65 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err65];
    } else {
      vErrors.push(err65);
    }
    errors++;
  }
  validate21.errors = vErrors;
  return errors === 0;
}
validate21.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var pattern8 = new RegExp("^[A-Z0-9]{1,15}/[A-Z0-9]{2,10}$", "u");
var pattern9 = new RegExp("^[A-Z0-9]{2,10}$", "u");
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate23.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs1 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs2 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.pairs === void 0) {
      const err0 = { instancePath, schemaPath: "#/oneOf/0/required", keyword: "required", params: { missingProperty: "pairs" }, message: "must have required property 'pairs'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = {};
    props0.pairs = true;
  }
  const _errs4 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.top === void 0) {
      const err2 = { instancePath, schemaPath: "#/oneOf/1/required", keyword: "required", params: { missingProperty: "top" }, message: "must have required property 'top'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/oneOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  var _valid0 = _errs4 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = props0 || {};
        props0.top = true;
      }
    }
  }
  if (!valid0) {
    const err4 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  } else {
    errors = _errs1;
    if (vErrors !== null) {
      if (_errs1) {
        vErrors.length = _errs1;
      } else {
        vErrors = null;
      }
    }
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.node === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "node" }, message: "must have required property 'node'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "node" || key0 === "pairs" || key0 === "top")) {
        const err6 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.node !== void 0) {
      let data0 = data.node;
      if (typeof data0 === "string") {
        if (!pattern4.test(data0)) {
          const err7 = { instancePath: instancePath + "/node", schemaPath: "#/$defs/nodeId/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z][A-Za-z0-9_-]{0,31}$" }, message: 'must match pattern "^[A-Za-z][A-Za-z0-9_-]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/node", schemaPath: "#/$defs/nodeId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.pairs !== void 0) {
      let data1 = data.pairs;
      if (Array.isArray(data1)) {
        if (data1.length > 100) {
          const err9 = { instancePath: instancePath + "/pairs", schemaPath: "#/properties/pairs/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data1.length < 1) {
          const err10 = { instancePath: instancePath + "/pairs", schemaPath: "#/properties/pairs/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data2 = data1[i0];
          if (typeof data2 === "string") {
            if (!pattern8.test(data2)) {
              const err11 = { instancePath: instancePath + "/pairs/" + i0, schemaPath: "#/properties/pairs/items/pattern", keyword: "pattern", params: { pattern: "^[A-Z0-9]{1,15}/[A-Z0-9]{2,10}$" }, message: 'must match pattern "^[A-Z0-9]{1,15}/[A-Z0-9]{2,10}$"' };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
          } else {
            const err12 = { instancePath: instancePath + "/pairs/" + i0, schemaPath: "#/properties/pairs/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/pairs", schemaPath: "#/properties/pairs/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.top !== void 0) {
      let data3 = data.top;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        if (data3.count === void 0) {
          const err14 = { instancePath: instancePath + "/top", schemaPath: "#/properties/top/required", keyword: "required", params: { missingProperty: "count" }, message: "must have required property 'count'" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data3.quote === void 0) {
          const err15 = { instancePath: instancePath + "/top", schemaPath: "#/properties/top/required", keyword: "required", params: { missingProperty: "quote" }, message: "must have required property 'quote'" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        for (const key1 in data3) {
          if (!(key1 === "count" || key1 === "quote")) {
            const err16 = { instancePath: instancePath + "/top", schemaPath: "#/properties/top/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data3.count !== void 0) {
          let data4 = data3.count;
          if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
            const err17 = { instancePath: instancePath + "/top/count", schemaPath: "#/properties/top/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
          if (typeof data4 == "number" && isFinite(data4)) {
            if (data4 > 100 || isNaN(data4)) {
              const err18 = { instancePath: instancePath + "/top/count", schemaPath: "#/properties/top/properties/count/maximum", keyword: "maximum", params: { comparison: "<=", limit: 100 }, message: "must be <= 100" };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (data4 < 1 || isNaN(data4)) {
              const err19 = { instancePath: instancePath + "/top/count", schemaPath: "#/properties/top/properties/count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
          }
        }
        if (data3.quote !== void 0) {
          let data5 = data3.quote;
          if (typeof data5 === "string") {
            if (!pattern9.test(data5)) {
              const err20 = { instancePath: instancePath + "/top/quote", schemaPath: "#/properties/top/properties/quote/pattern", keyword: "pattern", params: { pattern: "^[A-Z0-9]{2,10}$" }, message: 'must match pattern "^[A-Z0-9]{2,10}$"' };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          } else {
            const err21 = { instancePath: instancePath + "/top/quote", schemaPath: "#/properties/top/properties/quote/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
      } else {
        const err22 = { instancePath: instancePath + "/top", schemaPath: "#/properties/top/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
  } else {
    const err23 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err23];
    } else {
      vErrors.push(err23);
    }
    errors++;
  }
  validate23.errors = vErrors;
  return errors === 0;
}
validate23.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema42 = { "type": "object", "required": ["id", "type", "position", "settings"], "additionalProperties": false, "properties": { "id": { "$ref": "#/$defs/nodeId" }, "type": { "$ref": "#/$defs/nodeType" }, "position": { "type": "object", "required": ["x", "y"], "additionalProperties": false, "properties": { "x": { "type": "number" }, "y": { "type": "number" } } }, "settings": { "type": "object", "propertyNames": { "pattern": "^[a-z][a-zA-Z0-9]{0,31}$" }, "additionalProperties": { "type": ["number", "string", "boolean"] } } } };
var pattern11 = new RegExp("^[a-z][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)+(@[0-9]+(\\.[0-9]+){0,2})?$", "u");
var pattern12 = new RegExp("^[a-z][a-zA-Z0-9]{0,31}$", "u");
function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate25.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.type === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.position === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "position" }, message: "must have required property 'position'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.settings === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "settings" }, message: "must have required property 'settings'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "type" || key0 === "position" || key0 === "settings")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (!pattern4.test(data0)) {
          const err5 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nodeId/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z][A-Za-z0-9_-]{0,31}$" }, message: 'must match pattern "^[A-Za-z][A-Za-z0-9_-]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nodeId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.type !== void 0) {
      let data1 = data.type;
      if (typeof data1 === "string") {
        if (!pattern11.test(data1)) {
          const err7 = { instancePath: instancePath + "/type", schemaPath: "#/$defs/nodeType/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)+(@[0-9]+(\\.[0-9]+){0,2})?$" }, message: 'must match pattern "^[a-z][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)+(@[0-9]+(\\.[0-9]+){0,2})?$"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/type", schemaPath: "#/$defs/nodeType/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.position !== void 0) {
      let data2 = data.position;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        if (data2.x === void 0) {
          const err9 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/required", keyword: "required", params: { missingProperty: "x" }, message: "must have required property 'x'" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data2.y === void 0) {
          const err10 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/required", keyword: "required", params: { missingProperty: "y" }, message: "must have required property 'y'" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data2) {
          if (!(key1 === "x" || key1 === "y")) {
            const err11 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
        if (data2.x !== void 0) {
          let data3 = data2.x;
          if (!(typeof data3 == "number" && isFinite(data3))) {
            const err12 = { instancePath: instancePath + "/position/x", schemaPath: "#/properties/position/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data2.y !== void 0) {
          let data4 = data2.y;
          if (!(typeof data4 == "number" && isFinite(data4))) {
            const err13 = { instancePath: instancePath + "/position/y", schemaPath: "#/properties/position/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
      } else {
        const err14 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.settings !== void 0) {
      let data5 = data.settings;
      if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
        for (const key2 in data5) {
          const _errs17 = errors;
          if (typeof key2 === "string") {
            if (!pattern12.test(key2)) {
              const err15 = { instancePath: instancePath + "/settings", schemaPath: "#/properties/settings/propertyNames/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-zA-Z0-9]{0,31}$" }, message: 'must match pattern "^[a-z][a-zA-Z0-9]{0,31}$"', propertyName: key2 };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          }
          var valid4 = _errs17 === errors;
          if (!valid4) {
            const err16 = { instancePath: instancePath + "/settings", schemaPath: "#/properties/settings/propertyNames", keyword: "propertyNames", params: { propertyName: key2 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        for (const key3 in data5) {
          let data6 = data5[key3];
          if (!(typeof data6 == "number" && isFinite(data6)) && typeof data6 !== "string" && typeof data6 !== "boolean") {
            const err17 = { instancePath: instancePath + "/settings/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/settings/additionalProperties/type", keyword: "type", params: { type: schema42.properties.settings.additionalProperties.type }, message: "must be number,string,boolean" };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/settings", schemaPath: "#/properties/settings/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
  } else {
    const err19 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate25.errors = vErrors;
  return errors === 0;
}
validate25.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var pattern13 = new RegExp("^[A-Za-z][A-Za-z0-9_-]{0,31}\\.[a-z][A-Za-z0-9]{0,31}$", "u");
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate27.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.from === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "from" }, message: "must have required property 'from'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.to === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "to" }, message: "must have required property 'to'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "from" || key0 === "to")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.from !== void 0) {
      let data0 = data.from;
      if (typeof data0 === "string") {
        if (!pattern13.test(data0)) {
          const err3 = { instancePath: instancePath + "/from", schemaPath: "#/$defs/pinRef/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z][A-Za-z0-9_-]{0,31}\\.[a-z][A-Za-z0-9]{0,31}$" }, message: 'must match pattern "^[A-Za-z][A-Za-z0-9_-]{0,31}\\.[a-z][A-Za-z0-9]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/from", schemaPath: "#/$defs/pinRef/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.to !== void 0) {
      let data1 = data.to;
      if (typeof data1 === "string") {
        if (!pattern13.test(data1)) {
          const err5 = { instancePath: instancePath + "/to", schemaPath: "#/$defs/pinRef/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z][A-Za-z0-9_-]{0,31}\\.[a-z][A-Za-z0-9]{0,31}$" }, message: 'must match pattern "^[A-Za-z][A-Za-z0-9_-]{0,31}\\.[a-z][A-Za-z0-9]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/to", schemaPath: "#/$defs/pinRef/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate27.errors = vErrors;
  return errors === 0;
}
validate27.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema48 = { "type": "object", "required": ["id", "version", "label", "inputs", "outputs"], "additionalProperties": false, "description": "Ein eigener Baustein: Eingänge, Einstellungen und Ausgänge mit Formeln. Format 1, siehe docs/node-spec.md.", "properties": { "$schema": { "type": "string" }, "format": { "const": 1 }, "id": { "type": "string", "pattern": "^custom\\.[a-z0-9][a-z0-9-]{0,47}$" }, "version": { "type": "string", "maxLength": 40 }, "label": { "$ref": "#/$defs/text" }, "description": { "$ref": "#/$defs/text" }, "help": { "$ref": "#/$defs/text" }, "sentence": { "$ref": "#/$defs/text" }, "category": { "enum": ["ind", "cond", "logic"] }, "icon": { "type": "string", "pattern": "^[a-z0-9-]{1,40}$" }, "author": { "type": "string", "maxLength": 80 }, "inputs": { "type": "array", "maxItems": 8, "items": { "$ref": "#/$defs/customInput" } }, "settings": { "type": "array", "maxItems": 8, "items": { "$ref": "#/$defs/customSetting" } }, "outputs": { "type": "array", "minItems": 1, "maxItems": 8, "items": { "$ref": "#/$defs/customOutput" } } } };
var pattern15 = new RegExp("^custom\\.[a-z0-9][a-z0-9-]{0,47}$", "u");
var pattern16 = new RegExp("^[a-z0-9-]{1,40}$", "u");
function validate30(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate30.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (typeof data === "string") {
    if (func2(data) > 1500) {
      const err0 = { instancePath, schemaPath: "#/oneOf/0/maxLength", keyword: "maxLength", params: { limit: 1500 }, message: "must NOT have more than 1500 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/oneOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      if (!(key0 === "de" || key0 === "en")) {
        const err2 = { instancePath, schemaPath: "#/$defs/localized/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.de !== void 0) {
      let data0 = data.de;
      if (typeof data0 === "string") {
        if (func2(data0) > 2e3) {
          const err3 = { instancePath: instancePath + "/de", schemaPath: "#/$defs/localized/properties/de/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/de", schemaPath: "#/$defs/localized/properties/de/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.en !== void 0) {
      let data1 = data.en;
      if (typeof data1 === "string") {
        if (func2(data1) > 2e3) {
          const err5 = { instancePath: instancePath + "/en", schemaPath: "#/$defs/localized/properties/en/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/en", schemaPath: "#/$defs/localized/properties/en/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/$defs/localized/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  var _valid0 = _errs3 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      var props0 = true;
    }
  }
  if (!valid0) {
    const err8 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate30.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate30.evaluated = { "dynamicProps": true, "dynamicItems": false };
var schema53 = { "enum": ["price", "number", "signal"], "description": "price = Kursreihe, number = Zahl, signal = wahr/falsch." };
function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate35.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.type === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "type" || key0 === "label")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (!pattern12.test(data0)) {
          const err3 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/customPinId/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-zA-Z0-9]{0,31}$" }, message: 'must match pattern "^[a-z][a-zA-Z0-9]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/customPinId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.type !== void 0) {
      let data1 = data.type;
      if (!(data1 === "price" || data1 === "number" || data1 === "signal")) {
        const err5 = { instancePath: instancePath + "/type", schemaPath: "#/$defs/customPinType/enum", keyword: "enum", params: { allowedValues: schema53.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.label !== void 0) {
      if (!validate30(data.label, { instancePath: instancePath + "/label", parentData: data, parentDataProperty: "label", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate35.errors = vErrors;
  return errors === 0;
}
validate35.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate38(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate38.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.default === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "default" }, message: "must have required property 'default'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "label" || key0 === "help" || key0 === "default" || key0 === "min" || key0 === "max" || key0 === "step" || key0 === "integer")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (!pattern12.test(data0)) {
          const err3 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/customPinId/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-zA-Z0-9]{0,31}$" }, message: 'must match pattern "^[a-z][a-zA-Z0-9]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/customPinId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.label !== void 0) {
      if (!validate30(data.label, { instancePath: instancePath + "/label", parentData: data, parentDataProperty: "label", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.help !== void 0) {
      if (!validate30(data.help, { instancePath: instancePath + "/help", parentData: data, parentDataProperty: "help", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.default !== void 0) {
      let data3 = data.default;
      if (!(typeof data3 == "number" && isFinite(data3))) {
        const err5 = { instancePath: instancePath + "/default", schemaPath: "#/properties/default/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.min !== void 0) {
      let data4 = data.min;
      if (!(typeof data4 == "number" && isFinite(data4))) {
        const err6 = { instancePath: instancePath + "/min", schemaPath: "#/properties/min/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.max !== void 0) {
      let data5 = data.max;
      if (!(typeof data5 == "number" && isFinite(data5))) {
        const err7 = { instancePath: instancePath + "/max", schemaPath: "#/properties/max/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.step !== void 0) {
      let data6 = data.step;
      if (!(typeof data6 == "number" && isFinite(data6))) {
        const err8 = { instancePath: instancePath + "/step", schemaPath: "#/properties/step/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.integer !== void 0) {
      if (typeof data.integer !== "boolean") {
        const err9 = { instancePath: instancePath + "/integer", schemaPath: "#/properties/integer/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
  } else {
    const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err10];
    } else {
      vErrors.push(err10);
    }
    errors++;
  }
  validate38.errors = vErrors;
  return errors === 0;
}
validate38.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate42(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate42.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.type === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.formula === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "formula" }, message: "must have required property 'formula'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "type" || key0 === "label" || key0 === "unit" || key0 === "formula")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (!pattern12.test(data0)) {
          const err4 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/customPinId/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-zA-Z0-9]{0,31}$" }, message: 'must match pattern "^[a-z][a-zA-Z0-9]{0,31}$"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/customPinId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.type !== void 0) {
      let data1 = data.type;
      if (!(data1 === "price" || data1 === "number" || data1 === "signal")) {
        const err6 = { instancePath: instancePath + "/type", schemaPath: "#/$defs/customPinType/enum", keyword: "enum", params: { allowedValues: schema53.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.label !== void 0) {
      if (!validate30(data.label, { instancePath: instancePath + "/label", parentData: data, parentDataProperty: "label", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.unit !== void 0) {
      if ("percent" !== data.unit) {
        const err7 = { instancePath: instancePath + "/unit", schemaPath: "#/properties/unit/const", keyword: "const", params: { allowedValue: "percent" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.formula !== void 0) {
      let data4 = data.formula;
      if (typeof data4 === "string") {
        if (func2(data4) > 1e3) {
          const err8 = { instancePath: instancePath + "/formula", schemaPath: "#/properties/formula/maxLength", keyword: "maxLength", params: { limit: 1e3 }, message: "must NOT have more than 1000 characters" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (func2(data4) < 1) {
          const err9 = { instancePath: instancePath + "/formula", schemaPath: "#/properties/formula/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/formula", schemaPath: "#/properties/formula/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
  } else {
    const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate42.errors = vErrors;
  return errors === 0;
}
validate42.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate29.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.version === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "version" }, message: "must have required property 'version'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.label === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "label" }, message: "must have required property 'label'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.inputs === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "inputs" }, message: "must have required property 'inputs'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.outputs === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "outputs" }, message: "must have required property 'outputs'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema48.properties, key0)) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.$schema !== void 0) {
      if (typeof data.$schema !== "string") {
        const err6 = { instancePath: instancePath + "/$schema", schemaPath: "#/properties/%24schema/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.format !== void 0) {
      if (1 !== data.format) {
        const err7 = { instancePath: instancePath + "/format", schemaPath: "#/properties/format/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!pattern15.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/pattern", keyword: "pattern", params: { pattern: "^custom\\.[a-z0-9][a-z0-9-]{0,47}$" }, message: 'must match pattern "^custom\\.[a-z0-9][a-z0-9-]{0,47}$"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.version !== void 0) {
      let data3 = data.version;
      if (typeof data3 === "string") {
        if (func2(data3) > 40) {
          const err10 = { instancePath: instancePath + "/version", schemaPath: "#/properties/version/maxLength", keyword: "maxLength", params: { limit: 40 }, message: "must NOT have more than 40 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/version", schemaPath: "#/properties/version/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.label !== void 0) {
      if (!validate30(data.label, { instancePath: instancePath + "/label", parentData: data, parentDataProperty: "label", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.description !== void 0) {
      if (!validate30(data.description, { instancePath: instancePath + "/description", parentData: data, parentDataProperty: "description", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.help !== void 0) {
      if (!validate30(data.help, { instancePath: instancePath + "/help", parentData: data, parentDataProperty: "help", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.sentence !== void 0) {
      if (!validate30(data.sentence, { instancePath: instancePath + "/sentence", parentData: data, parentDataProperty: "sentence", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.category !== void 0) {
      let data8 = data.category;
      if (!(data8 === "ind" || data8 === "cond" || data8 === "logic")) {
        const err12 = { instancePath: instancePath + "/category", schemaPath: "#/properties/category/enum", keyword: "enum", params: { allowedValues: schema48.properties.category.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.icon !== void 0) {
      let data9 = data.icon;
      if (typeof data9 === "string") {
        if (!pattern16.test(data9)) {
          const err13 = { instancePath: instancePath + "/icon", schemaPath: "#/properties/icon/pattern", keyword: "pattern", params: { pattern: "^[a-z0-9-]{1,40}$" }, message: 'must match pattern "^[a-z0-9-]{1,40}$"' };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/icon", schemaPath: "#/properties/icon/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.author !== void 0) {
      let data10 = data.author;
      if (typeof data10 === "string") {
        if (func2(data10) > 80) {
          const err15 = { instancePath: instancePath + "/author", schemaPath: "#/properties/author/maxLength", keyword: "maxLength", params: { limit: 80 }, message: "must NOT have more than 80 characters" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
      } else {
        const err16 = { instancePath: instancePath + "/author", schemaPath: "#/properties/author/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.inputs !== void 0) {
      let data11 = data.inputs;
      if (Array.isArray(data11)) {
        if (data11.length > 8) {
          const err17 = { instancePath: instancePath + "/inputs", schemaPath: "#/properties/inputs/maxItems", keyword: "maxItems", params: { limit: 8 }, message: "must NOT have more than 8 items" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
        const len0 = data11.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate35(data11[i0], { instancePath: instancePath + "/inputs/" + i0, parentData: data11, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/inputs", schemaPath: "#/properties/inputs/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.settings !== void 0) {
      let data13 = data.settings;
      if (Array.isArray(data13)) {
        if (data13.length > 8) {
          const err19 = { instancePath: instancePath + "/settings", schemaPath: "#/properties/settings/maxItems", keyword: "maxItems", params: { limit: 8 }, message: "must NOT have more than 8 items" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
        const len1 = data13.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate38(data13[i1], { instancePath: instancePath + "/settings/" + i1, parentData: data13, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err20 = { instancePath: instancePath + "/settings", schemaPath: "#/properties/settings/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.outputs !== void 0) {
      let data15 = data.outputs;
      if (Array.isArray(data15)) {
        if (data15.length > 8) {
          const err21 = { instancePath: instancePath + "/outputs", schemaPath: "#/properties/outputs/maxItems", keyword: "maxItems", params: { limit: 8 }, message: "must NOT have more than 8 items" };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        if (data15.length < 1) {
          const err22 = { instancePath: instancePath + "/outputs", schemaPath: "#/properties/outputs/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
        const len2 = data15.length;
        for (let i2 = 0; i2 < len2; i2++) {
          if (!validate42(data15[i2], { instancePath: instancePath + "/outputs/" + i2, parentData: data15, parentDataProperty: i2, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate42.errors : vErrors.concat(validate42.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err23 = { instancePath: instancePath + "/outputs", schemaPath: "#/properties/outputs/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
  } else {
    const err24 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err24];
    } else {
      vErrors.push(err24);
    }
    errors++;
  }
  validate29.errors = vErrors;
  return errors === 0;
}
validate29.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate20.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.version === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "version" }, message: "must have required property 'version'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.nodes === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nodes" }, message: "must have required property 'nodes'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.edges === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "edges" }, message: "must have required property 'edges'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema31.properties, key0)) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.$schema !== void 0) {
      if (typeof data.$schema !== "string") {
        const err5 = { instancePath: instancePath + "/$schema", schemaPath: "#/properties/%24schema/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.name !== void 0) {
      let data1 = data.name;
      if (typeof data1 === "string") {
        if (func2(data1) > 120) {
          const err6 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/maxLength", keyword: "maxLength", params: { limit: 120 }, message: "must NOT have more than 120 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (func2(data1) < 1) {
          const err7 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.version !== void 0) {
      if (1 !== data.version) {
        const err9 = { instancePath: instancePath + "/version", schemaPath: "#/properties/version/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.description !== void 0) {
      let data3 = data.description;
      if (typeof data3 === "string") {
        if (func2(data3) > 2e3) {
          const err10 = { instancePath: instancePath + "/description", schemaPath: "#/properties/description/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/description", schemaPath: "#/properties/description/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.meta !== void 0) {
      if (!validate21(data.meta, { instancePath: instancePath + "/meta", parentData: data, parentDataProperty: "meta", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
        errors = vErrors.length;
      }
    }
    if (data.pauseAfterAlert !== void 0) {
      if (typeof data.pauseAfterAlert !== "boolean") {
        const err12 = { instancePath: instancePath + "/pauseAfterAlert", schemaPath: "#/properties/pauseAfterAlert/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.scanner !== void 0) {
      if (!validate23(data.scanner, { instancePath: instancePath + "/scanner", parentData: data, parentDataProperty: "scanner", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
        errors = vErrors.length;
      }
    }
    if (data.nodes !== void 0) {
      let data7 = data.nodes;
      if (Array.isArray(data7)) {
        if (data7.length > 200) {
          const err13 = { instancePath: instancePath + "/nodes", schemaPath: "#/properties/nodes/maxItems", keyword: "maxItems", params: { limit: 200 }, message: "must NOT have more than 200 items" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        const len0 = data7.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate25(data7[i0], { instancePath: instancePath + "/nodes/" + i0, parentData: data7, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err14 = { instancePath: instancePath + "/nodes", schemaPath: "#/properties/nodes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.edges !== void 0) {
      let data9 = data.edges;
      if (Array.isArray(data9)) {
        if (data9.length > 1e3) {
          const err15 = { instancePath: instancePath + "/edges", schemaPath: "#/properties/edges/maxItems", keyword: "maxItems", params: { limit: 1e3 }, message: "must NOT have more than 1000 items" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        const len1 = data9.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate27(data9[i1], { instancePath: instancePath + "/edges/" + i1, parentData: data9, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err16 = { instancePath: instancePath + "/edges", schemaPath: "#/properties/edges/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.customNodes !== void 0) {
      let data11 = data.customNodes;
      if (Array.isArray(data11)) {
        if (data11.length > 20) {
          const err17 = { instancePath: instancePath + "/customNodes", schemaPath: "#/properties/customNodes/maxItems", keyword: "maxItems", params: { limit: 20 }, message: "must NOT have more than 20 items" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
        const len2 = data11.length;
        for (let i2 = 0; i2 < len2; i2++) {
          if (!validate29(data11[i2], { instancePath: instancePath + "/customNodes/" + i2, parentData: data11, parentDataProperty: i2, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/customNodes", schemaPath: "#/properties/customNodes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
  } else {
    const err19 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function ucs2length(str) {
  const len = str.length;
  let length = 0;
  let pos = 0;
  let value;
  while (pos < len) {
    length++;
    value = str.charCodeAt(pos++);
    if (value >= 55296 && value <= 56319 && pos < len) {
      value = str.charCodeAt(pos);
      if ((value & 64512) === 56320)
        pos++;
    }
  }
  return length;
}

// packages/node-spec/src/series.ts
var series_exports = {};
__export(series_exports, {
  CANDLE_PATTERNS: () => CANDLE_PATTERNS,
  PATTERN_BODY_LENGTH: () => PATTERN_BODY_LENGTH,
  PATTERN_TREND_LENGTH: () => PATTERN_TREND_LENGTH,
  SWING_MAX_AGE: () => SWING_MAX_AGE,
  add: () => add,
  all: () => all,
  any: () => any,
  aroon: () => aroon,
  atr: () => atr,
  atrTrailingStop: () => atrTrailingStop,
  barsSince: () => barsSince,
  bb: () => bb,
  candlePattern: () => candlePattern,
  cci: () => cci,
  chandelier: () => chandelier,
  change: () => change,
  count: () => count,
  cross: () => cross,
  crossover: () => crossover,
  crossunder: () => crossunder,
  cum: () => cum,
  decreasing: () => decreasing,
  dev: () => dev,
  div: () => div,
  divergences: () => divergences,
  dmi: () => dmi,
  ema: () => ema,
  fixnan: () => fixnan,
  greater: () => greater,
  greaterEqual: () => greaterEqual,
  heikinAshi: () => heikinAshi,
  highest: () => highest,
  highestBars: () => highestBars,
  historicalVolatility: () => historicalVolatility,
  hlc3: () => hlc3,
  hma: () => hma,
  holds: () => holds,
  increasing: () => increasing,
  lag: () => lag,
  less: () => less,
  lessEqual: () => lessEqual,
  linreg: () => linreg,
  lowest: () => lowest,
  lowestBars: () => lowestBars,
  macd: () => macd,
  map: () => map,
  mfi: () => mfi,
  mul: () => mul,
  not: () => not,
  obv: () => obv,
  percentRank: () => percentRank,
  pivotHigh: () => pivotHigh,
  pivotLevels: () => pivotLevels,
  pivotLow: () => pivotLow,
  rising: () => rising,
  rma: () => rma,
  roc: () => roc,
  rsi: () => rsi,
  sar: () => sar,
  sma: () => sma,
  squeeze: () => squeeze,
  stdev: () => stdev,
  stoch: () => stoch,
  sub: () => sub,
  sum: () => sum,
  supertrend: () => supertrend,
  swingLeg: () => swingLeg,
  swingList: () => swingList,
  swingPoints: () => swingPoints,
  tr: () => tr,
  trStrict: () => trStrict,
  valueWhen: () => valueWhen,
  vwap: () => vwap,
  wma: () => wma,
  wpr: () => wpr
});
function assertLength(length, min = 1) {
  if (!Number.isInteger(length) || length < min) {
    throw new RangeError(`length muss eine ganze Zahl ab ${min} sein, war ${length}`);
  }
}
function emptySeries(n) {
  return new Array(n).fill(null);
}
var Window = class {
  #values;
  #start = 0;
  #count = 0;
  size;
  constructor(size) {
    this.size = size;
    this.#values = new Array(size).fill(0);
  }
  push(value) {
    if (this.#count < this.size) {
      this.#values[(this.#start + this.#count) % this.size] = value;
      this.#count++;
    } else {
      this.#values[this.#start] = value;
      this.#start = (this.#start + 1) % this.size;
    }
  }
  get full() {
    return this.#count === this.size;
  }
  /** Wert `k` Schritte zurück: 0 = neuester. */
  back(k) {
    return this.#values[(this.#start + this.#count - 1 - k + this.size) % this.size] ?? 0;
  }
};
function valueAt(operand2, i) {
  return typeof operand2 === "number" ? operand2 : operand2[i] ?? null;
}
function lengthOf(...operands) {
  for (const operand2 of operands) if (typeof operand2 !== "number") return operand2.length;
  return 0;
}
function map(source, fn) {
  const out = emptySeries(source.length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    const r = fn(v, i);
    out[i] = r != null && Number.isFinite(r) ? r : null;
  }
  return out;
}
function binary(a, b, fn) {
  const n = lengthOf(a, b);
  const out = emptySeries(n);
  for (let i = 0; i < n; i++) {
    const x = valueAt(a, i);
    const y = valueAt(b, i);
    if (x == null || y == null) continue;
    const r = fn(x, y);
    out[i] = Number.isFinite(r) ? r : null;
  }
  return out;
}
var add = (a, b) => binary(a, b, (x, y) => x + y);
var sub = (a, b) => binary(a, b, (x, y) => x - y);
var mul = (a, b) => binary(a, b, (x, y) => x * y);
var div = (a, b) => binary(a, b, (x, y) => y === 0 ? Number.NaN : x / y);
function lag(source, bars = 1) {
  assertLength(bars, 0);
  const out = emptySeries(source.length);
  for (let i = bars; i < source.length; i++) out[i] = source[i - bars] ?? null;
  return out;
}
function sma(source, length) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let sum2 = 0;
    for (let k = 0; k < length; k++) sum2 += window.back(k);
    out[i] = sum2 / length;
  }
  return out;
}
function smooth(source, length, alpha) {
  const out = emptySeries(source.length);
  let previous = null;
  let count2 = 0;
  let sum2 = 0;
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    if (previous === null) {
      sum2 += v;
      count2++;
      if (count2 === length) {
        previous = sum2 / length;
        out[i] = previous;
      }
    } else {
      previous = alpha * v + (1 - alpha) * previous;
      out[i] = previous;
    }
  }
  return out;
}
function ema(source, length) {
  assertLength(length);
  return smooth(source, length, 2 / (length + 1));
}
function rma(source, length) {
  assertLength(length);
  return smooth(source, length, 1 / length);
}
function wma(source, length) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  const norm = length * (length + 1) / 2;
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let sum2 = 0;
    for (let k = 0; k < length; k++) sum2 += window.back(k) * (length - k);
    out[i] = sum2 / norm;
  }
  return out;
}
function hma(source, length) {
  assertLength(length, 2);
  const half = wma(source, Math.floor(length / 2));
  const full = wma(source, length);
  const raw = sub(mul(half, 2), full);
  return wma(raw, Math.floor(Math.sqrt(length)));
}
function stdev(source, length) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let sum2 = 0;
    for (let k = 0; k < length; k++) sum2 += window.back(k);
    const mean = sum2 / length;
    let squares = 0;
    for (let k = 0; k < length; k++) {
      const deviation = window.back(k) - mean;
      if (Math.abs(deviation) > 1e-10) squares += deviation * deviation;
    }
    out[i] = Math.sqrt(squares / length);
  }
  return out;
}
function bb(source, length, mult) {
  const middle = sma(source, length);
  const deviation = mul(stdev(source, length), mult);
  return { middle, upper: add(middle, deviation), lower: sub(middle, deviation) };
}
function change(source, length = 1) {
  assertLength(length);
  return sub(source, lag(source, length));
}
function roc(source, length = 1) {
  assertLength(length);
  const previous = lag(source, length);
  return binary(source, previous, (x, y) => y === 0 ? Number.NaN : 100 * (x - y) / y);
}
function rsi(source, length) {
  assertLength(length);
  const delta = change(source, 1);
  const up = map(delta, (d) => Math.max(d, 0));
  const down = map(delta, (d) => Math.max(-d, 0));
  const avgUp = rma(up, length);
  const avgDown = rma(down, length);
  return binary(avgUp, avgDown, (u, d) => d === 0 ? 100 : u === 0 ? 0 : 100 - 100 / (1 + u / d));
}
function macd(source, fastLength, slowLength, signalLength) {
  const line = sub(ema(source, fastLength), ema(source, slowLength));
  const signal = ema(line, signalLength);
  return { macd: line, signal, hist: sub(line, signal) };
}
function extreme(source, length, pick) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let best = window.back(0);
    for (let k = 1; k < length; k++) best = pick(best, window.back(k));
    out[i] = best;
  }
  return out;
}
function highest(source, length) {
  return extreme(source, length, Math.max);
}
function lowest(source, length) {
  return extreme(source, length, Math.min);
}
function compare(a, b, test) {
  const n = lengthOf(a, b);
  const out = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const x = valueAt(a, i);
    const y = valueAt(b, i);
    out[i] = x != null && y != null && test(x, y);
  }
  return out;
}
var greater = (a, b) => compare(a, b, (x, y) => x > y);
var less = (a, b) => compare(a, b, (x, y) => x < y);
var greaterEqual = (a, b) => compare(a, b, (x, y) => x >= y);
var lessEqual = (a, b) => compare(a, b, (x, y) => x <= y);
function crossing(a, b, test) {
  const n = lengthOf(a, b);
  const out = new Array(n).fill(false);
  for (let i = 1; i < n; i++) {
    const x = valueAt(a, i);
    const y = valueAt(b, i);
    const px = valueAt(a, i - 1);
    const py = valueAt(b, i - 1);
    out[i] = x != null && y != null && px != null && py != null && test(x, y, px, py);
  }
  return out;
}
var crossover = (a, b) => crossing(a, b, (x, y, px, py) => x > y && px <= py);
var crossunder = (a, b) => crossing(a, b, (x, y, px, py) => x < y && px >= py);
var cross = (a, b) => crossing(a, b, (x, y, px, py) => x > y && px <= py || x < y && px >= py);
function all(signals, length) {
  const out = new Array(length).fill(signals.length > 0);
  for (const s of signals) for (let i = 0; i < length; i++) out[i] = (out[i] ?? false) && s[i] === true;
  return out;
}
function any(signals, length) {
  const out = new Array(length).fill(false);
  for (const s of signals) for (let i = 0; i < length; i++) out[i] = (out[i] ?? false) || s[i] === true;
  return out;
}
function not(signal) {
  return signal.map((v) => !v);
}
function holds(signal, bars) {
  assertLength(bars);
  const out = new Array(signal.length).fill(false);
  let run = 0;
  for (let i = 0; i < signal.length; i++) {
    run = signal[i] ? run + 1 : 0;
    out[i] = run >= bars;
  }
  return out;
}
function rising(signal) {
  const out = new Array(signal.length).fill(false);
  for (let i = 1; i < signal.length; i++) out[i] = signal[i] === true && signal[i - 1] !== true;
  return out;
}
function sum(source, length) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let total = 0;
    for (let k = 0; k < length; k++) total += window.back(k);
    out[i] = total;
  }
  return out;
}
function tr(high, low, close) {
  const n = high.length;
  const out = emptySeries(n);
  for (let i = 0; i < n; i++) {
    const h = high[i];
    const lo = low[i];
    if (h == null || lo == null) continue;
    const previous = i > 0 ? close[i - 1] ?? null : null;
    out[i] = previous == null ? h - lo : Math.max(h - lo, Math.abs(h - previous), Math.abs(lo - previous));
  }
  return out;
}
function atr(high, low, close, length) {
  return rma(tr(high, low, close), length);
}
function increasing(source, length) {
  return trend(source, length, (now, before) => now > before);
}
function decreasing(source, length) {
  return trend(source, length, (now, before) => now < before);
}
function trend(source, length, test) {
  assertLength(length);
  const out = new Array(source.length).fill(false);
  for (let i = length; i < source.length; i++) {
    const now = source[i];
    if (now == null) continue;
    let ok = true;
    for (let k = 1; k <= length && ok; k++) {
      const before = source[i - k];
      ok = before != null && test(now, before);
    }
    out[i] = ok;
  }
  return out;
}
function count(signal, length) {
  assertLength(length);
  const out = emptySeries(signal.length);
  let total = 0;
  for (let i = 0; i < signal.length; i++) {
    if (signal[i]) total++;
    if (i >= length && signal[i - length]) total--;
    if (i >= length - 1) out[i] = total;
  }
  return out;
}
function barsSince(signal) {
  const out = emptySeries(signal.length);
  let last = null;
  for (let i = 0; i < signal.length; i++) {
    if (signal[i]) last = i;
    if (last !== null) out[i] = i - last;
  }
  return out;
}
function trStrict(high, low, close) {
  const out = emptySeries(high.length);
  for (let i = 1; i < high.length; i++) {
    const h = high[i];
    const lo = low[i];
    const previous = close[i - 1];
    if (h == null || lo == null || previous == null) continue;
    out[i] = Math.max(h - lo, Math.abs(h - previous), Math.abs(lo - previous));
  }
  return out;
}
function fixnan(source) {
  const out = emptySeries(source.length);
  let last = null;
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v != null) last = v;
    out[i] = last;
  }
  return out;
}
function dmi(high, low, close, diLength, adxSmoothing) {
  assertLength(diLength);
  assertLength(adxSmoothing);
  const n = high.length;
  const plusMove = emptySeries(n);
  const minusMove = emptySeries(n);
  for (let i = 1; i < n; i++) {
    const h = high[i];
    const ph = high[i - 1];
    const lo = low[i];
    const pl = low[i - 1];
    const up = h != null && ph != null ? h - ph : null;
    const down = lo != null && pl != null ? pl - lo : null;
    if (up !== null) plusMove[i] = down !== null && up > down && up > 0 ? up : 0;
    if (down !== null) minusMove[i] = up !== null && down > up && down > 0 ? down : 0;
  }
  const range2 = rma(trStrict(high, low, close), diLength);
  const percentOf = (move) => fixnan(binary(rma(move, diLength), range2, (x, y) => y === 0 ? Number.NaN : 100 * x / y));
  const plus = percentOf(plusMove);
  const minus = percentOf(minusMove);
  const spread = binary(plus, minus, (p, m) => Math.abs(p - m) / (p + m === 0 ? 1 : p + m));
  return { plus, minus, adx: map(rma(spread, adxSmoothing), (v) => 100 * v) };
}
function supertrend(high, low, close, factor, atrPeriod) {
  const range2 = atr(high, low, close, atrPeriod);
  const n = close.length;
  const line = emptySeries(n);
  const direction = emptySeries(n);
  let started = false;
  let previousUpper = 0;
  let previousLower = 0;
  let previousLine = 0;
  let previousClose = null;
  for (let i = 0; i < n; i++) {
    const h = high[i];
    const lo = low[i];
    const c = close[i];
    const a = range2[i];
    if (h == null || lo == null || c == null || a == null) continue;
    const before = started ? previousClose : i > 0 ? close[i - 1] ?? null : null;
    const middle = (h + lo) / 2;
    let upper = middle + factor * a;
    let lower = middle - factor * a;
    if (!(lower > previousLower || before !== null && before < previousLower)) lower = previousLower;
    if (!(upper < previousUpper || before !== null && before > previousUpper)) upper = previousUpper;
    const dir = !started ? 1 : previousLine === previousUpper ? c > upper ? -1 : 1 : c < lower ? 1 : -1;
    const value = dir === -1 ? lower : upper;
    if (before !== null) {
      line[i] = value;
      direction[i] = dir;
    }
    started = true;
    previousUpper = upper;
    previousLower = lower;
    previousLine = value;
    previousClose = c;
  }
  return { line, direction };
}
function vwap(source, volume2, anchor, mult) {
  const n = source.length;
  const center = emptySeries(n);
  const upper = emptySeries(n);
  const lower = emptySeries(n);
  let started = false;
  let weight = 0;
  let weighted = 0;
  let mean = 0;
  let squares = 0;
  for (let i = 0; i < n; i++) {
    if (anchor[i]) {
      started = true;
      weight = 0;
      weighted = 0;
      mean = 0;
      squares = 0;
    }
    if (!started) continue;
    const x = source[i];
    const v = volume2[i];
    if (x == null || v == null) continue;
    weight += v;
    weighted += x * v;
    if (!(weight > 0)) continue;
    const delta = x - mean;
    mean += v / weight * delta;
    squares += v * delta * (x - mean);
    const value = weighted / weight;
    const deviation = Math.sqrt(Math.max(0, squares / weight));
    center[i] = value;
    upper[i] = value + mult * deviation;
    lower[i] = value - mult * deviation;
  }
  return { vwap: center, upper, lower };
}
function pivotsOf(kind, h, lo, c, o) {
  const range2 = h - lo;
  switch (kind) {
    case "classic": {
      const p = (h + lo + c) / 3;
      return [p, 2 * p - lo, p + range2, p + 2 * range2, 2 * p - h, p - range2, p - 2 * range2];
    }
    case "traditional": {
      const p = (h + lo + c) / 3;
      return [p, 2 * p - lo, p + range2, 2 * p + (h - 2 * lo), 2 * p - h, p - range2, 2 * p - (2 * h - lo)];
    }
    case "fibonacci": {
      const p = (h + lo + c) / 3;
      return [p, p + 0.382 * range2, p + 0.618 * range2, p + range2, p - 0.382 * range2, p - 0.618 * range2, p - range2];
    }
    case "camarilla": {
      const p = (h + lo + c) / 3;
      const k = 1.1 * range2;
      return [p, c + k / 12, c + k / 6, c + k / 4, c - k / 12, c - k / 6, c - k / 4];
    }
    case "woodie": {
      const p = (h + lo + 2 * o) / 4;
      return [p, 2 * p - lo, p + range2, h + 2 * (p - lo), 2 * p - h, p - range2, lo - 2 * (h - p)];
    }
  }
}
function pivotLevels(kind, high, low, close, open) {
  const n = high.length;
  const levels = { pivot: emptySeries(n), r1: emptySeries(n), r2: emptySeries(n), r3: emptySeries(n), s1: emptySeries(n), s2: emptySeries(n), s3: emptySeries(n) };
  for (let i = 0; i < n; i++) {
    const h = high[i];
    const lo = low[i];
    const c = close[i];
    if (h == null || lo == null || c == null) continue;
    const o = kind === "woodie" && open ? open[i] : c;
    if (o == null) continue;
    [levels.pivot[i], levels.r1[i], levels.r2[i], levels.r3[i], levels.s1[i], levels.s2[i], levels.s3[i]] = pivotsOf(kind, h, lo, c, o);
  }
  return levels;
}
function stoch(source, high, low, length) {
  const top = highest(high, length);
  const bottom = lowest(low, length);
  const out = emptySeries(source.length);
  for (let i = 0; i < source.length; i++) {
    const x = source[i];
    const h = top[i];
    const lo = bottom[i];
    if (x == null || h == null || lo == null || h === lo) continue;
    out[i] = 100 * (x - lo) / (h - lo);
  }
  return out;
}
function hlc3(high, low, close) {
  const out = emptySeries(high.length);
  for (let i = 0; i < high.length; i++) {
    const h = high[i];
    const lo = low[i];
    const c = close[i];
    if (h == null || lo == null || c == null) continue;
    out[i] = (h + lo + c) / 3;
  }
  return out;
}
function dev(source, length) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let sum2 = 0;
    let lo = v;
    let hi = v;
    for (let k = 0; k < length; k++) {
      const x = window.back(k);
      sum2 += x;
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    if (lo === hi) {
      out[i] = 0;
      continue;
    }
    const mean = sum2 / length;
    let total = 0;
    for (let k = 0; k < length; k++) total += Math.abs(window.back(k) - mean);
    out[i] = total / length;
  }
  return out;
}
function cci(source, length) {
  return binary(sub(source, sma(source, length)), dev(source, length), (x, d) => d === 0 ? Number.NaN : x / (0.015 * d));
}
function wpr(high, low, close, length) {
  const top = highest(high, length);
  const bottom = lowest(low, length);
  const out = emptySeries(close.length);
  for (let i = 0; i < close.length; i++) {
    const c = close[i];
    const h = top[i];
    const lo = bottom[i];
    if (c == null || h == null || lo == null || h === lo) continue;
    out[i] = 100 * (c - h) / (h - lo);
  }
  return out;
}
function mfi(source, volume2, length) {
  assertLength(length);
  const n = source.length;
  const up = emptySeries(n);
  const down = emptySeries(n);
  for (let i = 0; i < n; i++) {
    const x = source[i];
    const v = volume2[i];
    if (x == null || v == null) continue;
    const before = i > 0 ? source[i - 1] ?? null : null;
    const delta = before === null ? null : x - before;
    const flow = v * x;
    up[i] = delta !== null && delta <= 0 ? 0 : flow;
    down[i] = delta !== null && delta >= 0 ? 0 : flow;
  }
  return binary(sum(up, length), sum(down, length), (u, d) => d === 0 ? 100 : 100 - 100 / (1 + u / d));
}
function cum(source) {
  const out = emptySeries(source.length);
  let total = 0;
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    total += v;
    out[i] = total;
  }
  return out;
}
function obv(close, volume2) {
  const signed = emptySeries(close.length);
  for (let i = 0; i < close.length; i++) {
    const c = close[i];
    const v = volume2[i];
    if (c == null || v == null) continue;
    const before = i > 0 ? close[i - 1] ?? null : null;
    signed[i] = before === null ? 0 : Math.sign(c - before) * v;
  }
  return cum(signed);
}
function linreg(source, length, offset = 0) {
  assertLength(length);
  assertLength(offset, 0);
  const out = emptySeries(source.length);
  const window = new Window(length);
  const center = (length - 1) / 2;
  const spread = length * (length * length - 1) / 12;
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    if (length === 1) {
      out[i] = v;
      continue;
    }
    let sum2 = 0;
    for (let k = 0; k < length; k++) sum2 += window.back(k);
    const mean = sum2 / length;
    let covariance = 0;
    for (let k = 0; k < length; k++) covariance += (length - 1 - k - center) * (window.back(k) - mean);
    out[i] = mean + covariance / spread * (length - 1 - offset - center);
  }
  return out;
}
function extremeBars(source, length, better) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    window.push(v);
    if (!window.full) continue;
    let best = 0;
    for (let k = 1; k < length; k++) if (better(window.back(k), window.back(best))) best = k;
    out[i] = best;
  }
  return out;
}
function highestBars(source, length) {
  return extremeBars(source, length, (a, b) => a > b);
}
function lowestBars(source, length) {
  return extremeBars(source, length, (a, b) => a < b);
}
function aroon(high, low, length) {
  assertLength(length);
  const up = map(highestBars(high, length + 1), (bars) => 100 * (length - bars) / length);
  const down = map(lowestBars(low, length + 1), (bars) => 100 * (length - bars) / length);
  return { up, down, oscillator: sub(up, down) };
}
function squeeze(close, high, low, length, bbMult, kcMult) {
  assertLength(length);
  const n = close.length;
  const basis = sma(close, length);
  const bbWidth = mul(stdev(close, length), bbMult);
  const kcWidth = mul(sma(tr(high, low, close), length), kcMult);
  const lowerBB = sub(basis, bbWidth);
  const upperBB = add(basis, bbWidth);
  const lowerKC = sub(basis, kcWidth);
  const upperKC = add(basis, kcWidth);
  const on = all([greater(lowerBB, lowerKC), less(upperBB, upperKC)], n);
  const outside = any([lessEqual(lowerBB, lowerKC), greaterEqual(upperBB, upperKC)], n);
  const fired = on.map((_, i) => i > 0 && on[i - 1] === true && outside[i] === true);
  const middle = div(add(div(add(highest(high, length), lowest(low, length)), 2), basis), 2);
  return { momentum: linreg(sub(close, middle), length, 0), on, fired };
}
var CANDLE_PATTERNS = ["bullEngulfing", "bearEngulfing", "hammer", "shootingStar", "doji", "morningStar", "eveningStar", "whiteSoldiers", "blackCrows"];
var PATTERN_BODY_LENGTH = 14;
var PATTERN_TREND_LENGTH = 50;
var PATTERN_TREND = {
  bullEngulfing: "down",
  bearEngulfing: "up",
  hammer: "down",
  shootingStar: "up",
  doji: void 0,
  morningStar: "down",
  eveningStar: "up",
  whiteSoldiers: void 0,
  blackCrows: void 0
};
function candlePattern(pattern, open, high, low, close, trend2) {
  const n = close.length;
  const sizes = emptySeries(n);
  for (let i = 0; i < n; i++) {
    const o = open[i];
    const c = close[i];
    if (o != null && c != null) sizes[i] = Math.abs(c - o);
  }
  const average = ema(sizes, PATTERN_BODY_LENGTH);
  const trendLine = sma(close, PATTERN_TREND_LENGTH);
  const bodies = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const o = open[i];
    const h = high[i];
    const lo = low[i];
    const c = close[i];
    const size = sizes[i];
    const avg = average[i];
    if (o == null || h == null || lo == null || c == null || size == null || avg == null) continue;
    const top = Math.max(o, c);
    const bottom = Math.min(o, c);
    bodies[i] = { open: o, high: h, low: lo, close: c, size, top, bottom, middle: bottom + size / 2, upper: h - top, lower: bottom - lo, range: h - lo, long: size > avg, small: size < avg, gap: avg / 10 };
  }
  const white = (b) => b.close > b.open;
  const black = (b) => b.close < b.open;
  const shape = (a, b, c) => {
    switch (pattern) {
      case "bullEngulfing":
        return b !== null && white(a) && a.long && black(b) && b.small && a.close > b.open && a.open <= b.close + a.gap;
      case "bearEngulfing":
        return b !== null && black(a) && a.long && white(b) && b.small && a.close < b.open && a.open >= b.close - a.gap;
      case "hammer":
        return a.small && a.size > 0 && a.bottom > (a.high + a.low) / 2 && a.lower >= 2 * a.size && a.upper <= 0.05 * a.size;
      case "shootingStar":
        return a.small && a.size > 0 && a.top < (a.high + a.low) / 2 && a.upper >= 2 * a.size && a.lower <= 0.05 * a.size;
      case "doji":
        return a.range > 0 && a.size <= 0.05 * a.range;
      case "morningStar":
        return b !== null && c !== null && c.long && black(c) && b.small && b.top < c.middle && white(a) && a.long && a.close > c.middle;
      case "eveningStar":
        return b !== null && c !== null && c.long && white(c) && b.small && b.bottom > c.middle && black(a) && a.long && a.close < c.middle;
      case "whiteSoldiers":
        return b !== null && c !== null && [a, b, c].every((x) => white(x) && x.long && x.upper <= 0.25 * x.range) && a.close > b.close && b.close > c.close && a.open <= b.close + a.gap && a.open >= b.open - a.gap && b.open <= c.close + b.gap && b.open >= c.open - b.gap;
      case "blackCrows":
        return b !== null && c !== null && [a, b, c].every((x) => black(x) && x.long && x.lower <= 0.25 * x.range) && a.close < b.close && b.close < c.close && a.open >= b.close - a.gap && a.open <= b.open + a.gap && b.open >= c.close - b.gap && b.open <= c.open + b.gap;
    }
  };
  const side = PATTERN_TREND[pattern];
  const out = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const a = bodies[i] ?? null;
    if (a === null) continue;
    if (!shape(a, i > 0 ? bodies[i - 1] ?? null : null, i > 1 ? bodies[i - 2] ?? null : null)) continue;
    if (trend2 && side !== void 0) {
      const line = trendLine[i];
      if (line == null || (side === "down" ? !(a.close < line) : !(a.close > line))) continue;
    }
    out[i] = true;
  }
  return out;
}
var SWING_MAX_AGE = 500;
function findPivots(source, left, right, high) {
  assertLength(left);
  assertLength(right);
  const indices = [];
  for (let i = 0; i < source.length; i++) if (source[i] != null) indices.push(i);
  const value = (k) => source[indices[k]];
  const pivots = [];
  for (let k = left; k + right < indices.length; k++) {
    const v = value(k);
    let ok = true;
    for (let j = k - left; j < k && ok; j++) ok = high ? v > value(j) : v < value(j);
    for (let j = k + 1; j <= k + right && ok; j++) ok = high ? v >= value(j) : v <= value(j);
    if (ok) pivots.push({ at: indices[k], confirmed: indices[k + right], value: v });
  }
  return pivots;
}
function pivotSeries(source, pivots) {
  const out = emptySeries(source.length);
  for (const pivot of pivots) out[pivot.confirmed] = pivot.value;
  return out;
}
function pivotHigh(source, left, right) {
  return pivotSeries(source, findPivots(source, left, right, true));
}
function pivotLow(source, left, right) {
  return pivotSeries(source, findPivots(source, left, right, false));
}
function heldPivots(source, pivots, maxAge) {
  const held = emptySeries(source.length);
  const fresh = new Array(source.length).fill(false);
  let next = 0;
  let last;
  for (let i = 0; i < source.length; i++) {
    while (next < pivots.length && pivots[next].confirmed === i) {
      last = pivots[next];
      fresh[i] = true;
      next++;
    }
    if (last && source[i] != null && i - last.at <= maxAge) held[i] = last.value;
  }
  return { held, fresh };
}
function swingPoints(high, low, left, right, maxAge = SWING_MAX_AGE) {
  const highs = heldPivots(high, findPivots(high, left, right, true), maxAge);
  const lows = heldPivots(low, findPivots(low, left, right, false), maxAge);
  return { high: highs.held, low: lows.held, newHigh: highs.fresh, newLow: lows.fresh };
}
function swingList(high, low, left, right) {
  return [
    ...findPivots(high, left, right, true).map((pivot) => ({ ...pivot, high: true })),
    ...findPivots(low, left, right, false).map((pivot) => ({ ...pivot, high: false }))
  ].sort((a, b) => a.confirmed - b.confirmed || a.at - b.at || (a.high === b.high ? 0 : a.high ? -1 : 1));
}
function swingLeg(high, low, left, right, maxAge = SWING_MAX_AGE) {
  const n = high.length;
  const events = swingList(high, low, left, right);
  const start = emptySeries(n);
  const end = emptySeries(n);
  const up = new Array(n).fill(false);
  let first = 0;
  let known = 0;
  let drawn = -1;
  let previous;
  let last;
  for (let i = 0; i < n; i++) {
    while (known < events.length && events[known].confirmed <= i) known++;
    while (first < known && i - events[first].at > maxAge) first++;
    if (drawn !== first * (events.length + 1) + known) {
      drawn = first * (events.length + 1) + known;
      previous = void 0;
      last = void 0;
      for (let k = first; k < known; k++) {
        const event = events[k];
        if (last && last.high === event.high) {
          if (event.high ? event.value > last.value : event.value < last.value) last = event;
        } else {
          previous = last;
          last = event;
        }
      }
    }
    if (!previous || !last || high[i] == null || low[i] == null) continue;
    start[i] = previous.value;
    end[i] = last.value;
    up[i] = last.high;
  }
  return { start, end, up };
}
function sar(high, low, close, start, increment, maximum) {
  const n = close.length;
  const line = emptySeries(n);
  const direction = emptySeries(n);
  let result = 0;
  let extreme2 = 0;
  let acceleration = start;
  let below = false;
  let count2 = 0;
  let h1 = 0;
  let l1 = 0;
  let c1 = 0;
  let h2 = 0;
  let l2 = 0;
  for (let i = 0; i < n; i++) {
    const h = high[i];
    const lo = low[i];
    const c = close[i];
    if (h == null || lo == null || c == null) continue;
    if (count2 >= 1) {
      let firstTrendBar = false;
      if (count2 === 1) {
        below = c > c1;
        extreme2 = below ? h : lo;
        result = below ? l1 : h1;
        firstTrendBar = true;
        acceleration = start;
      }
      result += acceleration * (extreme2 - result);
      if (below && result > lo) {
        firstTrendBar = true;
        below = false;
        result = Math.max(h, extreme2);
        extreme2 = lo;
        acceleration = start;
      } else if (!below && result < h) {
        firstTrendBar = true;
        below = true;
        result = Math.min(lo, extreme2);
        extreme2 = h;
        acceleration = start;
      }
      if (!firstTrendBar) {
        if (below && h > extreme2) {
          extreme2 = h;
          acceleration = Math.min(acceleration + increment, maximum);
        } else if (!below && lo < extreme2) {
          extreme2 = lo;
          acceleration = Math.min(acceleration + increment, maximum);
        }
      }
      if (below) {
        result = Math.min(result, l1);
        if (count2 > 1) result = Math.min(result, l2);
      } else {
        result = Math.max(result, h1);
        if (count2 > 1) result = Math.max(result, h2);
      }
      line[i] = result;
      direction[i] = below ? 1 : -1;
    }
    h2 = h1;
    l2 = l1;
    h1 = h;
    l1 = lo;
    c1 = c;
    count2++;
  }
  return { line, direction };
}
function chandelier(high, low, close, length, factor) {
  const n = close.length;
  const range2 = atr(high, low, close, length);
  const top = highest(high, length);
  const bottom = lowest(low, length);
  const line = emptySeries(n);
  const direction = emptySeries(n);
  let longStop = null;
  let shortStop = null;
  let previousClose = null;
  let dir = 1;
  for (let i = 0; i < n; i++) {
    const c = close[i];
    const a = range2[i];
    const h = top[i];
    const lo = bottom[i];
    if (c == null || a == null || h == null || lo == null) continue;
    const rawLong = h - factor * a;
    const rawShort = lo + factor * a;
    const longBefore = longStop ?? rawLong;
    const shortBefore = shortStop ?? rawShort;
    const nextLong = previousClose !== null && previousClose > longBefore ? Math.max(rawLong, longBefore) : rawLong;
    const nextShort = previousClose !== null && previousClose < shortBefore ? Math.min(rawShort, shortBefore) : rawShort;
    dir = c > shortBefore ? 1 : c < longBefore ? -1 : dir;
    longStop = nextLong;
    shortStop = nextShort;
    previousClose = c;
    line[i] = dir === 1 ? nextLong : nextShort;
    direction[i] = dir;
  }
  return { line, direction };
}
function atrTrailingStop(source, high, low, close, length, factor) {
  const n = source.length;
  const range2 = atr(high, low, close, length);
  const line = emptySeries(n);
  const direction = emptySeries(n);
  let stop = null;
  let previous = null;
  for (let i = 0; i < n; i++) {
    const x = source[i];
    const a = range2[i];
    if (x == null || a == null) continue;
    const loss = factor * a;
    if (stop === null) stop = x - loss;
    else if (x > stop && previous !== null && previous > stop) stop = Math.max(stop, x - loss);
    else if (x < stop && previous !== null && previous < stop) stop = Math.min(stop, x + loss);
    else stop = x > stop ? x - loss : x + loss;
    previous = x;
    line[i] = stop;
    direction[i] = x > stop ? 1 : -1;
  }
  return { line, direction };
}
function historicalVolatility(source, length, periods) {
  const returns = binary(source, lag(source, 1), (x, y) => x > 0 && y > 0 ? Math.log(x / y) : Number.NaN);
  const scale = Math.sqrt(periods) * 100;
  return map(stdev(returns, length), (deviation) => deviation * scale);
}
function percentRank(source, length) {
  assertLength(length);
  const out = emptySeries(source.length);
  const window = new Window(length);
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (v == null) continue;
    if (window.full) {
      let count2 = 0;
      for (let k = 0; k < length; k++) if (window.back(k) <= v) count2++;
      out[i] = 100 * count2 / length;
    }
    window.push(v);
  }
  return out;
}
function heikinAshi(open, high, low, close) {
  const n = close.length;
  const out = { open: emptySeries(n), high: emptySeries(n), low: emptySeries(n), close: emptySeries(n) };
  let previousOpen = null;
  let previousClose = null;
  for (let i = 0; i < n; i++) {
    const o = open[i];
    const h = high[i];
    const l2 = low[i];
    const c = close[i];
    if (o == null || h == null || l2 == null || c == null) continue;
    const haClose = (o + h + l2 + c) / 4;
    const haOpen = previousOpen === null || previousClose === null ? (o + c) / 2 : (previousOpen + previousClose) / 2;
    out.open[i] = haOpen;
    out.close[i] = haClose;
    out.high[i] = Math.max(h, haOpen, haClose);
    out.low[i] = Math.min(l2, haOpen, haClose);
    previousOpen = haOpen;
    previousClose = haClose;
  }
  return out;
}
function valueWhen(signal, source, maxAge) {
  assertLength(maxAge, 0);
  const out = emptySeries(source.length);
  let at = -1;
  let value = null;
  for (let i = 0; i < source.length; i++) {
    if (signal[i] === true) {
      at = i;
      value = source[i] ?? null;
    }
    if (value !== null && i - at <= maxAge) out[i] = value;
  }
  return out;
}
function divergences(osc, high, low, left, right, minBars, maxBars, hidden) {
  const found = [];
  for (const bullish of [true, false]) {
    const price = bullish ? low : high;
    const pivots = findPivots(osc, left, right, !bullish);
    for (let k = 1; k < pivots.length; k++) {
      const a = pivots[k - 1];
      const b = pivots[k];
      const distance3 = b.at - a.at;
      const pa = price[a.at];
      const pb = price[b.at];
      if (distance3 < minBars || distance3 > maxBars || pa == null || pb == null) continue;
      const priceLower = pb < pa;
      const priceHigher = pb > pa;
      const oscLower = b.value < a.value;
      const oscHigher = b.value > a.value;
      const regular = bullish ? priceLower && oscHigher : priceHigher && oscLower;
      const concealed = bullish ? priceHigher && oscLower : priceLower && oscHigher;
      if (hidden ? !concealed : !regular) continue;
      found.push({ bullish, first: { at: a.at, price: pa, osc: a.value }, second: { at: b.at, price: pb, osc: b.value }, confirmed: b.confirmed });
    }
  }
  return found.sort((x, y) => x.confirmed - y.confirmed || (x.bullish === y.bullish ? 0 : x.bullish ? -1 : 1));
}

// packages/node-spec/src/formula.ts
var FORMULA_LIMITS = {
  /** Zeichen je Formel. */
  chars: 1e3,
  /** Bausteine (Zahlen, Namen, Rechenzeichen, Aufrufe) je Formel. */
  nodes: 200,
  /** Verschachtelung von Klammern und Aufrufen. */
  depth: 24,
  /** Größte Länge in Kerzen, etwa bei ema(x, 1000). */
  window: 1e3,
  /** Aufrufe mit Länge (ema, sma, highest …) je Formel; jeder kostet Rechenzeit über die ganze Zeitachse. */
  windowCalls: 24
};
var OPERATOR_ALIASES = { "×": "*", "·": "*", "÷": "/", "−": "-", "–": "-", "≥": ">=", "≤": "<=", "≠": "!=" };
var OPERATORS = [">=", "<=", "==", "!=", "&&", "||", "+", "-", "*", "/", "%", "^", "(", ")", "[", "]", ",", "?", ":", ">", "<", "!", "="];
var FormulaSyntaxError = class extends Error {
  issue;
  constructor(issue) {
    super(issue.message.de);
    this.issue = issue;
  }
};
function fail(message2, start, end) {
  throw new FormulaSyntaxError({ message: message2, start, end: Math.max(end, start + 1) });
}
function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(text.slice(i));
      if (!match) fail(l(`„${char}“ ist hier keine Zahl`, `"${char}" is not a number here`), i, i + 1);
      const raw = match[0];
      if (/[A-Za-z_]/.test(text[i + raw.length] ?? "")) {
        fail(l("Nach einer Zahl darf kein Buchstabe folgen; fehlt ein Rechenzeichen", "A number cannot be followed by a letter; is an operator missing"), i, i + raw.length + 1);
      }
      tokens.push({ kind: "num", text: raw, value: Number(raw), start: i, end: i + raw.length });
      i += raw.length;
      continue;
    }
    if (/[A-Za-z_äöüÄÖÜß]/.test(char)) {
      const match = /^[A-Za-z_äöüÄÖÜß][A-Za-z0-9_äöüÄÖÜß]*/.exec(text.slice(i));
      tokens.push({ kind: "name", text: match[0], start: i, end: i + match[0].length });
      i += match[0].length;
      continue;
    }
    const alias = OPERATOR_ALIASES[char];
    if (alias) {
      tokens.push({ kind: "op", text: alias, start: i, end: i + 1 });
      i++;
      continue;
    }
    const op = OPERATORS.find((candidate) => text.startsWith(candidate, i));
    if (!op) fail(l(`Unbekanntes Zeichen „${char}“`, `Unknown character "${char}"`), i, i + 1);
    if (op === "=") fail(l("Für einen Vergleich == schreiben, ein einzelnes = gibt es nicht", "Write == for a comparison, a single = does not exist"), i, i + 1);
    tokens.push({ kind: "op", text: op, start: i, end: i + op.length });
    i += op.length;
  }
  tokens.push({ kind: "end", text: "", start: text.length, end: text.length });
  return tokens;
}
var KEYWORDS = {
  and: "and",
  und: "and",
  or: "or",
  oder: "or",
  not: "not",
  nicht: "not",
  true: "true",
  wahr: "true",
  false: "false",
  falsch: "false"
};
function isFormulaKeyword(name4) {
  return Object.hasOwn(KEYWORDS, name4.toLowerCase());
}
function keyword(token) {
  return token.kind === "name" ? KEYWORDS[token.text.toLowerCase()] : void 0;
}
var Parser = class {
  #tokens;
  #pos = 0;
  #depth = 0;
  nodes = 0;
  constructor(tokens) {
    this.#tokens = tokens;
  }
  get #peek() {
    return this.#tokens[this.#pos];
  }
  #next() {
    const token = this.#peek;
    if (token.kind !== "end") this.#pos++;
    return token;
  }
  #isOp(text) {
    return this.#peek.kind === "op" && this.#peek.text === text;
  }
  #expect(text, message2) {
    if (!this.#isOp(text)) fail(message2, this.#peek.start, this.#peek.end);
    return this.#next();
  }
  #count(node) {
    this.nodes++;
    if (this.nodes > FORMULA_LIMITS.nodes) {
      fail(l(`Die Formel ist zu groß, höchstens ${FORMULA_LIMITS.nodes} Teile`, `The formula is too large, at most ${FORMULA_LIMITS.nodes} parts`), node.start, node.end);
    }
    return node;
  }
  #enter(token) {
    this.#depth++;
    if (this.#depth > FORMULA_LIMITS.depth) fail(l("Die Formel ist zu tief verschachtelt", "The formula is nested too deeply"), token.start, token.end);
  }
  parse() {
    if (this.#peek.kind === "end") fail(l("Die Formel ist leer", "The formula is empty"), 0, 0);
    const node = this.#expression();
    const rest = this.#peek;
    if (rest.kind !== "end") {
      if (rest.kind === "op" && rest.text === ")") fail(l("Diese Klammer schließt nichts", "This parenthesis closes nothing"), rest.start, rest.end);
      fail(l(`Unerwartet: „${rest.text}“. Fehlt ein Rechenzeichen`, `Unexpected: "${rest.text}". Is an operator missing`), rest.start, rest.end);
    }
    return node;
  }
  #expression() {
    this.#enter(this.#peek);
    const test = this.#or();
    let node = test;
    if (this.#isOp("?")) {
      this.#next();
      const then = this.#expression();
      this.#expect(":", l("Nach „? …“ fehlt „: …“ für den anderen Fall", 'After "? …" the ": …" for the other case is missing'));
      const otherwise = this.#expression();
      node = this.#count({ kind: "cond", test, then, otherwise, start: test.start, end: otherwise.end });
    }
    this.#depth--;
    return node;
  }
  #or() {
    let left = this.#and();
    while (this.#isOp("||") || keyword(this.#peek) === "or") {
      const op = this.#next();
      const right = this.#and();
      left = this.#count({ kind: "binary", op: "or", left, right, start: left.start, end: right.end, opStart: op.start });
    }
    return left;
  }
  #and() {
    let left = this.#not();
    while (this.#isOp("&&") || keyword(this.#peek) === "and") {
      const op = this.#next();
      const right = this.#not();
      left = this.#count({ kind: "binary", op: "and", left, right, start: left.start, end: right.end, opStart: op.start });
    }
    return left;
  }
  #not() {
    if (this.#isOp("!") || keyword(this.#peek) === "not") {
      const op = this.#next();
      this.#enter(op);
      const arg = this.#not();
      this.#depth--;
      return this.#count({ kind: "not", arg, start: op.start, end: arg.end });
    }
    return this.#comparison();
  }
  #comparison() {
    const left = this.#sum();
    const token = this.#peek;
    if (token.kind === "op" && [">", "<", ">=", "<=", "==", "!="].includes(token.text)) {
      this.#next();
      const right = this.#sum();
      const next = this.#peek;
      if (next.kind === "op" && [">", "<", ">=", "<=", "==", "!="].includes(next.text)) {
        fail(
          l("Zwei Vergleiche hintereinander gehen nicht; mit „and“ verbinden, etwa a > 1 and a < 5", 'Two comparisons in a row do not work; join them with "and", e.g. a > 1 and a < 5'),
          next.start,
          next.end
        );
      }
      return this.#count({ kind: "binary", op: token.text, left, right, start: left.start, end: right.end, opStart: token.start });
    }
    return left;
  }
  #sum() {
    let left = this.#product();
    while (this.#isOp("+") || this.#isOp("-")) {
      const op = this.#next();
      const right = this.#product();
      left = this.#count({ kind: "binary", op: op.text, left, right, start: left.start, end: right.end, opStart: op.start });
    }
    return left;
  }
  #product() {
    let left = this.#unary();
    while (this.#isOp("*") || this.#isOp("/") || this.#isOp("%")) {
      const op = this.#next();
      const right = this.#unary();
      left = this.#count({ kind: "binary", op: op.text, left, right, start: left.start, end: right.end, opStart: op.start });
    }
    return left;
  }
  #unary() {
    if (this.#isOp("-") || this.#isOp("+")) {
      const op = this.#next();
      this.#enter(op);
      const arg = this.#unary();
      this.#depth--;
      if (op.text === "+") return arg;
      return this.#count({ kind: "neg", arg, start: op.start, end: arg.end });
    }
    return this.#power();
  }
  #power() {
    const base = this.#postfix();
    if (this.#isOp("^")) {
      const op = this.#next();
      this.#enter(op);
      const exponent = this.#unary();
      this.#depth--;
      return this.#count({ kind: "binary", op: "^", left: base, right: exponent, start: base.start, end: exponent.end, opStart: op.start });
    }
    return base;
  }
  #postfix() {
    let node = this.#primary();
    while (this.#isOp("[")) {
      this.#next();
      const offset = this.#expression();
      const close = this.#expect("]", l("Hier fehlt die schließende eckige Klammer „]“", 'The closing bracket "]" is missing here'));
      node = this.#count({ kind: "index", target: node, offset, start: node.start, end: close.end });
    }
    return node;
  }
  #primary() {
    const token = this.#next();
    if (token.kind === "num") return this.#count({ kind: "num", value: token.value, start: token.start, end: token.end });
    if (token.kind === "name") {
      const word = keyword(token);
      if (word === "true" || word === "false") return this.#count({ kind: "bool", value: word === "true", start: token.start, end: token.end });
      if (word) fail(l(`„${token.text}“ braucht links und rechts einen Wert`, `"${token.text}" needs a value on both sides`), token.start, token.end);
      if (this.#isOp("(")) {
        this.#next();
        const args = [];
        if (!this.#isOp(")")) {
          for (; ; ) {
            args.push(this.#expression());
            if (this.#isOp(",")) {
              this.#next();
              continue;
            }
            break;
          }
        }
        const close = this.#expect(")", l(`Hier fehlt die schließende Klammer von ${token.text}( … )`, `The closing parenthesis of ${token.text}( … ) is missing here`));
        return this.#count({ kind: "call", name: token.text, args, start: token.start, end: close.end, nameEnd: token.end });
      }
      return this.#count({ kind: "name", name: token.text, start: token.start, end: token.end });
    }
    if (token.kind === "op" && token.text === "(") {
      const inner = this.#expression();
      this.#expect(")", l("Hier fehlt eine schließende Klammer „)“", 'A closing parenthesis ")" is missing here'));
      return inner;
    }
    if (token.kind === "end") fail(l("Die Formel hört mitten drin auf; hier fehlt ein Wert", "The formula stops in the middle; a value is missing here"), token.start, token.end);
    fail(l(`Hier fehlt ein Wert vor „${token.text}“`, `A value is missing before "${token.text}"`), token.start, token.end);
  }
};
function parseFormula(text) {
  if (text.length > FORMULA_LIMITS.chars) {
    return {
      ok: false,
      issue: {
        message: l(`Die Formel ist zu lang, höchstens ${FORMULA_LIMITS.chars} Zeichen`, `The formula is too long, at most ${FORMULA_LIMITS.chars} characters`),
        start: FORMULA_LIMITS.chars,
        end: text.length
      }
    };
  }
  try {
    return { ok: true, ast: new Parser(tokenize(text)).parse() };
  } catch (error) {
    if (error instanceof FormulaSyntaxError) return { ok: false, issue: error.issue };
    throw error;
  }
}
var ema5 = ([n = 1]) => 5 * n;
var rma10 = ([n = 1]) => 10 * n + 1;
var window1 = ([n = 1]) => n;
var FORMULA_FUNCTIONS = {
  sma: {
    group: "average",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("sma(Wert, Kerzen)", "sma(value, candles)"),
    help: l("Einfacher Durchschnitt: jede Kerze zählt gleich.", "Simple average: every candle counts the same."),
    example: "sma(price, 50)"
  },
  ema: {
    group: "average",
    params: ["number", "length"],
    returns: "number",
    warmup: ema5,
    signature: l("ema(Wert, Kerzen)", "ema(value, candles)"),
    help: l("Exponentieller Durchschnitt: neue Kerzen zählen mehr.", "Exponential average: recent candles count more."),
    example: "ema(price, 200)"
  },
  wma: {
    group: "average",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("wma(Wert, Kerzen)", "wma(value, candles)"),
    help: l("Gewichteter Durchschnitt: das Gewicht nimmt gleichmäßig ab.", "Weighted average: the weight drops evenly."),
    example: "wma(price, 20)"
  },
  rma: {
    group: "average",
    params: ["number", "length"],
    returns: "number",
    warmup: rma10,
    signature: l("rma(Wert, Kerzen)", "rma(value, candles)"),
    help: l("Geglätteter Durchschnitt nach Wilder, wie im RSI und in der ATR.", "Wilder’s smoothed average, as used in the RSI and the ATR."),
    example: "rma(price, 14)"
  },
  hma: {
    group: "average",
    params: ["number", "length"],
    returns: "number",
    warmup: ([n = 2]) => n + Math.floor(Math.sqrt(n)),
    signature: l("hma(Wert, Kerzen)", "hma(value, candles)"),
    help: l("Hull-Durchschnitt: schnell und trotzdem glatt.", "Hull average: fast and still smooth."),
    example: "hma(price, 21)"
  },
  rsi: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: rma10,
    signature: l("rsi(Wert, Kerzen)", "rsi(value, candles)"),
    help: l("Relative Stärke von 0 bis 100.", "Relative strength from 0 to 100."),
    example: "rsi(price, 14) < 30"
  },
  stdev: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("stdev(Wert, Kerzen)", "stdev(value, candles)"),
    help: l("Standardabweichung: wie stark der Wert schwankt.", "Standard deviation: how much the value swings."),
    example: "stdev(price, 20)"
  },
  percentrank: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: ([n = 1]) => n + 1,
    signature: l("percentrank(Wert, Kerzen)", "percentrank(value, candles)"),
    help: l("Prozentrang von 0 bis 100: Anteil der Werte der Kerzen davor, die kleiner oder gleich sind.", "Percent rank from 0 to 100: share of the values of the candles before that are less than or equal."),
    example: "percentrank(volume, 100) > 95"
  },
  highest: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("highest(Wert, Kerzen)", "highest(value, candles)"),
    help: l("Höchster Wert der letzten Kerzen, die aktuelle eingeschlossen.", "Highest value of the last candles, including the current one."),
    example: "price > highest(price, 20)[1]"
  },
  lowest: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("lowest(Wert, Kerzen)", "lowest(value, candles)"),
    help: l("Tiefster Wert der letzten Kerzen, die aktuelle eingeschlossen.", "Lowest value of the last candles, including the current one."),
    example: "lowest(price, 20)"
  },
  sum: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("sum(Wert, Kerzen)", "sum(value, candles)"),
    help: l("Summe der letzten Kerzen.", "Sum of the last candles."),
    example: "sum(volume, 24)"
  },
  change: {
    group: "indicator",
    params: ["number", "length"],
    required: 1,
    returns: "number",
    warmup: ([n = 1]) => n,
    signature: l("change(Wert, Kerzen = 1)", "change(value, candles = 1)"),
    help: l("Unterschied zum Wert vor so vielen Kerzen.", "Difference from the value that many candles ago."),
    example: "change(price, 4)"
  },
  roc: {
    group: "indicator",
    params: ["number", "length"],
    required: 1,
    returns: "number",
    warmup: ([n = 1]) => n,
    signature: l("roc(Wert, Kerzen = 1)", "roc(value, candles = 1)"),
    help: l("Veränderung in Prozent gegenüber dem Wert vor so vielen Kerzen.", "Change in percent compared with the value that many candles ago."),
    example: "roc(price, 24) < -5"
  },
  prev: {
    group: "indicator",
    params: ["number", "offset"],
    required: 1,
    returns: "number",
    warmup: ([n = 1]) => n,
    signature: l("prev(Wert, Kerzen = 1)", "prev(value, candles = 1)"),
    help: l("Der Wert vor so vielen Kerzen. Kurz: Wert[1].", "The value that many candles ago. Short form: value[1]."),
    example: "price > prev(price)"
  },
  atr: {
    group: "indicator",
    params: ["number", "number", "number", "length"],
    returns: "number",
    warmup: rma10,
    signature: l("atr(Hoch, Tief, Schluss, Kerzen)", "atr(high, low, close, candles)"),
    help: l("Durchschnittliche Schwankungsbreite einer Kerze, Average True Range.", "Average range of a candle, Average True Range."),
    example: "atr(high, low, close, 14)"
  },
  tr: {
    group: "indicator",
    params: ["number", "number", "number"],
    returns: "number",
    warmup: () => 1,
    signature: l("tr(Hoch, Tief, Schluss)", "tr(high, low, close)"),
    help: l("Spanne einer Kerze samt Lücke zum Schluss davor, True Range.", "Range of a candle including the gap to the previous close, True Range."),
    example: "tr(high, low, close)"
  },
  stoch: {
    group: "indicator",
    params: ["number", "number", "number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("stoch(Wert, Hoch, Tief, Kerzen)", "stoch(value, high, low, candles)"),
    help: l(
      "Wo der Wert in der Spanne der letzten Kerzen liegt, von 0 (tiefstes Tief) bis 100 (höchstes Hoch); leer, wenn Hoch und Tief gleich sind.",
      "Where the value sits within the range of the last candles, from 0 (lowest low) to 100 (highest high); empty when high and low are equal."
    ),
    example: "sma(stoch(close, high, low, 14), 3) < 20"
  },
  cci: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("cci(Wert, Kerzen)", "cci(value, candles)"),
    help: l(
      "Abstand vom Durchschnitt im Verhältnis zur mittleren Abweichung; über 100 ungewöhnlich stark, unter −100 ungewöhnlich schwach.",
      "Distance from the average relative to the mean deviation; above 100 unusually strong, below −100 unusually weak."
    ),
    example: "cci((high + low + close) / 3, 20) > 100"
  },
  dev: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("dev(Wert, Kerzen)", "dev(value, candles)"),
    help: l("Mittlere Abweichung der letzten Werte von ihrem Durchschnitt.", "Mean deviation of the last values from their average."),
    example: "dev(price, 20)"
  },
  wpr: {
    group: "indicator",
    params: ["number", "number", "number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("wpr(Hoch, Tief, Schluss, Kerzen)", "wpr(high, low, close, candles)"),
    help: l(
      "Williams %R von −100 (Schluss am tiefsten Tief) bis 0 (am höchsten Hoch) der letzten Kerzen; leer, wenn Hoch und Tief gleich sind.",
      "Williams %R from −100 (close at the lowest low) to 0 (at the highest high) of the last candles; empty when high and low are equal."
    ),
    example: "wpr(high, low, close, 14) < -80"
  },
  mfi: {
    group: "indicator",
    params: ["number", "number", "length"],
    returns: "number",
    warmup: ([n = 1]) => n + 1,
    signature: l("mfi(Wert, Volumen, Kerzen)", "mfi(value, volume, candles)"),
    help: l(
      "Money Flow Index von 0 bis 100: wie der RSI, aber nach Volumen gewichtet; unter 20 gilt als überverkauft.",
      "Money Flow Index from 0 to 100: like the RSI, but weighted by volume; below 20 counts as oversold."
    ),
    example: "mfi((high + low + close) / 3, volume, 14) < 20"
  },
  adx: {
    group: "indicator",
    params: ["number", "number", "number", "length", "length"],
    required: 4,
    returns: "number",
    warmup: ([n = 1, m = n]) => 10 * (n + m) + 1,
    signature: l("adx(Hoch, Tief, Schluss, Kerzen, Glättung = Kerzen)", "adx(high, low, close, candles, smoothing = candles)"),
    help: l("Trendstärke von 0 bis 100, egal in welche Richtung; über 25 gilt als starker Trend.", "Trend strength from 0 to 100, whatever the direction; above 25 counts as a strong trend."),
    example: "adx(high, low, close, 14) > 25"
  },
  diplus: {
    group: "indicator",
    params: ["number", "number", "number", "length"],
    returns: "number",
    warmup: rma10,
    signature: l("diplus(Hoch, Tief, Schluss, Kerzen)", "diplus(high, low, close, candles)"),
    help: l("Stärke der Bewegung nach oben (+DI) von 0 bis 100.", "Strength of the upward movement (+DI) from 0 to 100."),
    example: "diplus(high, low, close, 14) > diminus(high, low, close, 14)"
  },
  diminus: {
    group: "indicator",
    params: ["number", "number", "number", "length"],
    returns: "number",
    warmup: rma10,
    signature: l("diminus(Hoch, Tief, Schluss, Kerzen)", "diminus(high, low, close, candles)"),
    help: l("Stärke der Bewegung nach unten (−DI) von 0 bis 100.", "Strength of the downward movement (−DI) from 0 to 100."),
    example: "crossover(diminus(high, low, close, 14), diplus(high, low, close, 14))"
  },
  linreg: {
    group: "indicator",
    params: ["number", "length", "offset"],
    required: 2,
    returns: "number",
    warmup: window1,
    signature: l("linreg(Wert, Kerzen, zurück = 0)", "linreg(value, candles, back = 0)"),
    help: l(
      "Lineare Regression: der Wert der Ausgleichsgeraden durch die letzten Kerzen, an der aktuellen oder so viele Kerzen davor.",
      "Linear regression: the value of the best-fit line through the last candles, at the current one or that many candles before."
    ),
    example: "linreg(price, 20) > linreg(price, 20)[1]"
  },
  highestbars: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("highestbars(Wert, Kerzen)", "highestbars(value, candles)"),
    help: l(
      "Wie viele Kerzen der höchste Wert der letzten Kerzen zurückliegt, 0 an der aktuellen; bei gleichen Werten zählt der jüngste.",
      "How many candles ago the highest value of the last candles was, 0 on the current one; with equal values the most recent counts."
    ),
    example: "100 * (14 - highestbars(high, 15)) / 14"
  },
  lowestbars: {
    group: "indicator",
    params: ["number", "length"],
    returns: "number",
    warmup: window1,
    signature: l("lowestbars(Wert, Kerzen)", "lowestbars(value, candles)"),
    help: l(
      "Wie viele Kerzen der tiefste Wert der letzten Kerzen zurückliegt, 0 an der aktuellen; bei gleichen Werten zählt der jüngste.",
      "How many candles ago the lowest value of the last candles was, 0 on the current one; with equal values the most recent counts."
    ),
    example: "lowestbars(low, 20) == 0"
  },
  abs: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("abs(Wert)", "abs(value)"),
    help: l("Betrag: macht negative Zahlen positiv.", "Absolute value: makes negative numbers positive."),
    example: "abs(change(price))"
  },
  min: {
    group: "math",
    params: ["number"],
    variadic: true,
    returns: "number",
    signature: l("min(a, b, …)", "min(a, b, …)"),
    help: l("Der kleinste der Werte.", "The smallest of the values."),
    example: "min(open, close)"
  },
  max: {
    group: "math",
    params: ["number"],
    variadic: true,
    returns: "number",
    signature: l("max(a, b, …)", "max(a, b, …)"),
    help: l("Der größte der Werte.", "The largest of the values."),
    example: "max(open, close)"
  },
  avg: {
    group: "math",
    params: ["number"],
    variadic: true,
    returns: "number",
    signature: l("avg(a, b, …)", "avg(a, b, …)"),
    help: l("Durchschnitt der Werte an derselben Kerze.", "Average of the values on the same candle."),
    example: "avg(high, low, close)"
  },
  sqrt: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("sqrt(Wert)", "sqrt(value)"),
    help: l("Quadratwurzel; bei negativen Werten leer.", "Square root; empty for negative values."),
    example: "sqrt(abs(change(price)))"
  },
  pow: {
    group: "math",
    params: ["number", "number"],
    returns: "number",
    signature: l("pow(Wert, Hochzahl)", "pow(value, exponent)"),
    help: l("Potenz, wie Wert ^ Hochzahl.", "Power, like value ^ exponent."),
    example: "pow(change(price), 2)"
  },
  log: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("log(Wert)", "log(value)"),
    help: l("Natürlicher Logarithmus; bei 0 und negativen Werten leer.", "Natural logarithm; empty for 0 and negative values."),
    example: "log(price / prev(price))"
  },
  exp: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("exp(Wert)", "exp(value)"),
    help: l("e hoch Wert.", "e to the power of the value."),
    example: "exp(1)"
  },
  round: {
    group: "math",
    params: ["number", "digits"],
    required: 1,
    returns: "number",
    signature: l("round(Wert, Stellen = 0)", "round(value, digits = 0)"),
    help: l("Rundet auf so viele Nachkommastellen.", "Rounds to that many decimal places."),
    example: "round(rsi(price, 14), 1)"
  },
  floor: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("floor(Wert)", "floor(value)"),
    help: l("Rundet ab auf eine ganze Zahl.", "Rounds down to a whole number."),
    example: "floor(price / 1000) * 1000"
  },
  ceil: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("ceil(Wert)", "ceil(value)"),
    help: l("Rundet auf auf eine ganze Zahl.", "Rounds up to a whole number."),
    example: "ceil(price / 1000) * 1000"
  },
  sign: {
    group: "math",
    params: ["number"],
    returns: "number",
    signature: l("sign(Wert)", "sign(value)"),
    help: l("1 bei positiven, -1 bei negativen Werten, sonst 0.", "1 for positive, -1 for negative values, otherwise 0."),
    example: "sign(change(price))"
  },
  clamp: {
    group: "math",
    params: ["number", "number", "number"],
    returns: "number",
    signature: l("clamp(Wert, unten, oben)", "clamp(value, low, high)"),
    help: l("Begrenzt den Wert auf einen Bereich.", "Limits the value to a range."),
    example: "clamp(rsi(price, 14), 20, 80)"
  },
  nz: {
    group: "math",
    params: ["number", "number"],
    required: 1,
    returns: "number",
    signature: l("nz(Wert, Ersatz = 0)", "nz(value, fallback = 0)"),
    help: l("Setzt den Ersatz ein, solange der Wert noch leer ist, etwa im Vorlauf.", "Uses the fallback while the value is still empty, e.g. during warm-up."),
    example: "nz(volume)"
  },
  crossover: {
    group: "signal",
    params: ["number", "number"],
    returns: "bool",
    warmup: () => 1,
    signature: l("crossover(a, b)", "crossover(a, b)"),
    help: l("Wahr in der Kerze, in der a von unten über b steigt.", "True on the candle where a rises from below to above b."),
    example: "crossover(ema(price, 50), ema(price, 200))"
  },
  crossunder: {
    group: "signal",
    params: ["number", "number"],
    returns: "bool",
    warmup: () => 1,
    signature: l("crossunder(a, b)", "crossunder(a, b)"),
    help: l("Wahr in der Kerze, in der a von oben unter b fällt.", "True on the candle where a falls from above to below b."),
    example: "crossunder(price, sma(price, 200))"
  },
  cross: {
    group: "signal",
    params: ["number", "number"],
    returns: "bool",
    warmup: () => 1,
    signature: l("cross(a, b)", "cross(a, b)"),
    help: l("Wahr in der Kerze, in der a die Linie b in eine der beiden Richtungen kreuzt.", "True on the candle where a crosses line b in either direction."),
    example: "cross(price, 100000)"
  },
  rising: {
    group: "signal",
    params: ["number", "length"],
    required: 1,
    returns: "bool",
    warmup: ([n = 1]) => n,
    signature: l("rising(Wert, Kerzen = 1)", "rising(value, candles = 1)"),
    help: l("Wahr, wenn der Wert höher ist als an jeder der Kerzen davor.", "True when the value is higher than on each of the candles before."),
    example: "rising(volume, 3)"
  },
  falling: {
    group: "signal",
    params: ["number", "length"],
    required: 1,
    returns: "bool",
    warmup: ([n = 1]) => n,
    signature: l("falling(Wert, Kerzen = 1)", "falling(value, candles = 1)"),
    help: l("Wahr, wenn der Wert tiefer ist als an jeder der Kerzen davor.", "True when the value is lower than on each of the candles before."),
    example: "falling(price, 3)"
  },
  holds: {
    group: "signal",
    params: ["bool", "length"],
    returns: "bool",
    warmup: window1,
    signature: l("holds(Signal, Kerzen)", "holds(signal, candles)"),
    help: l("Wahr, wenn das Signal so viele Kerzen in Folge wahr ist.", "True when the signal has been true for that many candles in a row."),
    example: "holds(price < ema(price, 200), 3)"
  },
  count: {
    group: "signal",
    params: ["bool", "length"],
    returns: "number",
    warmup: window1,
    signature: l("count(Signal, Kerzen)", "count(signal, candles)"),
    help: l("Wie oft das Signal in den letzten Kerzen wahr war.", "How often the signal was true in the last candles."),
    example: "count(close > open, 5) >= 4"
  },
  barssince: {
    group: "signal",
    params: ["bool"],
    returns: "number",
    signature: l("barssince(Signal)", "barssince(signal)"),
    help: l("Kerzen, seit das Signal zuletzt wahr war; leer, solange es nie wahr war.", "Candles since the signal was last true; empty while it has never been true."),
    example: "barssince(crossover(price, ema(price, 50))) <= 3"
  },
  if: {
    group: "signal",
    params: ["bool", "number", "number"],
    returns: "number",
    signature: l("if(Bedingung, dann, sonst)", "if(condition, then, else)"),
    help: l("Wählt je Kerze einen von zwei Werten, wie Bedingung ? dann : sonst.", "Picks one of two values per candle, like condition ? then : else."),
    example: "if(close > open, high, low)"
  }
};
var FORMULA_GROUPS = {
  average: l("Durchschnitte", "Averages"),
  indicator: l("Indikatoren", "Indicators"),
  math: l("Rechnen", "Math"),
  signal: l("Signale", "Signals")
};
function isFormulaFunction(name4) {
  return Object.hasOwn(FORMULA_FUNCTIONS, name4.toLowerCase());
}
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_2, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = d[i];
      const above = d[i - 1];
      row[j] = Math.min(above[j] + 1, row[j - 1] + 1, above[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
function suggestion(name4, candidates) {
  let best;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const d = candidate.toLowerCase() === name4.toLowerCase() ? 0 : distance(name4.toLowerCase(), candidate.toLowerCase());
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best !== void 0 && bestDistance <= Math.max(1, Math.floor(name4.length / 3)) ? best : void 0;
}
var TYPE_NAME = {
  number: l("eine Zahl", "a number"),
  bool: l("ein Signal (wahr/falsch)", "a signal (true/false)")
};
function rangeOf(a, b, fn) {
  if (!a.range || !b.range) return void 0;
  const values = [fn(a.range[0], b.range[0]), fn(a.range[0], b.range[1]), fn(a.range[1], b.range[0]), fn(a.range[1], b.range[1])];
  if (values.some((v) => !Number.isFinite(v))) return void 0;
  return [Math.min(...values), Math.max(...values)];
}
function constantRange(name4, infos) {
  const ranges = infos.map((info) => info.range);
  if (ranges.some((range2) => range2 === void 0)) return void 0;
  const r = ranges;
  const first = r[0];
  const monotone = {
    floor: ([x = 0]) => Math.floor(x),
    ceil: ([x = 0]) => Math.ceil(x),
    round: ([x = 0]) => Math.round(x),
    min: (xs) => Math.min(...xs),
    max: (xs) => Math.max(...xs),
    sqrt: ([x = 0]) => Math.sqrt(x)
  };
  const fn = monotone[name4];
  if (fn) {
    if (name4 === "sqrt" && first[0] < 0) return void 0;
    return [fn(r.map((range2) => range2[0])), fn(r.map((range2) => range2[1]))];
  }
  if (name4 === "abs") {
    const [lo, hi] = first;
    if (lo >= 0) return [lo, hi];
    if (hi <= 0) return [-hi, -lo];
    return [0, Math.max(-lo, hi)];
  }
  return void 0;
}
var Checker = class {
  #env;
  issues = [];
  windowCalls = 0;
  /** Namen, die die Formel liest. */
  names = /* @__PURE__ */ new Set();
  constructor(env) {
    this.#env = env;
  }
  #issue(message2, node) {
    this.issues.push({ message: message2, start: node.start, end: Math.max(node.end, node.start + 1) });
  }
  #want(node, info, type, what) {
    if (info.type === type) return;
    this.#issue(
      l(`${what.de} muss ${TYPE_NAME[type].de} sein, hier steht ${TYPE_NAME[info.type].de}`, `${what.en} must be ${TYPE_NAME[type].en}, this is ${TYPE_NAME[info.type].en}`),
      node
    );
  }
  /** Feste Länge in Kerzen: Zahl oder Einstellung, im erlaubten Bereich. */
  #length(node, info, min, what) {
    if (info.type !== "number") {
      this.#want(node, info, "number", what);
      return;
    }
    if (!info.constant) {
      this.#issue(
        l(
          `${what.de} muss eine feste Zahl oder eine Einstellung sein, keine Reihe; etwa 14 oder length`,
          `${what.en} must be a fixed number or a setting, not a series; e.g. 14 or length`
        ),
        node
      );
      return;
    }
    const range2 = info.range;
    if (!range2) {
      this.#issue(
        l(
          `${what.de} lässt sich nicht im Voraus prüfen; eine Zahl oder eine Einstellung mit Mindest- und Höchstwert nehmen`,
          `${what.en} cannot be checked in advance; use a number or a setting with a minimum and maximum`
        ),
        node
      );
      return;
    }
    const lo = Math.floor(range2[0]);
    const hi = Math.floor(range2[1]);
    if (lo < min || hi > FORMULA_LIMITS.window) {
      const shown = lo === hi ? `${lo}` : `${lo} … ${hi}`;
      this.#issue(
        l(
          `${what.de} ist ${shown}; erlaubt sind ${min} bis ${FORMULA_LIMITS.window} Kerzen`,
          `${what.en} is ${shown}; allowed are ${min} to ${FORMULA_LIMITS.window} candles`
        ),
        node
      );
    }
  }
  check(node) {
    switch (node.kind) {
      case "num":
        return { type: "number", constant: true, range: [node.value, node.value] };
      case "bool":
        return { type: "bool", constant: true };
      case "name": {
        const symbol = this.#env.get(node.name);
        if (!symbol) {
          const hint = isFormulaFunction(node.name) ? l(` ${node.name} ist eine Funktion und braucht Klammern, etwa ${node.name}(…)`, ` ${node.name} is a function and needs parentheses, e.g. ${node.name}(…)`) : (() => {
            const near = suggestion(node.name, this.#env.keys());
            return near ? l(` Gemeint ist vielleicht „${near}“.`, ` Perhaps you mean "${near}".`) : l("", "");
          })();
          this.#issue(l(`Unbekannter Name „${node.name}“.${hint.de}`, `Unknown name "${node.name}".${hint.en}`), node);
          return { type: "number", constant: false };
        }
        this.names.add(node.name);
        if (symbol.kind === "setting") {
          return {
            type: "number",
            constant: true,
            ...symbol.min !== void 0 && symbol.max !== void 0 ? { range: [symbol.min, symbol.max] } : {}
          };
        }
        return { type: symbol.type, constant: false };
      }
      case "neg": {
        const arg = this.check(node.arg);
        this.#want(node.arg, arg, "number", l("Der Wert nach dem Minus", "The value after the minus"));
        return { type: "number", constant: arg.constant, ...arg.range ? { range: [-arg.range[1], -arg.range[0]] } : {} };
      }
      case "not": {
        const arg = this.check(node.arg);
        this.#want(node.arg, arg, "bool", l("Der Wert nach „not“", 'The value after "not"'));
        return { type: "bool", constant: arg.constant };
      }
      case "binary":
        return this.#binary(node);
      case "cond": {
        const test = this.check(node.test);
        this.#want(node.test, test, "bool", l("Die Bedingung vor „?“", 'The condition before "?"'));
        const then = this.check(node.then);
        const otherwise = this.check(node.otherwise);
        if (then.type !== otherwise.type) {
          this.#issue(
            l("Beide Fälle nach „?“ und „:“ müssen von derselben Art sein, beide Zahlen oder beide Signale", 'Both cases after "?" and ":" must be of the same kind, both numbers or both signals'),
            node.otherwise
          );
        }
        return { type: then.type, constant: false };
      }
      case "index": {
        const target = this.check(node.target);
        this.#want(node.target, target, "number", l("Der Wert vor [ ]", "The value before [ ]"));
        const offset = this.check(node.offset);
        this.windowCalls++;
        this.#length(node.offset, offset, 0, l("Die Zahl in [ ]", "The number in [ ]"));
        return { type: "number", constant: false };
      }
      case "call":
        return this.#call(node);
    }
  }
  #binary(node) {
    const left = this.check(node.left);
    const right = this.check(node.right);
    const opSpan = { start: node.opStart, end: node.opStart + (node.op.length > 2 ? 3 : node.op.length) };
    if (node.op === "and" || node.op === "or") {
      this.#want(node.left, left, "bool", l(`Links von „${node.op}“`, `Left of "${node.op}"`));
      this.#want(node.right, right, "bool", l(`Rechts von „${node.op}“`, `Right of "${node.op}"`));
      return { type: "bool", constant: left.constant && right.constant };
    }
    if (node.op === "==" || node.op === "!=") {
      if (left.type !== right.type) {
        this.#issue(l("Links und rechts vom Vergleich müssen gleich sein: zwei Zahlen oder zwei Signale", "Both sides of the comparison must match: two numbers or two signals"), opSpan);
      }
      return { type: "bool", constant: left.constant && right.constant };
    }
    const comparison = node.op === ">" || node.op === "<" || node.op === ">=" || node.op === "<=";
    for (const [side, info, label] of [
      [node.left, left, l(`Links von „${node.op}“`, `Left of "${node.op}"`)],
      [node.right, right, l(`Rechts von „${node.op}“`, `Right of "${node.op}"`)]
    ]) {
      if (info.type === "bool") {
        this.#issue(
          l(
            `${label.de} steht ein Signal (wahr/falsch); mit „${node.op}“ rechnet man nur mit Zahlen`,
            `${label.en} is a signal (true/false); "${node.op}" only works with numbers`
          ),
          side
        );
      }
    }
    if (comparison) return { type: "bool", constant: left.constant && right.constant };
    const constant2 = left.constant && right.constant;
    const fns = {
      "+": (x, y) => x + y,
      "-": (x, y) => x - y,
      "*": (x, y) => x * y,
      "/": (x, y) => x / y,
      "%": (x, y) => x % y,
      "^": (x, y) => x ** y
    };
    const op = fns[node.op];
    const range2 = constant2 && op && node.op !== "%" && !(node.op === "/" && right.range && right.range[0] <= 0 && right.range[1] >= 0) ? rangeOf(left, right, op) : void 0;
    return { type: "number", constant: constant2, ...range2 ? { range: range2 } : {} };
  }
  #call(node) {
    const name4 = node.name.toLowerCase();
    const spec = FORMULA_FUNCTIONS[name4];
    const nameSpan = { start: node.start, end: node.nameEnd };
    if (!spec) {
      const symbol = this.#env.get(node.name);
      if (symbol) {
        this.#issue(l(`„${node.name}“ ist ein Wert, keine Funktion; ohne Klammern schreiben`, `"${node.name}" is a value, not a function; write it without parentheses`), nameSpan);
      } else {
        const near = suggestion(name4, Object.keys(FORMULA_FUNCTIONS));
        const hint = near ? l(` Gemeint ist vielleicht ${near}(…).`, ` Perhaps you mean ${near}(…).`) : l("", "");
        this.#issue(l(`Unbekannte Funktion „${node.name}“.${hint.de}`, `Unknown function "${node.name}".${hint.en}`), nameSpan);
      }
      for (const arg of node.args) this.check(arg);
      return { type: "number", constant: false };
    }
    const required = spec.variadic ? 2 : spec.required ?? spec.params.length;
    const most = spec.variadic ? 16 : spec.params.length;
    if (node.args.length < required || node.args.length > most) {
      const count2 = spec.variadic ? l("mindestens 2 Werte", "at least 2 values") : required === most ? l(`${most} Werte`, `${most} values`) : l(`${required} bis ${most} Werte`, `${required} to ${most} values`);
      this.#issue(l(`${name4} braucht ${count2.de}: ${spec.signature.de}`, `${name4} needs ${count2.en}: ${spec.signature.en}`), nameSpan);
    }
    const infos = [];
    node.args.forEach((arg, index) => {
      const kind = spec.variadic ? spec.params[0] : spec.params[index];
      const info = this.check(arg);
      infos.push(info);
      if (!kind) return;
      const what = l(`Wert ${index + 1} von ${name4}`, `Value ${index + 1} of ${name4}`);
      if (kind === "number") this.#want(arg, info, "number", what);
      else if (kind === "bool") this.#want(arg, info, "bool", what);
      else if (kind === "length") {
        this.#length(arg, info, 1, l(`Die Kerzenzahl von ${name4}`, `The candle count of ${name4}`));
      } else if (kind === "offset") {
        this.#length(arg, info, 0, l(`Die Kerzenzahl von ${name4}`, `The candle count of ${name4}`));
      } else if (kind === "digits") {
        if (!info.constant || info.type !== "number" || !info.range || info.range[0] < 0 || info.range[1] > 8) {
          this.#issue(l("Die Stellen müssen eine feste Zahl von 0 bis 8 sein", "The digits must be a fixed number from 0 to 8"), arg);
        }
      }
    });
    if (spec.params.includes("length") || spec.params.includes("offset")) this.windowCalls++;
    if (spec.group !== "math" || infos.length === 0 || !infos.every((info) => info.constant && info.type === "number")) {
      return { type: spec.returns, constant: false };
    }
    const range2 = constantRange(name4, infos);
    return { type: "number", constant: true, ...range2 ? { range: range2 } : {} };
  }
};
function checkFormula(text, env, expect) {
  const parsed = parseFormula(text);
  if (!parsed.ok) return { ok: false, issues: [parsed.issue], names: /* @__PURE__ */ new Set() };
  const checker = new Checker(env);
  const info = checker.check(parsed.ast);
  if (checker.windowCalls > FORMULA_LIMITS.windowCalls) {
    checker.issues.push({
      message: l(
        `Die Formel rechnet zu viele Durchschnitte und Fenster, höchstens ${FORMULA_LIMITS.windowCalls}`,
        `The formula computes too many averages and windows, at most ${FORMULA_LIMITS.windowCalls}`
      ),
      start: 0,
      end: text.length
    });
  }
  if (expect && info.type !== expect && checker.issues.length === 0) {
    checker.issues.push({
      message: expect === "bool" ? l("Die Formel ergibt eine Zahl, hier ist ein Signal gefragt; etwa mit einem Vergleich wie rsi(price, 14) < 30", "The formula gives a number, a signal is needed here; e.g. with a comparison like rsi(price, 14) < 30") : l("Die Formel ergibt ein Signal, hier ist eine Zahl gefragt", "The formula gives a signal, a number is needed here"),
      start: parsed.ast.start,
      end: parsed.ast.end
    });
  }
  return { ok: checker.issues.length === 0, ast: parsed.ast, type: info.type, issues: checker.issues, names: checker.names };
}
var FormulaEvalError = class extends Error {
  constructor(message2) {
    super(message2);
    this.name = "FormulaEvalError";
  }
};
function numberSeries(value, length) {
  if (value.kind === "number") return value.series;
  if (value.kind === "const") return new Array(length).fill(Number.isFinite(value.value) ? value.value : null);
  throw new FormulaEvalError("Zahl erwartet, Signal erhalten");
}
function boolSeries(value, length) {
  if (value.kind === "bool") return value.series;
  if (value.kind === "constBool") return new Array(length).fill(value.value);
  throw new FormulaEvalError("Signal erwartet, Zahl erhalten");
}
function operand(value) {
  if (value.kind === "const") return value.value;
  if (value.kind === "number") return value.series;
  throw new FormulaEvalError("Zahl erwartet, Signal erhalten");
}
function constant(value) {
  if (value.kind !== "const") throw new FormulaEvalError("feste Zahl erwartet");
  return value.value;
}
function windowLength(value, min) {
  const n = Math.floor(constant(value));
  if (!Number.isFinite(n) || n < min || n > FORMULA_LIMITS.window) {
    throw new FormulaEvalError(`Länge ${n} liegt außerhalb von ${min} bis ${FORMULA_LIMITS.window}`);
  }
  return n;
}
function valueAt2(source, i) {
  return typeof source === "number" ? source : source[i] ?? null;
}
function zipNumbers(values, length, fn) {
  if (values.every((v) => v.kind === "const")) return { kind: "const", value: fn(values.map((v) => v.value)) };
  const columns = values.map(operand);
  const out = new Array(length).fill(null);
  const row = new Array(columns.length);
  outer: for (let i = 0; i < length; i++) {
    for (let k = 0; k < columns.length; k++) {
      const x = valueAt2(columns[k], i);
      if (x == null) continue outer;
      row[k] = x;
    }
    const r = fn(row);
    out[i] = Number.isFinite(r) ? r : null;
  }
  return { kind: "number", series: out };
}
function mapNumber(value, length, fn) {
  return zipNumbers([value], length, ([x = 0]) => fn(x));
}
var Evaluator = class {
  #ctx;
  constructor(ctx) {
    this.#ctx = ctx;
  }
  run(node) {
    const n = this.#ctx.length;
    switch (node.kind) {
      case "num":
        return { kind: "const", value: node.value };
      case "bool":
        return { kind: "constBool", value: node.value };
      case "name": {
        if (Object.hasOwn(this.#ctx.settings, node.name)) return { kind: "const", value: this.#ctx.settings[node.name] };
        const numbers = this.#ctx.numbers[node.name];
        if (numbers !== void 0) return { kind: "number", series: numbers };
        const signals = this.#ctx.signals[node.name];
        if (signals !== void 0) return { kind: "bool", series: signals };
        throw new FormulaEvalError(`unbekannter Name ${node.name}`);
      }
      case "neg":
        return mapNumber(this.run(node.arg), n, (x) => -x);
      case "not": {
        const arg = this.run(node.arg);
        if (arg.kind === "constBool") return { kind: "constBool", value: !arg.value };
        return { kind: "bool", series: not(boolSeries(arg, n)) };
      }
      case "binary":
        return this.#binary(node);
      case "cond":
        return this.#choose(this.run(node.test), this.run(node.then), this.run(node.otherwise));
      case "index": {
        const target = this.run(node.target);
        const offset = windowLength(this.run(node.offset), 0);
        if (target.kind === "const") return target;
        return { kind: "number", series: lag(numberSeries(target, n), offset) };
      }
      case "call":
        return this.#call(node);
    }
  }
  #choose(test, then, otherwise) {
    const n = this.#ctx.length;
    const cond = boolSeries(test, n);
    if (then.kind === "bool" || then.kind === "constBool") {
      const a2 = boolSeries(then, n);
      const b2 = boolSeries(otherwise, n);
      return { kind: "bool", series: cond.map((c, i) => c ? a2[i] === true : b2[i] === true) };
    }
    const a = numberSeries(then, n);
    const b = numberSeries(otherwise, n);
    return { kind: "number", series: cond.map((c, i) => c ? a[i] ?? null : b[i] ?? null) };
  }
  #binary(node) {
    const n = this.#ctx.length;
    const left = this.run(node.left);
    const right = this.run(node.right);
    switch (node.op) {
      case "and":
      case "or": {
        if (left.kind === "constBool" && right.kind === "constBool") {
          return { kind: "constBool", value: node.op === "and" ? left.value && right.value : left.value || right.value };
        }
        const both = [boolSeries(left, n), boolSeries(right, n)];
        return { kind: "bool", series: node.op === "and" ? all(both, n) : any(both, n) };
      }
      case "==":
      case "!=": {
        const equal = node.op === "==";
        if (left.kind === "bool" || left.kind === "constBool") {
          if (left.kind === "constBool" && right.kind === "constBool") return { kind: "constBool", value: left.value === right.value === equal };
          const a2 = boolSeries(left, n);
          const b2 = boolSeries(right, n);
          return { kind: "bool", series: a2.map((x, i) => x === b2[i] === equal) };
        }
        const a = operand(left);
        const b = operand(right);
        if (typeof a === "number" && typeof b === "number") return { kind: "constBool", value: a === b === equal };
        const out = new Array(n);
        for (let i = 0; i < n; i++) {
          const x = valueAt2(a, i);
          const y = valueAt2(b, i);
          out[i] = x != null && y != null && x === y === equal;
        }
        return { kind: "bool", series: out };
      }
      case ">":
        return compareValues(left, right, n, greater, (x, y) => x > y);
      case "<":
        return compareValues(left, right, n, less, (x, y) => x < y);
      case ">=":
        return compareValues(left, right, n, greaterEqual, (x, y) => x >= y);
      case "<=":
        return compareValues(left, right, n, lessEqual, (x, y) => x <= y);
      case "+":
        return zipNumbers([left, right], n, ([x = 0, y = 0]) => x + y);
      case "-":
        return zipNumbers([left, right], n, ([x = 0, y = 0]) => x - y);
      case "*":
        return zipNumbers([left, right], n, ([x = 0, y = 0]) => x * y);
      case "/":
        return zipNumbers([left, right], n, ([x = 0, y = 0]) => y === 0 ? Number.NaN : x / y);
      case "%":
        return zipNumbers([left, right], n, ([x = 0, y = 0]) => y === 0 ? Number.NaN : x % y);
      case "^":
        return zipNumbers([left, right], n, ([x = 0, y = 0]) => x ** y);
    }
  }
  #call(node) {
    const n = this.#ctx.length;
    const name4 = node.name.toLowerCase();
    const args = node.args.map((arg2) => this.run(arg2));
    const arg = (index) => {
      const value = args[index];
      if (value === void 0) throw new FormulaEvalError(`${name4}: Wert ${index + 1} fehlt`);
      return value;
    };
    const num2 = (index) => numberSeries(arg(index), n);
    const len = (index, fallback = 1, min = 1) => args[index] === void 0 ? fallback : windowLength(arg(index), min);
    const numbers = (values) => ({ kind: "number", series: values });
    const signal = (values) => ({ kind: "bool", series: values });
    switch (name4) {
      case "sma":
        return numbers(sma(num2(0), len(1)));
      case "ema":
        return numbers(ema(num2(0), len(1)));
      case "wma":
        return numbers(wma(num2(0), len(1)));
      case "rma":
        return numbers(rma(num2(0), len(1)));
      case "hma": {
        const length = len(1);
        return numbers(length < 2 ? [...num2(0)] : hma(num2(0), length));
      }
      case "rsi":
        return numbers(rsi(num2(0), len(1)));
      case "stdev":
        return numbers(stdev(num2(0), len(1)));
      case "percentrank":
        return numbers(percentRank(num2(0), len(1)));
      case "highest":
        return numbers(highest(num2(0), len(1)));
      case "lowest":
        return numbers(lowest(num2(0), len(1)));
      case "sum":
        return numbers(sum(num2(0), len(1)));
      case "change":
        return numbers(change(num2(0), len(1)));
      case "roc":
        return numbers(roc(num2(0), len(1)));
      case "prev":
        return numbers(lag(num2(0), len(1, 1, 0)));
      case "atr":
        return numbers(atr(num2(0), num2(1), num2(2), len(3)));
      case "tr":
        return numbers(tr(num2(0), num2(1), num2(2)));
      case "stoch":
        return numbers(stoch(num2(0), num2(1), num2(2), len(3)));
      case "cci":
        return numbers(cci(num2(0), len(1)));
      case "dev":
        return numbers(dev(num2(0), len(1)));
      case "wpr":
        return numbers(wpr(num2(0), num2(1), num2(2), len(3)));
      case "mfi":
        return numbers(mfi(num2(0), num2(1), len(2)));
      case "adx":
        return numbers(dmi(num2(0), num2(1), num2(2), len(3), len(4, len(3))).adx);
      case "diplus":
        return numbers(dmi(num2(0), num2(1), num2(2), len(3), 1).plus);
      case "diminus":
        return numbers(dmi(num2(0), num2(1), num2(2), len(3), 1).minus);
      case "linreg":
        return numbers(linreg(num2(0), len(1), len(2, 0, 0)));
      case "highestbars":
        return numbers(highestBars(num2(0), len(1)));
      case "lowestbars":
        return numbers(lowestBars(num2(0), len(1)));
      case "abs":
        return mapNumber(arg(0), n, Math.abs);
      case "sqrt":
        return mapNumber(arg(0), n, Math.sqrt);
      case "log":
        return mapNumber(arg(0), n, (x) => x > 0 ? Math.log(x) : Number.NaN);
      case "exp":
        return mapNumber(arg(0), n, Math.exp);
      case "floor":
        return mapNumber(arg(0), n, Math.floor);
      case "ceil":
        return mapNumber(arg(0), n, Math.ceil);
      case "sign":
        return mapNumber(arg(0), n, (x) => Math.sign(x) + 0);
      case "round": {
        const factor = 10 ** (args[1] === void 0 ? 0 : Math.floor(constant(arg(1))));
        return mapNumber(arg(0), n, (x) => Math.round(x * factor) / factor);
      }
      case "pow":
        return zipNumbers([arg(0), arg(1)], n, ([x = 0, y = 0]) => x ** y);
      case "min":
        return zipNumbers(args, n, (xs) => Math.min(...xs));
      case "max":
        return zipNumbers(args, n, (xs) => Math.max(...xs));
      case "avg":
        return zipNumbers(args, n, (xs) => xs.reduce((a, b) => a + b, 0) / xs.length);
      case "clamp":
        return zipNumbers([arg(0), arg(1), arg(2)], n, ([x = 0, lo = 0, hi = 0]) => Math.min(Math.max(x, lo), hi));
      case "nz": {
        const source = arg(0);
        if (source.kind === "const") return source;
        const values = numberSeries(source, n);
        const fallback = args[1] === void 0 ? 0 : operand(arg(1));
        return numbers(values.map((v, i) => v ?? valueAt2(fallback, i)));
      }
      case "crossover":
        return signal(crossover(num2(0), operand(arg(1))));
      case "crossunder":
        return signal(crossunder(num2(0), operand(arg(1))));
      case "cross":
        return signal(cross(num2(0), operand(arg(1))));
      case "rising":
        return signal(increasing(num2(0), len(1)));
      case "falling":
        return signal(decreasing(num2(0), len(1)));
      case "holds":
        return signal(holds(boolSeries(arg(0), n), len(1)));
      case "count":
        return numbers(count(boolSeries(arg(0), n), len(1)));
      case "barssince":
        return numbers(barsSince(boolSeries(arg(0), n)));
      case "if":
        return this.#choose(arg(0), arg(1), arg(2));
      default:
        throw new FormulaEvalError(`unbekannte Funktion ${name4}`);
    }
  }
};
function compareValues(left, right, n, vector, scalar) {
  const a = operand(left);
  const b = operand(right);
  if (typeof a === "number" && typeof b === "number") return { kind: "constBool", value: Number.isFinite(a) && Number.isFinite(b) && scalar(a, b) };
  const out = vector(a, b);
  return { kind: "bool", series: out.length === n ? out : new Array(n).fill(false) };
}
function evaluateFormula(ast, ctx, type) {
  const value = new Evaluator(ctx).run(ast);
  if (type === "bool") return [...boolSeries(value, ctx.length)];
  return numberSeries(value, ctx.length).map((v) => v !== null && Number.isFinite(v) ? v : null);
}
function formulaWarmup(ast, settings, outputs = {}) {
  const evaluator = new Evaluator({ length: 0, numbers: {}, signals: {}, settings });
  const constValue = (node) => {
    try {
      const value = evaluator.run(node);
      return value.kind === "const" && Number.isFinite(value.value) ? Math.max(0, Math.floor(value.value)) : 0;
    } catch {
      return 0;
    }
  };
  const walk = (node) => {
    switch (node.kind) {
      case "num":
      case "bool":
        return 0;
      case "name":
        return outputs[node.name] ?? 0;
      case "neg":
      case "not":
        return walk(node.arg);
      case "binary":
        return Math.max(walk(node.left), walk(node.right));
      case "cond":
        return Math.max(walk(node.test), walk(node.then), walk(node.otherwise));
      case "index":
        return walk(node.target) + constValue(node.offset);
      case "call": {
        const spec = FORMULA_FUNCTIONS[node.name.toLowerCase()];
        const inner = Math.max(0, ...node.args.map(walk));
        if (!spec?.warmup) return inner;
        const lengths = [];
        spec.params.forEach((kind, index) => {
          if (kind !== "length" && kind !== "offset") return;
          const value = node.args[index];
          if (value !== void 0) lengths.push(constValue(value));
        });
        return inner + spec.warmup(lengths);
      }
    }
  };
  return walk(ast);
}

// packages/node-spec/src/runtime.ts
var NodeComputeError = class extends Error {
  nodeType;
  constructor(nodeType, message2, options) {
    super(`${nodeType}: ${message2}`, options);
    this.name = "NodeComputeError";
    this.nodeType = nodeType;
  }
};
function isTextValue(value) {
  if (typeof value !== "object" || value === null) return false;
  const record = value;
  return typeof record["template"] === "string" && typeof record["values"] === "object" && record["values"] !== null;
}
function checkOutputSeries(definition, pin, type, value, length) {
  if (!Array.isArray(value)) throw new NodeComputeError(definition.id, `Ausgang ${pin} ist keine Reihe`);
  if (value.length !== length) {
    throw new NodeComputeError(definition.id, `Ausgang ${pin} hat ${value.length} statt ${length} Werte`);
  }
  if (type === "series") {
    let clean;
    for (let i = 0; i < length; i++) {
      const v = value[i];
      if (v === null) continue;
      if (typeof v !== "number") throw new NodeComputeError(definition.id, `Ausgang ${pin}[${i}] ist keine Zahl`);
      if (!Number.isFinite(v)) {
        clean ??= [...value];
        clean[i] = null;
      }
    }
    return clean ?? value;
  }
  if (type === "signal") {
    for (let i = 0; i < length; i++) {
      if (typeof value[i] !== "boolean") throw new NodeComputeError(definition.id, `Ausgang ${pin}[${i}] ist kein Wahrheitswert`);
    }
    return value;
  }
  for (let i = 0; i < length; i++) {
    const v = value[i];
    if (v !== null && !isTextValue(v)) throw new NodeComputeError(definition.id, `Ausgang ${pin}[${i}] ist keine Nachricht`);
  }
  return value;
}
function checkOutputValue(definition, pin, type, value) {
  if (type === "series") {
    if (value === null) return null;
    if (typeof value !== "number") throw new NodeComputeError(definition.id, `Ausgang ${pin} ist keine Zahl`);
    return Number.isFinite(value) ? value : null;
  }
  if (type === "signal") {
    if (typeof value !== "boolean") throw new NodeComputeError(definition.id, `Ausgang ${pin} ist kein Wahrheitswert`);
    return value;
  }
  if (value !== null && !isTextValue(value)) throw new NodeComputeError(definition.id, `Ausgang ${pin} ist keine Nachricht`);
  return value;
}
function checkOutputs(definition, result, length) {
  if (typeof result !== "object" || result === null) throw new NodeComputeError(definition.id, "compute() muss ein Objekt liefern");
  const record = result;
  const outputs = {};
  for (const pin of definition.outputs) {
    outputs[pin.id] = checkOutputSeries(definition, pin.id, pin.type, record[pin.id], length);
  }
  for (const key of Object.keys(record)) {
    if (!definition.outputs.some((pin) => pin.id === key)) throw new NodeComputeError(definition.id, `unbekannter Ausgang ${key}`);
  }
  return outputs;
}
function inputsAtBar(definition, inputs2, index) {
  const values = {};
  for (const spec of definition.inputs) {
    const value = inputs2[spec.id];
    if (spec.variadic) {
      values[spec.id] = (value ?? []).map((series) => series[index] ?? null);
    } else if (value === void 0) {
      values[spec.id] = void 0;
    } else {
      const series = value;
      values[spec.id] = series[index] ?? (spec.type === "signal" ? false : null);
    }
  }
  return values;
}
function computeNode(definition, ctx, initialState) {
  const length = ctx.bars.length;
  if (definition.state) {
    let state = initialState ? initialState.state : definition.state.init(ctx.settings);
    const series = {};
    for (const pin of definition.outputs) series[pin.id] = new Array(length);
    for (let index = 0; index < length; index++) {
      const result2 = stepNode(definition, state, inputsAtBar(definition, ctx.inputs, index), ctx.settings, {
        index,
        openTime: ctx.bars.openTime[index] ?? 0,
        closeTime: ctx.bars.closeTime[index] ?? 0
      });
      state = result2.state;
      for (const pin of definition.outputs) series[pin.id][index] = result2.outputs[pin.id];
    }
    return { outputs: series, state: { state } };
  }
  if (!definition.compute) return { outputs: {} };
  let result;
  try {
    result = definition.compute({
      inputs: ctx.inputs,
      settings: ctx.settings,
      bars: ctx.bars,
      ...ctx.candles ? { candles: ctx.candles } : {},
      ...ctx.manual ? { manual: ctx.manual } : {}
    });
  } catch (error) {
    if (error instanceof NodeComputeError) throw error;
    throw new NodeComputeError(definition.id, error instanceof Error ? error.message : String(error), { cause: error });
  }
  return { outputs: checkOutputs(definition, result, length) };
}
function stepNode(definition, state, inputs2, settings, bar) {
  if (!definition.state) throw new NodeComputeError(definition.id, "hat keinen Zustand");
  let result;
  try {
    result = definition.state.step({ state, inputs: inputs2, settings, bar });
  } catch (error) {
    throw new NodeComputeError(definition.id, error instanceof Error ? error.message : String(error), { cause: error });
  }
  if (typeof result !== "object" || result === null || typeof result.outputs !== "object" || result.outputs === null) {
    throw new NodeComputeError(definition.id, "step() muss { state, outputs } liefern");
  }
  const record = result.outputs;
  const outputs = {};
  for (const pin of definition.outputs) outputs[pin.id] = checkOutputValue(definition, pin.id, pin.type, record[pin.id]);
  return { state: result.state, outputs };
}

// packages/node-spec/src/sha256.ts
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var rotr = (x, n) => x >>> n | x << 32 - n;
function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const bitLength = data.length * 8;
  const padded = new Uint8Array(data.length + 9 + 63 >> 6 << 6);
  padded.set(data);
  padded[data.length] = 128;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 2 ** 32));
  view.setUint32(padded.length - 4, bitLength >>> 0);
  const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  const w = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ w15 >>> 3;
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ w2 >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = e & f ^ ~e & g;
      const t1 = hh + s1 + ch + K[i] + w[i] >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = s0 + maj >>> 0;
      hh = g;
      g = f;
      f = e;
      e = d + t1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 >>> 0;
    }
    h[0] = h[0] + a >>> 0;
    h[1] = h[1] + b >>> 0;
    h[2] = h[2] + c >>> 0;
    h[3] = h[3] + d >>> 0;
    h[4] = h[4] + e >>> 0;
    h[5] = h[5] + f >>> 0;
    h[6] = h[6] + g >>> 0;
    h[7] = h[7] + hh >>> 0;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, "0")).join("");
}
function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value;
  const keys = Object.keys(record).filter((key) => record[key] !== void 0).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

// packages/node-spec/src/testkit.ts
function isCandleFixture(value) {
  if (typeof value !== "object" || value === null) return false;
  const v = value;
  return typeof v["name"] === "string" && isTimeframe(v["timeframe"]) && Array.isArray(v["candles"]) && JSON.stringify(v["columns"]) === JSON.stringify(["openTime", "open", "high", "low", "close", "volume"]);
}
function fixtureData(fixture) {
  const openTime = fixture.candles.map((c) => c[0]);
  return {
    bars: {
      length: openTime.length,
      timeframe: fixture.timeframe,
      openTime,
      closeTime: openTime.map((t) => nextOpenTime(t, fixture.timeframe))
    },
    candles: {
      open: fixture.candles.map((c) => c[1]),
      high: fixture.candles.map((c) => c[2]),
      low: fixture.candles.map((c) => c[3]),
      close: fixture.candles.map((c) => c[4]),
      volume: fixture.candles.map((c) => c[5])
    }
  };
}
function sliceBars(bars, length) {
  return {
    length,
    timeframe: bars.timeframe,
    openTime: bars.openTime.slice(0, length),
    closeTime: bars.closeTime.slice(0, length)
  };
}
function sliceInputs(inputs2, length) {
  const out = {};
  for (const [key, value] of Object.entries(inputs2)) {
    if (value === void 0) out[key] = void 0;
    else if (value.length > 0 && Array.isArray(value[0])) out[key] = value.map((s) => s.slice(0, length));
    else out[key] = value.slice(0, length);
  }
  return out;
}
function sliceCandles(candles, length) {
  return {
    open: candles.open.slice(0, length),
    high: candles.high.slice(0, length),
    low: candles.low.slice(0, length),
    close: candles.close.slice(0, length),
    volume: candles.volume.slice(0, length)
  };
}
function sliceContext(ctx, length) {
  return {
    inputs: sliceInputs(ctx.inputs, length),
    settings: ctx.settings,
    bars: sliceBars(ctx.bars, length),
    ...ctx.candles ? { candles: sliceCandles(ctx.candles, length) } : {},
    ...ctx.manual ? { manual: ctx.manual.slice(0, length) } : {}
  };
}
function checkCausality(definition, ctx, cuts) {
  const full = computeNode(definition, ctx).outputs;
  const n = ctx.bars.length;
  const points = cuts ?? [1, 2, Math.floor(n / 3), Math.floor(n / 2), n - 1].filter((k, i, a) => k > 0 && k < n && a.indexOf(k) === i);
  const problems = [];
  for (const k of points) {
    const part = computeNode(definition, sliceContext(ctx, k)).outputs;
    for (const pin of definition.outputs) {
      const a = part[pin.id] ?? [];
      const b = full[pin.id] ?? [];
      for (let i = 0; i < k; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
          problems.push(`${pin.id}[${i}] ändert sich, wenn Kerzen nach ${k} dazukommen`);
          break;
        }
      }
    }
  }
  return problems;
}
function checkDeterminism(definition, ctx) {
  const before = JSON.stringify(ctx.inputs);
  const a = computeNode(definition, ctx).outputs;
  const b = computeNode(definition, ctx).outputs;
  const problems = [];
  if (JSON.stringify(a) !== JSON.stringify(b)) problems.push("zwei Aufrufe liefern verschiedene Ergebnisse");
  if (JSON.stringify(ctx.inputs) !== before) problems.push("compute() verändert seine Eingänge");
  return problems;
}

// packages/node-spec/src/custom-node.ts
var CUSTOM_NODE_FORMAT = 1;
var CUSTOM_NODE_SCHEMA_URL = "https://bellchain.app/schema/node-1.json";
var CUSTOM_NODE_ID_PATTERN = /^custom\.[a-z0-9][a-z0-9-]{0,47}$/;
var CUSTOM_NODE_LIMITS = {
  inputs: 8,
  settings: 8,
  outputs: 8,
  label: 40,
  /** Länge, die in eine Zeile der Bausteinleiste passt; länger ist erlaubt, wird aber gekürzt. */
  description: 42,
  descriptionMax: 120,
  help: 1500,
  pinLabel: 24,
  /** Eigene Bausteine je Chain. */
  perChain: 20,
  /** Größe einer Beschreibung als JSON. */
  bytes: 32 * 1024
};
var CUSTOM_PIN_TYPES = ["price", "number", "signal"];
var CUSTOM_CATEGORIES = ["ind", "cond", "logic"];
var CUSTOM_NODE_TEST_FIXTURE = "btcusdt-1h-500";
var CUSTOM_NODE_TEST_LIMITS = { tests: 10, name: 80, expectations: 200 };
var DEFAULT_CUSTOM_ICON = "square-function";
var TOP_LEVEL_KEYS = /* @__PURE__ */ new Set(["$schema", "format", "id", "version", "label", "description", "help", "category", "icon", "author", "sentence", "inputs", "settings", "outputs", "tests"]);
var TEST_KEYS = ["name", "fixture", "settings", "inputs", "expectAt", "expectLast", "tolerance"];
var CANDLE_ENV = new Map(FIXTURE_COLUMNS.map((column) => [column, { kind: "input", type: "number" }]));
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function customText(value) {
  if (typeof value === "string") {
    const text = value.trim();
    return text === "" ? void 0 : { de: text, en: text };
  }
  if (!isRecord(value)) return void 0;
  const de = typeof value["de"] === "string" ? value["de"].trim() : "";
  const en = typeof value["en"] === "string" ? value["en"].trim() : "";
  if (de === "" && en === "") return void 0;
  return { de: de || en, en: en || de };
}
function textIssue(issues, path2, value, max, what, required) {
  if (value === void 0 && !required) return void 0;
  if (value !== void 0 && typeof value !== "string" && !isRecord(value)) {
    issues.push({ severity: "error", path: path2, message: l(`${what.de} muss ein Text sein`, `${what.en} must be text`) });
    return void 0;
  }
  const text = customText(value);
  if (!text) {
    if (required) issues.push({ severity: "error", path: path2, message: l(`${what.de} fehlt`, `${what.en} is missing`) });
    return void 0;
  }
  for (const locale of LOCALES) {
    if (text[locale].length > max) {
      issues.push({ severity: "error", path: path2, message: l(`${what.de} ist länger als ${max} Zeichen`, `${what.en} is longer than ${max} characters`) });
      break;
    }
  }
  return text;
}
function nameProblem(id) {
  if (isFormulaKeyword(id)) return l(`„${id}“ ist ein Wort der Formelsprache und kann kein Name sein`, `"${id}" is a word of the formula language and cannot be a name`);
  if (isFormulaFunction(id)) return l(`„${id}“ ist eine Funktion der Formelsprache und kann kein Name sein`, `"${id}" is a function of the formula language and cannot be a name`);
  return void 0;
}
function deriveCategory(inputs2, outputs) {
  if (!outputs.some((pin) => pin.type === "signal")) return "ind";
  return inputs2.length > 0 && inputs2.every((pin) => pin.type === "signal") ? "logic" : "cond";
}
function checkCustomNode(input) {
  const issues = [];
  const error = (path2, message2, range2) => issues.push({ severity: "error", path: path2, message: message2, ...range2 ? { range: range2 } : {} });
  const warning = (path2, message2) => issues.push({ severity: "warning", path: path2, message: message2 });
  if (!isRecord(input)) {
    error("/", l("Ein eigener Baustein ist ein JSON-Objekt", "A custom node is a JSON object"));
    return { ok: false, issues };
  }
  let size = 0;
  try {
    size = new TextEncoder().encode(JSON.stringify(input)).length;
  } catch {
    error("/", l("Der Baustein lässt sich nicht als JSON schreiben", "The node cannot be written as JSON"));
    return { ok: false, issues };
  }
  if (size > CUSTOM_NODE_LIMITS.bytes) {
    error("/", l(`Der Baustein ist größer als ${CUSTOM_NODE_LIMITS.bytes / 1024} KB`, `The node is larger than ${CUSTOM_NODE_LIMITS.bytes / 1024} KB`));
    return { ok: false, issues };
  }
  for (const key of Object.keys(input)) {
    if (!TOP_LEVEL_KEYS.has(key)) error(`/${key}`, l(`Unbekanntes Feld „${key}“`, `Unknown field "${key}"`));
  }
  if (input["format"] !== void 0 && input["format"] !== CUSTOM_NODE_FORMAT) {
    error("/format", l(`Unbekanntes Format ${JSON.stringify(input["format"])}; diese Version kennt Format ${CUSTOM_NODE_FORMAT}`, `Unknown format ${JSON.stringify(input["format"])}; this version knows format ${CUSTOM_NODE_FORMAT}`));
  }
  const id = input["id"];
  if (typeof id !== "string" || !CUSTOM_NODE_ID_PATTERN.test(id) || !NODE_ID_PATTERN.test(id)) {
    error("/id", l("Die Kennung beginnt mit custom. und enthält nur Kleinbuchstaben, Ziffern und Bindestriche, etwa custom.trend-abstand", "The id starts with custom. and only contains lowercase letters, digits and hyphens, e.g. custom.trend-distance"));
  }
  const version = input["version"];
  if (typeof version !== "string" || !SEMVER_PATTERN.test(version) || version.length > 40) {
    error("/version", l("Die Version hat die Form 1.0.0", "The version has the form 1.0.0"));
  }
  const label = textIssue(issues, "/label", input["label"], CUSTOM_NODE_LIMITS.label, l("Der Name", "The name"), true);
  const description = textIssue(issues, "/description", input["description"], CUSTOM_NODE_LIMITS.descriptionMax, l("Die Beschreibung", "The description"), false);
  if (description && LOCALES.some((locale) => description[locale].length > CUSTOM_NODE_LIMITS.description)) {
    warning("/description", l(`Die Beschreibung passt mit mehr als ${CUSTOM_NODE_LIMITS.description} Zeichen nicht in eine Zeile der Leiste`, `With more than ${CUSTOM_NODE_LIMITS.description} characters the description does not fit on one line of the panel`));
  }
  const help = textIssue(issues, "/help", input["help"], CUSTOM_NODE_LIMITS.help, l("Die Erklärung", "The explanation"), false);
  const sentence = textIssue(issues, "/sentence", input["sentence"], 60, l("Der Satz auf dem Board", "The sentence on the board"), false);
  const author = input["author"];
  if (author !== void 0 && (typeof author !== "string" || author.length > 80)) error("/author", l("Der Autor ist ein Text bis 80 Zeichen", "The author is text up to 80 characters"));
  const icon = input["icon"];
  if (icon !== void 0 && (typeof icon !== "string" || !/^[a-z0-9-]{1,40}$/.test(icon))) error("/icon", l("Das Icon ist ein Name wie ruler oder activity", "The icon is a name like ruler or activity"));
  const category = input["category"];
  if (category !== void 0 && !CUSTOM_CATEGORIES.includes(category)) {
    error("/category", l("Die Kategorie ist ind, cond oder logic", "The category is ind, cond or logic"));
  }
  const names = /* @__PURE__ */ new Map();
  const claim = (name4, path2) => {
    const taken = names.get(name4);
    if (taken !== void 0) error(path2, l(`Den Namen „${name4}“ gibt es schon (${taken})`, `The name "${name4}" already exists (${taken})`));
    else names.set(name4, path2);
    const problem = nameProblem(name4);
    if (problem) error(path2, problem);
  };
  const pinType = (value, path2) => {
    if (CUSTOM_PIN_TYPES.includes(value)) return value;
    error(path2, l("Die Art ist price (Kursreihe), number (Zahl) oder signal (Signal)", "The type is price (price series), number or signal"));
    return void 0;
  };
  const inputs2 = [];
  const rawInputs = input["inputs"] ?? [];
  if (!Array.isArray(rawInputs)) error("/inputs", l("Die Eingänge sind eine Liste", "The inputs are a list"));
  else {
    if (rawInputs.length > CUSTOM_NODE_LIMITS.inputs) error("/inputs", l(`Höchstens ${CUSTOM_NODE_LIMITS.inputs} Eingänge`, `At most ${CUSTOM_NODE_LIMITS.inputs} inputs`));
    rawInputs.slice(0, CUSTOM_NODE_LIMITS.inputs).forEach((pin, index) => {
      const path2 = `/inputs/${index}`;
      if (!isRecord(pin)) {
        error(path2, l("Ein Eingang ist ein Objekt mit id, type und label", "An input is an object with id, type and label"));
        return;
      }
      for (const key of Object.keys(pin)) if (!["id", "type", "label"].includes(key)) error(`${path2}/${key}`, l(`Unbekanntes Feld „${key}“`, `Unknown field "${key}"`));
      const pinId = pin["id"];
      if (typeof pinId !== "string" || !PIN_ID_PATTERN.test(pinId)) {
        error(`${path2}/id`, l("Der Name des Eingangs beginnt mit einem Kleinbuchstaben, dann Buchstaben oder Ziffern, etwa price", "The input name starts with a lowercase letter, then letters or digits, e.g. price"));
        return;
      }
      claim(pinId, `${path2}/id`);
      const type = pinType(pin["type"], `${path2}/type`);
      const pinLabel = textIssue(issues, `${path2}/label`, pin["label"], CUSTOM_NODE_LIMITS.pinLabel, l("Die Beschriftung", "The label"), false) ?? { de: pinId, en: pinId };
      if (type) inputs2.push({ id: pinId, type, label: pinLabel });
    });
  }
  const settings = [];
  const rawSettings = input["settings"] ?? [];
  if (!Array.isArray(rawSettings)) error("/settings", l("Die Einstellungen sind eine Liste", "The settings are a list"));
  else {
    if (rawSettings.length > CUSTOM_NODE_LIMITS.settings) error("/settings", l(`Höchstens ${CUSTOM_NODE_LIMITS.settings} Einstellungen`, `At most ${CUSTOM_NODE_LIMITS.settings} settings`));
    rawSettings.slice(0, CUSTOM_NODE_LIMITS.settings).forEach((setting, index) => {
      const path2 = `/settings/${index}`;
      if (!isRecord(setting)) {
        error(path2, l("Eine Einstellung ist ein Objekt mit id, label und default", "A setting is an object with id, label and default"));
        return;
      }
      for (const key of Object.keys(setting)) {
        if (!["id", "label", "help", "default", "min", "max", "step", "integer"].includes(key)) error(`${path2}/${key}`, l(`Unbekanntes Feld „${key}“`, `Unknown field "${key}"`));
      }
      const settingId = setting["id"];
      if (typeof settingId !== "string" || !SETTING_KEY_PATTERN.test(settingId)) {
        error(`${path2}/id`, l("Der Name der Einstellung beginnt mit einem Kleinbuchstaben, dann Buchstaben oder Ziffern, etwa length", "The setting name starts with a lowercase letter, then letters or digits, e.g. length"));
        return;
      }
      claim(settingId, `${path2}/id`);
      const settingLabel = textIssue(issues, `${path2}/label`, setting["label"], CUSTOM_NODE_LIMITS.label, l("Die Beschriftung", "The label"), false) ?? { de: settingId, en: settingId };
      const settingHelp = textIssue(issues, `${path2}/help`, setting["help"], 400, l("Die Erklärung", "The explanation"), false);
      const number = (key) => {
        const value = setting[key];
        if (value === void 0) return void 0;
        if (typeof value !== "number" || !Number.isFinite(value)) {
          error(`${path2}/${key}`, l("Hier gehört eine Zahl hin", "This needs to be a number"));
          return void 0;
        }
        return value;
      };
      const fallback = number("default");
      const min = number("min");
      const max = number("max");
      const step = number("step");
      const integer = setting["integer"];
      if (integer !== void 0 && typeof integer !== "boolean") error(`${path2}/integer`, l("integer ist true oder false", "integer is true or false"));
      if (fallback === void 0) {
        if (setting["default"] === void 0) error(`${path2}/default`, l("Der Standardwert fehlt", "The default value is missing"));
        return;
      }
      if (min !== void 0 && max !== void 0 && min > max) error(`${path2}/min`, l("Der Mindestwert ist größer als der Höchstwert", "The minimum is larger than the maximum"));
      if (min !== void 0 && fallback < min) error(`${path2}/default`, l(`Der Standardwert liegt unter dem Mindestwert ${min}`, `The default is below the minimum ${min}`));
      if (max !== void 0 && fallback > max) error(`${path2}/default`, l(`Der Standardwert liegt über dem Höchstwert ${max}`, `The default is above the maximum ${max}`));
      if (integer === true && !Number.isInteger(fallback)) error(`${path2}/default`, l("Der Standardwert muss eine ganze Zahl sein", "The default must be a whole number"));
      if (step !== void 0 && !(step > 0)) error(`${path2}/step`, l("Die Schrittweite muss größer als 0 sein", "The step must be greater than 0"));
      settings.push({
        id: settingId,
        label: settingLabel,
        ...settingHelp ? { help: settingHelp } : {},
        default: fallback,
        ...min !== void 0 ? { min } : {},
        ...max !== void 0 ? { max } : {},
        ...step !== void 0 ? { step } : {},
        ...integer === true ? { integer: true } : {}
      });
    });
  }
  const env = /* @__PURE__ */ new Map();
  for (const pin of inputs2) env.set(pin.id, { kind: "input", type: pin.type === "signal" ? "bool" : "number" });
  for (const setting of settings) env.set(setting.id, { kind: "setting", type: "number", ...setting.min !== void 0 ? { min: setting.min } : {}, ...setting.max !== void 0 ? { max: setting.max } : {} });
  const used = /* @__PURE__ */ new Set();
  const outputs = [];
  const rawOutputs = input["outputs"];
  if (!Array.isArray(rawOutputs) || rawOutputs.length === 0) error("/outputs", l("Ein Baustein braucht mindestens einen Ausgang", "A node needs at least one output"));
  else {
    if (rawOutputs.length > CUSTOM_NODE_LIMITS.outputs) error("/outputs", l(`Höchstens ${CUSTOM_NODE_LIMITS.outputs} Ausgänge`, `At most ${CUSTOM_NODE_LIMITS.outputs} outputs`));
    rawOutputs.slice(0, CUSTOM_NODE_LIMITS.outputs).forEach((pin, index) => {
      const path2 = `/outputs/${index}`;
      if (!isRecord(pin)) {
        error(path2, l("Ein Ausgang ist ein Objekt mit id, type, label und formula", "An output is an object with id, type, label and formula"));
        return;
      }
      for (const key of Object.keys(pin)) if (!["id", "type", "label", "unit", "formula"].includes(key)) error(`${path2}/${key}`, l(`Unbekanntes Feld „${key}“`, `Unknown field "${key}"`));
      const pinId = pin["id"];
      const validId = typeof pinId === "string" && PIN_ID_PATTERN.test(pinId);
      if (!validId) error(`${path2}/id`, l("Der Name des Ausgangs beginnt mit einem Kleinbuchstaben, dann Buchstaben oder Ziffern, etwa out", "The output name starts with a lowercase letter, then letters or digits, e.g. out"));
      else claim(pinId, `${path2}/id`);
      const type = pinType(pin["type"], `${path2}/type`);
      const unit = pin["unit"];
      if (unit !== void 0 && unit !== "percent") error(`${path2}/unit`, l("Die Einheit ist percent oder fehlt", "The unit is percent or absent"));
      if (unit === "percent" && type !== "number") error(`${path2}/unit`, l("Prozent gibt es nur bei Zahlen", "Percent only applies to numbers"));
      const pinLabel = textIssue(issues, `${path2}/label`, pin["label"], CUSTOM_NODE_LIMITS.pinLabel, l("Die Beschriftung", "The label"), false);
      const formula = pin["formula"];
      if (typeof formula !== "string") {
        error(`${path2}/formula`, l("Die Formel fehlt", "The formula is missing"));
        return;
      }
      const expected = type === "signal" ? "bool" : "number";
      const checked = checkFormula(formula, env, type ? expected : void 0);
      for (const issue of checked.issues) error(`${path2}/formula`, issue.message, { start: issue.start, end: issue.end });
      for (const name4 of checked.names) used.add(name4);
      if (validId && type) {
        env.set(pinId, { kind: "output", type: expected });
        outputs.push({ id: pinId, type, label: pinLabel ?? { de: pinId, en: pinId }, ...unit === "percent" ? { unit } : {}, formula });
      }
    });
  }
  const formulasRead = !issues.some((issue) => issue.severity === "error" && issue.path.endsWith("/formula"));
  if (formulasRead) inputs2.forEach((pin, index) => {
    if (!used.has(pin.id)) warning(`/inputs/${index}/id`, l(`Keine Formel liest den Eingang „${pin.id}“`, `No formula reads the input "${pin.id}"`));
  });
  if (formulasRead) settings.forEach((setting, index) => {
    if (!used.has(setting.id)) warning(`/settings/${index}/id`, l(`Keine Formel nutzt die Einstellung „${setting.id}“`, `No formula uses the setting "${setting.id}"`));
  });
  if (input["tests"] !== void 0) checkTests2(input["tests"], inputs2, settings, outputs, error);
  if (issues.some((issue) => issue.severity === "error") || typeof id !== "string" || typeof version !== "string" || !label) return { ok: false, issues };
  const spec = {
    format: CUSTOM_NODE_FORMAT,
    id,
    version,
    label,
    description: description ?? label,
    ...help ? { help } : {},
    category: category ?? deriveCategory(inputs2, outputs),
    icon: typeof icon === "string" ? icon : DEFAULT_CUSTOM_ICON,
    ...typeof author === "string" && author.trim() !== "" ? { author: author.trim() } : {},
    ...sentence ? { sentence } : {},
    inputs: inputs2,
    settings,
    outputs
  };
  return { ok: true, issues, spec };
}
function defaultTestInput(pin) {
  if (FIXTURE_COLUMNS.includes(pin.id)) return pin.id;
  return pin.type === "signal" ? void 0 : "close";
}
function checkTests2(raw, inputs2, settings, outputs, error) {
  if (!Array.isArray(raw)) {
    error("/tests", l("Die Tests sind eine Liste", "The tests are a list"));
    return;
  }
  if (raw.length > CUSTOM_NODE_TEST_LIMITS.tests) error("/tests", l(`Höchstens ${CUSTOM_NODE_TEST_LIMITS.tests} Tests`, `At most ${CUSTOM_NODE_TEST_LIMITS.tests} tests`));
  let expectations = 0;
  raw.slice(0, CUSTOM_NODE_TEST_LIMITS.tests).forEach((test, index) => {
    const path2 = `/tests/${index}`;
    if (!isRecord(test)) {
      error(path2, l("Ein Test ist ein Objekt mit Einstellungen, Eingängen und erwarteten Werten", "A test is an object with settings, inputs and expected values"));
      return;
    }
    for (const key of Object.keys(test)) if (!TEST_KEYS.includes(key)) error(`${path2}/${key}`, l(`Unbekanntes Feld „${key}“`, `Unknown field "${key}"`));
    const name4 = test["name"];
    if (name4 !== void 0 && (typeof name4 !== "string" || name4.length > CUSTOM_NODE_TEST_LIMITS.name)) {
      error(`${path2}/name`, l(`Der Name eines Tests ist ein Text bis ${CUSTOM_NODE_TEST_LIMITS.name} Zeichen`, `A test name is text up to ${CUSTOM_NODE_TEST_LIMITS.name} characters`));
    }
    if (test["fixture"] !== void 0 && test["fixture"] !== CUSTOM_NODE_TEST_FIXTURE) {
      error(`${path2}/fixture`, l(`Die Kursdaten heißen ${CUSTOM_NODE_TEST_FIXTURE}; die Angabe kann auch fehlen`, `The price data is called ${CUSTOM_NODE_TEST_FIXTURE}; it can also be left out`));
    }
    const tolerance = test["tolerance"];
    if (tolerance !== void 0 && !(typeof tolerance === "number" && Number.isFinite(tolerance) && tolerance > 0)) {
      error(`${path2}/tolerance`, l("Die Toleranz ist eine Zahl größer als 0", "The tolerance is a number greater than 0"));
    }
    const values = test["settings"];
    if (values !== void 0 && !isRecord(values)) error(`${path2}/settings`, l('Die Einstellungen eines Tests sind ein Objekt, etwa { "length": 20 }', 'The settings of a test are an object, e.g. { "length": 20 }'));
    else if (values) {
      for (const [key, value] of Object.entries(values)) {
        const setting = settings.find((candidate) => candidate.id === key);
        const where = `${path2}/settings/${key}`;
        if (!setting) error(where, l(`Die Einstellung „${key}“ gibt es nicht`, `There is no setting "${key}"`));
        else if (typeof value !== "number" || !Number.isFinite(value)) error(where, l("Hier gehört eine Zahl hin", "This needs to be a number"));
        else if (setting.min !== void 0 && value < setting.min || setting.max !== void 0 && value > setting.max || setting.integer && !Number.isInteger(value)) {
          error(where, l(`${value} ist für „${key}“ nicht erlaubt`, `${value} is not allowed for "${key}"`));
        }
      }
    }
    const mapping = test["inputs"];
    if (mapping !== void 0 && !isRecord(mapping)) error(`${path2}/inputs`, l('Die Eingänge eines Tests sind ein Objekt, etwa { "price": "close" }', 'The inputs of a test are an object, e.g. { "price": "close" }'));
    const given = isRecord(mapping) ? mapping : {};
    for (const key of Object.keys(given)) {
      if (!inputs2.some((pin) => pin.id === key)) error(`${path2}/inputs/${key}`, l(`Den Eingang „${key}“ gibt es nicht`, `There is no input "${key}"`));
    }
    for (const pin of inputs2) {
      const where = `${path2}/inputs/${pin.id}`;
      const formula = Object.hasOwn(given, pin.id) ? given[pin.id] : defaultTestInput(pin);
      if (formula === void 0) {
        error(where, l(`Der Signal-Eingang „${pin.id}“ braucht im Test eine Formel aus den Kursdaten, etwa close > open`, `The signal input "${pin.id}" needs a formula from the price data in the test, e.g. close > open`));
        continue;
      }
      if (typeof formula !== "string") {
        error(where, l("Hier gehört eine Spalte der Kursdaten oder eine Formel daraus hin, etwa close", "This needs a column of the price data or a formula from it, e.g. close"));
        continue;
      }
      const checked = checkFormula(formula, CANDLE_ENV, pin.type === "signal" ? "bool" : "number");
      for (const issue of checked.issues) error(where, issue.message, { start: issue.start, end: issue.end });
    }
    let count2 = 0;
    const expect = (where, expected) => {
      if (!isRecord(expected)) {
        error(where, l('Erwartete Werte sind ein Objekt mit Ausgängen, etwa { "out": 1.5 }', 'Expected values are an object with outputs, e.g. { "out": 1.5 }'));
        return;
      }
      for (const [key, value] of Object.entries(expected)) {
        count2++;
        const pin = outputs.find((candidate) => candidate.id === key);
        if (!pin) error(`${where}/${key}`, l(`Den Ausgang „${key}“ gibt es nicht`, `There is no output "${key}"`));
        else if (pin.type === "signal" ? typeof value !== "boolean" : !(value === null || typeof value === "number" && Number.isFinite(value))) {
          error(
            `${where}/${key}`,
            pin.type === "signal" ? l(`„${key}“ ist ein Signal; erwartet wird true oder false`, `"${key}" is a signal; expected true or false`) : l(`„${key}“ ist eine Zahl; erwartet wird eine Zahl oder null`, `"${key}" is a number; expected a number or null`)
          );
        }
      }
    };
    const at = test["expectAt"];
    if (at !== void 0 && !isRecord(at)) error(`${path2}/expectAt`, l('expectAt ist ein Objekt mit Kerzen, etwa { "250": { "out": 1.5 } }', 'expectAt is an object with candles, e.g. { "250": { "out": 1.5 } }'));
    else if (at) {
      for (const [key, expected] of Object.entries(at)) {
        if (!/^-?\d{1,6}$/.test(key)) error(`${path2}/expectAt/${key}`, l(`„${key}“ ist keine Kerze; gemeint ist eine Nummer ab 0, von hinten ab -1`, `"${key}" is not a candle; use a number from 0, or from the end from -1`));
        else expect(`${path2}/expectAt/${key}`, expected);
      }
    }
    if (test["expectLast"] !== void 0) expect(`${path2}/expectLast`, test["expectLast"]);
    if (count2 === 0) error(path2, l("Ein Test braucht erwartete Werte (expectAt oder expectLast)", "A test needs expected values (expectAt or expectLast)"));
    expectations += count2;
  });
  if (expectations > CUSTOM_NODE_TEST_LIMITS.expectations) {
    error("/tests", l(`Höchstens ${CUSTOM_NODE_TEST_LIMITS.expectations} erwartete Werte insgesamt`, `At most ${CUSTOM_NODE_TEST_LIMITS.expectations} expected values in total`));
  }
}
function customNodeTestContext(definition, spec, data, test = {}) {
  const settings = normalizeSettings(definition.settings, test.settings);
  const numbers = { ...data.candles };
  const inputs2 = {};
  for (const pin of spec.inputs) {
    const type = pin.type === "signal" ? "bool" : "number";
    const formula = test.inputs?.[pin.id] ?? defaultTestInput(pin) ?? "false";
    const checked = checkFormula(formula, CANDLE_ENV, type);
    if (!checked.ast) throw new Error(`${spec.id}: Eingang ${pin.id} im Test: ${checked.issues[0]?.message.de ?? formula}`);
    inputs2[pin.id] = evaluateFormula(checked.ast, { length: data.bars.length, numbers, signals: {}, settings: {} }, type);
  }
  return { inputs: inputs2, settings: settings.values, bars: data.bars };
}
function sameExpected(actual, expected, tolerance) {
  if (expected === null || actual === null) return actual === expected;
  if (typeof expected === "number" && typeof actual === "number") return Math.abs(actual - expected) <= tolerance;
  return actual === expected;
}
function runCustomNodeTests(input, fixture) {
  const compiled = compileCustomNode(input);
  if (!compiled.definition || !compiled.spec) throw new Error("Der Baustein besteht die Prüfung nicht; erst checkCustomNode() ansehen");
  const { definition, spec } = compiled;
  const tests = input.tests ?? [];
  const data = fixtureData(fixture);
  return tests.map((test, number) => {
    const name4 = test.name ?? `#${number + 1}`;
    const outputs = computeNode(definition, customNodeTestContext(definition, spec, data, test)).outputs;
    const tolerance = test.tolerance ?? 1e-6;
    const failures = [];
    const checks = [];
    const expectations = [];
    for (const [key, expected] of Object.entries(test.expectAt ?? {})) expectations.push([key, Number(key) < 0 ? data.bars.length + Number(key) : Number(key), expected]);
    if (test.expectLast) expectations.push(["last", data.bars.length - 1, test.expectLast]);
    for (const [key, index, expected] of expectations) {
      if (index < 0 || index >= data.bars.length) {
        failures.push(l(`Kerze ${key} gibt es nicht; die Kursdaten haben ${data.bars.length} Kerzen`, `Candle ${key} does not exist; the price data has ${data.bars.length} candles`));
        continue;
      }
      for (const [pin, value] of Object.entries(expected)) {
        const actual = outputs[pin]?.[index] ?? null;
        const ok = sameExpected(actual, value, tolerance);
        checks.push({ index, time: data.bars.openTime[index] ?? 0, pin, expected: value, actual, ok });
        if (!ok) failures.push(l(`${pin}[${index}]: erwartet ${JSON.stringify(value)}, erhalten ${JSON.stringify(actual)}`, `${pin}[${index}]: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`));
      }
    }
    return { name: name4, passed: failures.length === 0, checks, failures };
  });
}
function customNodeFingerprint(spec) {
  return sha256Hex(canonicalJson(spec)).slice(0, 32);
}
function fillSentence(template, settings, locale) {
  return template.replace(/\{([a-z][a-zA-Z0-9]{0,31})\}/g, (match, key) => {
    const value = settings[key];
    return typeof value === "number" ? formatNumber(value, locale) : match;
  });
}
function formulaSentence(formula) {
  const flat = formula.replace(/\s+/g, " ").trim();
  return flat.length > 36 ? `${flat.slice(0, 35)}…` : flat;
}
function compileCustomNode(input) {
  const checked = checkCustomNode(input);
  if (!checked.ok || !checked.spec) return { ok: false, issues: checked.issues };
  const spec = checked.spec;
  const env = /* @__PURE__ */ new Map();
  for (const pin of spec.inputs) env.set(pin.id, { kind: "input", type: pin.type === "signal" ? "bool" : "number" });
  for (const setting of spec.settings) env.set(setting.id, { kind: "setting", type: "number", ...setting.min !== void 0 ? { min: setting.min } : {}, ...setting.max !== void 0 ? { max: setting.max } : {} });
  const formulas = [];
  for (const pin of spec.outputs) {
    const type = pin.type === "signal" ? "bool" : "number";
    const result = checkFormula(pin.formula, env, type);
    if (!result.ast) return { ok: false, issues: checked.issues };
    formulas.push({ id: pin.id, type, ast: result.ast });
    env.set(pin.id, { kind: "output", type });
  }
  const inputs2 = spec.inputs.map((pin) => ({ id: pin.id, type: pin.type === "signal" ? "signal" : "series", label: pin.label }));
  const outputs = spec.outputs.map((pin) => ({
    id: pin.id,
    type: pin.type === "signal" ? "signal" : "series",
    label: pin.label,
    ...pin.type === "price" ? { unit: "price" } : pin.unit === "percent" ? { unit: "percent" } : {}
  }));
  const settings = {};
  for (const setting of spec.settings) {
    settings[setting.id] = {
      type: "number",
      label: setting.label,
      ...setting.help ? { help: setting.help } : {},
      default: setting.default,
      ...setting.min !== void 0 ? { min: setting.min } : {},
      ...setting.max !== void 0 ? { max: setting.max } : {},
      ...setting.step !== void 0 ? { step: setting.step } : setting.integer ? { step: 1 } : {},
      ...setting.integer ? { integer: true } : {}
    };
  }
  const numbersOf = (values) => {
    const out = {};
    for (const setting of spec.settings) {
      const value = values[setting.id];
      out[setting.id] = typeof value === "number" ? value : setting.default;
    }
    return out;
  };
  const definition = {
    id: spec.id,
    version: spec.version,
    category: spec.category,
    label: spec.label,
    description: spec.description,
    ...spec.help ? { help: spec.help } : {},
    technical: l(
      `Eigener Baustein, rechnet mit Formeln: ${spec.outputs.map((pin) => `${pin.id} = ${pin.formula}`).join(" · ")}`,
      `Custom node computing with formulas: ${spec.outputs.map((pin) => `${pin.id} = ${pin.formula}`).join(" · ")}`
    ),
    icon: spec.icon,
    keywords: { de: ["eigener baustein", "formel", ...spec.label.de.toLowerCase().split(/\s+/)], en: ["custom node", "formula", ...spec.label.en.toLowerCase().split(/\s+/)] },
    ...spec.author ? { author: spec.author } : {},
    inputs: inputs2,
    outputs,
    settings,
    sentence: ({ settings: values, locale }) => {
      const current = values;
      if (spec.sentence) return fillSentence(spec.sentence[locale], current, locale);
      if (spec.settings.length > 0) return spec.settings.map((setting) => `${setting.label[locale]} ${formatNumber(numbersOf(current)[setting.id] ?? setting.default, locale)}`).join(" · ");
      return formulaSentence(spec.outputs[0]?.formula ?? "");
    },
    short: ({ pin, locale }) => {
      if (spec.outputs.length <= 1) return spec.label[locale];
      const output = spec.outputs.find((candidate) => candidate.id === pin) ?? spec.outputs[0];
      return `${spec.label[locale]} ${output?.label[locale] ?? ""}`.trim();
    },
    warmup: ({ settings: values }) => {
      const numbers = numbersOf(values);
      const known = {};
      let most = 0;
      for (const formula of formulas) {
        const warmup = formulaWarmup(formula.ast, numbers, known);
        known[formula.id] = warmup;
        most = Math.max(most, warmup);
      }
      return most;
    },
    compute: (ctx) => {
      const { inputs: given, settings: values, bars } = ctx;
      const numbers = {};
      const signals = {};
      for (const pin of spec.inputs) {
        const series = given[pin.id];
        if (pin.type === "signal") signals[pin.id] = series ?? new Array(bars.length).fill(false);
        else numbers[pin.id] = series ?? new Array(bars.length).fill(null);
      }
      const settingValues = numbersOf(values);
      const result = {};
      for (const formula of formulas) {
        const out = evaluateFormula(formula.ast, { length: bars.length, numbers, signals, settings: settingValues }, formula.type);
        result[formula.id] = out;
        if (formula.type === "bool") signals[formula.id] = out;
        else numbers[formula.id] = out;
      }
      return result;
    },
    fingerprint: customNodeFingerprint(spec),
    custom: spec
  };
  const problems = checkNodeDefinition(definition);
  if (problems.length > 0) {
    return { ok: false, issues: [...checked.issues, ...problems.map((problem) => ({ severity: "error", path: "/", message: l(problem, problem) }))] };
  }
  return { ok: true, issues: checked.issues, spec, definition: Object.freeze(definition) };
}
function compileChainCustomNodes(list) {
  const definitions = [];
  const issues = [];
  const broken = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  (list ?? []).forEach((entry, index) => {
    const id = isRecord(entry) && typeof entry["id"] === "string" ? entry["id"] : void 0;
    if (index >= CUSTOM_NODE_LIMITS.perChain) {
      issues.push({ index, severity: "error", path: "/", message: l(`Höchstens ${CUSTOM_NODE_LIMITS.perChain} eigene Bausteine je Chain`, `At most ${CUSTOM_NODE_LIMITS.perChain} custom nodes per chain`) });
      return;
    }
    if (id !== void 0 && seen.has(id)) {
      issues.push({ index, severity: "error", path: "/id", message: l(`Den eigenen Baustein „${id}“ gibt es in der Chain zweimal`, `The custom node "${id}" appears twice in the chain`) });
      return;
    }
    if (id !== void 0) seen.add(id);
    const compiled = compileCustomNode(entry);
    for (const issue of compiled.issues) issues.push({ ...issue, index });
    if (compiled.definition) definitions.push(compiled.definition);
    else if (id !== void 0) {
      const first = compiled.issues.find((issue) => issue.severity === "error");
      broken.set(id, {
        label: (isRecord(entry) ? customText(entry["label"]) : void 0) ?? { de: id, en: id },
        message: first?.message ?? l("ungültig", "invalid")
      });
    }
  });
  return { definitions, issues, broken };
}

// packages/node-spec/src/chain.ts
var BEGINNER_TAG = "einsteiger";
var TEMPLATE_TOPICS = ["dip", "trend", "momentum", "volatilitaet", "volumen", "ausbruch", "crash", "levels", "smartmoney", "konfluenz", "zeit", "scanner"];
function schemaMessage(error) {
  const p = error.params;
  switch (error.keyword) {
    case "required":
      return l(`Pflichtfeld „${String(p["missingProperty"])}“ fehlt`, `required field "${String(p["missingProperty"])}" is missing`);
    case "additionalProperties":
      return l(`unbekanntes Feld „${String(p["additionalProperty"])}“`, `unknown field "${String(p["additionalProperty"])}"`);
    case "type":
      return l(`hat den falschen Typ, erwartet ${String(p["type"])}`, `has the wrong type, expected ${String(p["type"])}`);
    case "const":
      return l(`muss ${JSON.stringify(p["allowedValue"])} sein`, `must be ${JSON.stringify(p["allowedValue"])}`);
    case "pattern":
      return l("hat nicht das erwartete Format", "does not have the expected format");
    case "propertyNames":
      return l("enthält einen ungültigen Namen", "contains an invalid name");
    case "minLength":
      return l("ist zu kurz", "is too short");
    case "maxLength":
      return l("ist zu lang", "is too long");
    case "minItems":
      return l("hat zu wenige Einträge", "has too few entries");
    case "minimum":
      return l(`muss mindestens ${String(p["limit"])} sein`, `must be at least ${String(p["limit"])}`);
    case "maximum":
      return l(`darf höchstens ${String(p["limit"])} sein`, `must be at most ${String(p["limit"])}`);
    case "maxItems":
    case "maxProperties":
      return l(`hat mehr als ${String(p["limit"])} Einträge`, `has more than ${String(p["limit"])} entries`);
    default:
      return l(error.message ?? "ist ungültig", error.message ?? "is invalid");
  }
}
function scannerChoiceError(error) {
  return error.instancePath === "/scanner" && (error.keyword === "oneOf" || error.schemaPath.startsWith("#/oneOf/"));
}
function checkChainSchema(input) {
  if (chain_schema_validator_default(input)) return [];
  const errors = chain_schema_validator_default.errors ?? [];
  const issues = errors.filter((error) => !scannerChoiceError(error)).map((error) => ({
    severity: "error",
    code: "schema",
    message: schemaMessage(error),
    path: error.instancePath || "/"
  }));
  if (errors.some(scannerChoiceError)) {
    issues.push({
      severity: "error",
      code: "schema",
      message: l("braucht entweder eine Liste von Paaren („pairs“) oder Top N („top“), nicht beides", 'needs either a list of pairs ("pairs") or top N ("top"), not both'),
      path: "/scanner"
    });
  }
  return issues;
}
function splitPinRef(ref) {
  const dot = ref.indexOf(".");
  return { node: ref.slice(0, dot), pin: ref.slice(dot + 1) };
}
function validateChain(input, registry, options = {}) {
  const schemaIssues = checkChainSchema(input);
  if (schemaIssues.length > 0) return { ok: false, issues: schemaIssues };
  const chain = input;
  const issues = [];
  const soft = options.strict ? "error" : "warning";
  const nodes = /* @__PURE__ */ new Map();
  const custom = compileChainCustomNodes(chain.customNodes);
  for (const issue of custom.issues) {
    issues.push({
      severity: issue.severity,
      code: "custom-node",
      path: `/customNodes/${issue.index}${issue.path === "/" ? "" : issue.path}`,
      message: issue.message,
      ...issue.range ? { range: issue.range } : {}
    });
  }
  const effective = custom.definitions.length > 0 ? registry.extend(custom.definitions) : registry;
  chain.nodes.forEach((node, index) => {
    const path2 = `/nodes/${index}`;
    if (nodes.has(node.id) || chain.nodes.findIndex((other) => other.id === node.id) !== index) {
      issues.push({
        severity: "error",
        code: "duplicate-node",
        path: `${path2}/id`,
        node: node.id,
        message: l(`Die id „${node.id}“ gibt es mehrfach`, `The id "${node.id}" is used more than once`)
      });
      return;
    }
    const definition = effective.resolve(node.type);
    const broken = definition ? void 0 : custom.broken.get(parseTypeRef(node.type)?.id ?? node.type);
    if (broken) {
      issues.push({
        severity: "error",
        code: "custom-node",
        path: `${path2}/type`,
        node: node.id,
        message: l(`Der eigene Baustein „${broken.label.de}“ hat einen Fehler: ${broken.message.de}`, `The custom node "${broken.label.en}" has an error: ${broken.message.en}`)
      });
      return;
    }
    if (!definition) {
      issues.push({
        severity: "error",
        code: "unknown-type",
        path: `${path2}/type`,
        node: node.id,
        message: l(`Unbekannter Baustein „${node.type}“`, `Unknown node type "${node.type}"`)
      });
      return;
    }
    const normalized = normalizeSettings(definition.settings, node.settings);
    for (const issue of normalized.issues) {
      const field = issue.code === "required-setting" ? definition.settings[issue.key]?.label : void 0;
      issues.push({
        severity: issue.code === "required-setting" ? soft : issue.severity,
        code: issue.code,
        path: `${path2}/settings/${issue.key}`,
        node: node.id,
        message: field ? l(`${definition.label.de}: Pflichtfeld „${field.de}“ fehlt`, `${definition.label.en}: required field "${field.en}" is missing`) : l(`${definition.label.de}, ${issue.key}: ${issue.message.de}`, `${definition.label.en}, ${issue.key}: ${issue.message.en}`)
      });
    }
    nodes.set(node.id, { id: node.id, type: node.type, definition, settings: normalized.values, position: node.position });
  });
  const edges = [];
  const taken = /* @__PURE__ */ new Map();
  chain.edges.forEach((edge, index) => {
    const path2 = `/edges/${index}`;
    const from = splitPinRef(edge.from);
    const to = splitPinRef(edge.to);
    const source = nodes.get(from.node);
    const target = nodes.get(to.node);
    const known = (address, side) => {
      if (nodes.has(address.node) || chain.nodes.some((n) => n.id === address.node)) return true;
      issues.push({
        severity: "error",
        code: "unknown-node",
        path: `${path2}/${side}`,
        edge: index,
        message: l(`Verbindung zu unbekanntem Baustein „${address.node}“`, `Connection to unknown node "${address.node}"`)
      });
      return false;
    };
    const fromKnown = known(from, "from");
    const toKnown = known(to, "to");
    if (!fromKnown || !toKnown || !source || !target) return;
    if (from.node === to.node) {
      issues.push({
        severity: "error",
        code: "self-loop",
        path: path2,
        edge: index,
        node: from.node,
        message: l("Ein Baustein kann nicht mit sich selbst verbunden werden", "A node cannot be connected to itself")
      });
      return;
    }
    const output = findOutputPin(source.definition, from.pin);
    if (!output) {
      issues.push({
        severity: "error",
        code: "unknown-pin",
        path: `${path2}/from`,
        edge: index,
        node: from.node,
        message: l(`${source.definition.label.de} hat keinen Ausgang „${from.pin}“`, `${source.definition.label.en} has no output "${from.pin}"`)
      });
      return;
    }
    const input2 = findInputPin(target.definition, to.pin);
    if (!input2) {
      issues.push({
        severity: "error",
        code: "unknown-pin",
        path: `${path2}/to`,
        edge: index,
        node: to.node,
        message: l(`${target.definition.label.de} hat keinen Eingang „${to.pin}“`, `${target.definition.label.en} has no input "${to.pin}"`)
      });
      return;
    }
    if (output.type !== input2.spec.type) {
      issues.push({
        severity: "error",
        code: "type-mismatch",
        path: path2,
        edge: index,
        message: l(
          `${edge.from} liefert ${output.type}, ${edge.to} erwartet ${input2.spec.type}`,
          `${edge.from} provides ${output.type}, ${edge.to} expects ${input2.spec.type}`
        )
      });
      return;
    }
    const key = `${to.node}.${to.pin}`;
    if (taken.has(key)) {
      issues.push({
        severity: "error",
        code: "input-taken",
        path: `${path2}/to`,
        edge: index,
        node: to.node,
        message: l(`Am Eingang ${key} hängt schon eine Verbindung`, `Input ${key} is already connected`)
      });
      return;
    }
    taken.set(key, index);
    edges.push({ index, from, to, type: output.type });
  });
  for (const node of nodes.values()) {
    const nodeIndex = chain.nodes.findIndex((n) => n.id === node.id);
    for (const spec of node.definition.inputs) {
      if (spec.variadic) {
        const connected2 = expandInputs(node.definition).filter((pin) => pin.spec === spec && taken.has(`${node.id}.${pin.name}`)).length;
        if (connected2 < spec.variadic.min) {
          issues.push({
            severity: soft,
            code: "too-few-inputs",
            path: `/nodes/${nodeIndex}`,
            node: node.id,
            message: l(
              `${node.definition.label.de} braucht mindestens ${spec.variadic.min} verbundene Eingänge`,
              `${node.definition.label.en} needs at least ${spec.variadic.min} connected inputs`
            )
          });
        }
      } else if (!spec.optional && !taken.has(`${node.id}.${spec.id}`)) {
        issues.push({
          severity: soft,
          code: "required-input",
          path: `/nodes/${nodeIndex}`,
          node: node.id,
          message: l(
            `${node.definition.label.de}: Eingang „${spec.label.de}“ ist nicht verbunden`,
            `${node.definition.label.en}: input "${spec.label.en}" is not connected`
          )
        });
      }
    }
  }
  const timeframes = /* @__PURE__ */ new Set();
  for (const node of nodes.values()) {
    const source = node.definition.source;
    if (source?.kind !== "candles") continue;
    const market = source.market(node.settings);
    timeframes.add(market.timeframe);
    const exchange = exchangeInfo(market.exchange);
    if (!exchange || exchange.timeframes.includes(market.timeframe)) continue;
    const nodeIndex = chain.nodes.findIndex((n) => n.id === node.id);
    issues.push({
      severity: "error",
      code: "timeframe-unsupported",
      path: `/nodes/${nodeIndex}${"timeframe" in node.definition.settings ? "/settings/timeframe" : ""}`,
      node: node.id,
      message: unsupportedTimeframeMessage(exchange, market.timeframe)
    });
  }
  if (timeframes.size > 1) {
    issues.push({
      severity: "error",
      code: "timeframe-mismatch",
      path: "/nodes",
      message: l(
        `Alle Kerzen-Quellen einer Chain brauchen dieselbe Zeiteinheit, gefunden: ${[...timeframes].join(", ")}`,
        `All candle sources of a chain need the same timeframe, found: ${[...timeframes].join(", ")}`
      )
    });
  }
  issues.push(...scannerIssues(chain, nodes));
  const order = topologicalOrder(chain.nodes.map((n) => n.id).filter((id) => nodes.has(id)), edges);
  if (order.cyclic.length > 0) {
    issues.push({
      severity: "error",
      code: "cycle",
      path: "/edges",
      message: l(
        `Die Verbindungen bilden einen Kreis: ${order.cyclic.join(", ")}`,
        `The connections form a loop: ${order.cyclic.join(", ")}`
      )
    });
  }
  const ok = !issues.some((issue) => issue.severity === "error");
  if (!ok) return { ok, issues };
  const incoming = new Map(edges.map((edge) => [`${edge.to.node}.${edge.to.pin}`, edge]));
  const resolved = {
    name: chain.name,
    source: chain,
    registry: effective,
    nodes,
    edges,
    order: order.sorted,
    incoming: (node, pin) => incoming.get(`${node}.${pin}`),
    outgoing: (node) => edges.filter((edge) => edge.from.node === node)
  };
  return { ok, issues, chain: resolved };
}
function scannerIssues(chain, nodes) {
  const scanner = chain.scanner;
  if (!scanner) return [];
  const issues = [];
  const node = nodes.get(scanner.node);
  if (!node) {
    if (!chain.nodes.some((other) => other.id === scanner.node)) {
      issues.push({
        severity: "error",
        code: "scanner",
        path: "/scanner/node",
        message: l(`Der Scanner nennt den Baustein „${scanner.node}“, den es in der Chain nicht gibt`, `The scanner names the node "${scanner.node}", which is not in the chain`)
      });
    }
  } else if (node.definition.source?.kind !== "candles" || !("pair" in node.definition.settings)) {
    issues.push({
      severity: "error",
      code: "scanner",
      path: "/scanner/node",
      node: node.id,
      message: l(
        `Der Scanner braucht eine Kerze mit Handelspaar; „${node.definition.label.de}“ hat keins`,
        `The scanner needs a candle with a trading pair; "${node.definition.label.en}" has none`
      )
    });
  }
  const seen = /* @__PURE__ */ new Set();
  (scanner.pairs ?? []).forEach((pair, index) => {
    if (!seen.has(pair)) {
      seen.add(pair);
      return;
    }
    issues.push({
      severity: "error",
      code: "scanner",
      path: `/scanner/pairs/${index}`,
      ...node ? { node: node.id } : {},
      message: l(`Der Scanner nennt ${pair} mehrmals`, `The scanner lists ${pair} more than once`)
    });
  });
  return issues;
}
function topologicalOrder(ids, edges) {
  const position = new Map(ids.map((id, index) => [id, index]));
  const indegree = new Map(ids.map((id) => [id, 0]));
  const next = new Map(ids.map((id) => [id, []]));
  for (const edge of edges) {
    indegree.set(edge.to.node, (indegree.get(edge.to.node) ?? 0) + 1);
    next.get(edge.from.node)?.push(edge.to.node);
  }
  const ready = ids.filter((id) => indegree.get(id) === 0);
  const sorted = [];
  while (ready.length > 0) {
    ready.sort((a, b) => (position.get(a) ?? 0) - (position.get(b) ?? 0));
    const id = ready.shift();
    sorted.push(id);
    for (const target of next.get(id) ?? []) {
      const remaining = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, remaining);
      if (remaining === 0) ready.push(target);
    }
  }
  const cyclic = ids.filter((id) => !sorted.includes(id));
  return { sorted, cyclic };
}

// packages/node-spec/src/scanner.ts
function scannerPairs(chain) {
  return chain.scanner?.pairs ? [...new Set(chain.scanner.pairs)] : [];
}

// packages/nodes/src/data/message.ts
var DEFAULT_MESSAGE = "{{kette}}: {{werte}}";
var VALUE_PINS = ["a", "b", "c", "d"];
var messageTemplate = defineNode({
  id: "core.message",
  version: "1.0.0",
  category: "data",
  label: l("Nachrichtenvorlage", "Message template"),
  description: l("Schreibt deinen eigenen Alarmtext", "Writes your own alert text"),
  help: l(
    "Baut den Text, den eine Aktion verschickt. Verbinde den Ausgang mit dem Eingang Nachricht einer Aktion. Platzhalter in doppelten geschweiften Klammern füllt Bellchain beim Alarm aus: {{kette}} den Namen der Chain, {{kurs}} den Schlusskurs, {{paar}} das Handelspaar, {{coin}} den Coin, {{zeit}} die Uhrzeit, {{werte}} alle Werte der Chain und {{a}} bis {{d}} die Werte an den Eingängen A bis D. Beispiel: „{{coin}} bei {{kurs}}, RSI {{a}}“ wird zu „BTC bei 81.616 $, RSI 28,7“.",
    "Builds the text an action sends. Connect the output to an action’s Message input. Placeholders in double curly braces are filled in when the alert fires: {{chain}} with the chain’s name, {{price}} the closing price, {{pair}} the trading pair, {{coin}} the coin, {{time}} the time, {{values}} all values of the chain and {{a}} to {{d}} the values at inputs A to D. Example: “{{coin}} at {{price}}, RSI {{a}}” becomes “BTC at $81,616, RSI 28.7”."
  ),
  icon: "text",
  keywords: { de: ["text", "nachricht", "vorlage", "platzhalter"], en: ["text", "message", "template", "placeholder"] },
  inputs: [
    { id: "a", type: "series", label: l("A", "A"), optional: true },
    { id: "b", type: "series", label: l("B", "B"), optional: true },
    { id: "c", type: "series", label: l("C", "C"), optional: true },
    { id: "d", type: "series", label: l("D", "D"), optional: true }
  ],
  outputs: [{ id: "out", type: "text", label: l("Nachricht", "Message") }],
  settings: {
    text: {
      type: "text",
      label: l("Text", "Text"),
      help: l(
        "Bis zu 1.000 Zeichen. Zahlen und Uhrzeiten erscheinen in der Sprache und Zeitzone des Empfängers. Mit **fett**, _kursiv_ und `Code` hebst du Text hervor.",
        "Up to 1,000 characters. Numbers and times appear in the recipient’s language and time zone. Use **bold**, _italic_ and `code` to highlight text."
      ),
      default: DEFAULT_MESSAGE,
      maxLength: 1e3,
      multiline: true
    }
  },
  sentence: ({ settings }) => settings.text.length > 48 ? `${settings.text.slice(0, 47)}…` : settings.text,
  short: ({ locale }) => l("Nachricht", "message")[locale],
  compute({ inputs: inputs2, settings, bars }) {
    const out = new Array(bars.length);
    for (let i = 0; i < bars.length; i++) {
      const values = {};
      for (const pin of VALUE_PINS) values[pin] = inputs2[pin]?.[i] ?? null;
      out[i] = { template: settings.text, values };
    }
    return { out };
  }
});

// packages/nodes/src/actions/actions.ts
var inputs = [
  { id: "in", type: "signal", label: l("Auslöser", "Trigger") },
  { id: "message", type: "text", label: l("Nachricht", "Message"), optional: true }
];
var cooldown = {
  type: "number",
  label: l("Höchstens alle … Stunden", "At most every … hours"),
  help: l(
    "Cooldown: Nach einem Alarm wartet die Aktion mindestens so lange bis zum nächsten. 4 Stunden passen für die meisten Chains. 0 heißt: Jedes Mal, wenn die Bedingung wahr wird, kommt ein Alarm.",
    "Cooldown: after an alert the action waits at least this long before the next one. 4 hours suit most chains. 0 means an alert every time the condition turns true."
  ),
  default: 4,
  min: 0,
  max: 168,
  step: 0.5,
  unit: l("h", "h")
};
var message = {
  type: "text",
  label: l("Nachricht", "Message"),
  help: l(
    "Der Text des Alarms. {{kette}} setzt den Namen der Chain ein, {{werte}} die Werte der Bausteine, {{kurs}} den Kurs; dazu gibt es {{paar}}, {{coin}} und {{zeit}}. Mit **fett**, _kursiv_ und `Code` hebst du Text hervor. Hängt eine Nachrichtenvorlage am Eingang Nachricht, gilt deren Text.",
    "The alert text. {{chain}} inserts the chain’s name, {{values}} the values of the nodes, {{price}} the price; there are also {{pair}}, {{coin}} and {{time}}. Use **bold**, _italic_ and `code` to highlight text. If a message template is connected to the Message input, its text is used instead."
  ),
  default: DEFAULT_MESSAGE,
  maxLength: 1e3,
  multiline: true
};
var chart = {
  type: "select",
  label: l("Chart im Alarm", "Chart in the alert"),
  help: l(
    "Schickt zum Alarm ein Bild des Charts mit: die Kerzen bis zum Alarm, die Linien, Bänder und Felder der Chain und die Marke an der Kerze des Alarms. „Ohne“ schickt nur den Text.",
    "Sends a picture of the chart with the alert: the candles up to the alert, the chain’s lines, bands and panes and the marker at the alert’s candle. “Off” sends the text only."
  ),
  default: "on",
  options: [
    {
      value: "on",
      label: l("Mit Bild", "With picture"),
      help: l(
        "Der Alarm kommt mit dem Bild: in Telegram als Foto mit dem Text darunter, in der E-Mail unter der Nachricht, in Discord als Anhang.",
        "The alert comes with the picture: in Telegram as a photo with the text below, in email below the message, in Discord as an attachment."
      )
    },
    {
      value: "off",
      label: l("Ohne", "Off"),
      help: l("Nur der Text, etwa wenn Alarme in einer Gruppe kurz bleiben sollen.", "Text only, for example when alerts in a group should stay short.")
    }
  ]
};
function pause(hours, locale) {
  if (hours === 0) return locale === "de" ? "bei jeder Auslösung" : "on every trigger";
  return locale === "de" ? `höchstens alle ${formatNumber(hours, locale)} h` : `at most every ${formatNumber(hours, locale)} h`;
}
var KEYWORDS2 = { de: ["benachrichtigung", "nachricht", "alarm"], en: ["notification", "message", "alert"] };
var WEBHOOK_HEADER_NAME = "^[A-Za-z][A-Za-z0-9-]{0,63}$";
var push = defineNode({
  id: "core.push",
  version: "1.0.0",
  category: "act",
  label: l("Push", "Push"),
  description: l("Push-Mitteilung auf Handy und Computer", "Push notification to phone and computer"),
  help: l(
    "Schickt bei einem Alarm eine Push-Mitteilung an jedes Gerät, auf dem du Mitteilungen von Bellchain erlaubt hast: iPhone, Android oder Computer. Auf dem iPhone geht das nur mit der App auf dem Home-Bildschirm. Wie du Push einrichtest, steht unter Benachrichtigungen. Beispiel: „RSI 14 unter 30“ an Push, und dein Handy meldet sich, sobald BTC überverkauft ist.",
    "Sends a push notification to every device where you allowed notifications from Bellchain: iPhone, Android or computer. On iPhone this only works with the app on your home screen. Setting up push is explained under Notifications. Example: “RSI 14 below 30” into Push, and your phone alerts you as soon as BTC is oversold."
  ),
  icon: "smartphone",
  keywords: { de: [...KEYWORDS2.de, "push", "handy"], en: [...KEYWORDS2.en, "push", "phone"] },
  inputs,
  outputs: [],
  settings: { cooldown, message },
  effect: { kind: "notify", channel: "push" },
  sentence: ({ settings, locale }) => pause(settings.cooldown, locale)
});
var email = defineNode({
  id: "core.email",
  version: "1.0.0",
  category: "act",
  label: l("E-Mail", "Email"),
  description: l("E-Mail an deine bestätigten Adressen", "Email to your confirmed addresses"),
  help: l(
    "Schickt bei einem Alarm eine E-Mail an alle bestätigten Adressen deines Kontos. Weitere Adressen fügst du unter Benachrichtigungen hinzu; sie bekommen Alarme, sobald der Link in der Bestätigungsmail geklickt ist. Beispiel: Der Betreff „{{kette}}: RSI unter 30“ zeigt dir schon im Posteingang, worum es geht.",
    "Sends an email to all confirmed addresses of your account. Add more addresses under Notifications; they receive alerts once the link in the confirmation email has been clicked. Example: the subject “{{chain}}: RSI below 30” tells you in your inbox what it is about."
  ),
  icon: "mail",
  keywords: { de: [...KEYWORDS2.de, "e-mail", "mail"], en: [...KEYWORDS2.en, "email", "mail"] },
  inputs,
  outputs: [],
  settings: {
    subject: {
      type: "text",
      label: l("Betreff", "Subject"),
      help: l(
        "Betreffzeile der E-Mail, bis zu 120 Zeichen, mit denselben Platzhaltern wie die Nachricht. Standard ist der Name der Chain.",
        "Subject line of the email, up to 120 characters, with the same placeholders as the message. The default is the chain’s name."
      ),
      default: "{{kette}}",
      maxLength: 120
    },
    cooldown,
    message,
    chart
  },
  effect: { kind: "notify", channel: "email" },
  sentence: ({ settings, locale }) => `${locale === "de" ? "an mich" : "to me"} · ${pause(settings.cooldown, locale)}`
});
var telegram = defineNode({
  id: "core.telegram",
  version: "1.0.0",
  category: "act",
  label: l("Telegram", "Telegram"),
  description: l("Nachricht in Telegram über @BellchainBot", "Message in Telegram via @BellchainBot"),
  help: l(
    "Schickt den Alarm über @BellchainBot in deinen Telegram-Chat. Verbinde Telegram einmal unter Benachrichtigungen und lass das Feld Chat leer. Im Plan Community gehen Alarme auch in Gruppen und Kanäle: Trag deren Chat-ID oder @Namen ein; @BellchainBot muss dort Mitglied sein, in Kanälen als Admin. Beispiel: Der Alarm „BTC Dip-Käufer: RSI 14: 28,7 · Kurs: 81.616 $“ kommt als Nachricht in deinen Chat.",
    "Sends the alert via @BellchainBot to your Telegram chat. Connect Telegram once under Notifications and leave the Chat field empty. On the Community plan, alerts can also go to groups and channels: enter their chat ID or @name; @BellchainBot must be a member there, in channels as an admin. Example: the alert “BTC Dip Buyer: RSI 14: 28.7 · Price: $81,616” arrives as a message in your chat."
  ),
  icon: "send",
  keywords: { de: [...KEYWORDS2.de, "telegram", "bot", "chat"], en: [...KEYWORDS2.en, "telegram", "bot", "chat"] },
  inputs,
  outputs: [],
  settings: {
    chat: {
      type: "text",
      label: l("Chat", "Chat"),
      help: l(
        "Leer lassen für deinen verbundenen Privatchat. Gruppen und Kanäle gibt es im Plan Community: für eine Gruppe die Chat-ID (beginnt mit -100, /chatid in der Gruppe nennt sie dir), für einen öffentlichen Kanal den Namen mit @, etwa @meinkanal. Du musst dort Ersteller oder Admin sein.",
        "Leave empty for your connected private chat. Groups and channels come with the Community plan: for a group enter the chat ID (starts with -100, /chatid in the group tells you), for a public channel its name with @, such as @mychannel. You must be its creator or an admin."
      ),
      default: "",
      pattern: "^(-?\\d{1,20}|@[A-Za-z0-9_]{5,32})$",
      maxLength: 33
    },
    cooldown,
    message,
    chart
  },
  effect: { kind: "notify", channel: "telegram" },
  sentence: ({ settings, locale }) => `${settings.chat || (locale === "de" ? "verknüpfter Chat" : "linked chat")} · ${pause(settings.cooldown, locale)}`
});
var webhook = defineNode({
  id: "core.webhook",
  version: "1.0.0",
  category: "act",
  label: l("Webhook", "Webhook"),
  description: l("Alarm an n8n, Zapier oder eigene Bots", "Alert to n8n, Zapier or your own bots"),
  help: l(
    "Schickt bei einem Alarm die Daten an deine eigene https-Adresse: Chain, Kurs, Werte und Nachricht, mit einer Signatur, an der du Bellchain als Absender erkennst. So startest du eigene Abläufe, etwa einen n8n-Workflow, einen Zap in Zapier oder eine Automation in Home Assistant. Webhooks gibt es ab dem Plan Trader. Beispiel: Bei „Kurs über 100.000“ ruft Bellchain deine Adresse auf, und dein Workflow trägt den Kurs in eine Tabelle ein.",
    "Sends the alert data to your own https address: chain, price, values and message, with a signature that proves it comes from Bellchain. That is how you start your own workflows, such as an n8n workflow, a Zap in Zapier or an automation in Home Assistant. Webhooks come with the Trader plan and up. Example: on “Price above 100,000” Bellchain calls your address, and your workflow writes the price into a spreadsheet."
  ),
  technical: l("POST mit JSON und HMAC-SHA256-Signatur im Header Bellchain-Signature; Aufbau unter „Webhooks empfangen“.", "POST with JSON and an HMAC-SHA256 signature in the Bellchain-Signature header; details under “Receiving webhooks”."),
  icon: "webhook",
  keywords: { de: [...KEYWORDS2.de, "webhook", "json", "api", "n8n"], en: [...KEYWORDS2.en, "webhook", "json", "api", "n8n"] },
  inputs,
  outputs: [],
  settings: {
    url: {
      type: "text",
      label: l("Adresse", "URL"),
      help: l(
        "Die https-Adresse, an die Bellchain bei jedem Alarm sendet, etwa die Webhook-Adresse aus n8n oder Zapier. Adressen im eigenen Netz wie localhost gehen nicht. Wer die Adresse kennt, kann dorthin senden. Darum bleibt sie im Export der Chain leer, außer du wählst dort „Mit Adressen exportieren“.",
        "The https address Bellchain sends to on every alert, such as the webhook URL from n8n or Zapier. Addresses on your own network such as localhost do not work. Anyone who knows the URL can send to it. That is why it stays empty when you export the chain, unless you choose “Export with URLs” there."
      ),
      default: "",
      format: "url",
      maxLength: 500,
      required: true,
      secret: true,
      placeholder: l("https://…", "https://…")
    },
    headerName: {
      type: "text",
      label: l("Header", "Header"),
      help: l(
        "Optional: ein fester Header, den dein Empfänger prüft, etwa x-make-apikey für Make oder der Name aus der Header-Prüfung in n8n. Leer lassen, wenn du die Signatur prüfst.",
        "Optional: a fixed header your receiver checks, such as x-make-apikey for Make or the name from the header auth in n8n. Leave empty if you verify the signature."
      ),
      default: "",
      pattern: WEBHOOK_HEADER_NAME,
      maxLength: 64,
      advanced: true,
      placeholder: l("x-make-apikey", "x-make-apikey")
    },
    headerValue: {
      type: "text",
      label: l("Header-Wert", "Header value"),
      help: l(
        "Der Wert zum Header, etwa der API-Key aus Make. Behandle ihn wie ein Passwort; darum bleibt er im Export der Chain leer.",
        "The value for the header, such as the API key from Make. Treat it like a password; that is why it stays empty when you export the chain."
      ),
      default: "",
      maxLength: 500,
      secret: true,
      advanced: true
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "webhook" },
  sentence: ({ settings, locale }) => {
    let host = locale === "de" ? "Adresse fehlt" : "URL missing";
    try {
      if (settings.url) host = new URL(settings.url).host;
    } catch {
      host = settings.url;
    }
    return `${host} · ${pause(settings.cooldown, locale)}`;
  }
});
var DISCORD_WEBHOOK = "^https://(?:(?:ptb|canary)\\.)?discord(?:app)?\\.com/api/webhooks/\\d{17,20}/[A-Za-z0-9_-]{60,100}$";
var discord = defineNode({
  id: "core.discord",
  version: "1.0.0",
  category: "act",
  label: l("Discord", "Discord"),
  description: l("Nachricht in einen Discord-Kanal", "Message to a Discord channel"),
  help: l(
    "Schickt den Alarm per Webhook in einen Kanal deines Discord-Servers, etwa für deine Community. Den Webhook legst du in Discord an: Kanal bearbeiten, Integrationen, Webhooks, Neuer Webhook, dann Webhook-URL kopieren. Name und Bild des Absenders stellst du dort ein. Erwähnungen wie @everyone pingen niemanden. Discord gibt es im Plan Community. Beispiel: Der Alarm „BTC Dip-Käufer: RSI 14: 28,7 · Kurs: 81.616 $“ erscheint als Nachricht im Kanal.",
    "Sends the alert via webhook to a channel on your Discord server, for example for your community. Create the webhook in Discord: Edit channel, Integrations, Webhooks, New Webhook, then Copy Webhook URL. Set the sender’s name and picture there. Mentions such as @everyone ping nobody. Discord comes with the Community plan. Example: the alert “BTC Dip Buyer: RSI 14: 28.7 · Price: $81,616” appears as a message in the channel."
  ),
  technical: l(
    "POST an die Webhook-URL mit content und allowed_mentions ohne Erwähnungen, ohne Link-Vorschau. Nur Adressen von discord.com; im Versandprotokoll steht nur die Nummer des Webhooks.",
    "POST to the webhook URL with content and allowed_mentions without mentions, no link preview. Only discord.com addresses; the delivery log keeps only the webhook’s number."
  ),
  icon: "messages-square",
  keywords: { de: [...KEYWORDS2.de, "discord", "server", "community"], en: [...KEYWORDS2.en, "discord", "server", "community"] },
  inputs,
  outputs: [],
  settings: {
    url: {
      type: "text",
      label: l("Webhook-URL", "Webhook URL"),
      help: l(
        "Die Webhook-URL aus Discord, sie beginnt mit https://discord.com/api/webhooks/. Behandle sie wie ein Passwort: Wer sie kennt, kann in den Kanal schreiben. Darum bleibt sie im Export der Chain leer, außer du wählst dort „Mit Adressen exportieren“.",
        "The webhook URL from Discord; it starts with https://discord.com/api/webhooks/. Treat it like a password: anyone who knows it can post to the channel. That is why it stays empty when you export the chain, unless you choose “Export with URLs” there."
      ),
      default: "",
      pattern: DISCORD_WEBHOOK,
      maxLength: 200,
      required: true,
      secret: true,
      placeholder: l("https://discord.com/api/webhooks/…", "https://discord.com/api/webhooks/…")
    },
    cooldown,
    message,
    chart
  },
  effect: { kind: "notify", channel: "discord" },
  sentence: ({ settings, locale }) => `${settings.url ? "Discord" : locale === "de" ? "Webhook fehlt" : "Webhook missing"} · ${pause(settings.cooldown, locale)}`
});
var PUSHOVER_USER = "^[A-Za-z0-9]{30}$";
var pushover = defineNode({
  id: "core.pushover",
  version: "1.0.0",
  category: "act",
  label: l("Pushover", "Pushover"),
  description: l("Push über Pushover, auch dringend", "Push via Pushover, urgent if needed"),
  help: l(
    "Schickt den Alarm über die App Pushover auf Handy, Tablet und Computer. Mit der Stufe „Dringend“ wiederholt Pushover ihn jede Minute, bis du ihn bestätigst, höchstens eine Stunde lang, und auf dem iPhone kommt er auch bei „Nicht stören“ durch. So verpasst du nichts, ganz ohne Anruf oder SMS. Du brauchst die App Pushover (nach 30 Tagen Test einmalig rund 5 $ je Plattform) und trägst hier deinen User Key ein. Pushover gibt es ab dem Plan Pro. Beispiel: „Kurs unter 80.000“ an Pushover mit „Dringend“, und dein Handy meldet sich, bis du reagierst.",
    "Sends the alert via the Pushover app to your phone, tablet and computer. With the “Urgent” level, Pushover repeats it every minute until you acknowledge it, for at most an hour, and on iPhone it gets through “Do Not Disturb”. That way you miss nothing, without calls or text messages. You need the Pushover app (after a 30-day trial a one-time fee of about $5 per platform) and enter your user key here. Pushover comes with the Pro plan and up. Example: “Price below 80,000” into Pushover with “Urgent”, and your phone keeps alerting you until you react."
  ),
  technical: l(
    "POST an api.pushover.net mit dem App-Token von Bellchain und deinem User Key, Priorität −1 bis 2; bei „Dringend“ retry 60 s und expire 3600 s. Im Versandprotokoll steht nur ein Fingerabdruck des Schlüssels.",
    "POST to api.pushover.net with Bellchain’s app token and your user key, priority −1 to 2; “Urgent” uses retry 60 s and expire 3600 s. The delivery log keeps only a fingerprint of the key."
  ),
  icon: "bell-ring",
  keywords: { de: [...KEYWORDS2.de, "pushover", "push", "dringend", "handy"], en: [...KEYWORDS2.en, "pushover", "push", "urgent", "phone"] },
  inputs,
  outputs: [],
  settings: {
    user: {
      type: "text",
      label: l("User Key", "User key"),
      help: l(
        "Dein User Key steht nach der Anmeldung oben auf pushover.net, 30 Zeichen. Für eine Gruppe nimm deren Gruppenschlüssel. Er bleibt im Export der Chain leer.",
        "Your user key is shown at the top of pushover.net after you log in, 30 characters. For a group, use its group key. It stays empty when you export the chain."
      ),
      default: "",
      pattern: PUSHOVER_USER,
      maxLength: 30,
      required: true,
      secret: true
    },
    priority: {
      type: "select",
      label: l("Stufe", "Level"),
      help: l(
        "Wie laut der Alarm kommt. „Dringend“ ist für Alarme, die du nicht verpassen darfst, etwa einen Kurssturz in der Nacht.",
        "How loud the alert is. “Urgent” is for alerts you must not miss, such as a price crash at night."
      ),
      default: "normal",
      options: [
        { value: "quiet", label: l("Leise", "Quiet"), help: l("Ohne Ton und Vibration, nur in der Liste der App.", "No sound or vibration, only in the app’s list.") },
        { value: "normal", label: l("Normal", "Normal"), help: l("Mit Ton, wie in der App eingestellt.", "With sound, as set in the app.") },
        { value: "high", label: l("Hoch", "High"), help: l("Hervorgehoben und mit Ton, auch in den Ruhezeiten der App.", "Highlighted and with sound, even during the app’s quiet hours.") },
        {
          value: "emergency",
          label: l("Dringend", "Urgent"),
          help: l(
            "Wiederholt jede Minute, bis du in Pushover bestätigst, höchstens eine Stunde; kommt auf dem iPhone durch „Nicht stören“.",
            "Repeats every minute until you acknowledge in Pushover, for at most an hour; gets through “Do Not Disturb” on iPhone."
          )
        }
      ]
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "pushover" },
  sentence: ({ settings, locale }) => {
    const level = { quiet: l("leise", "quiet"), normal: l("normal", "normal"), high: l("hoch", "high"), emergency: l("dringend", "urgent") }[settings.priority];
    return `${level[locale]} · ${pause(settings.cooldown, locale)}`;
  }
});
var NTFY_TOPIC = "^[-_A-Za-z0-9]{1,64}$";
var NTFY_TOKEN = "^tk_[A-Za-z0-9]{20,64}$";
var ntfy = defineNode({
  id: "core.ntfy",
  version: "1.0.0",
  category: "act",
  label: l("ntfy", "ntfy"),
  description: l("Push über ntfy, auch vom eigenen Server", "Push via ntfy, also from your own server"),
  help: l(
    "Schickt den Alarm über ntfy an alle Geräte, die ein Thema abonniert haben: Android, iPhone oder Browser. Abonniere in der ntfy-App ein Thema mit einem schwer zu erratenden Namen und trag denselben Namen hier ein. Auf ntfy.sh brauchst du ein Konto mit Tarif und dessen Zugangstoken, mit deinem eigenen ntfy-Server geht es auch ohne. ntfy gibt es ab dem Plan Pro. Beispiel: Mit der Priorität „Max“ vibriert dein Android-Handy bei „Kurs über 100.000“ lange.",
    "Sends the alert via ntfy to every device subscribed to a topic: Android, iPhone or browser. Subscribe to a topic with a hard-to-guess name in the ntfy app and enter the same name here. On ntfy.sh you need an account with a paid tier and its access token; with your own ntfy server it also works without. ntfy comes with the Pro plan and up. Example: with priority “Max”, your Android phone vibrates for a long time on “Price above 100,000”."
  ),
  technical: l(
    "POST mit JSON an den Server (Titel = Name der Chain, Klick öffnet die Chain, Knöpfe für Chart und Börse), Token als Bearer. Im Versandprotokoll stehen nur der Server und ein Fingerabdruck des Themas.",
    "POST with JSON to the server (title = chain name, click opens the chain, buttons for chart and exchange), token as bearer. The delivery log keeps only the server and a fingerprint of the topic."
  ),
  icon: "radio",
  keywords: { de: [...KEYWORDS2.de, "ntfy", "push", "selbst gehostet"], en: [...KEYWORDS2.en, "ntfy", "push", "self-hosted"] },
  inputs,
  outputs: [],
  settings: {
    server: {
      type: "text",
      label: l("Server", "Server"),
      help: l(
        "Adresse deines ntfy-Servers, Standard ist ntfy.sh. Ein eigener Server muss per https aus dem Internet erreichbar sein.",
        "Address of your ntfy server; the default is ntfy.sh. Your own server must be reachable from the internet via https."
      ),
      default: "https://ntfy.sh",
      format: "url",
      maxLength: 200
    },
    topic: {
      type: "text",
      label: l("Thema", "Topic"),
      help: l(
        "Das Thema, das du in der ntfy-App abonniert hast: Buchstaben, Ziffern, - und _, höchstens 64 Zeichen. Wer den Namen kennt, liest mit; nimm etwas schwer zu Erratendes wie bellchain-7Kq2xW9. Darum bleibt er im Export der Chain leer.",
        "The topic you subscribed to in the ntfy app: letters, digits, - and _, at most 64 characters. Anyone who knows the name can read along; pick something hard to guess such as bellchain-7Kq2xW9. That is why it stays empty when you export the chain."
      ),
      default: "",
      pattern: NTFY_TOPIC,
      maxLength: 64,
      required: true,
      secret: true
    },
    token: {
      type: "text",
      label: l("Zugangstoken", "Access token"),
      help: l(
        "Token deines ntfy-Kontos, beginnt mit tk_ (Konto, Zugangstokens). Auf ntfy.sh Pflicht, auf eigenen Servern nur nötig, wenn das Thema geschützt ist. Bleibt im Export der Chain leer.",
        "Token of your ntfy account, starts with tk_ (Account, Access tokens). Required on ntfy.sh, on your own server only if the topic is protected. It stays empty when you export the chain."
      ),
      default: "",
      pattern: NTFY_TOKEN,
      maxLength: 70,
      secret: true
    },
    priority: {
      type: "select",
      label: l("Priorität", "Priority"),
      help: l("Wie laut der Alarm auf dem Handy kommt, von Min bis Max; Standard ist 3.", "How loud the alert is on the phone, from Min to Max; the default is 3."),
      default: "3",
      options: [
        { value: "1", label: l("Min", "Min"), help: l("Ohne Ton und Vibration, nur in der Liste.", "No sound or vibration, only in the list.") },
        { value: "2", label: l("Niedrig", "Low"), help: l("Ohne Ton, je nach Gerät eingeklappt.", "No sound, collapsed on some devices.") },
        { value: "3", label: l("Standard", "Default"), help: l("Ton und Vibration wie bei anderen Apps.", "Sound and vibration like other apps.") },
        { value: "4", label: l("Hoch", "High"), help: l("Lange Vibration und Hinweis oben auf dem Bildschirm.", "Long vibration and a pop-over notification.") },
        { value: "5", label: l("Max", "Max"), help: l("Sehr lange Vibration; je nach Einstellung des Handys auch bei „Nicht stören“.", "Very long vibration; depending on the phone’s settings even in “Do Not Disturb”.") }
      ]
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "ntfy" },
  sentence: ({ settings, locale }) => {
    let host = "ntfy.sh";
    try {
      host = new URL(settings.server).host;
    } catch {
      host = settings.server || host;
    }
    return `${host} · ${pause(settings.cooldown, locale)}`;
  }
});
var BOT_URL = "^https://(?![^/?#]*(?:discord(?:app)?\\.com|hooks\\.slack\\.com|chat\\.googleapis\\.com|powerplatform\\.com|logic\\.azure\\.com|api\\.telegram\\.org)(?:[:/?#]|$))\\S+$";
var BOT_LABELS = {
  "3commas": l("3Commas", "3Commas"),
  wundertrading: l("WunderTrading", "WunderTrading"),
  traderspost: l("TradersPost", "TradersPost"),
  alertatron: l("Alertatron", "Alertatron"),
  octobot: l("OctoBot", "OctoBot"),
  custom: l("eigenes Format", "custom format")
};
var BOT_ACTION_LABELS = { buy: l("kaufen", "buy"), sell: l("verkaufen", "sell"), exit: l("schließen", "close") };
var tradingBot = defineNode({
  id: "core.bot",
  version: "1.0.0",
  category: "act",
  label: l("Trading-Bot", "Trading bot"),
  description: l("Signal an deinen eigenen Trading-Bot", "Signal to your own trading bot"),
  help: l(
    "Schickt den Alarm als Signal an deinen eigenen Trading-Bot, im Format, das er erwartet: 3Commas, WunderTrading, TradersPost, Alertatron, OctoBot oder ein eigenes Format. Dein Bot handelt, Bellchain nie: Bellchain kennt keine Zugangsdaten deiner Börse und gibt keine Anlageberatung. Richtung und Betrag legst du hier oder im Bot fest. Test-Alarme gehen nicht an den Bot, damit kein Test eine echte Order auslöst. Trading-Bots gibt es ab dem Plan Trader. Beispiel: „RSI 14 unter 30“ mit „Kaufen“ und 100 USDT an einen Signal-Bot in 3Commas.",
    "Sends the alert as a signal to your own trading bot, in the format it expects: 3Commas, WunderTrading, TradersPost, Alertatron, OctoBot or a custom format. Your bot trades, Bellchain never does: Bellchain knows no credentials of your exchange and gives no investment advice. Set the direction and amount here or in the bot. Test alerts do not go to the bot, so that no test places a real order. Trading bots come with the Trader plan and up. Example: “RSI 14 below 30” with “Buy” and 100 USDT to a signal bot in 3Commas."
  ),
  technical: l(
    "POST über IPv4 von der festen Adresse aus der Doku (für Bots, die nur eingetragene IPs annehmen), nur https, ohne Weiterleitungen. Wiederholt nur bei 429, 503 und Verbindungsfehlern vor dem Senden, höchstens 2 Minuten lang, damit keine Order doppelt ausgelöst wird. Platzhalter im Inhalt: {{token}}, {{action}}, {{ACTION}}, {{symbol}}, {{pair}}, {{base}}, {{quote}}, {{exchange}}, {{price}}, {{time}}, {{timestamp}}, {{amount}}, {{amount_type}}, {{chain}}, {{message}}, {{id}}.",
    "POST over IPv4 from the fixed address in the docs (for bots that accept only listed IPs), https only, no redirects. Retries only on 429, 503 and connection errors before sending, for at most 2 minutes, so that no order is placed twice. Placeholders in the content: {{token}}, {{action}}, {{ACTION}}, {{symbol}}, {{pair}}, {{base}}, {{quote}}, {{exchange}}, {{price}}, {{time}}, {{timestamp}}, {{amount}}, {{amount_type}}, {{chain}}, {{message}}, {{id}}."
  ),
  icon: "bot",
  keywords: {
    de: [...KEYWORDS2.de, "bot", "trading", "signal", "automatisch", "3commas", "wundertrading", "traderspost", "alertatron", "octobot"],
    en: [...KEYWORDS2.en, "bot", "trading", "signal", "automation", "3commas", "wundertrading", "traderspost", "alertatron", "octobot"]
  },
  inputs,
  outputs: [],
  settings: {
    bot: {
      type: "select",
      label: l("Bot", "Bot"),
      help: l(
        "Für welchen Bot Bellchain das Signal formatiert. Was du dafür im Bot einstellst, steht bei der jeweiligen Wahl und in der Doku unter „Trading-Bots“.",
        "Which bot Bellchain formats the signal for. What to set up in the bot is described with each choice and in the docs under “Trading bots”."
      ),
      default: "3commas",
      options: [
        {
          value: "3commas",
          label: BOT_LABELS["3commas"],
          help: l(
            "Signal-Bot mit Startbedingung „API request“: Adresse https://3c.wtalerts.com/bot/custom, im Feld Code der Code der Aktion aus 3Commas. Trag in 3Commas die Absender-IP von Bellchain ein (steht in der Doku).",
            "Signal bot with the start condition “API request”: URL https://3c.wtalerts.com/bot/custom, the action’s code from 3Commas in the Code field. Add Bellchain’s sender IP in 3Commas (see the docs)."
          )
        },
        {
          value: "wundertrading",
          label: BOT_LABELS.wundertrading,
          help: l(
            "Signal-Bot mit Startbedingung „API request“: Adresse https://wtalerts.com/bot/custom, im Feld Code der Code der Aktion. Trag die Absender-IP von Bellchain ein (steht in der Doku).",
            "Signal bot with the start condition “API request”: URL https://wtalerts.com/bot/custom, the action’s code in the Code field. Add Bellchain’s sender IP (see the docs)."
          )
        },
        {
          value: "traderspost",
          label: BOT_LABELS.traderspost,
          help: l("Webhook-Adresse deiner Strategie; das Paar geht als BTCUSDT raus, die Richtung als buy, sell oder exit.", "Webhook URL of your strategy; the pair is sent as BTCUSDT, the direction as buy, sell or exit.")
        },
        {
          value: "alertatron",
          label: BOT_LABELS.alertatron,
          help: l(
            "Webhook-Adresse aus Alertatron; den Befehl, etwa MyKeys(BTCUSDT) { market(side=buy, amount=10%); } #bot, schreibst du ins Feld Code.",
            "Webhook URL from Alertatron; write the command, such as MyKeys(BTCUSDT) { market(side=buy, amount=10%); } #bot, into the Code field."
          )
        },
        {
          value: "octobot",
          label: BOT_LABELS.octobot,
          help: l("Adresse deines OctoBot-Webhooks; Börse und Paar kommen aus der Kerze, das Token ins Feld Code.", "URL of your OctoBot webhook; exchange and pair come from the candle, the token goes into the Code field.")
        },
        {
          value: "custom",
          label: l("Eigenes Format", "Custom format"),
          help: l("Für jeden anderen Bot: Inhalt mit Platzhaltern unter „Mehr“.", "For any other bot: content with placeholders under “More”.")
        }
      ]
    },
    url: {
      type: "text",
      label: l("Adresse", "URL"),
      help: l(
        "Die Webhook-Adresse deines Bots, beginnend mit https://. Für Chat-Dienste wie Discord oder Slack gibt es eigene Bausteine. Bei manchen Bots steckt das Geheimnis in der Adresse; darum bleibt sie im Export der Chain leer.",
        "Your bot’s webhook URL, starting with https://. Chat services such as Discord or Slack have their own nodes. Some bots keep the secret in the URL; that is why it stays empty when you export the chain."
      ),
      default: "",
      pattern: BOT_URL,
      maxLength: 500,
      required: true,
      secret: true,
      placeholder: l("https://…", "https://…")
    },
    token: {
      type: "text",
      label: l("Code", "Code"),
      help: l(
        "Was dein Bot als Geheimnis erwartet: bei 3Commas und WunderTrading der Code der Aktion (für Kaufen ein anderer als für Schließen), bei OctoBot das Token, bei Alertatron der ganze Befehl. Leer lassen, wenn die Adresse das Geheimnis trägt (TradersPost). Bleibt im Export der Chain leer.",
        "Whatever your bot expects as its secret: for 3Commas and WunderTrading the action’s code (buying uses a different one than closing), for OctoBot the token, for Alertatron the whole command. Leave empty if the URL carries the secret (TradersPost). It stays empty when you export the chain."
      ),
      default: "",
      maxLength: 1e3,
      secret: true
    },
    action: {
      type: "select",
      label: l("Richtung", "Direction"),
      help: l("Was der Bot tun soll. Für Ein- und Ausstieg legst du zwei Aktionen an, jede mit eigener Bedingung.", "What the bot should do. For entry and exit, add two actions, each with its own condition."),
      default: "buy",
      options: [
        { value: "buy", label: l("Kaufen / Long", "Buy / long"), help: l("Einstieg: kaufen bzw. Long eröffnen.", "Entry: buy or open a long.") },
        { value: "sell", label: l("Verkaufen / Short", "Sell / short"), help: l("Verkaufen bzw. Short eröffnen, je nach Bot.", "Sell or open a short, depending on the bot.") },
        { value: "exit", label: l("Position schließen", "Close position"), help: l("Offene Position schließen; bei 3Commas und WunderTrading mit dem Code für den Ausstieg.", "Close the open position; for 3Commas and WunderTrading with the exit code.") }
      ]
    },
    amount: {
      type: "number",
      label: l("Betrag", "Amount"),
      help: l(
        "Wie viel je Signal, in der Einheit darunter. Bei 3Commas und WunderTrading Pflicht für Einstiege; 0 heißt: wie im Bot eingestellt.",
        "How much per signal, in the unit below. Required for entries with 3Commas and WunderTrading; 0 means: as set in the bot."
      ),
      default: 0,
      min: 0,
      max: 1e9,
      step: 1
    },
    amountType: {
      type: "select",
      label: l("Einheit", "Unit"),
      help: l("Worin der Betrag gemeint ist. Nicht jeder Bot kennt jede Einheit; OctoBot nimmt nur Basiswährung und Prozent.", "What the amount refers to. Not every bot knows every unit; OctoBot only takes base currency and percent."),
      default: "quote",
      options: [
        { value: "quote", label: l("Quote-Währung", "Quote currency"), help: l("Etwa 100 USDT bei BTC/USDT.", "Such as 100 USDT for BTC/USDT.") },
        { value: "percents", label: l("Prozent des Guthabens", "Percent of balance"), help: l("Etwa 10 für 10 % des verfügbaren Guthabens.", "Such as 10 for 10% of the available balance.") },
        { value: "base", label: l("Basiswährung", "Base currency"), help: l("Etwa 0,01 BTC bei BTC/USDT.", "Such as 0.01 BTC for BTC/USDT.") }
      ]
    },
    body: {
      type: "text",
      label: l("Inhalt", "Content"),
      help: l(
        "Eigener Inhalt statt der Vorlage, als JSON oder Text, mit Platzhaltern wie {{symbol}} (BTCUSDT), {{pair}}, {{action}}, {{price}}, {{time}}, {{token}} oder {{amount}}. Leer lassen für die Vorlage des gewählten Bots. Geheimnisse gehören ins Feld Code, hier nur {{token}}.",
        "Your own content instead of the template, as JSON or text, with placeholders such as {{symbol}} (BTCUSDT), {{pair}}, {{action}}, {{price}}, {{time}}, {{token}} or {{amount}}. Leave empty for the selected bot’s template. Secrets belong in the Code field, here only {{token}}."
      ),
      default: "",
      maxLength: 2e3,
      multiline: true,
      advanced: true
    },
    tests: {
      type: "select",
      label: l("Test-Alarme", "Test alerts"),
      help: l("Ob Test-Alarme, etwa vom Test-Signal, an den Bot gehen.", "Whether test alerts, for example from the test signal, go to the bot."),
      default: "skip",
      advanced: true,
      options: [
        {
          value: "skip",
          label: l("Nicht senden", "Do not send"),
          help: l("Test-Alarme stehen nur im Verlauf, mit dem Inhalt, der gesendet worden wäre.", "Test alerts only go to the history, with the content that would have been sent.")
        },
        {
          value: "send",
          label: l("Senden", "Send"),
          help: l("Auch Test-Alarme gehen an den Bot, etwa für ein Paper-Konto. Ein echter Bot handelt dann wirklich.", "Test alerts go to the bot as well, for example for a paper account. A live bot then really trades.")
        }
      ]
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "bot" },
  sentence: ({ settings, locale }) => `${BOT_LABELS[settings.bot][locale]} · ${BOT_ACTION_LABELS[settings.action][locale]} · ${pause(settings.cooldown, locale)}`
});
var SLACK_WEBHOOK = "^https://hooks\\.slack\\.com/services/T[A-Z0-9]{6,15}/B[A-Z0-9]{6,15}/[A-Za-z0-9]{16,48}$";
var TEAMS_WEBHOOK = "^https://(?:[A-Za-z0-9-]+\\.)+powerplatform\\.com(?::443)?/[^\\s?#]*/workflows/[A-Za-z0-9-]+/[^\\s?#]*\\?(?:[^\\s#]*&)?sig=[^&\\s#]+[^\\s#]*$";
var GOOGLE_CHAT_WEBHOOK = "^https://chat\\.googleapis\\.com/v1/spaces/[A-Za-z0-9_-]+/messages\\?(?=[^\\s#]*\\bkey=[^&\\s#]+)(?=[^\\s#]*\\btoken=[^&\\s#]+)[^\\s#]+$";
function hookSentence(name4) {
  return ({ settings, locale }) => `${settings.url ? name4 : locale === "de" ? "Webhook fehlt" : "Webhook missing"} · ${pause(settings.cooldown, locale)}`;
}
var slack = defineNode({
  id: "core.slack",
  version: "1.0.0",
  category: "act",
  label: l("Slack", "Slack"),
  description: l("Nachricht in einen Slack-Kanal", "Message to a Slack channel"),
  help: l(
    "Schickt den Alarm per Webhook in einen Kanal deines Slack-Workspace, etwa für dein Team. Den Webhook legst du einmal in Slack an: unter api.slack.com/apps eine App erstellen, „Incoming Webhooks“ einschalten, „Add New Webhook“, Kanal wählen und die Webhook-URL kopieren. Slack gibt es im Plan Community. Beispiel: Der Alarm „BTC Dip-Käufer: RSI 14: 28,7 · Kurs: 81.616 $“ erscheint als Nachricht im Kanal.",
    "Sends the alert via webhook to a channel in your Slack workspace, for example for your team. Create the webhook once in Slack: create an app at api.slack.com/apps, turn on “Incoming Webhooks”, “Add New Webhook”, pick the channel and copy the webhook URL. Slack comes with the Community plan. Example: the alert “BTC Dip Buyer: RSI 14: 28.7 · Price: $81,616” appears as a message in the channel."
  ),
  technical: l(
    "POST an hooks.slack.com mit Text in mrkdwn, ohne Link-Vorschau; <, > und & sind maskiert, Erwähnungen wie @channel pingen niemanden. Im Versandprotokoll stehen nur Team und Hook.",
    "POST to hooks.slack.com with mrkdwn text, no link previews; <, > and & are escaped, mentions such as @channel ping nobody. The delivery log keeps only team and hook."
  ),
  icon: "hash",
  keywords: { de: [...KEYWORDS2.de, "slack", "team", "kanal"], en: [...KEYWORDS2.en, "slack", "team", "channel"] },
  inputs,
  outputs: [],
  settings: {
    url: {
      type: "text",
      label: l("Webhook-URL", "Webhook URL"),
      help: l(
        "Die Webhook-URL aus Slack, sie beginnt mit https://hooks.slack.com/services/. Behandle sie wie ein Passwort: Wer sie kennt, kann in den Kanal schreiben. Darum bleibt sie im Export der Chain leer.",
        "The webhook URL from Slack; it starts with https://hooks.slack.com/services/. Treat it like a password: anyone who knows it can post to the channel. That is why it stays empty when you export the chain."
      ),
      default: "",
      pattern: SLACK_WEBHOOK,
      maxLength: 200,
      required: true,
      secret: true,
      placeholder: l("https://hooks.slack.com/services/…", "https://hooks.slack.com/services/…")
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "slack" },
  sentence: hookSentence("Slack")
});
var teams = defineNode({
  id: "core.teams",
  version: "1.0.0",
  category: "act",
  label: l("Microsoft Teams", "Microsoft Teams"),
  description: l("Nachricht in einen Teams-Kanal", "Message to a Teams channel"),
  help: l(
    "Schickt den Alarm als Karte in einen Kanal von Microsoft Teams. Leg dafür im Kanal einen Workflow an: beim Kanal auf „…“, „Workflows“, Vorlage „Send webhook alerts to a channel“ (deutsch „Webhookwarnungen an einen Kanal senden“), dann die angezeigte Adresse kopieren. Dafür brauchst du ein Firmen- oder Schulkonto von Microsoft 365. Teams gibt es im Plan Community. Beispiel: Der Alarm erscheint als Karte mit Name, Nachricht und Werten im Kanal.",
    "Sends the alert as a card to a Microsoft Teams channel. Create a workflow in the channel: “…” next to the channel, “Workflows”, template “Send webhook alerts to a channel”, then copy the URL it shows. You need a Microsoft 365 work or school account for this. Teams comes with the Community plan. Example: the alert appears as a card with name, message and values in the channel."
  ),
  technical: l(
    "POST einer Adaptive Card an die Adresse des Workflows (*.powerplatform.com, mit Signatur sig=). Teams antwortet mit 202 und meldet nicht, ob der Post im Kanal ankam; höchstens 25 Posts in 5 Minuten je Workflow.",
    "POST of an Adaptive Card to the workflow URL (*.powerplatform.com, signed with sig=). Teams answers 202 and does not report whether the post reached the channel; at most 25 posts per 5 minutes per workflow."
  ),
  icon: "users-round",
  keywords: { de: [...KEYWORDS2.de, "teams", "microsoft", "team", "kanal"], en: [...KEYWORDS2.en, "teams", "microsoft", "team", "channel"] },
  inputs,
  outputs: [],
  settings: {
    url: {
      type: "text",
      label: l("Workflow-URL", "Workflow URL"),
      help: l(
        "Die Adresse des Workflows aus Teams; sie endet mit einer langen Signatur (sig=…). Wer sie kennt, kann in den Kanal schreiben. Darum bleibt sie im Export der Chain leer.",
        "The workflow URL from Teams; it ends with a long signature (sig=…). Anyone who knows it can post to the channel. That is why it stays empty when you export the chain."
      ),
      default: "",
      pattern: TEAMS_WEBHOOK,
      maxLength: 1500,
      required: true,
      secret: true,
      placeholder: l("https://….powerplatform.com/…", "https://….powerplatform.com/…")
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "teams" },
  sentence: hookSentence("Teams")
});
var googleChat = defineNode({
  id: "core.googlechat",
  version: "1.0.0",
  category: "act",
  label: l("Google Chat", "Google Chat"),
  description: l("Nachricht in einen Bereich von Google Chat", "Message to a Google Chat space"),
  help: l(
    "Schickt den Alarm per Webhook in einen Bereich von Google Chat. Den Webhook legst du im Browser an: Bereich öffnen, auf den Namen des Bereichs, „Apps und Integrationen“, „Webhooks“, hinzufügen und die Adresse kopieren. Webhooks gibt es nur in Google Workspace (Business oder Enterprise), und dein Admin muss sie erlauben. Google Chat gibt es im Plan Community.",
    "Sends the alert via webhook to a Google Chat space. Create the webhook in the browser: open the space, click its name, “Apps & integrations”, “Webhooks”, add one and copy the URL. Webhooks exist only in Google Workspace (Business or Enterprise), and your admin must allow them. Google Chat comes with the Community plan."
  ),
  technical: l(
    "POST an chat.googleapis.com mit Text in der Syntax von Google Chat; Erwähnungen wie <users/all> werden entschärft. Höchstens eine Nachricht pro Sekunde je Bereich. Im Versandprotokoll steht nur der Bereich.",
    "POST to chat.googleapis.com with text in Google Chat syntax; mentions such as <users/all> are defused. At most one message per second per space. The delivery log keeps only the space."
  ),
  icon: "message-circle",
  keywords: { de: [...KEYWORDS2.de, "google", "chat", "workspace", "team"], en: [...KEYWORDS2.en, "google", "chat", "workspace", "team"] },
  inputs,
  outputs: [],
  settings: {
    url: {
      type: "text",
      label: l("Webhook-URL", "Webhook URL"),
      help: l(
        "Die Webhook-URL aus Google Chat, sie beginnt mit https://chat.googleapis.com/v1/spaces/ und enthält key= und token=. Wer sie kennt, kann in den Bereich schreiben. Darum bleibt sie im Export der Chain leer.",
        "The webhook URL from Google Chat; it starts with https://chat.googleapis.com/v1/spaces/ and contains key= and token=. Anyone who knows it can post to the space. That is why it stays empty when you export the chain."
      ),
      default: "",
      pattern: GOOGLE_CHAT_WEBHOOK,
      maxLength: 500,
      required: true,
      secret: true,
      placeholder: l("https://chat.googleapis.com/v1/spaces/…", "https://chat.googleapis.com/v1/spaces/…")
    },
    cooldown,
    message
  },
  effect: { kind: "notify", channel: "googlechat" },
  sentence: hookSentence("Google Chat")
});
var logOnly = defineNode({
  id: "core.log",
  version: "1.0.0",
  category: "act",
  label: l("Nur protokollieren", "Log only"),
  description: l("Alarm nur im Verlauf, ohne Mitteilung", "Alerts go to the history, no notification"),
  help: l(
    "Schreibt jeden Alarm mit allen Werten in den Verlauf der Chain, ohne jemanden zu benachrichtigen. Gut zum Ausprobieren: Lass eine neue Chain eine Woche still laufen und sieh dann im Verlauf, wie oft und wann sie sich gemeldet hätte.",
    "Writes every alert with all values to the chain’s history without notifying anyone. Good for trying things out: let a new chain run silently for a week, then check in the history how often and when it would have alerted you."
  ),
  icon: "inbox",
  keywords: { de: ["verlauf", "protokoll", "log", "still"], en: ["history", "log", "silent"] },
  inputs,
  outputs: [],
  settings: { cooldown, message },
  effect: { kind: "log" },
  sentence: ({ settings, locale }) => `${locale === "de" ? "in den Verlauf" : "to history"} · ${pause(settings.cooldown, locale)}`
});

// packages/nodes/src/shared.ts
var FIXTURE = "binance-btcusdt-1h-500";
var LABEL_VALUE = l("Wert", "Value");
var LABEL_SIGNAL = l("Signal", "Signal");
var LABEL_RESULT = l("wahr/falsch", "true/false");
function fmt(value, locale) {
  return formatNumber(value, locale);
}
var UNIT = {
  m: l("Minute", "minute"),
  mm: l("Minuten", "minutes"),
  h: l("Stunde", "hour"),
  hh: l("Stunden", "hours"),
  d: l("Tag", "day"),
  dd: l("Tage", "days"),
  w: l("Woche", "week"),
  ww: l("Wochen", "weeks"),
  M: l("Monat", "month"),
  MM: l("Monate", "months")
};
function timeframeLabel(timeframe) {
  const count2 = Number.parseInt(timeframe, 10);
  const unit = timeframe.replace(String(count2), "");
  const word = (count2 === 1 ? UNIT[unit] : UNIT[unit + unit]) ?? l(unit, unit);
  return l(`${count2} ${word.de}`, `${count2} ${word.en}`);
}
var TIMEFRAME_OPTIONS = TIMEFRAMES.map((value) => ({ value, label: timeframeLabel(value) }));
var timezoneSetting = {
  type: "text",
  label: l("Zeitzone", "Time zone"),
  help: l(
    "In welcher Zeitzone Uhrzeiten und Tage gelten, etwa Europe/Berlin oder America/New_York. Sommer- und Winterzeit stellt Bellchain selbst um. Europe/Berlin passt für Deutschland, Österreich und die Schweiz.",
    "The time zone for times and days, such as Europe/Berlin or America/New_York. Bellchain handles daylight saving time. Europe/Berlin fits Germany, Austria and Switzerland."
  ),
  default: "Europe/Berlin",
  format: "timezone",
  maxLength: 64,
  advanced: true
};
var DAY_SETS = {
  daily: l("täglich", "daily"),
  weekdays: l("Mo–Fr", "Mon–Fri"),
  weekend: l("Sa–So", "Sat–Sun"),
  mon: l("montags", "Mondays"),
  tue: l("dienstags", "Tuesdays"),
  wed: l("mittwochs", "Wednesdays"),
  thu: l("donnerstags", "Thursdays"),
  fri: l("freitags", "Fridays"),
  sat: l("samstags", "Saturdays"),
  sun: l("sonntags", "Sundays")
};
var SINGLE_DAYS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function dayMatches(set, weekday) {
  if (set === "daily" || set === "all") return true;
  if (set === "weekdays") return weekday >= 1 && weekday <= 5;
  if (set === "weekend") return weekday === 0 || weekday === 6;
  return SINGLE_DAYS[set] === weekday;
}
function clock(hour, minute, locale) {
  const mm = String(minute).padStart(2, "0");
  if (locale === "de") return `${String(hour).padStart(2, "0")}:${mm}`;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${mm} ${hour < 12 ? "AM" : "PM"}`;
}
var OPERATORS2 = {
  above: l("über", "above"),
  below: l("unter", "below"),
  atLeast: l("mindestens", "at least"),
  atMost: l("höchstens", "at most"),
  crossesAbove: l("kreuzt nach oben", "crosses above"),
  crossesBelow: l("kreuzt nach unten", "crosses below"),
  crosses: l("kreuzt", "crosses")
};
function operatorOptions(value, target, targetObject = target) {
  const v = value;
  const t = target;
  const o = targetObject;
  const help = {
    above: l(`Wahr, solange ${v.de} größer als ${t.de} ist.`, `True while ${v.en} is greater than ${t.en}.`),
    below: l(`Wahr, solange ${v.de} kleiner als ${t.de} ist.`, `True while ${v.en} is less than ${t.en}.`),
    atLeast: l(`Wie „über“, gilt aber auch, wenn ${v.de} ${o.de} genau erreicht.`, `Like “above”, but also true when ${v.en} exactly reaches ${o.en}.`),
    atMost: l(`Wie „unter“, gilt aber auch, wenn ${v.de} ${o.de} genau erreicht.`, `Like “below”, but also true when ${v.en} exactly reaches ${o.en}.`),
    crossesAbove: l(`Nur in der Kerze wahr, in der ${v.de} von unten über ${t.de} steigt.`, `Only true on the candle where ${v.en} rises from below to above ${t.en}.`),
    crossesBelow: l(`Nur in der Kerze wahr, in der ${v.de} von oben unter ${t.de} fällt.`, `Only true on the candle where ${v.en} falls from above to below ${t.en}.`),
    crosses: l(`Nur in der Kerze wahr, in der ${v.de} ${o.de} in die eine oder andere Richtung kreuzt.`, `Only true on the candle where ${v.en} crosses ${o.en} in either direction.`)
  };
  return Object.keys(OPERATORS2).map((operator) => ({ value: operator, label: OPERATORS2[operator], help: help[operator] }));
}
function compareSentence(operator, a, b, locale) {
  if (locale === "de" && operator === "crossesAbove") return `${a} kreuzt ${b} nach oben`;
  if (locale === "de" && operator === "crossesBelow") return `${a} kreuzt ${b} nach unten`;
  return `${a} ${OPERATORS2[operator][locale]} ${b}`;
}
function applyOperator(operator, a, b) {
  switch (operator) {
    case "above":
      return series_exports.greater(a, b);
    case "below":
      return series_exports.less(a, b);
    case "atLeast":
      return series_exports.greaterEqual(a, b);
    case "atMost":
      return series_exports.lessEqual(a, b);
    case "crossesAbove":
      return series_exports.crossover(a, b);
    case "crossesBelow":
      return series_exports.crossunder(a, b);
    case "crosses":
      return series_exports.cross(a, b);
  }
}
function isCrossing(operator) {
  return operator === "crossesAbove" || operator === "crossesBelow" || operator === "crosses";
}
function lengthSetting(defaultValue, min, max, help, label = l("Kerzen", "Candles")) {
  return { type: "number", label, help, default: defaultValue, min, max, integer: true, step: 1 };
}

// packages/nodes/src/conditions/compare-ab.ts
var compareAB = defineNode({
  id: "core.compare-ab",
  version: "1.0.0",
  category: "cond",
  label: l("Vergleich A/B", "Compare A/B"),
  description: l("Vergleicht zwei Werte, etwa Kurs und EMA", "Compares two values, e.g. price and EMA"),
  help: l(
    "Vergleicht bei jeder Kerze zwei Werte miteinander, etwa den Kurs (A) mit einem gleitenden Durchschnitt (B). Mit dem Faktor nimmst du B mal eine Zahl. Beispiel: Volumen (A) über Durchschnitt (B) mit Faktor 1,8 ist wahr, wenn das Volumen mehr als das 1,8-Fache seines Durchschnitts beträgt.",
    "Compares two values on every candle, such as the price (A) with a moving average (B). The factor multiplies B by a number. Example: volume (A) above average (B) with factor 1.8 is true when the volume is more than 1.8 times its average."
  ),
  technical: l(
    "„kreuzt nach oben“ ist wahr, wenn A jetzt über B mal Faktor liegt und eine Kerze davor höchstens darauf, „kreuzt nach unten“ umgekehrt; dieselbe Regel wie ta.crossover und ta.crossunder in TradingView.",
    "“crosses above” is true when A is now above B times the factor and was at most on it one candle before, “crosses below” the other way round; the same rule as ta.crossover and ta.crossunder in TradingView."
  ),
  icon: "git-compare",
  keywords: { de: ["kreuzt", "cross", "ema", "preis", "über", "unter", "faktor"], en: ["crosses", "cross", "ema", "price", "above", "below", "factor"] },
  inputs: [
    { id: "a", type: "series", label: l("A", "A") },
    { id: "b", type: "series", label: l("B", "B") }
  ],
  outputs: [{ id: "out", type: "signal", label: LABEL_RESULT }],
  settings: {
    operator: {
      type: "select",
      label: l("Bedingung", "Condition"),
      help: l(
        "Wann der Vergleich wahr ist. „über“ und „unter“ gelten, solange A dort liegt. „kreuzt“ gilt nur in der einen Kerze, in der A die Linie B durchbricht.",
        "When the comparison is true. “above” and “below” hold as long as A stays there. “crosses” only holds on the one candle where A breaks through B."
      ),
      default: "above",
      options: operatorOptions(l("A", "A"), l("B", "B"), l("die Linie B", "line B"))
    },
    factor: {
      type: "number",
      label: l("Faktor für B", "Factor for B"),
      help: l(
        "B wird mit dieser Zahl malgenommen, bevor verglichen wird. 1 lässt B unverändert. 1,02 legt B 2 % höher, 0,98 legt es 2 % tiefer, 2 verdoppelt es. Im Bild darüber ziehst du die Fläche über oder unter B und siehst den Abstand in Prozent.",
        "B is multiplied by this number before comparing. 1 leaves B unchanged. 1.02 puts B 2 % higher, 0.98 puts it 2 % lower, 2 doubles it. In the chart above you drag the area above or below B and see the distance in percent."
      ),
      default: 1,
      min: 0,
      max: 1e3,
      step: 0.1
    }
  },
  sentence: ({ settings, locale, input }) => compareSentence(settings.operator, input("a") ?? "A", `${input("b") ?? "B"}${settings.factor !== 1 ? ` ${formatFactor(settings.factor, locale)}` : ""}`, locale),
  warmup: ({ settings }) => isCrossing(settings.operator) ? 1 : 0,
  visual: { kind: "factor", series: { input: "a" }, line: { input: "b" }, factor: "factor", signal: "out" },
  compute({ inputs: inputs2, settings }) {
    const b = settings.factor === 1 ? inputs2.b : series_exports.mul(inputs2.b, settings.factor);
    return { out: applyOperator(settings.operator, inputs2.a, b) };
  },
  tests: [
    {
      name: "Hoch über Schluss",
      fixture: FIXTURE,
      inputs: { a: "high", b: "close" },
      settings: { operator: "atLeast", factor: 1 },
      expectLast: { out: true },
      expectAt: { "0": { out: true } }
    }
  ]
});

// packages/nodes/src/conditions/band.ts
var MODES = {
  inside: {
    label: l("liegt im Band", "is inside the band"),
    help: l("Wahr, solange der Wert im Band liegt, beide Kanten eingeschlossen.", "True while the value lies inside the band, both edges included.")
  },
  outside: {
    label: l("liegt außerhalb", "is outside the band"),
    help: l("Wahr, solange der Wert über oder unter dem Band liegt.", "True while the value lies above or below the band.")
  },
  enters: {
    label: l("betritt das Band", "enters the band"),
    help: l(
      "Nur in der Kerze wahr, in der der Wert von außen ins Band kommt, etwa wenn der Kurs nach einem Ausflug zum POC zurückkehrt.",
      "Only true on the candle where the value comes into the band from outside, such as when the price returns to the POC after a move away."
    )
  },
  exits: {
    label: l("verlässt das Band", "leaves the band"),
    help: l("Nur in der Kerze wahr, in der der Wert das Band verlässt, egal in welche Richtung.", "Only true on the candle where the value leaves the band, in either direction.")
  },
  breakUp: {
    label: l("bricht nach oben aus", "breaks out upward"),
    help: l("Nur in der Kerze wahr, in der der Wert die Oberkante des Bands nach oben kreuzt.", "Only true on the candle where the value crosses above the upper edge of the band.")
  },
  breakDown: {
    label: l("bricht nach unten aus", "breaks out downward"),
    help: l("Nur in der Kerze wahr, in der der Wert die Unterkante des Bands nach unten kreuzt.", "Only true on the candle where the value crosses below the lower edge of the band.")
  },
  oscillates: {
    label: l("pendelt um die Linie", "swings around the line"),
    help: l(
      "Wahr, wenn die letzten Kerzen (Einstellung Kerzen) alle im Band schließen und der Wert die Linie dabei mindestens so oft kreuzt wie unter Wechsel eingestellt. So sieht eine ruhige Phase um den POC aus, in der der Markt den Preis annimmt, bevor er sich für eine Richtung entscheidet.",
      "True when the last candles (setting Candles) all close inside the band and the value crosses the line at least as often as set under Crossings. That is what a calm phase around the POC looks like, in which the market accepts the price before it picks a direction."
    )
  }
};
var SENTENCES = {
  inside: l("{in} im Band {line} ±{width}", "{in} inside {line} ±{width}"),
  outside: l("{in} außerhalb {line} ±{width}", "{in} outside {line} ±{width}"),
  enters: l("{in} betritt {line} ±{width}", "{in} enters {line} ±{width}"),
  exits: l("{in} verlässt {line} ±{width}", "{in} leaves {line} ±{width}"),
  breakUp: l("{in} bricht über {line} +{width}", "{in} breaks above {line} +{width}"),
  breakDown: l("{in} bricht unter {line} −{width}", "{in} breaks below {line} −{width}"),
  oscillates: l("{in} pendelt um {line} ±{width} · {crossings}× in {bars} Kerzen", "{in} swings around {line} ±{width} · {crossings}× in {bars} candles")
};
var SHORT = {
  upper: l("Band oben", "upper band"),
  lower: l("Band unten", "lower band"),
  distance: l("Abstand zur Linie", "distance to line")
};
var band = defineNode({
  id: "core.band",
  version: "1.0.0",
  category: "cond",
  label: l("Band", "Band"),
  description: l("Wert in einem Band ±x % um eine Linie", "Value in a band of ±x % around a line"),
  help: l(
    "Legt ein Band von ±x % um eine Linie, etwa den POC von gestern, den VWAP oder einen Pivot, und prüft bei jeder Kerze, wo der Wert dazu steht: im Band, außerhalb, beim Betreten oder Verlassen, beim Ausbruch nach oben oder unten oder ob er um die Linie pendelt. Das Band wandert mit der Linie mit, auch wenn sie jeden Tag springt. Beispiel: Kurs pendelt um POC Vortag ±0,3 % mit 3 Wechseln in 12 Kerzen meldet sich, wenn BTC einen halben Tag lang dreimal über und unter den meistgehandelten Preis von gestern läuft, ohne das Band zu verlassen.",
    "Places a band of ±x % around a line, such as yesterday’s POC, the VWAP or a pivot, and checks on every candle where the value stands: inside the band, outside, when entering or leaving, on a breakout up or down, or whether it swings around the line. The band moves with the line, even when it jumps every day. Example: price swings around prior day POC ±0.3 % with 3 crossings in 12 candles reports when BTC runs above and below yesterday’s most traded price three times in half a day without leaving the band."
  ),
  technical: l(
    "Band: Linie ± Breite / 100 × |Linie|, die Kanten zählen dazu. Ausbrüche kreuzen die Kanten nach derselben Regel wie „kreuzt“ beim Vergleich (wie ta.crossover und ta.crossunder in TradingView). „pendelt um“ ist wahr, wenn die letzten N Schlüsse im Band liegen und der Wert die Linie zwischen ihnen mindestens K-mal kreuzt (ta.cross über N − 1 Kerzen). Abstand: (Wert − Linie) / |Linie| × 100.",
    "Band: line ± width / 100 × |line|, the edges count as inside. Breakouts cross the edges by the same rule as “crosses” in Compare (like ta.crossover and ta.crossunder in TradingView). “swings around” is true when the last N closes lie inside the band and the value crosses the line at least K times between them (ta.cross over N − 1 candles). Distance: (value − line) / |line| × 100."
  ),
  icon: "unfold-vertical",
  keywords: {
    de: ["band", "zone", "abstand", "prozent", "pendelt", "poc", "rotation", "nähe", "um die linie"],
    en: ["band", "zone", "distance", "percent", "oscillates", "poc", "rotation", "near", "around the line"]
  },
  inputs: [
    { id: "in", type: "series", label: LABEL_VALUE },
    { id: "line", type: "series", label: l("Linie", "Line") }
  ],
  outputs: [
    { id: "out", type: "signal", label: LABEL_RESULT },
    { id: "upper", type: "series", label: l("Oben", "Upper"), unit: "input" },
    { id: "lower", type: "series", label: l("Unten", "Lower"), unit: "input" },
    { id: "distance", type: "series", label: l("Abstand %", "Distance %"), unit: "percent" }
  ],
  settings: {
    mode: {
      type: "select",
      label: l("Bedingung", "Condition"),
      help: l(
        "Wann der Baustein wahr ist: solange der Wert im Band oder außerhalb liegt, im Moment eines Wechsels oder wenn er um die Linie pendelt.",
        "When the node is true: while the value lies inside or outside the band, at the moment of a change, or when it swings around the line."
      ),
      default: "enters",
      options: Object.keys(MODES).map((value) => ({ value, label: MODES[value].label, help: MODES[value].help }))
    },
    width: {
      type: "number",
      label: l("Breite ±", "Width ±"),
      help: l(
        "Wie weit das Band über und unter die Linie reicht, in Prozent der Linie. 0,5 heißt 0,5 % darüber und darunter, bei einem POC von 80.000 $ also 400 $ in jede Richtung. Für POC und Value Area mit Stundenkerzen passen 0,2 bis 0,5 %.",
        "How far the band reaches above and below the line, in percent of the line. 0.5 means 0.5 % above and below, so with a POC of $80,000 that is $400 in each direction. For POC and value area with hourly candles, 0.2 to 0.5 % fit."
      ),
      default: 0.5,
      min: 0.01,
      max: 50,
      step: 0.05,
      unit: l("%", "%")
    },
    bars: lengthSetting(
      12,
      2,
      200,
      l(
        "Nur bei „pendelt um die Linie“: über wie viele Kerzen der Wert im Band bleiben muss. 12 Stundenkerzen sind ein halber Tag.",
        "Only for “swings around the line”: for how many candles the value must stay inside the band. 12 hourly candles are half a day."
      )
    ),
    crossings: {
      type: "number",
      label: l("Wechsel", "Crossings"),
      help: l(
        "Nur bei „pendelt um die Linie“: wie oft der Wert die Linie in diesen Kerzen mindestens kreuzen muss. 3 heißt drei Seitenwechsel; mehr als Kerzen − 1 ist nie erfüllt.",
        "Only for “swings around the line”: how many times the value must at least cross the line within these candles. 3 means three changes of side; more than candles − 1 is never met."
      ),
      default: 3,
      min: 1,
      max: 100,
      integer: true,
      step: 1
    }
  },
  sentence: ({ settings, locale, input }) => SENTENCES[settings.mode][locale].replace("{in}", input("in") ?? LABEL_VALUE[locale]).replace("{line}", input("line") ?? l("Linie", "line")[locale]).replace("{width}", `${fmt(settings.width, locale)} %`).replace("{crossings}", String(settings.crossings)).replace("{bars}", String(settings.bars)),
  short: ({ settings, pin, locale }) => pin === "out" ? MODES[settings.mode].label[locale] : (SHORT[pin] ?? SHORT.upper)[locale],
  warmup: ({ settings }) => settings.mode === "oscillates" ? settings.bars : settings.mode === "inside" || settings.mode === "outside" ? 0 : 1,
  visual: { kind: "band", series: { input: "in" }, line: { input: "line" }, width: "width", signal: "out" },
  compute({ inputs: inputs2, settings }) {
    const value = inputs2.in;
    const line = inputs2.line;
    const share = settings.width / 100;
    const n = value.length;
    const upper = new Array(n).fill(null);
    const lower = new Array(n).fill(null);
    const distance3 = new Array(n).fill(null);
    const inside = new Array(n).fill(false);
    const outside = new Array(n).fill(false);
    for (let i = 0; i < n; i++) {
      const center = line[i];
      if (center == null) continue;
      const half = share * Math.abs(center);
      upper[i] = center + half;
      lower[i] = center - half;
      const v = value[i];
      if (v == null) continue;
      inside[i] = Math.abs(v - center) <= half;
      outside[i] = Math.abs(v - center) > half;
      distance3[i] = (v - center) / Math.abs(center) * 100;
    }
    let out;
    switch (settings.mode) {
      case "inside":
        out = inside;
        break;
      case "outside":
        out = outside;
        break;
      case "enters":
        out = inside.map((now, i) => i > 0 && now && outside[i - 1] === true);
        break;
      case "exits":
        out = outside.map((now, i) => i > 0 && now && inside[i - 1] === true);
        break;
      case "breakUp":
        out = series_exports.crossover(value, upper);
        break;
      case "breakDown":
        out = series_exports.crossunder(value, lower);
        break;
      case "oscillates": {
        const held = series_exports.holds(inside, settings.bars);
        const crossings = series_exports.count(series_exports.cross(value, line), settings.bars - 1);
        out = held.map((ok, i) => ok && (crossings[i] ?? 0) >= settings.crossings);
        break;
      }
    }
    return { out, upper, lower, distance: distance3 };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung): der Schlusskurs im Band um die Eröffnung derselben
  // Kerze, die einzige zweite Kursreihe in den festen Kursdaten.
  tests: [
    {
      name: "Schluss im Band ±0,1 % um die Eröffnung",
      fixture: FIXTURE,
      inputs: { in: "close", line: "open" },
      settings: { mode: "inside", width: 0.1 },
      expectAt: { "0": { out: true, upper: 84022.94901, lower: 83855.07099, distance: 0.04406771059129718 }, "3": { out: false } },
      expectLast: { out: false, upper: 81862.96118, lower: 81699.39882, distance: -0.20241820917722145 }
    },
    {
      name: "pendelt um die Eröffnung ±0,3 %, 3 Wechsel in 12 Kerzen",
      fixture: FIXTURE,
      inputs: { in: "close", line: "open" },
      settings: { mode: "oscillates", width: 0.3, bars: 12, crossings: 3 },
      expectAt: { "10": { out: false }, "11": { out: true }, "26": { out: true }, "27": { out: false } }
    }
  ]
});

// packages/nodes/src/conditions/compare.ts
var compare2 = defineNode({
  id: "core.compare",
  version: "1.0.0",
  category: "cond",
  label: l("Vergleich", "Compare"),
  description: l("Prüft einen Wert gegen eine feste Zahl", "Checks a value against a fixed number"),
  help: l(
    "Prüft bei jeder Kerze, ob ein Wert über oder unter einer Schwelle liegt, und gibt wahr oder falsch weiter. So wird aus einer Zahl ein Signal, das eine Aktion auslösen kann. Beispiel: „RSI 14 unter 30“ ist wahr, solange der RSI unter 30 liegt. Die Aktion meldet sich einmal, wenn es wahr wird.",
    "Checks on every candle whether a value is above or below a threshold and passes on true or false. That turns a number into a signal that can trigger an action. Example: “RSI 14 below 30” is true while the RSI is below 30. The action notifies you once, when it becomes true."
  ),
  technical: l(
    "„kreuzt nach oben“ ist wahr, wenn der Wert jetzt über der Schwelle liegt und eine Kerze davor höchstens auf ihr, „kreuzt nach unten“ umgekehrt; dieselbe Regel wie ta.crossover und ta.crossunder in TradingView.",
    "“crosses above” is true when the value is now above the threshold and was at most on it one candle before, “crosses below” the other way round; the same rule as ta.crossover and ta.crossunder in TradingView."
  ),
  icon: "scale",
  keywords: { de: ["unter", "über", "kreuzt", "schwelle", "bedingung"], en: ["below", "above", "crosses", "threshold", "condition"] },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [{ id: "out", type: "signal", label: LABEL_RESULT }],
  settings: {
    operator: {
      type: "select",
      label: l("Bedingung", "Condition"),
      help: l(
        "Wann der Vergleich wahr ist. „über“ und „unter“ gelten, solange der Wert dort liegt. „kreuzt“ gilt nur in der einen Kerze, in der der Wert die Schwelle durchbricht.",
        "When the comparison is true. “above” and “below” hold as long as the value stays there. “crosses” only holds on the one candle where the value breaks through the threshold."
      ),
      default: "below",
      options: operatorOptions(l("der Wert", "the value"), l("die Schwelle", "the threshold"))
    },
    value: {
      type: "number",
      label: l("Schwelle", "Threshold"),
      help: l(
        "Die Zahl, mit der verglichen wird, in der Einheit des Eingangs: beim RSI etwa 30, bei einem Kurs etwa 100000, bei Veränderung % etwa -5 für minus 5 %.",
        "The number to compare with, in the unit of the input: for the RSI e.g. 30, for a price e.g. 100000, for Change % e.g. -5 for minus 5 %."
      ),
      default: 30
    }
  },
  sentence: ({ settings, locale, input }) => compareSentence(settings.operator, input("in") ?? LABEL_VALUE[locale], fmt(settings.value, locale), locale),
  short: ({ settings, locale }) => `${OPERATORS2[settings.operator][locale]} ${fmt(settings.value, locale)}`,
  warmup: ({ settings }) => isCrossing(settings.operator) ? 1 : 0,
  visual: { kind: "level", series: { input: "in" }, level: "value" },
  compute: ({ inputs: inputs2, settings }) => ({ out: applyOperator(settings.operator, inputs2.in, settings.value) }),
  tests: [
    { name: "Kurs unter 82.000", fixture: FIXTURE, settings: { operator: "below", value: 82e3 }, expectLast: { out: true } },
    { name: "Kurs über 82.000", fixture: FIXTURE, settings: { operator: "above", value: 82e3 }, expectLast: { out: false }, expectAt: { "0": { out: true } } }
  ]
});

// packages/nodes/src/conditions/date-range.ts
function when(ms, locale) {
  return `${formatDateTime(ms, locale, "UTC")} UTC`;
}
function bounds(settings) {
  return { from: parseUtcTime(settings.from), to: parseUtcTime(settings.to) };
}
var dateRange = defineNode({
  id: "core.date-range",
  version: "1.0.0",
  category: "cond",
  label: l("Datumsbereich", "Date range"),
  description: l("Wahr zwischen zwei Zeitpunkten", "True between two points in time"),
  help: l(
    "Ist wahr, solange eine Kerze zwischen „Von“ und „Bis“ schließt. Bleibt ein Feld leer, ist der Bereich zu dieser Seite offen: nur „Von“ heißt „ab dann“, nur „Bis“ heißt „bis dahin“. Mit UND gibt eine Chain Alarme nur in dieser Zeit weiter, mit NICHT davor schaltet sie sie in dieser Zeit stumm, etwa rund um einen Zinsentscheid. „Tage seit Von“ zählt die ganzen Tage ab „Von“. Beispiel: Von 28.10. 18:00 bis 29.10. 22:00, davor NICHT und dann UND mit deinem Signal: keine Alarme in den Stunden um den Termin.",
    "Is true while a candle closes between “From” and “Until”. If a field stays empty, the range is open on that side: only “From” means “from then on”, only “Until” means “until then”. With AND a chain passes alerts on only during this time, with NOT in front it mutes them during this time, for example around a rate decision. “Days since From” counts the whole days since “From”. Example: from Oct 28, 6 PM until Oct 29, 10 PM, NOT in front and then AND with your signal: no alerts in the hours around the event."
  ),
  technical: l(
    "Maßgeblich ist der Zeitpunkt, zu dem eine Kerze schließt. „Von“ zählt dazu, „Bis“ nicht mehr. Die Zeitpunkte stehen in UTC in der Chain; der Editor zeigt sie in deiner Zeitzone. Liegt „Bis“ vor „Von“, ist der Bereich leer. Tage seit Von = ⌊(Schluss der Kerze − Von) / 24 h⌋, vor „Von“ leer.",
    "What counts is the time a candle closes. “From” is included, “Until” is not. The times are stored in UTC in the chain; the editor shows them in your time zone. If “Until” lies before “From”, the range is empty. Days since From = ⌊(candle close − From) / 24 h⌋, empty before “From”."
  ),
  icon: "calendar-range",
  keywords: {
    de: ["datum", "zeitraum", "termin", "von bis", "ablaufdatum", "sperre", "news", "zinsentscheid", "tage seit"],
    en: ["date", "date range", "event", "from until", "expiry", "blackout", "news filter", "rate decision", "days since"]
  },
  inputs: [],
  outputs: [
    { id: "out", type: "signal", label: l("im Zeitraum", "in range") },
    { id: "days", type: "series", label: l("Tage seit Von", "Days since From") }
  ],
  settings: {
    from: {
      type: "text",
      label: l("Von", "From"),
      help: l(
        "Ab diesem Zeitpunkt ist der Ausgang wahr, in deiner Zeitzone. Leer: schon immer.",
        "From this point in time the output is true, in your time zone. Empty: always has been."
      ),
      default: "",
      format: "datetime"
    },
    to: {
      type: "text",
      label: l("Bis", "Until"),
      help: l(
        "Ab diesem Zeitpunkt ist der Ausgang wieder falsch, in deiner Zeitzone. Leer: ohne Ende.",
        "From this point in time the output is false again, in your time zone. Empty: no end."
      ),
      default: "",
      format: "datetime"
    }
  },
  sentence: ({ settings, locale }) => {
    const { from, to } = bounds(settings);
    if (from !== void 0 && to !== void 0) return `${when(from, locale)} – ${when(to, locale)}`;
    if (from !== void 0) return `${locale === "de" ? "ab" : "from"} ${when(from, locale)}`;
    if (to !== void 0) return `${locale === "de" ? "bis" : "until"} ${when(to, locale)}`;
    return locale === "de" ? "immer" : "always";
  },
  short: ({ pin, locale }) => (pin === "days" ? l("Tage seit Von", "Days since From") : l("im Zeitraum", "in date range"))[locale],
  warmup: () => 0,
  compute({ bars, settings }) {
    const { from, to } = bounds(settings);
    const out = new Array(bars.length).fill(false);
    const days = new Array(bars.length).fill(null);
    for (let i = 0; i < bars.length; i++) {
      const close = bars.closeTime[i] ?? 0;
      out[i] = (from === void 0 || close >= from) && (to === void 0 || close < to);
      if (from !== void 0 && close >= from) days[i] = Math.floor((close - from) / DAY);
    }
    return { out, days };
  },
  // Die Kursdaten beginnen am 26.09.2026 um 04:00 UTC mit Stundenkerzen: Kerze 99 schließt am 30.09. um 08:00 UTC,
  // Kerze 199 am 04.10. um 12:00 UTC.
  tests: [
    {
      name: "von bis",
      fixture: FIXTURE,
      settings: { from: "2026-09-30T08:00:00Z", to: "2026-10-04T12:00:00Z" },
      expectAt: { "98": { out: false, days: null }, "99": { out: true, days: 0 }, "122": { days: 0 }, "123": { days: 1 }, "198": { out: true }, "199": { out: false } },
      expectLast: { out: false, days: 16 }
    },
    { name: "nur bis", fixture: FIXTURE, settings: { to: "2026-09-30T08:00:00Z" }, expectAt: { "0": { out: true, days: null }, "98": { out: true }, "99": { out: false } } },
    { name: "leer", fixture: FIXTURE, expectAt: { "0": { out: true } }, expectLast: { out: true, days: null } }
  ]
});

// packages/nodes/src/conditions/newhighlow.ts
var newHighLow = defineNode({
  id: "core.newhighlow",
  version: "1.0.0",
  category: "cond",
  label: l("Neues Hoch/Tief", "New high/low"),
  description: l("Höchster oder tiefster Wert seit N Kerzen", "Highest or lowest value in N candles"),
  help: l(
    "Wahr an jeder Kerze, an der der Wert höher liegt als an allen Kerzen davor im gewählten Zeitraum, oder tiefer als an allen. So meldest du Ausbrüche auf ein neues Hoch oder Tief, beim Kurs wie bei einem Indikator. Beispiel: Kurs an „neues Hoch“ mit 168 Kerzen meldet bei 1-Stunden-Kerzen den höchsten Schlusskurs seit einer Woche.",
    "True on every candle where the value is higher than on all candles before it in the chosen period, or lower than on all of them. That is how you report breakouts to a new high or low, for the price as well as for an indicator. Example: price into “new high” with 168 candles reports the highest close in a week on 1-hour candles."
  ),
  technical: l(
    "Neues Hoch: Wert > höchster Wert der N Kerzen davor, die aktuelle nicht mitgezählt; neues Tief: Wert < tiefster Wert davor. Dieselbe Rechnung wie Wert > ta.highest(Wert, N)[1] in TradingView.",
    "New high: value > highest value of the N candles before, the current one not counted; new low: value < lowest value before. The same calculation as value > ta.highest(value, N)[1] in TradingView."
  ),
  icon: "chevrons-up",
  keywords: {
    de: ["neues hoch", "neues tief", "ausbruch", "rekord", "höchster", "tiefster", "hoch", "tief"],
    en: ["new high", "new low", "breakout", "record", "highest", "lowest", "high", "low"]
  },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "high", type: "signal", label: l("neues Hoch", "new high") },
    { id: "low", type: "signal", label: l("neues Tief", "new low") }
  ],
  settings: {
    length: lengthSetting(
      20,
      1,
      1e3,
      l(
        "Mit wie vielen Kerzen davor der Wert verglichen wird. 20 ist üblich; 168 ist bei 1-Stunden-Kerzen eine Woche.",
        "How many candles before the value is compared with. 20 is usual; 168 is one week on 1-hour candles."
      )
    )
  },
  sentence: ({ settings, locale, input }) => `${input("in") ?? LABEL_VALUE[locale]} · ${settings.length} ${locale === "de" ? "Kerzen" : "candles"}`,
  short: ({ settings, pin, locale }) => {
    if (locale === "de") return `${pin === "low" ? "neues Tief" : "neues Hoch"} ${settings.length}`;
    return `new ${settings.length}-candle ${pin === "low" ? "low" : "high"}`;
  },
  warmup: ({ settings }) => settings.length + 1,
  compute({ inputs: inputs2, settings }) {
    return {
      high: series_exports.greater(inputs2.in, series_exports.lag(series_exports.highest(inputs2.in, settings.length), 1)),
      low: series_exports.less(inputs2.in, series_exports.lag(series_exports.lowest(inputs2.in, settings.length), 1))
    };
  },
  // Referenzwerte aus scripts/pine-reference.py (Schlusskurse, 20 Kerzen)
  tests: [
    {
      fixture: FIXTURE,
      settings: { length: 20 },
      expectAt: { "20": { high: false }, "21": { high: true, low: false }, "42": { low: true }, "43": { low: false } },
      expectLast: { high: false, low: false }
    }
  ]
});

// packages/nodes/src/conditions/range.ts
function limits(settings, locale, input) {
  const lower = input("lower");
  const upper = input("upper");
  if (lower === void 0 && upper === void 0) return `${fmt(Math.min(settings.low, settings.high), locale)}–${fmt(Math.max(settings.low, settings.high), locale)}`;
  return `${lower ?? fmt(settings.low, locale)} ${locale === "de" ? "bis" : "to"} ${upper ?? fmt(settings.high, locale)}`;
}
var MODES2 = {
  inside: {
    label: l("liegt im Bereich", "is inside"),
    help: l("Wahr, solange der Wert zwischen Unten und Oben liegt, beide Grenzen eingeschlossen.", "True while the value is between Low and High, both limits included.")
  },
  outside: {
    label: l("liegt außerhalb", "is outside"),
    help: l("Wahr, solange der Wert unter Unten oder über Oben liegt.", "True while the value is below Low or above High.")
  },
  enters: {
    label: l("betritt den Bereich", "enters"),
    help: l("Nur in der Kerze wahr, in der der Wert von außen in den Bereich kommt. Gut für Kaufzonen.", "Only true on the candle where the value moves into the range from outside. Good for buy zones.")
  },
  exits: {
    label: l("verlässt den Bereich", "exits"),
    help: l("Nur in der Kerze wahr, in der der Wert den Bereich verlässt, egal in welche Richtung. Gut für Ausbrüche aus einer Seitwärtsphase.", "Only true on the candle where the value leaves the range, in either direction. Good for breakouts from a sideways phase.")
  }
};
var range = defineNode({
  id: "core.range",
  version: "1.0.0",
  category: "cond",
  label: l("Bereich", "Range"),
  description: l("Wert betritt oder verlässt eine Zone", "Value enters or leaves a zone"),
  help: l(
    "Prüft bei jeder Kerze, ob ein Wert zwischen zwei Grenzen liegt, und gibt wahr oder falsch weiter. So baust du Alarme für Zonen: eine Kaufzone beim Kurs, ein neutraler Bereich beim RSI. Die Grenzen sind feste Zahlen oder kommen von anderen Bausteinen, wenn du die Eingänge Unten und Oben verbindest, etwa VAL und VAH der Value Area von gestern. Beispiel: Kurs betritt den Bereich 58.000 bis 60.000 meldet sich einmal, wenn der Kurs in deine Kaufzone fällt oder steigt.",
    "Checks on every candle whether a value lies between two limits and passes on true or false. That is how you build alerts for zones: a buy zone for the price, a neutral range for the RSI. The limits are fixed numbers or come from other nodes when you connect the Low and High inputs, such as VAL and VAH of yesterday’s value area. Example: price enters the range 58,000 to 60,000 notifies you once when the price falls or rises into your buy zone."
  ),
  technical: l(
    "Innerhalb heißt Unten ≤ Wert ≤ Oben; Unten und Oben werden bei Bedarf getauscht. Verbundene Eingänge Unten und Oben ersetzen die Zahlen, Kerze für Kerze. Betritt und verlässt vergleichen mit der Kerze davor und brauchen an beiden Kerzen einen Wert und beide Grenzen.",
    "Inside means Low ≤ value ≤ High; Low and High are swapped if needed. Connected Low and High inputs replace the numbers, candle by candle. Enters and exits compare with the candle before and need a value and both limits on both candles."
  ),
  icon: "between-horizontal-start",
  keywords: { de: ["zone", "bereich", "zwischen", "kaufzone", "band", "seitwärts", "value area"], en: ["zone", "range", "between", "buy zone", "band", "sideways", "value area"] },
  inputs: [
    { id: "in", type: "series", label: LABEL_VALUE },
    { id: "lower", type: "series", label: l("Unten", "Low"), optional: true },
    { id: "upper", type: "series", label: l("Oben", "High"), optional: true }
  ],
  outputs: [{ id: "out", type: "signal", label: LABEL_RESULT }],
  settings: {
    mode: {
      type: "select",
      label: l("Bedingung", "Condition"),
      help: l("Wann der Baustein wahr ist: solange der Wert drin oder draußen liegt, oder nur im Moment des Wechsels.", "When the node is true: while the value is inside or outside, or only at the moment it changes."),
      default: "enters",
      options: Object.keys(MODES2).map((value) => ({ value, label: MODES2[value].label, help: MODES2[value].help }))
    },
    low: {
      type: "number",
      label: l("Unten", "Low"),
      help: l(
        "Untere Grenze in der Einheit des Eingangs, etwa 58000 für einen Kurs oder 40 für den RSI. Ist der Eingang Unten verbunden, gilt dessen Wert.",
        "Lower limit in the unit of the input, such as 58000 for a price or 40 for the RSI. If the Low input is connected, its value applies."
      ),
      default: 40,
      input: "lower"
    },
    high: {
      type: "number",
      label: l("Oben", "High"),
      help: l("Obere Grenze, etwa 60000 für einen Kurs oder 60 für den RSI. Ist der Eingang Oben verbunden, gilt dessen Wert.", "Upper limit, such as 60000 for a price or 60 for the RSI. If the High input is connected, its value applies."),
      default: 60,
      input: "upper"
    }
  },
  sentence: ({ settings, locale, input }) => {
    const value = input("in") ?? LABEL_VALUE[locale];
    return `${value} ${MODES2[settings.mode].label[locale]} ${limits(settings, locale, input)}`;
  },
  short: ({ settings, locale }) => `${MODES2[settings.mode].label[locale]} ${limits(settings, locale, () => void 0)}`,
  warmup: ({ settings }) => settings.mode === "enters" || settings.mode === "exits" ? 1 : 0,
  visual: { kind: "zone", series: { input: "in" }, low: "low", high: "high" },
  compute({ inputs: inputs2, settings }) {
    const n = inputs2.in.length;
    const lower = inputs2.lower;
    const upper = inputs2.upper;
    const known = new Array(n).fill(false);
    const inside = new Array(n).fill(false);
    for (let i = 0; i < n; i++) {
      const v = inputs2.in[i];
      const a = lower ? lower[i] : settings.low;
      const b = upper ? upper[i] : settings.high;
      if (v == null || a == null || b == null) continue;
      known[i] = true;
      inside[i] = v >= Math.min(a, b) && v <= Math.max(a, b);
    }
    switch (settings.mode) {
      case "inside":
        return { out: inside };
      case "outside":
        return { out: inside.map((now, i) => known[i] === true && !now) };
      case "enters":
        return { out: inside.map((now, i) => i > 0 && now && known[i - 1] === true && !inside[i - 1]) };
      case "exits":
        return { out: inside.map((now, i) => i > 0 && known[i] === true && !now && inside[i - 1] === true) };
    }
  },
  // Erwartete Werte aus einer Nachrechnung in Python über dieselben Kerzen (Schlusskurse, Grenzen 81.500 und 82.500).
  tests: [
    { name: "Kurs liegt im Bereich", fixture: FIXTURE, settings: { mode: "inside", low: 81500, high: 82500 }, expectLast: { out: true }, expectAt: { "0": { out: false } } },
    { name: "Kurs betritt den Bereich", fixture: FIXTURE, settings: { mode: "enters", low: 82500, high: 81500 }, expectAt: { "295": { out: false }, "296": { out: true }, "297": { out: false } } },
    { name: "Kurs verlässt den Bereich", fixture: FIXTURE, settings: { mode: "exits", low: 81500, high: 82500 }, expectAt: { "297": { out: false }, "298": { out: true } } },
    // Verbundene Grenzen ersetzen die Zahlen: Der Schluss liegt immer zwischen Tief und Hoch derselben Kerze.
    {
      name: "Grenzen aus den Eingängen Unten und Oben",
      fixture: FIXTURE,
      inputs: { in: "close", lower: "low", upper: "high" },
      settings: { mode: "inside", low: 81500, high: 82500 },
      expectLast: { out: true },
      expectAt: { "0": { out: true }, "296": { out: true } }
    }
  ]
});

// packages/nodes/src/conditions/timewindow.ts
var DAYS = {
  all: l("Mo–So", "Mon–Sun"),
  weekdays: l("Mo–Fr", "Mon–Fri"),
  weekend: l("Sa–So", "Sat–Sun")
};
function inWindow(minutes, from, to) {
  const start = from * 60;
  const end = to * 60;
  if (start === end) return true;
  if (start < end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}
var timeWindow = defineNode({
  id: "core.timewindow",
  version: "1.0.0",
  category: "cond",
  label: l("Zeitfenster", "Time window"),
  description: l("Erlaubt Alarme nur zu bestimmten Zeiten", "Allows alerts only at certain times"),
  help: l(
    "Ist wahr, wenn eine Kerze innerhalb des Zeitfensters schließt, sonst falsch. Verbinde es mit UND, dann kommen Alarme nur in dieser Zeit. Beispiel: Von 8 bis 22 Uhr an allen Tagen hält dir die Nacht frei. Ein Fenster von 22 bis 6 Uhr reicht über Mitternacht.",
    "Is true when a candle closes inside the time window, otherwise false. Connect it to AND so alerts only arrive during that time. Example: from 8 AM to 10 PM on all days keeps your nights quiet. A window from 10 PM to 6 AM runs past midnight."
  ),
  technical: l(
    "Maßgeblich ist der Zeitpunkt, zu dem eine Kerze schließt, in der eingestellten Zeitzone. „Von“ zählt dazu, „Bis“ nicht mehr.",
    "What counts is the time a candle closes, in the chosen time zone. “From” is included, “Until” is not."
  ),
  icon: "clock",
  keywords: { de: ["uhrzeit", "wochenende", "nacht", "ruhezeit", "werktags"], en: ["time", "weekend", "night", "quiet hours", "weekdays"] },
  inputs: [],
  outputs: [{ id: "out", type: "signal", label: l("im Fenster", "in window") }],
  settings: {
    from: {
      type: "number",
      label: l("Von (Uhr)", "From (hour)"),
      help: l("Stunde, ab der das Fenster gilt, von 0 bis 23. 8 heißt ab 8:00 Uhr.", "Hour the window starts, from 0 to 23. 8 means from 8 AM."),
      default: 8,
      min: 0,
      max: 23,
      integer: true,
      step: 1
    },
    to: {
      type: "number",
      label: l("Bis (Uhr)", "Until (hour)"),
      help: l(
        "Stunde, ab der das Fenster nicht mehr gilt, von 0 bis 24. 22 heißt bis kurz vor 22:00 Uhr. Ist „Bis“ kleiner als „Von“, reicht das Fenster über Mitternacht. Sind beide gleich, gilt es rund um die Uhr.",
        "Hour the window ends, from 0 to 24. 22 means until just before 10 PM. If “Until” is smaller than “From”, the window runs past midnight. If both are equal, it applies around the clock."
      ),
      default: 22,
      min: 0,
      max: 24,
      integer: true,
      step: 1
    },
    days: {
      type: "select",
      label: l("Tage", "Days"),
      help: l("An welchen Tagen das Fenster gilt. An den anderen Tagen ist es den ganzen Tag falsch.", "Which days the window applies on. On the other days it is false all day."),
      default: "all",
      options: Object.keys(DAYS).map((value) => ({ value, label: DAYS[value] }))
    },
    timezone: timezoneSetting
  },
  sentence: ({ settings, locale }) => `${DAYS[settings.days][locale]} · ${clock(settings.from, 0, locale)}–${clock(settings.to % 24, 0, locale)}`,
  short: ({ locale }) => l("Zeitfenster", "time window")[locale],
  warmup: () => 0,
  compute({ bars, settings }) {
    const out = new Array(bars.length).fill(false);
    for (let i = 0; i < bars.length; i++) {
      const p = zonedParts(bars.closeTime[i] ?? 0, settings.timezone);
      out[i] = dayMatches(settings.days, p.weekday) && inWindow(p.hour * 60 + p.minute, settings.from, settings.to);
    }
    return { out };
  }
});

// packages/nodes/src/indicators/candle-inputs.ts
var CANDLE_HLC_INPUTS = [
  { id: "close", type: "series", label: l("Kurs", "Price") },
  { id: "high", type: "series", label: l("Hoch", "High") },
  { id: "low", type: "series", label: l("Tief", "Low") }
];
var CANDLE_HLCV_INPUTS = [...CANDLE_HLC_INPUTS, { id: "volume", type: "series", label: l("Volumen", "Volume") }];
var CANDLE_COHL_INPUTS = [
  CANDLE_HLC_INPUTS[0],
  { id: "open", type: "series", label: l("Eröffnung", "Open"), optional: true },
  CANDLE_HLC_INPUTS[1],
  CANDLE_HLC_INPUTS[2]
];
var CANDLE_CV_INPUTS = [CANDLE_HLCV_INPUTS[0], CANDLE_HLCV_INPUTS[3]];
var CANDLE_HL_INPUTS = [CANDLE_HLC_INPUTS[1], CANDLE_HLC_INPUTS[2]];
var CANDLE_HLV_INPUTS = [CANDLE_HLC_INPUTS[1], CANDLE_HLC_INPUTS[2], CANDLE_HLCV_INPUTS[3]];
var CANDLE_BODY_INPUTS = [CANDLE_HLC_INPUTS[0], { id: "open", type: "series", label: l("Eröffnung", "Open") }, CANDLE_HLC_INPUTS[1], CANDLE_HLC_INPUTS[2]];
var CANDLE_HLC = { high: "high", low: "low", close: "close" };
var CANDLE_HLCV = { ...CANDLE_HLC, volume: "volume" };
var CANDLE_OHLC = { ...CANDLE_HLC, open: "open" };
var CANDLE_CV = { close: "close", volume: "volume" };
var CANDLE_HL = { high: "high", low: "low" };
var CANDLE_HLV = { ...CANDLE_HL, volume: "volume" };

// packages/nodes/src/indicators/adx.ts
var adx = defineNode({
  id: "core.adx",
  version: "1.0.0",
  category: "ind",
  label: l("ADX/DMI", "ADX/DMI"),
  description: l("Misst, wie stark ein Trend ist", "Measures how strong a trend is"),
  help: l(
    "Misst auf einer Skala von 0 bis 100, wie stark der Kurs in eine Richtung läuft, nach oben oder nach unten. Unter 20 läuft er eher seitwärts, über 25 gilt ein Trend als stark. Dazu kommen +DI und −DI: Liegt +DI über −DI, drücken die Käufer stärker, sonst die Verkäufer. Beispiel: „ADX 14 über 25“ zusammen mit „+DI 14 über −DI 14“ meldet einen kräftigen Aufwärtstrend. Für Alarme, die nur im Trend gelten sollen, etwa ein Ausbruch, ist „ADX über 20“ ein guter Filter.",
    "Measures on a scale from 0 to 100 how strongly the price moves in one direction, up or down. Below 20 it tends to move sideways, above 25 a trend counts as strong. You also get +DI and −DI: when +DI is above −DI, buyers push harder, otherwise sellers. Example: “ADX 14 above 25” together with “+DI 14 above −DI 14” reports a strong uptrend. For alerts that should only count in a trend, such as a breakout, “ADX above 20” is a good filter."
  ),
  technical: l(
    "Richtungsbewegung aus den Änderungen von Hoch und Tief, +DI und −DI als ihre RMA geteilt durch die RMA der True Range mal 100, ADX als RMA des Abstands beider DI geteilt durch ihre Summe, mal 100; dieselbe Formel wie ta.dmi in TradingView.",
    "Directional movement from the changes in high and low, +DI and −DI as its RMA divided by the RMA of the true range times 100, ADX as the RMA of the gap between both DI divided by their sum, times 100; the same formula as ta.dmi in TradingView."
  ),
  icon: "gauge",
  keywords: {
    de: ["trendstärke", "adx", "dmi", "richtungsbewegung", "seitwärts", "di"],
    en: ["trend strength", "adx", "dmi", "directional movement", "sideways", "di"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "adx", type: "series", label: l("ADX", "ADX") },
    { id: "plus", type: "series", label: l("+DI", "+DI") },
    { id: "minus", type: "series", label: l("−DI", "−DI") }
  ],
  settings: {
    length: lengthSetting(
      14,
      1,
      200,
      l(
        "Über wie viele Kerzen +DI und −DI die Bewegungen nach oben und nach unten messen. 14 ist der übliche Wert.",
        "How many candles +DI and −DI measure the moves up and down over. 14 is the usual value."
      ),
      l("DI-Kerzen", "DI candles")
    ),
    smoothing: lengthSetting(
      14,
      1,
      100,
      l(
        "Über wie viele Kerzen der ADX geglättet wird. 14 ist üblich. Weniger Kerzen reagieren schneller auf einen neuen Trend, schwanken aber stärker.",
        "How many candles the ADX is smoothed over. 14 is usual. Fewer candles react faster to a new trend but swing more."
      ),
      l("ADX-Glättung", "ADX smoothing")
    )
  },
  sentence: ({ settings }) => `DI ${settings.length} · ADX ${settings.smoothing}`,
  short: ({ settings, pin }) => {
    if (pin === "plus") return `+DI ${settings.length}`;
    if (pin === "minus") return `−DI ${settings.length}`;
    return settings.smoothing === settings.length ? `ADX ${settings.length}` : `ADX ${settings.length} · ${settings.smoothing}`;
  },
  warmup: ({ settings }) => 10 * (settings.length + settings.smoothing) + 1,
  compute({ inputs: inputs2, settings }) {
    const result = series_exports.dmi(inputs2.high, inputs2.low, inputs2.close, settings.length, settings.smoothing);
    return { adx: result.adx, plus: result.plus, minus: result.minus };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, smoothing: 14 },
      expectAt: {
        "13": { plus: null, minus: null },
        "14": { plus: 22.6217777394603, minus: 19.978446417794636 },
        "26": { adx: null },
        "27": { adx: 18.973169930768115 }
      },
      expectLast: { adx: 15.557470972546643, plus: 16.660005241707076, minus: 23.85661316363395 },
      tolerance: 1e-9
    }
  ]
});

// packages/nodes/src/indicators/aroon.ts
var aroon2 = defineNode({
  id: "core.aroon",
  version: "1.0.0",
  category: "ind",
  label: l("Aroon", "Aroon"),
  description: l("Wie frisch das letzte Hoch und Tief sind", "How recent the last high and low are"),
  help: l(
    "Misst, wie lange das höchste Hoch und das tiefste Tief der letzten Kerzen zurückliegen. Aroon Up steht bei 100, wenn die aktuelle Kerze das Hoch hat, und fällt mit jeder Kerze ohne neues Hoch bis 0; Aroon Down ebenso mit dem Tief. Liegt Up über 70 und Down unter 30, läuft ein frischer Aufwärtstrend. Beispiel: „Aroon Up kreuzt Aroon Down nach oben“ meldet, wenn neue Hochs wieder frischer sind als neue Tiefs.",
    "Measures how long ago the highest high and the lowest low of the last candles were. Aroon Up is 100 when the current candle has the high and falls with every candle without a new high down to 0; Aroon Down likewise with the low. With Up above 70 and Down below 30 a fresh uptrend is running. Example: “Aroon Up crosses above Aroon Down” reports when new highs are fresher than new lows again."
  ),
  technical: l(
    "Aroon Up = 100 × (Kerzen − Kerzen seit dem höchsten Hoch) / Kerzen über die letzten Kerzen + 1, die aktuelle eingeschlossen; Aroon Down ebenso mit dem tiefsten Tief, der Oszillator ist Up − Down; bei gleichen Werten zählt der jüngste. Dieselbe Formel wie der eingebaute Aroon in TradingView.",
    "Aroon Up = 100 × (candles − candles since the highest high) / candles over the last candles + 1, the current one included; Aroon Down likewise with the lowest low, the oscillator is Up − Down; with equal values the most recent counts. The same formula as TradingView’s built-in Aroon."
  ),
  icon: "compass",
  keywords: {
    de: ["aroon", "trend", "trendstärke", "hoch", "tief", "oszillator", "frisch"],
    en: ["aroon", "trend", "trend strength", "high", "low", "oscillator", "recent"]
  },
  inputs: CANDLE_HL_INPUTS,
  outputs: [
    { id: "up", type: "series", label: l("Aroon Up", "Aroon Up") },
    { id: "down", type: "series", label: l("Aroon Down", "Aroon Down") },
    { id: "osc", type: "series", label: l("Oszillator", "Oscillator") }
  ],
  settings: {
    length: lengthSetting(
      14,
      1,
      500,
      l("Über wie viele Kerzen Hoch und Tief gesucht werden. 14 ist üblich, 25 gibt ruhigere Linien.", "How many candles the high and low are searched over. 14 is usual, 25 gives calmer lines.")
    )
  },
  sentence: ({ settings, locale }) => `${settings.length} ${locale === "de" ? "Kerzen" : "candles"}`,
  short: ({ settings, pin, locale }) => {
    if (pin === "down") return `Aroon Down ${settings.length}`;
    if (pin === "osc") return `${locale === "de" ? "Aroon-Oszillator" : "Aroon oscillator"} ${settings.length}`;
    return `Aroon Up ${settings.length}`;
  },
  warmup: ({ settings }) => settings.length + 1,
  compute({ inputs: inputs2, settings }) {
    const lines = series_exports.aroon(inputs2.high, inputs2.low, settings.length);
    return { up: lines.up, down: lines.down, osc: lines.oscillator };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HL,
      settings: { length: 14 },
      expectAt: { "13": { up: null }, "14": { up: 28.571428571428573, down: 0, osc: 28.571428571428573 } },
      expectLast: { up: 14.285714285714286, down: 57.142857142857146, osc: -42.857142857142854 }
    }
  ]
});

// packages/nodes/src/indicators/atr.ts
var SMOOTHING = {
  rma: {
    label: l("RMA · üblich", "RMA · usual"),
    help: l(
      "Die Glättung von Wilder, mit der er die ATR eingeführt hat. Ruhig: Bei 14 Kerzen zählt jede neue Kerze mit einem Vierzehntel.",
      "Wilder’s smoothing, the one he introduced the ATR with. Calm: with 14 candles each new candle counts for one fourteenth."
    )
  },
  sma: {
    label: l("SMA · jede Kerze zählt gleich", "SMA · every candle counts equally"),
    help: l(
      "Einfacher Durchschnitt: Jede der letzten Kerzen zählt gleich viel. Fällt eine große Kerze aus dem Fenster, springt der Wert.",
      "Simple average: each of the last candles counts the same. When a big candle drops out of the window, the value jumps."
    )
  },
  ema: {
    label: l("EMA · neue Kerzen zählen mehr", "EMA · recent candles count more"),
    help: l(
      "Exponentieller Durchschnitt: Neue Kerzen zählen mehr als bei RMA. Reagiert schneller, wenn der Markt plötzlich unruhig wird.",
      "Exponential average: recent candles count more than with RMA. Reacts faster when the market suddenly gets restless."
    )
  },
  wma: {
    label: l("WMA · Gewicht nimmt gleichmäßig ab", "WMA · weight drops evenly"),
    help: l("Gewichteter Durchschnitt: Die neueste Kerze zählt am meisten, jede ältere gleichmäßig weniger.", "Weighted average: the newest candle counts most, each older one evenly less.")
  }
};
function smooth2(values, length, smoothing) {
  switch (smoothing) {
    case "rma":
      return series_exports.rma(values, length);
    case "sma":
      return series_exports.sma(values, length);
    case "ema":
      return series_exports.ema(values, length);
    case "wma":
      return series_exports.wma(values, length);
  }
}
function suffix(smoothing) {
  return smoothing === "rma" ? "" : ` ${smoothing.toUpperCase()}`;
}
var atr2 = defineNode({
  id: "core.atr",
  version: "1.0.0",
  category: "ind",
  label: l("ATR", "ATR"),
  description: l("Misst, wie stark der Kurs schwankt", "Measures how much the price swings"),
  help: l(
    "Misst, wie weit sich der Kurs je Kerze im Schnitt bewegt, vom Tief bis zum Hoch, Sprünge seit dem Schluss der Kerze davor eingerechnet. Je größer die Zahl, desto unruhiger der Markt. Der Ausgang ATR % setzt sie ins Verhältnis zum Kurs, so lassen sich Coins mit ganz verschiedenen Preisen vergleichen. Beispiel: Bei BTC um 82.000 $ liegt die ATR 14 auf 1-Stunden-Kerzen oft um 400 $, also bei etwa 0,5 %. „ATR % 14 über 0,7“ meldet, wenn der Markt deutlich unruhiger wird als sonst.",
    "Measures how far the price moves per candle on average, from low to high, including jumps since the previous candle’s close. The bigger the number, the more restless the market. The ATR % output relates it to the price, which lets you compare coins with very different prices. Example: with BTC around $82,000 the ATR 14 on 1-hour candles is often around $400, about 0.5 %. “ATR % 14 above 0.7” fires when the market gets clearly more restless than usual."
  ),
  technical: l(
    "True Range als größte der Spannen Hoch − Tief, |Hoch − Schluss davor| und |Tief − Schluss davor|, geglättet mit RMA, SMA, EMA oder WMA, ATR % als ATR geteilt durch den Schluss mal 100; dieselben Werte wie der eingebaute Indikator Average True Range von TradingView, mit RMA dieselbe Formel wie ta.atr.",
    "True range as the largest of high − low, |high − previous close| and |low − previous close|, smoothed with RMA, SMA, EMA or WMA, ATR % as ATR divided by the close times 100; the same values as TradingView’s built-in Average True Range indicator, with RMA the same formula as ta.atr."
  ),
  icon: "ruler",
  keywords: {
    de: ["volatilität", "schwankung", "spanne", "true range", "stopp"],
    en: ["volatility", "range", "true range", "stop loss"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "out", type: "series", label: l("ATR", "ATR"), unit: "price" },
    { id: "percent", type: "series", label: l("ATR %", "ATR %"), unit: "percent" }
  ],
  settings: {
    length: lengthSetting(
      14,
      1,
      500,
      l(
        "Über wie viele Kerzen die Spannen gemittelt werden. 14 ist der übliche Wert. Weniger Kerzen reagieren schneller auf plötzliche Unruhe, mehr Kerzen zeigen die Schwankung über längere Zeit.",
        "How many candles the ranges are averaged over. 14 is the usual value. Fewer candles react faster to sudden turbulence, more candles show the swings over a longer time."
      )
    ),
    smoothing: {
      type: "select",
      label: l("Glättung", "Smoothing"),
      help: l(
        "Wie die Spannen gemittelt werden. RMA ist die übliche Rechnung der ATR; die anderen brauchst du nur, wenn du Werte aus einem anderen Programm nachbauen willst.",
        "How the ranges are averaged. RMA is the usual way to calculate the ATR; you only need the others to match values from another tool."
      ),
      default: "rma",
      options: Object.keys(SMOOTHING).map((value) => ({ value, label: SMOOTHING[value].label, help: SMOOTHING[value].help })),
      advanced: true
    }
  },
  sentence: ({ settings, locale }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + (settings.smoothing === "rma" ? "" : ` · ${settings.smoothing.toUpperCase()}`),
  short: ({ settings, pin }) => (pin === "percent" ? `ATR % ${settings.length}` : `ATR ${settings.length}`) + suffix(settings.smoothing),
  warmup: ({ settings }) => {
    if (settings.smoothing === "rma") return 10 * settings.length + 1;
    if (settings.smoothing === "ema") return 5 * settings.length + 1;
    return settings.length + 1;
  },
  compute({ inputs: inputs2, settings }) {
    const out = smooth2(series_exports.tr(inputs2.high, inputs2.low, inputs2.close), settings.length, settings.smoothing);
    return { out, percent: series_exports.div(series_exports.mul(out, 100), inputs2.close) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "ATR 14 mit RMA",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, smoothing: "rma" },
      expectAt: { "12": { out: null }, "13": { out: 167.43, percent: 0.1990077544441856 } },
      expectLast: { out: 453.3931797869771, percent: 0.5555224216669465 },
      tolerance: 1e-9
    },
    {
      name: "ATR 14 mit SMA",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, smoothing: "sma" },
      expectLast: { out: 513.2735714285715 },
      tolerance: 1e-9
    }
  ]
});

// packages/nodes/src/indicators/atrstop.ts
var KINDS = {
  chandelier: {
    label: l("Chandelier · vom Hoch", "Chandelier · from the high"),
    short: l("Chandelier", "Chandelier"),
    help: l(
      "Der Stopp hängt am höchsten Hoch der letzten Kerzen, im Abwärtstrend am tiefsten Tief. Üblich sind 22 Kerzen und Faktor 3.",
      "The stop hangs from the highest high of the last candles, in a downtrend from the lowest low. 22 candles and factor 3 are usual."
    )
  },
  close: {
    label: l("vom Kurs", "from the price"),
    short: l("vom Kurs", "from the price"),
    help: l(
      "Der Stopp folgt dem Schlusskurs im Abstand Faktor × ATR und reagiert schneller. Üblich sind 10 Kerzen und Faktor 1 bis 2.",
      "The stop follows the close at a distance of factor × ATR and reacts faster. 10 candles and factor 1 to 2 are usual."
    )
  }
};
var SETTINGS = {
  kind: {
    type: "select",
    label: l("Art", "Type"),
    help: l("Wovon aus der Stopp seinen Abstand hält.", "What the stop keeps its distance from."),
    default: "chandelier",
    options: Object.keys(KINDS).map((value) => ({ value, label: KINDS[value].label, help: KINDS[value].help }))
  },
  length: lengthSetting(
    22,
    1,
    500,
    l(
      "Über wie viele Kerzen die übliche Spanne (ATR) gemessen wird, beim Chandelier auch das höchste Hoch und das tiefste Tief.",
      "How many candles the usual range (ATR) is measured over, for the chandelier also the highest high and the lowest low."
    ),
    l("ATR-Kerzen", "ATR candles")
  ),
  factor: {
    type: "number",
    label: l("Faktor", "Factor"),
    help: l(
      "Abstand des Stopps als Vielfaches der ATR. Mit 3 dreht der Trend erst bei einer deutlichen Gegenbewegung, kleinere Werte melden früher, aber auch öfter falsch.",
      "Distance of the stop as a multiple of the ATR. With 3 the trend only turns on a clear counter move; smaller values report earlier, but also more often wrongly."
    ),
    default: 3,
    min: 0.1,
    max: 20,
    step: 0.1
  }
};
function name(settings, locale) {
  return `${locale === "de" ? "ATR-Stopp" : "ATR stop"} ${settings.length} · ${fmt(settings.factor, locale)}`;
}
var atrStop = defineNode({
  id: "core.atrstop",
  version: "1.0.0",
  category: "ind",
  label: l("ATR-Stopp", "ATR stop"),
  description: l("Nachgezogener Stopp im Abstand der ATR", "Trailing stop at a distance of the ATR"),
  help: l(
    "Zieht einen Stopp im Abstand der üblichen Schwankung (ATR) hinter dem Kurs her: im Aufwärtstrend darunter, im Abwärtstrend darüber. Er rückt nur in Trendrichtung nach. Schließt der Kurs auf seiner anderen Seite, dreht der Trend und der Stopp springt um. Die Signale „aufwärts“ und „abwärts“ sind wahr, solange der Trend in diese Richtung zeigt. Beispiel: „ATR-Stopp abwärts“ meldet, sobald dein nachgezogener Stopp im Aufwärtstrend gerissen ist und der Trend dreht.",
    "Trails a stop behind the price at the distance of its usual swings (ATR): below it in an uptrend, above it in a downtrend. It only moves in the direction of the trend. When the price closes on its other side, the trend turns and the stop jumps across. The “up” and “down” signals are true as long as the trend points that way. Example: “ATR stop down” reports as soon as your trailing stop in an uptrend is hit and the trend turns."
  ),
  technical: l(
    "Chandelier: im Aufwärtstrend höchstes Hoch der Kerzen − Faktor × ATR, im Abwärtstrend tiefstes Tief + Faktor × ATR; ein Stopp rückt nur nach, solange der Schluss davor auf seiner Seite lag, und der Trend dreht, wenn der Schluss den Stopp der Gegenseite von der Kerze davor durchbricht. Vom Kurs: Schluss − Faktor × ATR im Aufwärtstrend, Schluss + Faktor × ATR im Abwärtstrend, nur in Trendrichtung nachgezogen; der Trend dreht, wenn der Schluss den Stopp kreuzt. ATR als RMA der True Range, beide beginnen aufwärts.",
    "Chandelier: in an uptrend the highest high of the candles − factor × ATR, in a downtrend the lowest low + factor × ATR; a stop only moves while the previous close was on its side, and the trend turns when the close breaks the opposite stop of the candle before. From the price: close − factor × ATR in an uptrend, close + factor × ATR in a downtrend, only trailed in the direction of the trend; the trend turns when the close crosses the stop. ATR as the RMA of the true range, both start upward."
  ),
  icon: "shield",
  keywords: {
    de: ["stopp", "stop loss", "nachgezogener stopp", "chandelier", "atr", "trailing", "trend", "ausstieg"],
    en: ["stop", "stop loss", "trailing stop", "chandelier", "atr", "trailing", "trend", "exit"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "line", type: "series", label: l("Stopp", "Stop"), unit: "price" },
    { id: "up", type: "signal", label: l("aufwärts", "up") },
    { id: "down", type: "signal", label: l("abwärts", "down") }
  ],
  settings: SETTINGS,
  sentence: ({ settings, locale }) => `${KINDS[settings.kind].short[locale]} · ${settings.length} ${locale === "de" ? "Kerzen" : "candles"} · ${locale === "de" ? "Faktor" : "factor"} ${fmt(settings.factor, locale)}`,
  short: ({ settings, pin, locale }) => {
    if (pin === "up") return `${name(settings, locale)} ${locale === "de" ? "aufwärts" : "up"}`;
    if (pin === "down") return `${name(settings, locale)} ${locale === "de" ? "abwärts" : "down"}`;
    return name(settings, locale);
  },
  // ATR mit RMA wie beim RSI, dazu Zeit, bis der nachgezogene Stopp vom Startpunkt unabhängig ist, wie beim Supertrend.
  warmup: ({ settings }) => 10 * settings.length + 100,
  compute({ inputs: inputs2, settings }) {
    const stop = settings.kind === "chandelier" ? series_exports.chandelier(inputs2.high, inputs2.low, inputs2.close, settings.length, settings.factor) : series_exports.atrTrailingStop(inputs2.close, inputs2.high, inputs2.low, inputs2.close, settings.length, settings.factor);
    return { line: stop.line, up: stop.direction.map((d) => d === 1), down: stop.direction.map((d) => d === -1) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "Chandelier 22 · 3",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { kind: "chandelier", length: 22, factor: 3 },
      expectAt: { "20": { line: null, up: false, down: false }, "21": { line: 84023.59727272727, up: true, down: false } },
      expectLast: { line: 82224.9877221301, up: false, down: true }
    },
    {
      name: "vom Kurs 10 · 1",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { kind: "close", length: 10, factor: 1 },
      expectAt: { "8": { line: null }, "9": { line: 83752.322, up: true } },
      expectLast: { line: 81322.14946638339, up: true, down: false }
    }
  ]
});

// packages/nodes/src/indicators/bb.ts
var PIN_SHORT = {
  upper: l("oberes Band", "upper band"),
  middle: l("Mittelband", "middle band"),
  lower: l("unteres Band", "lower band")
};
var bollinger = defineNode({
  id: "core.bb",
  version: "1.0.0",
  category: "ind",
  label: l("Bollinger-Bänder", "Bollinger Bands"),
  description: l("Kanal für die übliche Schwankung", "Channel of the usual price swings"),
  help: l(
    "Legt ein Band um den Durchschnitt der letzten Kerzen. Es wird breiter, wenn der Kurs stark schwankt, und enger, wenn es ruhig ist. Meist bleibt der Kurs innerhalb. Beispiel: Fällt der Kurs unter das untere Band, ist er für seine übliche Schwankung ungewöhnlich weit gefallen. Ein sehr enges Band zeigt eine ungewöhnlich ruhige Phase.",
    "Draws a band around the average of the last candles. It widens when the price swings a lot and narrows when things are calm. Most of the time the price stays inside. Example: when the price drops below the lower band, it has fallen unusually far for its normal swings. A very narrow band shows an unusually quiet phase."
  ),
  technical: l(
    "SMA in der Mitte, Bänder im Abstand von Breite mal Standardabweichung (Grundgesamtheit); dieselbe Formel wie ta.bb in TradingView.",
    "SMA in the middle, bands at width times the (population) standard deviation; the same formula as ta.bb in TradingView."
  ),
  icon: "chart-area",
  keywords: { de: ["volatilität", "band", "squeeze", "standardabweichung"], en: ["volatility", "band", "squeeze", "standard deviation"] },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "upper", type: "series", label: l("Oben", "Upper"), unit: "input" },
    { id: "middle", type: "series", label: l("Mitte", "Middle"), unit: "input" },
    { id: "lower", type: "series", label: l("Unten", "Lower"), unit: "input" }
  ],
  settings: {
    length: lengthSetting(
      20,
      2,
      500,
      l("Über wie viele Kerzen Durchschnitt und Schwankung rechnen. 20 ist der übliche Wert.", "How many candles the average and the swings are measured over. 20 is the usual value.")
    ),
    mult: {
      type: "number",
      label: l("Breite", "Width"),
      help: l(
        "Wie weit die Bänder vom Durchschnitt entfernt liegen, gemessen in Standardabweichungen. Mit dem üblichen Wert 2 bleibt der Kurs die meiste Zeit innerhalb. Größere Werte wie 2,5 oder 3 lassen nur sehr starke Ausschläge hinaus.",
        "How far the bands sit from the average, measured in standard deviations. With the usual value 2 the price stays inside most of the time. Larger values like 2.5 or 3 only let very strong moves out."
      ),
      default: 2,
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: l("σ", "σ")
    }
  },
  sentence: ({ settings, locale }) => locale === "de" ? `${settings.length} Kerzen · Breite ${formatNumber(settings.mult, locale)}` : `${settings.length} candles · width ${formatNumber(settings.mult, locale)}`,
  short: ({ pin, locale }) => (PIN_SHORT[pin] ?? PIN_SHORT.middle)[locale],
  warmup: ({ settings }) => settings.length,
  visual: { kind: "channel", series: { input: "in" }, middle: { output: "middle" }, upper: { output: "upper" }, lower: { output: "lower" }, width: "mult" },
  compute({ inputs: inputs2, settings }) {
    const bands = series_exports.bb(inputs2.in, settings.length, settings.mult);
    return { upper: bands.upper, middle: bands.middle, lower: bands.lower };
  },
  tests: [
    {
      fixture: FIXTURE,
      settings: { length: 20, mult: 2 },
      expectAt: { "18": { middle: null, upper: null } },
      expectLast: { upper: 82651.48264870465, middle: 81876.3555, lower: 81101.22835129534 }
    }
  ]
});

// packages/nodes/src/indicators/candlepattern.ts
var PATTERNS = {
  bullEngulfing: {
    label: l("Bullisches Engulfing", "Bullish engulfing"),
    help: l(
      "Eine lange grüne Kerze umschließt den Körper einer kleinen roten davor. Gilt als Zeichen, dass Käufer übernehmen.",
      "A long green candle engulfs the body of a small red one before it. Seen as a sign that buyers are taking over."
    )
  },
  bearEngulfing: {
    label: l("Bärisches Engulfing", "Bearish engulfing"),
    help: l(
      "Eine lange rote Kerze umschließt den Körper einer kleinen grünen davor. Gilt als Zeichen, dass Verkäufer übernehmen.",
      "A long red candle engulfs the body of a small green one before it. Seen as a sign that sellers are taking over."
    )
  },
  hammer: {
    label: l("Hammer", "Hammer"),
    help: l(
      "Kleiner Körper oben, darunter ein Docht, mindestens doppelt so lang wie der Körper: Der Kurs fiel stark und wurde zurückgekauft.",
      "Small body at the top with a lower wick at least twice as long as the body: the price dropped hard and was bought back."
    )
  },
  shootingStar: {
    label: l("Sternschnuppe", "Shooting star"),
    help: l(
      "Kleiner Körper unten, darüber ein Docht, mindestens doppelt so lang wie der Körper: Der Kurs stieg stark und wurde wieder abverkauft.",
      "Small body at the bottom with an upper wick at least twice as long as the body: the price rose sharply and was sold off again."
    )
  },
  doji: {
    label: l("Doji", "Doji"),
    help: l(
      "Eröffnung und Schluss fast gleich, der Körper ist höchstens 5 % der Spanne: Käufer und Verkäufer halten sich die Waage.",
      "Open and close almost equal, the body is at most 5 % of the range: buyers and sellers are in balance."
    )
  },
  morningStar: {
    label: l("Morgenstern", "Morning star"),
    help: l(
      "Drei Kerzen: eine lange rote, eine kleine tief unten, dann eine lange grüne, die über der Mitte der ersten schließt. Eine mögliche Wende nach oben.",
      "Three candles: a long red one, a small one low down, then a long green one that closes above the middle of the first. A possible turn upward."
    )
  },
  eveningStar: {
    label: l("Abendstern", "Evening star"),
    help: l(
      "Drei Kerzen: eine lange grüne, eine kleine weit oben, dann eine lange rote, die unter der Mitte der ersten schließt. Eine mögliche Wende nach unten.",
      "Three candles: a long green one, a small one high up, then a long red one that closes below the middle of the first. A possible turn downward."
    )
  },
  whiteSoldiers: {
    label: l("Drei weiße Soldaten", "Three white soldiers"),
    help: l(
      "Drei lange grüne Kerzen in Folge, jede schließt höher und im oberen Viertel ihrer Spanne. Zeigt kräftigen, gleichmäßigen Kaufdruck.",
      "Three long green candles in a row, each closing higher and in the top quarter of its range. Shows strong, steady buying pressure."
    )
  },
  blackCrows: {
    label: l("Drei schwarze Krähen", "Three black crows"),
    help: l(
      "Drei lange rote Kerzen in Folge, jede schließt tiefer und im unteren Viertel ihrer Spanne. Zeigt kräftigen, gleichmäßigen Verkaufsdruck.",
      "Three long red candles in a row, each closing lower and in the bottom quarter of its range. Shows strong, steady selling pressure."
    )
  }
};
var WITH_TREND = /* @__PURE__ */ new Set(["bullEngulfing", "bearEngulfing", "hammer", "shootingStar", "morningStar", "eveningStar"]);
var candlePattern2 = defineNode({
  id: "core.candlepattern",
  version: "1.0.0",
  category: "ind",
  label: l("Kerzenmuster", "Candlestick pattern"),
  description: l("Engulfing, Hammer, Doji, Sterne und mehr", "Engulfing, hammer, doji, stars and more"),
  help: l(
    "Erkennt bekannte Muster aus einer bis drei Kerzen, etwa Engulfing, Hammer oder Morgenstern, und meldet sie an der Kerze, mit der das Muster fertig ist. Gerechnet wird nur mit geschlossenen Kerzen, ein gemeldetes Muster verschwindet also nicht wieder. Allein sind Kerzenmuster schwache Signale; zusammen mit einem Level oder dem RSI sagen sie mehr. Beispiel: „Bullisches Engulfing“ und „RSI unter 30“ meldet eine mögliche Wende im überverkauften Bereich.",
    "Detects well-known patterns of one to three candles, such as engulfing, hammer or morning star, and reports them on the candle that completes the pattern. Only closed candles count, so a reported pattern never disappears again. On their own, candlestick patterns are weak signals; together with a level or the RSI they say more. Example: “Bullish engulfing” and “RSI below 30” reports a possible turn in the oversold zone."
  ),
  technical: l(
    "Körper = |Schluss − Eröffnung|, lang und klein heißt größer bzw. kleiner als die EMA 14 der Körper; Trend: Schluss unter (steigende Muster) bzw. über (fallende) der SMA 50. Engulfing: langer Körper, der über die Eröffnung des kleinen davor hinausreicht und höchstens bei dessen Schluss beginnt; Hammer: kleiner Körper über der Mitte der Spanne, unterer Docht ≥ 2 × Körper, oberer ≤ 5 % des Körpers; Doji: Körper ≤ 5 % der Spanne; Morgenstern: langer fallender Körper, kleiner Körper unter dessen Mitte, langer steigender Körper mit Schluss über dessen Mitte; drei weiße Soldaten: drei lange steigende Körper mit höherem Schluss, jeder öffnet im Körper davor und schließt im oberen Viertel seiner Spanne; die fallenden Muster gespiegelt. Eröffnungen bis ein Zehntel der EMA neben dem Körper davor gelten als darin, weil Krypto ohne Kurslücken handelt.",
    "Body = |close − open|, long and small mean larger or smaller than the EMA 14 of the bodies; trend: close below (rising patterns) or above (falling ones) the SMA 50. Engulfing: a long body reaching beyond the open of the small one before and starting at most at its close; hammer: small body above the middle of the range, lower wick ≥ 2 × body, upper ≤ 5 % of the body; doji: body ≤ 5 % of the range; morning star: long falling body, small body below its middle, long rising body closing above its middle; three white soldiers: three long rising bodies with higher closes, each opening within the body before and closing in the top quarter of its range; the falling patterns mirrored. Opens up to a tenth of the EMA beside the previous body count as inside, because crypto trades without price gaps."
  ),
  icon: "scan",
  keywords: {
    de: ["kerzenmuster", "muster", "candlestick", "engulfing", "hammer", "doji", "morgenstern", "abendstern", "sternschnuppe", "soldaten", "krähen", "wende"],
    en: ["candlestick", "pattern", "engulfing", "hammer", "doji", "morning star", "evening star", "shooting star", "soldiers", "crows", "reversal"]
  },
  inputs: CANDLE_BODY_INPUTS,
  outputs: [{ id: "out", type: "signal", label: l("erkannt", "found") }],
  settings: {
    pattern: {
      type: "select",
      label: l("Muster", "Pattern"),
      help: l("Welches Muster der Baustein sucht. Er meldet es an der Kerze, mit der es fertig ist.", "Which pattern the node looks for. It reports it on the candle that completes it."),
      default: "bullEngulfing",
      options: Object.keys(PATTERNS).map((value) => ({ value, label: PATTERNS[value].label, help: PATTERNS[value].help }))
    },
    trend: {
      type: "select",
      label: l("Trend davor", "Prior trend"),
      help: l(
        "Ob ein Muster nur nach einer passenden Bewegung zählt. Ein Hammer ist eine Wende nach einem Rückgang; mit Trend zählt er nur, wenn der Kurs unter seinem Durchschnitt der letzten 50 Kerzen schließt.",
        "Whether a pattern only counts after a matching move. A hammer is a turn after a decline; with the trend it only counts when the price closes below its average of the last 50 candles."
      ),
      default: "sma50",
      options: [
        {
          value: "sma50",
          label: l("beachten", "consider"),
          help: l(
            "Steigende Muster zählen nur, wenn der Kurs unter dem Durchschnitt der letzten 50 Kerzen schließt, fallende nur darüber. Doji und drei Soldaten oder Krähen gelten immer.",
            "Rising patterns only count when the price closes below the average of the last 50 candles, falling ones only above it. Doji and three soldiers or crows always count."
          )
        },
        {
          value: "none",
          label: l("nicht beachten", "ignore"),
          help: l("Nur die Form der Kerzen zählt, egal wie der Kurs davor lief.", "Only the shape of the candles counts, no matter how the price moved before.")
        }
      ]
    }
  },
  sentence: ({ settings, locale }) => {
    const pattern = PATTERNS[settings.pattern];
    if (settings.trend === "none" && WITH_TREND.has(settings.pattern)) return `${pattern.label[locale]} · ${locale === "de" ? "ohne Trend" : "any trend"}`;
    return pattern.label[locale];
  },
  short: ({ settings, locale }) => PATTERNS[settings.pattern].label[locale],
  // Der Durchschnitt der Körper ist eine EMA 14: Nach zehnmal so vielen Kerzen hängt er nicht mehr vom Beginn der Daten ab,
  // so kippt kein Vergleich mit ihm. Dazu zwei Kerzen für die längsten Muster; der Trend braucht 50.
  warmup: () => Math.max(10 * series_exports.PATTERN_BODY_LENGTH + 2, series_exports.PATTERN_TREND_LENGTH),
  compute({ inputs: inputs2, settings }) {
    return { out: series_exports.candlePattern(settings.pattern, inputs2.open, inputs2.high, inputs2.low, inputs2.close, settings.trend === "sma50") };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "bullisches Engulfing nach Abwärtstrend",
      fixture: FIXTURE,
      inputs: CANDLE_OHLC,
      settings: { pattern: "bullEngulfing", trend: "sma50" },
      expectAt: { "96": { out: false }, "97": { out: true }, "193": { out: true }, "495": { out: true } },
      expectLast: { out: false }
    },
    {
      name: "Hammer ohne Trend",
      fixture: FIXTURE,
      inputs: CANDLE_OHLC,
      settings: { pattern: "hammer", trend: "none" },
      expectAt: { "13": { out: true }, "178": { out: true }, "202": { out: true }, "203": { out: false } }
    },
    {
      name: "drei weiße Soldaten",
      fixture: FIXTURE,
      inputs: CANDLE_OHLC,
      settings: { pattern: "whiteSoldiers" },
      expectAt: { "143": { out: false }, "144": { out: true }, "195": { out: true }, "380": { out: true } }
    }
  ]
});

// packages/nodes/src/indicators/thresholds.ts
var THRESHOLD_OUTPUTS = [
  { id: "oversold", type: "signal", label: l("überverkauft", "oversold") },
  { id: "overbought", type: "signal", label: l("überkauft", "overbought") }
];
function thresholdSettings(range2, help) {
  const { min, max, step } = range2;
  return {
    oversold: { type: "number", label: l("Überverkauft unter", "Oversold below"), help: help.oversold, default: range2.oversold, min, max, step },
    overbought: { type: "number", label: l("Überkauft über", "Overbought above"), help: help.overbought, default: range2.overbought, min, max, step }
  };
}
function thresholdSignals(values, oversold, overbought) {
  return {
    oversold: values.map((value) => value !== null && value < oversold),
    overbought: values.map((value) => value !== null && value > overbought)
  };
}
function thresholdSentence(settings, output, locale) {
  const low = output?.("oversold") === true;
  const high = output?.("overbought") === true;
  if (low && high) return ` · ${formatNumber(settings.oversold, locale)}/${formatNumber(settings.overbought, locale)}`;
  if (low) return ` · ${locale === "de" ? "unter" : "below"} ${formatNumber(settings.oversold, locale)}`;
  if (high) return ` · ${locale === "de" ? "über" : "above"} ${formatNumber(settings.overbought, locale)}`;
  return "";
}
function thresholdShort(name4, pin, settings, locale) {
  if (pin === "oversold") return `${name4} ${locale === "de" ? "unter" : "below"} ${formatNumber(settings.oversold, locale)}`;
  return `${name4} ${locale === "de" ? "über" : "above"} ${formatNumber(settings.overbought, locale)}`;
}

// packages/nodes/src/indicators/cci.ts
var RANGE = { oversold: -100, overbought: 100, min: -500, max: 500, step: 10 };
var cci2 = defineNode({
  id: "core.cci",
  version: "1.0.0",
  category: "ind",
  label: l("CCI", "CCI"),
  description: l("Wie weit der Kurs vom Schnitt abweicht", "How far the price strays from its average"),
  help: l(
    "Misst, wie weit der typische Kurs, der Mittelwert aus Hoch, Tief und Schluss, von seinem Durchschnitt der letzten Kerzen entfernt ist, gemessen an der üblichen Schwankung. Meist liegt der CCI zwischen −100 und 100. Über 100 ist der Kurs ungewöhnlich weit gestiegen, oft zu Beginn eines starken Anstiegs, unter −100 ungewöhnlich weit gefallen. Die Ausgänge „überkauft“ und „überverkauft“ melden das, die Schwellen ziehst du im Bild unter dem Kurs. Beispiel: „CCI 20 kreuzt 100 nach oben“ meldet einen kräftigen Ausbruch nach oben, „CCI 20 unter −200“ einen sehr starken Abverkauf.",
    "Measures how far the typical price, the mean of high, low and close, is from its average over the last candles, relative to its usual swings. Most of the time the CCI stays between −100 and 100. Above 100 the price has risen unusually far, often at the start of a strong rise, below −100 it has fallen unusually far. The “overbought” and “oversold” outputs report this, and you drag the thresholds in the chart below the price. Example: “CCI 20 crosses above 100” reports a strong upside breakout, “CCI 20 below −200” a very sharp sell-off."
  ),
  technical: l(
    "Typischer Kurs (Hoch + Tief + Schluss) / 3, CCI als (typischer Kurs − SMA) / (0,015 · mittlere absolute Abweichung) über die Kerzen, leer ohne Abweichung; dieselbe Formel wie ta.cci in TradingView, wie der eingebaute CCI mit der Quelle hlc3.",
    "Typical price (high + low + close) / 3, CCI as (typical price − SMA) / (0.015 · mean absolute deviation) over the candles, empty without deviation; the same formula as ta.cci in TradingView, like the built-in CCI with the source hlc3."
  ),
  icon: "arrow-up-down",
  keywords: {
    de: ["cci", "commodity channel index", "abweichung", "überkauft", "überverkauft", "momentum"],
    en: ["cci", "commodity channel index", "deviation", "overbought", "oversold", "momentum"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [{ id: "out", type: "series", label: l("CCI", "CCI") }, ...THRESHOLD_OUTPUTS],
  settings: {
    length: lengthSetting(
      20,
      2,
      200,
      l(
        "Über wie viele Kerzen Durchschnitt und Schwankung rechnen. 20 ist der übliche Wert. Mit 14 reagiert der CCI schneller, mit 50 zeigt er eher den größeren Trend.",
        "How many candles the average and the swings are measured over. 20 is the usual value. With 14 the CCI reacts faster, with 50 it shows more of the bigger trend."
      )
    ),
    ...thresholdSettings(RANGE, {
      oversold: l(
        "Unter dieser Linie ist der Kurs ungewöhnlich weit gefallen, und der Ausgang „überverkauft“ ist wahr. Üblich ist −100; mit −200 meldet er nur sehr starke Abverkäufe.",
        "Below this line the price has fallen unusually far, and the “oversold” output is true. −100 is usual; with −200 it only reports very sharp sell-offs."
      ),
      overbought: l(
        "Über dieser Linie ist der Kurs ungewöhnlich weit gestiegen, und der Ausgang „überkauft“ ist wahr. Üblich ist 100; mit 200 meldet er nur sehr starke Anstiege.",
        "Above this line the price has risen unusually far, and the “overbought” output is true. 100 is usual; with 200 it only reports very strong rallies."
      )
    })
  },
  sentence: ({ settings, locale, output }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + thresholdSentence(settings, output, locale),
  short: ({ settings, pin, locale }) => pin === "out" ? `CCI ${settings.length}` : thresholdShort(`CCI ${settings.length}`, pin, settings, locale),
  warmup: ({ settings }) => settings.length,
  visual: { kind: "zone", series: { output: "out" }, low: "oversold", high: "overbought", price: { input: "close" }, signal: ["oversold", "overbought"] },
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.cci(series_exports.hlc3(inputs2.high, inputs2.low, inputs2.close), settings.length);
    return { out, ...thresholdSignals(out, settings.oversold, settings.overbought) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 20 },
      expectAt: { "18": { out: null }, "19": { out: 224.42112374349497 } },
      expectLast: { out: -44.01874454095633 },
      tolerance: 1e-9
    },
    // Schwellen gegen die Referenz (scripts/pine-reference.py): über 100 schon an Kerze 19, unter −100 ab Kerze 42.
    {
      name: "Schwellen −100 und 100",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 20, oversold: -100, overbought: 100 },
      expectAt: { "18": { overbought: false }, "19": { overbought: true }, "41": { oversold: false }, "42": { oversold: true } }
    }
  ]
});

// packages/nodes/src/indicators/change.ts
var change2 = defineNode({
  id: "core.change",
  version: "1.0.0",
  category: "ind",
  label: l("Veränderung %", "Change %"),
  description: l("Wie viel Prozent sich der Kurs bewegt hat", "How many percent the price has moved"),
  help: l(
    "Rechnet aus, um wie viel Prozent sich der Kurs seit einer bestimmten Zahl Kerzen verändert hat. Positive Werte heißen gestiegen, negative gefallen. Beispiel: Mit 1-Stunden-Kerzen und 4 Kerzen zurück vergleicht er mit dem Kurs vor vier Stunden. „Veränderung 4 unter -5“ meldet dann einen Absturz von mehr als 5 % in vier Stunden.",
    "Calculates by how many percent the price has changed compared with a set number of candles ago. Positive means up, negative down. Example: with 1-hour candles and 4 candles back it compares with the price four hours ago. “change 4 below -5” then fires on a drop of more than 5 % in four hours."
  ),
  technical: l(
    "Unterschied zum Wert vor N Kerzen, geteilt durch diesen Wert, mal 100; dieselbe Formel wie ta.roc in TradingView.",
    "Difference from the value N candles ago, divided by that value, times 100; the same formula as ta.roc in TradingView."
  ),
  icon: "move-vertical",
  keywords: { de: ["prozent", "pump", "dump", "crash", "veränderung"], en: ["percent", "pump", "dump", "crash", "change"] },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [{ id: "out", type: "series", label: l("%", "%"), unit: "percent" }],
  settings: {
    length: lengthSetting(
      4,
      1,
      500,
      l(
        "Mit dem Kurs vor wie vielen Kerzen verglichen wird. Die Zeitspanne ist Zeiteinheit mal Kerzen: 4 Kerzen zu 1 Stunde sind vier Stunden, 24 Kerzen ein Tag.",
        "How many candles back to compare with. The time span is timeframe times candles: 4 candles of 1 hour are four hours, 24 candles a day."
      ),
      l("Kerzen zurück", "Candles back")
    )
  },
  sentence: ({ settings, locale }) => locale === "de" ? `über ${settings.length} Kerzen` : `over ${settings.length} candles`,
  short: ({ settings, locale }) => locale === "de" ? `Veränderung ${settings.length}` : `change ${settings.length}`,
  warmup: ({ settings }) => settings.length,
  compute: ({ inputs: inputs2, settings }) => ({ out: series_exports.roc(inputs2.in, settings.length) }),
  tests: [
    {
      fixture: FIXTURE,
      settings: { length: 4 },
      expectAt: { "3": { out: null }, "4": { out: 0.29057111555682574 } },
      expectLast: { out: 0.03159706365472376 },
      tolerance: 1e-9
    }
  ]
});

// packages/nodes/src/indicators/divergence.ts
var KINDS2 = {
  regular: {
    label: l("Regulär", "Regular"),
    help: l(
      "Bullisch: Der Kurs macht ein tieferes Tief, der Oszillator ein höheres. Der Abverkauf verliert an Schwung, oft vor einer Wende nach oben. Bärisch spiegelbildlich an Hochs.",
      "Bullish: the price makes a lower low, the oscillator a higher one. The sell-off is losing momentum, often before a turn up. Bearish the other way round at highs."
    )
  },
  hidden: {
    label: l("Versteckt", "Hidden"),
    help: l(
      "Bullisch: Der Kurs macht ein höheres Tief, der Oszillator ein tieferes. Der Rücksetzer im Aufwärtstrend war im Oszillator tief, im Kurs flach; viele lesen das als Fortsetzung des Trends. Bärisch spiegelbildlich an Hochs.",
      "Bullish: the price makes a higher low, the oscillator a lower one. The pullback in an uptrend was deep in the oscillator but shallow in the price; many read this as the trend continuing. Bearish the other way round at highs."
    )
  }
};
var OSCILLATOR = l("Oszillator", "Oscillator");
var NAMES = {
  regular: { bull: l("Bullische Divergenz", "Bullish divergence"), bear: l("Bärische Divergenz", "Bearish divergence") },
  hidden: { bull: l("Versteckte bullische Divergenz", "Hidden bullish divergence"), bear: l("Versteckte bärische Divergenz", "Hidden bearish divergence") }
};
function segment(length, from, a, to, b) {
  const values = new Array(length).fill(null);
  for (let i = Math.max(0, from); i <= Math.min(length - 1, to); i++) values[i] = to === from ? b : a + (b - a) * (i - from) / (to - from);
  return values;
}
function divergencesOf(inputs2, settings) {
  return series_exports.divergences(inputs2.osc, inputs2.high, inputs2.low, settings.left, settings.right, settings.minBars, settings.maxBars, settings.kind === "hidden");
}
var divergence = defineNode({
  id: "core.divergence",
  version: "1.0.0",
  category: "ind",
  label: l("Divergenz", "Divergence"),
  description: l("Kurs und Oszillator laufen auseinander", "Price and oscillator move apart"),
  help: l(
    "Vergleicht zwei aufeinanderfolgende Tiefs (oder Hochs) eines Oszillators wie RSI oder MACD mit dem Kurs an denselben Kerzen. Bullische Divergenz: Der Kurs macht ein tieferes Tief, der Oszillator ein höheres, der Abverkauf verliert also an Schwung. Bärische Divergenz: Der Kurs macht ein höheres Hoch, der Oszillator ein tieferes. Ein Tief zählt erst, wenn die eingestellten Kerzen danach es bestätigt haben; so viele Kerzen später meldet sich der Baustein, nie rückwirkend. Beispiel: RSI 14 mit Divergenz auf 4-Stunden-Kerzen meldet „bullisch“, wenn BTC tiefer fällt als beim letzten Tief, der RSI aber höher bleibt.",
    "Compares two consecutive lows (or highs) of an oscillator such as RSI or MACD with the price on the same candles. Bullish divergence: the price makes a lower low, the oscillator a higher one, so the sell-off is losing momentum. Bearish divergence: the price makes a higher high, the oscillator a lower one. A low only counts once the chosen candles after it have confirmed it; the node reports that many candles later, never in hindsight. Example: RSI 14 with Divergence on 4-hour candles reports “bullish” when BTC falls below its last low but the RSI stays higher."
  ),
  technical: l(
    "Pivot-Tiefs und -Hochs des Oszillators wie beim Baustein Swing-Punkte (niedriger bzw. höher als die Kerzen davor, mindestens so tief bzw. hoch wie die danach). Verglichen werden zwei aufeinanderfolgende Pivots, die die eingestellten Kerzen auseinanderliegen, mit dem Tief bzw. Hoch der Kerze an jedem Pivot. Regulär bullisch: Tief tiefer, Oszillator höher; versteckt bullisch: Tief höher, Oszillator tiefer; an Hochs spiegelbildlich. Gemeldet an der Kerze, die das zweite Pivot bestätigt. Aufgebaut wie das Divergenz-Skript von TradingView, mit dem Abstand der Pivots statt der Kerzen dazwischen.",
    "Pivot lows and highs of the oscillator as in the Swing points node (lower or higher than the candles before, at least as low or high as those after). Two consecutive pivots that lie the chosen number of candles apart are compared with the low or high of the candle at each pivot. Regular bullish: lower low, higher oscillator; hidden bullish: higher low, lower oscillator; mirrored at highs. Reported on the candle that confirms the second pivot. Built like the divergence script in TradingView, with the distance between the pivots instead of the candles in between."
  ),
  icon: "split",
  keywords: {
    de: ["divergenz", "rsi-divergenz", "macd-divergenz", "bullisch", "bärisch", "versteckt", "momentum", "wende"],
    en: ["divergence", "rsi divergence", "macd divergence", "bullish", "bearish", "hidden", "momentum", "reversal"]
  },
  inputs: [{ id: "osc", type: "series", label: OSCILLATOR }, ...CANDLE_HL_INPUTS],
  outputs: [
    { id: "bull", type: "signal", label: l("bullisch", "bullish") },
    { id: "bear", type: "signal", label: l("bärisch", "bearish") }
  ],
  settings: {
    kind: {
      type: "select",
      label: l("Art", "Type"),
      help: l("Welche Divergenz der Baustein meldet. Für beide Arten nimm zwei Bausteine.", "Which divergence the node reports. For both types use two nodes."),
      default: "regular",
      options: Object.keys(KINDS2).map((value) => ({ value, label: KINDS2[value].label, help: KINDS2[value].help }))
    },
    left: lengthSetting(
      5,
      1,
      50,
      l(
        "Wie viele Kerzen vor einem Tief des Oszillators alle höher liegen müssen, vor einem Hoch tiefer. Mehr Kerzen: nur deutlichere Tiefs und Hochs.",
        "How many candles before a low of the oscillator must all be higher, before a high lower. More candles: only clearer lows and highs."
      ),
      l("Kerzen davor", "Candles before")
    ),
    right: lengthSetting(
      5,
      1,
      50,
      l(
        "Wie viele Kerzen nach einem Tief des Oszillators nicht tiefer fallen dürfen, bis es feststeht. So viele Kerzen später meldet sich die Divergenz; weniger Kerzen melden früher, aber auch bei kleineren Tiefs.",
        "How many candles after a low of the oscillator must not fall below it before it is confirmed. The divergence reports that many candles later; fewer candles report sooner, but also for smaller lows."
      ),
      l("Kerzen danach", "Candles after")
    ),
    minBars: lengthSetting(
      5,
      1,
      200,
      l("So viele Kerzen müssen die beiden Tiefs oder Hochs mindestens auseinanderliegen.", "At least this many candles must lie between the two lows or highs."),
      l("Abstand mindestens", "Distance at least")
    ),
    maxBars: lengthSetting(
      60,
      2,
      500,
      l(
        "Höchstens so viele Kerzen dürfen die beiden Tiefs oder Hochs auseinanderliegen. Ältere Tiefs vergleicht der Baustein nicht mehr.",
        "At most this many candles may lie between the two lows or highs. The node no longer compares older lows."
      ),
      l("Abstand höchstens", "Distance at most")
    )
  },
  sentence: ({ settings, locale, input }) => `${input("osc") ?? OSCILLATOR[locale]}${settings.kind === "hidden" ? locale === "de" ? " · versteckt" : " · hidden" : ""} · ${settings.left} · ${settings.right}`,
  short: ({ settings, pin, locale }) => NAMES[settings.kind][pin === "bear" ? "bear" : "bull"][locale],
  warmup: ({ settings }) => settings.maxBars + settings.left + settings.right + 1,
  visual: {
    kind: "overlay",
    series: { input: "low" },
    lower: { input: "osc" },
    // Gemeldet wird an der Marke „Div“; Punkte für die Signale zeigten dieselben Kerzen noch einmal.
    draw({ inputs: inputs2, settings, bars }) {
      const found = divergencesOf(inputs2, settings);
      const paths = [];
      const marks = [];
      for (const div2 of found) {
        const tone = div2.bullish ? "up" : "down";
        paths.push({ upper: segment(bars.length, div2.first.at, div2.first.price, div2.second.at, div2.second.price), tone });
        paths.push({ upper: segment(bars.length, div2.first.at, div2.first.osc, div2.second.at, div2.second.osc), tone, pane: "lower" });
        const at = div2.confirmed;
        const value = (div2.bullish ? inputs2.low[at] : inputs2.high[at]) ?? div2.second.price;
        marks.push({ at, value, tone, side: div2.bullish ? "below" : "above", label: l("Div", "Div") });
      }
      const last = found.at(-1);
      return {
        legend: [
          { kind: "line", tone: "up", label: NAMES[settings.kind].bull },
          { kind: "line", tone: "down", label: NAMES[settings.kind].bear },
          { kind: "mark", tone: "neutral", label: l("gemeldet, Tief oder Hoch bestätigt", "reported, low or high confirmed") }
        ],
        paths,
        marks,
        note: last ? l(
          `zuletzt ${last.bullish ? "bullisch" : "bärisch"} vor ${formatNumber(bars.length - 1 - last.confirmed, "de")} Kerzen`,
          `last ${last.bullish ? "bullish" : "bearish"} ${formatNumber(bars.length - 1 - last.confirmed, "en")} candles ago`
        ) : l("noch keine Divergenz", "no divergence yet")
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const n = inputs2.osc.length;
    const bull = new Array(n).fill(false);
    const bear = new Array(n).fill(false);
    for (const div2 of divergencesOf(inputs2, settings)) (div2.bullish ? bull : bear)[div2.confirmed] = true;
    return { bull, bear };
  },
  // Referenzwerte aus scripts/pine-reference.py; die Kursdaten haben keinen RSI, deshalb der Schlusskurs als Oszillator.
  tests: [
    {
      name: "regulär, Schlusskurs als Oszillator",
      fixture: FIXTURE,
      inputs: { osc: "close", high: "high", low: "low" },
      expectAt: { "189": { bull: false }, "190": { bull: true }, "247": { bull: true, bear: false } },
      expectLast: { bull: false, bear: false }
    },
    {
      name: "versteckt, 3 · 3, Abstand 3 bis 60",
      fixture: FIXTURE,
      inputs: { osc: "close", high: "high", low: "low" },
      settings: { kind: "hidden", left: 3, right: 3, minBars: 3, maxBars: 60 },
      expectAt: { "73": { bull: true }, "101": { bull: true }, "383": { bear: true }, "384": { bear: false } }
    }
  ]
});

// packages/nodes/src/indicators/donchian.ts
var PIN_SHORT2 = {
  upper: l("oberes Donchian-Band", "upper Donchian band"),
  middle: l("Donchian-Mitte", "Donchian middle"),
  lower: l("unteres Donchian-Band", "lower Donchian band")
};
var donchian = defineNode({
  id: "core.donchian",
  version: "1.0.0",
  category: "ind",
  label: l("Donchian-Kanal", "Donchian Channel"),
  description: l("Kanal aus höchstem Hoch und tiefstem Tief", "Channel of the highest high and lowest low"),
  help: l(
    "Zieht einen Kanal um die Kerzen: oben das höchste Hoch, unten das tiefste Tief der letzten Kerzen, in der Mitte der Wert dazwischen. Schließt der Kurs über dem Kanal, hat er ein neues Hoch für diesen Zeitraum, ein klassisches Ausbruch-Signal. Beispiel: „Kurs kreuzt oberes Donchian-Band nach oben“ mit 20 Kerzen meldet einen Ausbruch über das Hoch der letzten 20 Kerzen.",
    "Draws a channel around the candles: the highest high of the last candles at the top, the lowest low at the bottom and the value in between in the middle. When the price closes above the channel, it has made a new high for that period, a classic breakout signal. Example: “Price crosses above upper Donchian band” with 20 candles reports a breakout above the high of the last 20 candles."
  ),
  technical: l(
    "Oben höchstes Hoch, unten tiefstes Tief der Kerzen, Mitte (Oben + Unten) / 2; um eine Kerze versetzt, wenn die aktuelle nicht mitzählt. Mit „mitzählen“ dieselben Werte wie der eingebaute Indikator Donchian Channels in TradingView.",
    "Top the highest high, bottom the lowest low of the candles, middle (top + bottom) / 2; shifted by one candle when the current one is excluded. With “include” the same values as TradingView’s built-in Donchian Channels indicator."
  ),
  icon: "between-horizontal-end",
  keywords: {
    de: ["donchian", "kanal", "ausbruch", "turtle", "hoch", "tief", "volatilität"],
    en: ["donchian", "channel", "breakout", "turtle", "high", "low", "volatility"]
  },
  inputs: CANDLE_HL_INPUTS,
  outputs: [
    { id: "upper", type: "series", label: l("Oben", "Upper"), unit: "price" },
    { id: "middle", type: "series", label: l("Mitte", "Middle"), unit: "price" },
    { id: "lower", type: "series", label: l("Unten", "Lower"), unit: "price" }
  ],
  settings: {
    length: lengthSetting(
      20,
      2,
      500,
      l("Aus wie vielen Kerzen Hoch und Tief stammen. 20 ist üblich, für längere Ausbrüche auch 55.", "How many candles the high and low come from. 20 is usual, 55 for longer breakouts.")
    ),
    current: {
      type: "select",
      label: l("Aktuelle Kerze", "Current candle"),
      help: l(
        "Ob die gerade geschlossene Kerze mitzählt. Für Ausbruch-Alarme nicht mitzählen, sonst kann der Kurs nie über dem Kanal liegen.",
        "Whether the candle that just closed counts. For breakout alerts leave it out, otherwise the price can never be above the channel."
      ),
      default: "exclude",
      options: [
        { value: "exclude", label: l("nicht mitzählen", "exclude"), help: l("Hoch und Tief der Kerzen davor. Richtig für Ausbrüche.", "High and low of the candles before. Right for breakouts.") },
        {
          value: "include",
          label: l("mitzählen", "include"),
          help: l("Hoch und Tief einschließlich der aktuellen Kerze, so wie die meisten Charts den Kanal zeichnen.", "High and low including the current candle, the way most charts draw the channel.")
        }
      ],
      advanced: true
    }
  },
  sentence: ({ settings, locale }) => `${settings.length} ${locale === "de" ? "Kerzen" : "candles"}${settings.current === "include" ? locale === "de" ? " inkl. aktueller" : " incl. current" : ""}`,
  short: ({ pin, locale }) => (PIN_SHORT2[pin] ?? PIN_SHORT2.middle)[locale],
  warmup: ({ settings }) => settings.length + 1,
  compute({ inputs: inputs2, settings }) {
    let upper = series_exports.highest(inputs2.high, settings.length);
    let lower = series_exports.lowest(inputs2.low, settings.length);
    if (settings.current !== "include") {
      upper = series_exports.lag(upper, 1);
      lower = series_exports.lag(lower, 1);
    }
    return { upper, middle: series_exports.div(series_exports.add(upper, lower), 2), lower };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HL,
      settings: { length: 20 },
      expectAt: { "19": { upper: null }, "20": { upper: 84473.58, middle: 84155.79, lower: 83838 } },
      expectLast: { upper: 82940.81, middle: 81875.03, lower: 80809.25 }
    }
  ]
});

// packages/nodes/src/indicators/levels.ts
var NEAR_OUTPUT = { id: "near", type: "signal", label: l("nahe", "near") };
function levelSetting(options, standard) {
  return {
    type: "select",
    label: l("Level", "Level"),
    help: l(
      "Für welches Level der Ausgang „nahe“ gilt. Im Bild darüber wählst du es auch mit einem Klick auf seine Linie.",
      "Which level the “near” output refers to. In the chart above you can also pick it by clicking its line."
    ),
    default: standard,
    options
  };
}
var levelWidthSetting = {
  type: "number",
  label: l("Band ±", "Band ±"),
  help: l(
    "Wie nah eine Kerze dem Level kommen muss, in Prozent des Levels: „nahe“ ist wahr, sobald Hoch oder Tief der Kerze ins Band reichen. 0,3 heißt 0,3 % darüber und darunter, bei einem Level von 80.000 $ also 240 $. Mit 0 zählt nur eine Kerze, die das Level selbst berührt.",
    "How close a candle must come to the level, in percent of the level: “near” is true as soon as the candle’s high or low reaches into the band. 0.3 means 0.3 % above and below, so with a level of $80,000 that is $240. With 0 only a candle that touches the level itself counts."
  ),
  default: 0.3,
  min: 0,
  max: 10,
  step: 0.05,
  unit: l("%", "%")
};
function nearLevel(high, low, level, width) {
  const share = width / 100;
  return level.map((center, i) => {
    const h = high[i];
    const lo = low[i];
    if (center == null || h == null || lo == null) return false;
    const half = share * Math.abs(center);
    return lo <= center + half && h >= center - half;
  });
}
function nearText(level, width, locale) {
  return `${locale === "de" ? "nahe" : "near"} ${level} ±${formatNumber(width, locale)} %`;
}

// packages/nodes/src/indicators/swings.ts
var SWING_RIGHT_USED = l(
  "Wie viele Kerzen nach einem Hoch nicht höher steigen dürfen, bis es als Swing feststeht. Erst dann zählt es hier, so viele Kerzen später; mit weniger Kerzen zählt es früher, aber es zählen auch kleinere Wendepunkte.",
  "How many candles after a high must not rise above it before it counts as a swing. Only then does it count here, that many candles later; with fewer candles it counts sooner, but smaller turning points count too."
);
function swingSettings(standard, rightHelp) {
  return {
    left: lengthSetting(
      standard,
      1,
      100,
      l(
        "Wie viele Kerzen vor einem Hoch alle tiefer liegen müssen, bei einem Tief höher. Mit mehr Kerzen zählen nur deutlichere Wendepunkte.",
        "How many candles before a high must all be lower, before a low higher. With more candles only clearer turning points count."
      ),
      l("Kerzen davor", "Candles before")
    ),
    right: lengthSetting(
      standard,
      1,
      100,
      rightHelp ?? l(
        "Wie viele Kerzen nach einem Hoch nicht höher steigen dürfen, bis es als Swing feststeht. So viele Kerzen später meldet der Baustein ihn; mit weniger Kerzen kommt die Meldung früher, aber auch für kleinere Wendepunkte.",
        "How many candles after a high must not rise above it before it counts as a swing. The node reports it that many candles later; with fewer candles the report comes sooner, but also for smaller turning points."
      ),
      l("Kerzen danach", "Candles after")
    )
  };
}
var SWING_SETTINGS = swingSettings(5);
function swingSentence(settings, locale) {
  return locale === "de" ? `${settings.left} Kerzen davor · ${settings.right} danach` : `${settings.left} candles before · ${settings.right} after`;
}
var PIN_SHORT3 = {
  high: l("Swing-Hoch", "Swing high"),
  low: l("Swing-Tief", "Swing low"),
  newHigh: l("neues Swing-Hoch", "new swing high"),
  newLow: l("neues Swing-Tief", "new swing low")
};
var swings = defineNode({
  id: "core.swings",
  version: "1.0.0",
  category: "ind",
  label: l("Swing-Punkte", "Swing points"),
  description: l("Letzte bestätigte Hochs und Tiefs", "Last confirmed highs and lows"),
  help: l(
    "Findet Wendepunkte im Kurs: Ein Swing-Hoch liegt höher als die Kerzen davor und danach, ein Swing-Tief tiefer. Ob ein Hoch eines war, steht erst fest, wenn die Kerzen danach geschlossen sind. Deshalb meldet der Baustein es so viele Kerzen später und ändert es danach nicht mehr. Die Level bleiben stehen, bis ein neuer Swing kommt. Beispiel: „Kurs kreuzt Swing-Hoch nach oben“ meldet, wenn der Kurs über das letzte Hoch ausbricht.",
    "Finds turning points in the price: a swing high is higher than the candles before and after it, a swing low lower. Whether a high was one is only certain once the candles after it have closed. That is why the node reports it that many candles later and never changes it afterwards. The levels stay until a new swing comes. Example: “Price crosses above swing high” reports when the price breaks out above the last high."
  ),
  technical: l(
    "Swing-Hoch: ein Hoch, das höher ist als die Hochs der Kerzen davor und mindestens so hoch wie die der Kerzen danach, bei gleich hohen zählt also das erste. Gemeldet an der Kerze, mit der die Kerzen danach geschlossen sind, und als Level gehalten, bis ein neues kommt, höchstens 500 Kerzen nach dem Hoch. Swing-Tief entsprechend mit den Tiefs.",
    "Swing high: a high that is higher than the highs of the candles before and at least as high as those of the candles after, so with equal highs the first one counts. Reported on the candle with which the candles after have closed, and held as a level until a new one comes, at most 500 candles after the high. Swing low likewise with the lows."
  ),
  icon: "mountain",
  keywords: {
    de: ["swing", "wendepunkt", "hoch", "tief", "pivot", "struktur", "ausbruch", "unterstützung", "widerstand"],
    en: ["swing", "turning point", "high", "low", "pivot", "structure", "breakout", "support", "resistance"]
  },
  inputs: CANDLE_HL_INPUTS,
  outputs: [
    { id: "high", type: "series", label: l("Swing-Hoch", "Swing high"), unit: "price" },
    { id: "low", type: "series", label: l("Swing-Tief", "Swing low"), unit: "price" },
    { id: "newHigh", type: "signal", label: l("neues Swing-Hoch", "new swing high") },
    { id: "newLow", type: "signal", label: l("neues Swing-Tief", "new swing low") }
  ],
  settings: SWING_SETTINGS,
  sentence: ({ settings, locale }) => swingSentence(settings, locale),
  short: ({ settings, pin, locale }) => `${(PIN_SHORT3[pin] ?? PIN_SHORT3.high)[locale]} ${settings.left} · ${settings.right}`,
  // Ein Swing zählt 500 Kerzen; dafür braucht er die Kerzen davor und danach.
  warmup: ({ settings }) => series_exports.SWING_MAX_AGE + settings.left + settings.right,
  compute({ inputs: inputs2, settings }) {
    return series_exports.swingPoints(inputs2.high, inputs2.low, settings.left, settings.right);
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HL,
      settings: { left: 5, right: 5 },
      expectAt: {
        "13": { low: null, newLow: false },
        "14": { low: 83856.23, newLow: true },
        "37": { high: null },
        "38": { high: 85159.03, newHigh: true },
        "39": { newHigh: false }
      },
      expectLast: { high: 82940.81, low: 80809.25 }
    }
  ]
});

// packages/nodes/src/indicators/fibonacci.ts
var LEVELS = { f236: 0.236, f382: 0.382, f500: 0.5, f618: 0.618, f786: 0.786 };
var NEAR_LEVELS = {
  end: { label: l("0 %", "0 %"), help: l("Das Ende der Strecke, das letzte bestätigte Swing-Hoch oder -Tief.", "The end of the swing, the last confirmed swing high or low.") },
  f236: { label: l("23,6 %", "23.6 %"), help: l("Ein flacher Rücksetzer, typisch in einem starken Trend.", "A shallow pullback, typical in a strong trend.") },
  f382: { label: l("38,2 %", "38.2 %"), help: l("Ein üblicher Rücksetzer, nach dem viele Trends weiterlaufen.", "A common pullback after which many trends continue.") },
  f500: { label: l("50 %", "50 %"), help: l("Die Mitte der Strecke.", "The middle of the swing.") },
  f618: { label: l("61,8 %", "61.8 %"), help: l("Der goldene Schnitt, das meistbeachtete Level.", "The golden ratio, the most watched level.") },
  f786: { label: l("78,6 %", "78.6 %"), help: l("Ein tiefer Rücksetzer nahe am Anfang der Strecke.", "A deep pullback close to the start of the swing.") },
  start: { label: l("100 %", "100 %"), help: l("Der Anfang der Strecke, das Swing-Tief oder -Hoch davor.", "The start of the swing, the swing low or high before it.") }
};
var PIN_SHORT4 = {
  end: l("Fib 0 %", "Fib 0 %"),
  f236: l("Fib 23,6 %", "Fib 23.6 %"),
  f382: l("Fib 38,2 %", "Fib 38.2 %"),
  f500: l("Fib 50 %", "Fib 50 %"),
  f618: l("Fib 61,8 %", "Fib 61.8 %"),
  f786: l("Fib 78,6 %", "Fib 78.6 %"),
  start: l("Fib 100 %", "Fib 100 %"),
  up: l("Fib-Strecke aufwärts", "Fib swing up")
};
var fibonacci = defineNode({
  id: "core.fibonacci",
  version: "1.0.0",
  category: "ind",
  label: l("Fibonacci-Level", "Fibonacci levels"),
  description: l("Retracements der letzten Swing-Strecke", "Retracements of the last swing"),
  help: l(
    "Legt die Fibonacci-Level 23,6 %, 38,2 %, 50 %, 61,8 % und 78,6 % zwischen Anfang und Ende der letzten Bewegung von einem Swing-Tief zu einem Swing-Hoch oder umgekehrt. 0 % liegt am Ende der Bewegung, 100 % an ihrem Anfang. Die Level ändern sich erst, wenn ein neuer Swing bestätigt ist, wie beim Baustein Swing-Punkte. Der Ausgang „nahe“ meldet, wenn eine Kerze einem gewählten Level bis auf ±x % nahekommt. Beispiel: „Kurs kreuzt Fib 61,8 % nach unten“ meldet, wenn ein Rücksetzer nach einem Anstieg das 61,8-%-Level erreicht; „nahe 61,8 % ±0,3 %“ schon, wenn er bis auf 0,3 % herankommt.",
    "Places the Fibonacci levels 23.6 %, 38.2 %, 50 %, 61.8 % and 78.6 % between the start and end of the last move from a swing low to a swing high or the other way round. 0 % is at the end of the move, 100 % at its start. The levels only change once a new swing is confirmed, as with the Swing points node. The “near” output reports when a candle comes within ±x % of a chosen level. Example: “Price crosses below Fib 61.8 %” reports when a pullback after a rise reaches the 61.8 % level; “near 61.8 % ±0.3 %” already when it gets within 0.3 %."
  ),
  technical: l(
    "Strecke aus den zwei letzten Punkten einer Zickzack-Linie durch die bestätigten Swing-Hochs und -Tiefs der letzten 500 Kerzen, Swings wie im Baustein Swing-Punkte; folgen zwei Hochs ohne Tief dazwischen, zählt das höhere, bei Tiefs das tiefere. Level = Ende − Anteil × (Ende − Anfang). „nahe“: Tief ≤ Level × (1 + x / 100) und Hoch ≥ Level × (1 − x / 100).",
    "Swing from the last two points of a zigzag line through the confirmed swing highs and lows of the last 500 candles, swings as in the Swing points node; if two highs follow without a low in between, the higher one counts, for lows the lower one. Level = end − ratio × (end − start). “near”: low ≤ level × (1 + x / 100) and high ≥ level × (1 − x / 100)."
  ),
  icon: "ratio",
  keywords: {
    de: ["fibonacci", "fib", "retracement", "rücksetzer", "level", "swing", "goldener schnitt", "61,8"],
    en: ["fibonacci", "fib", "retracement", "pullback", "level", "swing", "golden ratio", "61.8"]
  },
  inputs: CANDLE_HL_INPUTS,
  outputs: [
    { id: "end", type: "series", label: l("0 % · Ende", "0 % · end"), unit: "price" },
    { id: "f236", type: "series", label: l("23,6 %", "23.6 %"), unit: "price" },
    { id: "f382", type: "series", label: l("38,2 %", "38.2 %"), unit: "price" },
    { id: "f500", type: "series", label: l("50 %", "50 %"), unit: "price" },
    { id: "f618", type: "series", label: l("61,8 %", "61.8 %"), unit: "price" },
    { id: "f786", type: "series", label: l("78,6 %", "78.6 %"), unit: "price" },
    { id: "start", type: "series", label: l("100 % · Anfang", "100 % · start"), unit: "price" },
    { id: "up", type: "signal", label: l("aufwärts", "up") },
    NEAR_OUTPUT
  ],
  settings: {
    ...swingSettings(10),
    level: levelSetting(
      Object.keys(NEAR_LEVELS).map((value) => ({ value, label: NEAR_LEVELS[value].label, help: NEAR_LEVELS[value].help })),
      "f618"
    ),
    width: levelWidthSetting
  },
  sentence: ({ settings, locale, output }) => swingSentence(settings, locale) + (output?.("near") ? ` · ${nearText(NEAR_LEVELS[settings.level].label[locale], settings.width, locale)}` : ""),
  short: ({ settings, pin, locale }) => pin === "near" ? nearText(PIN_SHORT4[settings.level][locale], settings.width, locale) : (PIN_SHORT4[pin] ?? PIN_SHORT4.f618)[locale],
  warmup: ({ settings }) => series_exports.SWING_MAX_AGE + settings.left + settings.right,
  compute({ inputs: inputs2, settings }) {
    const leg = series_exports.swingLeg(inputs2.high, inputs2.low, settings.left, settings.right);
    const range2 = series_exports.sub(leg.end, leg.start);
    const level = (ratio) => series_exports.sub(leg.end, series_exports.mul(range2, ratio));
    const levels = {
      end: leg.end,
      f236: level(LEVELS.f236),
      f382: level(LEVELS.f382),
      f500: level(LEVELS.f500),
      f618: level(LEVELS.f618),
      f786: level(LEVELS.f786),
      start: leg.start
    };
    return { ...levels, up: leg.up, near: nearLevel(inputs2.high, inputs2.low, levels[settings.level], settings.width) };
  },
  visual: { kind: "levels", high: { input: "high" }, low: { input: "low" }, levels: Object.keys(NEAR_LEVELS), level: "level", width: "width", signal: "near" },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "Standard, Swings 10 · 10",
      fixture: FIXTURE,
      inputs: CANDLE_HL,
      expectAt: { "42": { end: null }, "43": { start: 83838, end: 85159.03, f618: 84342.63346, up: true } },
      expectLast: { start: 81688, end: 82940.81, f618: 82166.57342, up: true }
    },
    {
      name: "Swings 5 · 5",
      fixture: FIXTURE,
      inputs: CANDLE_HL,
      settings: { left: 5, right: 5 },
      expectAt: {
        "37": { end: null, f618: null, up: false },
        "38": { start: 83838, end: 85159.03, f236: 84847.26692, f382: 84654.39654, f500: 84498.515, f618: 84342.63346, f786: 84120.70042, up: true }
      },
      expectLast: { start: 82940.81, end: 80809.25, f618: 82126.55408, up: false }
    }
  ]
});

// packages/nodes/src/indicators/heikin-ashi.ts
var WARMUP = 50;
var PIN_SHORT5 = {
  close: l("HA-Schluss", "HA close"),
  open: l("HA-Eröffnung", "HA open"),
  high: l("HA-Hoch", "HA high"),
  low: l("HA-Tief", "HA low"),
  green: l("Heikin Ashi grün", "Heikin Ashi green"),
  red: l("Heikin Ashi rot", "Heikin Ashi red"),
  up: l("Heikin Ashi dreht nach oben", "Heikin Ashi turns up"),
  down: l("Heikin Ashi dreht nach unten", "Heikin Ashi turns down")
};
function colors(ha) {
  return ha.close.map((close, i) => {
    const open = ha.open[i];
    if (close == null || open == null || close === open) return 0;
    return close > open ? 1 : -1;
  });
}
function turns(color) {
  const up = new Array(color.length).fill(false);
  const down = new Array(color.length).fill(false);
  let last = 0;
  color.forEach((c, i) => {
    if (c === 0) return;
    if (c === 1 && last === -1) up[i] = true;
    if (c === -1 && last === 1) down[i] = true;
    last = c;
  });
  return { up, down };
}
function heikinAshiOf(inputs2) {
  return series_exports.heikinAshi(inputs2.open, inputs2.high, inputs2.low, inputs2.close);
}
function colorSpans(color) {
  const spans = [];
  let start = -1;
  for (let i = 0; i <= color.length; i++) {
    const c = color[i] ?? 0;
    const previous = start >= 0 ? color[start] ?? 0 : 0;
    if (start >= 0 && c !== previous) {
      spans.push({ from: start, to: i - 1, tone: previous === 1 ? "up" : "down" });
      start = -1;
    }
    if (start < 0 && c !== 0) start = i;
  }
  return spans;
}
var heikinAshi2 = defineNode({
  id: "core.heikin-ashi",
  version: "1.0.0",
  category: "ind",
  label: l("Heikin Ashi", "Heikin Ashi"),
  description: l("Geglättete Kerzen, Farbwechsel als Wende", "Smoothed candles, a color change as a turn"),
  help: l(
    "Rechnet aus jeder Kerze eine geglättete Heikin-Ashi-Kerze: Ihr Schluss ist der Mittelwert aus Eröffnung, Hoch, Tief und Schluss, ihre Eröffnung die Mitte der Heikin-Ashi-Kerze davor. In einem Trend bleiben die Kerzen so lange grün oder rot, einzelne Gegenkerzen fallen weniger ins Gewicht. „Dreht nach oben“ ist wahr an der ersten grünen Kerze nach einer roten, „dreht nach unten“ umgekehrt. Die Werte sind Mittelwerte, keine gehandelten Kurse; für Level und Stopps nimm die Kerze selbst. Beispiel: Heikin Ashi dreht nach oben auf 4-Stunden-Kerzen meldet, wenn nach einer Reihe roter Kerzen die erste grüne kommt.",
    "Turns every candle into a smoothed Heikin Ashi candle: its close is the average of open, high, low and close, its open the middle of the Heikin Ashi candle before. In a trend the candles stay green or red for longer, single counter-candles weigh less. “Turns up” is true on the first green candle after a red one, “turns down” the other way round. The values are averages, not traded prices; for levels and stops use the candle itself. Example: Heikin Ashi turns up on 4-hour candles reports when the first green candle follows a series of red ones."
  ),
  technical: l(
    "HA-Schluss = (Eröffnung + Hoch + Tief + Schluss) / 4; HA-Eröffnung = (HA-Eröffnung + HA-Schluss der Kerze davor) / 2, an der ersten Kerze (Eröffnung + Schluss) / 2; HA-Hoch und HA-Tief schließen HA-Eröffnung und HA-Schluss ein. Grün: HA-Schluss über HA-Eröffnung, rot darunter; Kerzen ohne Körper haben keine Farbe und ändern die Wende nicht. Der Anfang wirkt nach 50 Kerzen nicht mehr nach. Dieselbe Rechnung wie die Heikin-Ashi-Kerzen in TradingView.",
    "HA close = (open + high + low + close) / 4; HA open = (HA open + HA close of the candle before) / 2, on the first candle (open + close) / 2; HA high and HA low include HA open and HA close. Green: HA close above HA open, red below; candles without a body have no color and do not change the turn. The start no longer has an effect after 50 candles. The same calculation as the Heikin Ashi candles in TradingView."
  ),
  icon: "blend",
  keywords: {
    de: ["heikin ashi", "heikin-ashi", "ha", "kerzen", "geglättet", "trend", "wende", "farbwechsel"],
    en: ["heikin ashi", "heikin-ashi", "ha", "candles", "smoothed", "trend", "reversal", "color change"]
  },
  inputs: CANDLE_BODY_INPUTS,
  outputs: [
    { id: "close", type: "series", label: l("HA-Schluss", "HA close"), unit: "price" },
    { id: "open", type: "series", label: l("HA-Eröffnung", "HA open"), unit: "price" },
    { id: "high", type: "series", label: l("HA-Hoch", "HA high"), unit: "price" },
    { id: "low", type: "series", label: l("HA-Tief", "HA low"), unit: "price" },
    { id: "green", type: "signal", label: l("grün", "green") },
    { id: "red", type: "signal", label: l("rot", "red") },
    { id: "up", type: "signal", label: l("dreht nach oben", "turns up") },
    { id: "down", type: "signal", label: l("dreht nach unten", "turns down") }
  ],
  settings: {},
  sentence: ({ locale }) => locale === "de" ? "geglättete Kerzen" : "smoothed candles",
  short: ({ pin, locale }) => (PIN_SHORT5[pin] ?? PIN_SHORT5["close"] ?? l("HA", "HA"))[locale],
  warmup: () => WARMUP,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    // Die Wenden stehen als Marken im Bild; Punkte für die Signale zeigten dieselben Kerzen noch einmal.
    draw({ inputs: inputs2 }) {
      const ha = heikinAshiOf(inputs2);
      const color = colors(ha);
      const { up, down } = turns(color);
      const marks = [];
      up.forEach((on, i) => {
        if (on) marks.push({ at: i, value: ha.low[i] ?? 0, tone: "up", side: "below" });
      });
      down.forEach((on, i) => {
        if (on) marks.push({ at: i, value: ha.high[i] ?? 0, tone: "down", side: "above" });
      });
      const last = color.at(-1) ?? 0;
      let run = 0;
      for (let i = color.length - 1; i >= 0 && (color[i] === last || color[i] === 0); i--) if (color[i] === last) run++;
      return {
        legend: [
          { kind: "line", tone: "neutral", label: l("HA-Schluss", "HA close") },
          { kind: "mark", tone: "up", label: l("dreht nach oben", "turns up") },
          { kind: "mark", tone: "down", label: l("dreht nach unten", "turns down") },
          { kind: "span", tone: "up", label: l("Farbe der Heikin-Ashi-Kerze", "Color of the Heikin Ashi candle") }
        ],
        paths: [{ upper: ha.close, tone: "neutral", label: l("HA-Schluss", "HA close") }],
        marks,
        spans: colorSpans(color),
        note: last === 0 ? l("noch keine Farbe", "no color yet") : l(`${last === 1 ? "grün" : "rot"} seit ${run} ${run === 1 ? "Kerze" : "Kerzen"}`, `${last === 1 ? "green" : "red"} for ${run} ${run === 1 ? "candle" : "candles"}`)
      };
    }
  },
  compute({ inputs: inputs2 }) {
    const ha = heikinAshiOf(inputs2);
    const color = colors(ha);
    return {
      close: ha.close,
      open: ha.open,
      high: ha.high,
      low: ha.low,
      green: color.map((c) => c === 1),
      red: color.map((c) => c === -1),
      ...turns(color)
    };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_OHLC,
      expectAt: {
        "0": { open: 83957.505, close: 83952.3925, high: 84045.65, low: 83848.91, red: true, up: false },
        "3": { green: true, up: true },
        "8": { red: true, down: true },
        "250": { open: 86207.09291772565, close: 86374.0275 }
      },
      expectLast: { open: 81670.98897734618, close: 81699.5075, high: 81814.68, low: 81586.53 },
      tolerance: 1e-6
    }
  ]
});

// packages/nodes/src/indicators/highlow.ts
function periodStart(ms, period, timeZone) {
  const p = zonedParts(ms, timeZone);
  let date = Date.UTC(p.year, p.month - 1, p.day);
  if (period === "prevWeek") date -= (weekdayOf(p.year, p.month, p.day) + 6) % 7 * DAY;
  const d = new Date(date);
  return zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 0, 0, timeZone);
}
function previousPeriod(source, bars, period, timeZone) {
  const high = new Array(bars.length).fill(null);
  const low = new Array(bars.length).fill(null);
  const stats = /* @__PURE__ */ new Map();
  const starts = [];
  for (let i = 0; i < bars.length; i++) {
    const open = bars.openTime[i] ?? 0;
    const start = periodStart(open, period, timeZone);
    starts.push(start);
    let entry = stats.get(start);
    if (!entry) {
      entry = { high: Number.NEGATIVE_INFINITY, low: Number.POSITIVE_INFINITY, complete: i > 0 || open === start };
      stats.set(start, entry);
    }
    const v = source[i];
    if (v != null) {
      entry.high = Math.max(entry.high, v);
      entry.low = Math.min(entry.low, v);
    }
  }
  const previousStart = /* @__PURE__ */ new Map();
  for (let i = 0; i < bars.length; i++) {
    const start = starts[i] ?? 0;
    let before = previousStart.get(start);
    if (before === void 0) {
      before = periodStart(start - 1, period, timeZone);
      previousStart.set(start, before);
    }
    const previous = stats.get(before);
    if (previous && previous.complete && Number.isFinite(previous.high)) {
      high[i] = previous.high;
      low[i] = previous.low;
    }
  }
  return { high, low };
}
var SHORT2 = {
  prevDay: { high: l("Vortageshoch", "previous day high"), low: l("Vortagestief", "previous day low") },
  prevWeek: { high: l("Vorwochenhoch", "previous week high"), low: l("Vorwochentief", "previous week low") }
};
var highLow = defineNode({
  id: "core.highlow",
  version: "1.0.0",
  category: "ind",
  label: l("Hoch/Tief", "High/Low"),
  description: l("Hoch und Tief eines Zeitraums", "High and low of a period"),
  help: l(
    "Liefert den höchsten und den tiefsten Kurs der letzten Kerzen, des Vortags oder der Vorwoche. Damit baust du Ausbruch-Alarme. Beispiel: „Kurs kreuzt Hoch 20 nach oben“ meldet sich, sobald der Kurs über das Hoch der letzten 20 Kerzen steigt.",
    "Gives the highest and the lowest price of the last candles, the previous day or the previous week. Use it for breakout alerts. Example: “Price crosses above 20-candle high” fires as soon as the price rises above the high of the last 20 candles."
  ),
  technical: l(
    "Bei „letzte Kerzen“ höchster und tiefster Wert über N Kerzen, um eine Kerze versetzt, wenn die aktuelle nicht mitzählt; dieselbe Rechnung wie ta.highest und ta.lowest in TradingView.",
    "For “last candles” the highest and lowest value over N candles, shifted by one candle when the current one is excluded; the same calculation as ta.highest and ta.lowest in TradingView."
  ),
  icon: "arrow-up-to-line",
  keywords: { de: ["hoch", "tief", "ausbruch", "level", "widerstand", "unterstützung"], en: ["high", "low", "breakout", "level", "resistance", "support"] },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "high", type: "series", label: l("Hoch", "High"), unit: "input" },
    { id: "low", type: "series", label: l("Tief", "Low"), unit: "input" }
  ],
  settings: {
    mode: {
      type: "select",
      label: l("Zeitraum", "Period"),
      help: l("Aus welchem Zeitraum Hoch und Tief stammen.", "Which period the high and low come from."),
      default: "bars",
      options: [
        {
          value: "bars",
          label: l("letzte Kerzen", "last candles"),
          help: l("Hoch und Tief der letzten Kerzen, Anzahl unter „Kerzen“. Wandert mit jeder neuen Kerze weiter.", "High and low of the last candles; set the number under “Candles”. Moves on with every new candle.")
        },
        {
          value: "prevDay",
          label: l("Vortag", "previous day"),
          help: l("Hoch und Tief des ganzen gestrigen Tages in deiner Zeitzone. Bleibt bis Mitternacht gleich.", "High and low of the whole previous day in your time zone. Stays the same until midnight.")
        },
        {
          value: "prevWeek",
          label: l("Vorwoche", "previous week"),
          help: l("Hoch und Tief der letzten Kalenderwoche, Montag bis Sonntag. Bleibt die ganze Woche gleich.", "High and low of the last calendar week, Monday to Sunday. Stays the same all week.")
        }
      ]
    },
    length: lengthSetting(
      20,
      2,
      500,
      l("Wie viele Kerzen zurück, nur bei „letzte Kerzen“. 20 ist üblich; mit 1-Stunden-Kerzen ist das knapp ein Tag.", "How many candles back, only for “last candles”. 20 is usual; with 1-hour candles that is almost a day.")
    ),
    current: {
      type: "select",
      label: l("Aktuelle Kerze", "Current candle"),
      help: l(
        "Ob die gerade geschlossene Kerze mitzählt. Für Ausbruch-Alarme nicht mitzählen, sonst kann der Kurs nie über dem Hoch liegen.",
        "Whether the candle that just closed counts. For breakout alerts leave it out, otherwise the price can never be above the high."
      ),
      default: "exclude",
      options: [
        { value: "exclude", label: l("nicht mitzählen", "exclude"), help: l("Hoch und Tief der Kerzen davor. Richtig für Ausbrüche.", "High and low of the candles before. Right for breakouts.") },
        { value: "include", label: l("mitzählen", "include"), help: l("Hoch und Tief einschließlich der aktuellen Kerze, etwa um die Spanne bis jetzt zu zeigen.", "High and low including the current candle, for example to show the range up to now.") }
      ],
      advanced: true
    },
    timezone: timezoneSetting
  },
  sentence: ({ settings, locale }) => {
    if (settings.mode === "prevDay") return locale === "de" ? "Vortag" : "previous day";
    if (settings.mode === "prevWeek") return locale === "de" ? "Vorwoche" : "previous week";
    const extra = settings.current === "include" ? locale === "de" ? " inkl. aktueller" : " incl. current" : "";
    return (locale === "de" ? `letzte ${settings.length} Kerzen` : `last ${settings.length} candles`) + extra;
  },
  short: ({ settings, pin, locale }) => {
    const side = pin === "low" ? "low" : "high";
    if (settings.mode !== "bars") return SHORT2[settings.mode][side][locale];
    if (locale === "de") return `${side === "high" ? "Hoch" : "Tief"} ${settings.length}`;
    return `${settings.length}-candle ${side}`;
  },
  warmup: ({ settings, timeframe }) => {
    if (settings.mode === "prevDay") return Math.ceil(2 * DAY / timeframeMs(timeframe));
    if (settings.mode === "prevWeek") return Math.ceil(14 * DAY / timeframeMs(timeframe));
    return settings.length + 1;
  },
  compute({ inputs: inputs2, settings, bars }) {
    if (settings.mode !== "bars") return previousPeriod(inputs2.in, bars, settings.mode, settings.timezone);
    const high = series_exports.highest(inputs2.in, settings.length);
    const low = series_exports.lowest(inputs2.in, settings.length);
    if (settings.current === "include") return { high, low };
    return { high: series_exports.lag(high, 1), low: series_exports.lag(low, 1) };
  },
  tests: [
    {
      name: "letzte 20 Kerzen ohne aktuelle",
      fixture: FIXTURE,
      settings: { mode: "bars", length: 20 },
      expectAt: { "19": { high: null }, "20": { high: 84433.1 } },
      expectLast: { high: 82640.73, low: 81145.73 }
    },
    {
      name: "Hoch der letzten 20 Kerzen inklusive aktueller",
      fixture: FIXTURE,
      inputs: { in: "high" },
      settings: { mode: "bars", length: 20, current: "include" },
      expectLast: { high: 82940.81 }
    }
  ]
});

// packages/nodes/src/indicators/limits.ts
function limitSignals(values, low, high) {
  return {
    low: values.map((value) => value !== null && value < low),
    high: values.map((value) => value !== null && value > high)
  };
}
function limitText(value, unit, locale) {
  return `${formatNumber(value, locale)}${unit}`;
}
function limitSentence(settings, output, unit, locale) {
  const low = output?.("low") === true;
  const high = output?.("high") === true;
  if (low && high) return ` · ${formatNumber(settings.low, locale)}/${limitText(settings.high, unit, locale)}`;
  if (low) return ` · ${locale === "de" ? "unter" : "below"} ${limitText(settings.low, unit, locale)}`;
  if (high) return ` · ${locale === "de" ? "über" : "above"} ${limitText(settings.high, unit, locale)}`;
  return "";
}
function limitShort(name4, pin, settings, unit, locale) {
  if (pin === "low") return `${name4} ${locale === "de" ? "unter" : "below"} ${limitText(settings.low, unit, locale)}`;
  return `${name4} ${locale === "de" ? "über" : "above"} ${limitText(settings.high, unit, locale)}`;
}

// packages/nodes/src/indicators/hv.ts
function barsPerYear(timeframe) {
  return timeframe === "1M" ? 12 : 365 * DAY / timeframeMs(timeframe);
}
var historicalVolatility2 = defineNode({
  id: "core.hv",
  version: "1.0.0",
  category: "ind",
  label: l("Historische Volatilität", "Historical volatility"),
  description: l("Schwankung des Kurses als Jahreswert", "How much the price swings, per year"),
  help: l(
    "Misst, wie stark der Kurs in den letzten Kerzen geschwankt hat, und rechnet das auf ein Jahr hoch, wie man es von Optionen kennt. 50 % heißt: Die Schwankung der letzten Kerzen entspricht über ein Jahr gerechnet etwa ±50 %. Weil Bellchain mit der Zeiteinheit hochrechnet, liegen Werte aus Stunden- und Tageskerzen in derselben Größenordnung. Unter „ruhig“ ist der Markt still, oft vor einer größeren Bewegung; über „unruhig“ schwankt er stark, etwa in einem Abverkauf. Beispiel: HV 20 auf Tageskerzen über 80 % meldet eine Phase, in der BTC ungewöhnlich stark schwankt.",
    "Measures how much the price has swung over the last candles and scales that to a year, the way options traders quote it. 50 % means the swings of the last candles amount to roughly ±50 % over a year. Because Bellchain scales by the timeframe, values from hourly and daily candles are of the same order. Below “calm” the market is quiet, often before a bigger move; above “volatile” it swings hard, for example in a sell-off. Example: HV 20 on daily candles above 80 % reports a phase in which BTC swings unusually hard."
  ),
  technical: l(
    "Standardabweichung der logarithmischen Renditen ln(Schluss / Schluss davor) über die eingestellten Kerzen (Grundgesamtheit), mal √(Kerzen je Jahr) mal 100. Kerzen je Jahr bei Handel rund um die Uhr: 365 Tage geteilt durch die Zeiteinheit, bei 1 Monat 12. Auf Tages- und Wochenkerzen dieselben Werte wie der Indikator Historical Volatility in TradingView.",
    "Standard deviation of the logarithmic returns ln(close / previous close) over the chosen candles (population), times √(candles per year) times 100. Candles per year for round-the-clock trading: 365 days divided by the timeframe, 12 for 1 month. On daily and weekly candles the same values as the Historical Volatility indicator in TradingView."
  ),
  icon: "waves",
  keywords: {
    de: ["volatilität", "schwankung", "hv", "realisierte volatilität", "ruhig", "unruhig", "risiko"],
    en: ["volatility", "historical volatility", "hv", "realized volatility", "calm", "volatile", "risk"]
  },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "out", type: "series", label: l("HV", "HV"), unit: "percent" },
    { id: "low", type: "signal", label: l("ruhig", "calm") },
    { id: "high", type: "signal", label: l("unruhig", "volatile") }
  ],
  settings: {
    length: lengthSetting(
      20,
      2,
      500,
      l(
        "Über wie viele Kerzen die Schwankung zählt. 20 ist üblich, auf Tageskerzen also gut drei Wochen. Weniger Kerzen reagieren schneller auf einzelne große Kerzen, mehr Kerzen zeigen die ruhigere Grundschwankung.",
        "How many candles the swings are measured over. 20 is usual, on daily candles about three weeks. Fewer candles react faster to single big candles, more candles show the calmer underlying swing."
      )
    ),
    low: {
      type: "number",
      label: l("Ruhig unter", "Calm below"),
      help: l(
        "Unter dieser Linie gilt der Markt als ruhig, und der Ausgang „ruhig“ ist wahr. Bei BTC auf Tageskerzen sind 30 % eher still; Altcoins schwanken meist stärker.",
        "Below this line the market counts as calm, and the “calm” output is true. For BTC on daily candles 30 % is rather quiet; altcoins usually swing more."
      ),
      default: 30,
      min: 0,
      max: 500,
      step: 1,
      unit: l("%", "%")
    },
    high: {
      type: "number",
      label: l("Unruhig über", "Volatile above"),
      help: l(
        "Über dieser Linie gilt der Markt als unruhig, und der Ausgang „unruhig“ ist wahr. Bei BTC auf Tageskerzen sind 80 % schon viel.",
        "Above this line the market counts as volatile, and the “volatile” output is true. For BTC on daily candles 80 % is already a lot."
      ),
      default: 80,
      min: 0,
      max: 500,
      step: 1,
      unit: l("%", "%")
    }
  },
  sentence: ({ settings, locale, output }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + limitSentence(settings, output, " %", locale),
  short: ({ settings, pin, locale }) => pin === "out" ? `HV ${settings.length}` : limitShort(`HV ${settings.length}`, pin, settings, " %", locale),
  warmup: ({ settings }) => settings.length + 1,
  visual: { kind: "zone", series: { output: "out" }, low: "low", high: "high", price: { input: "in" }, signal: ["low", "high"] },
  compute({ inputs: inputs2, settings, bars }) {
    const out = series_exports.historicalVolatility(inputs2.in, settings.length, barsPerYear(bars.timeframe));
    return { out, ...limitSignals(out, settings.low, settings.high) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung); Stundenkerzen, also 8.760 Kerzen je Jahr.
  tests: [
    {
      fixture: FIXTURE,
      settings: { length: 20 },
      expectAt: { "19": { out: null }, "20": { out: 12.888039788928422 }, "250": { out: 18.567564288174175 } },
      expectLast: { out: 29.39922718413788 },
      tolerance: 1e-9
    },
    {
      name: "Schwellen 15 und 40",
      fixture: FIXTURE,
      settings: { length: 20, low: 15, high: 40 },
      expectAt: { "103": { high: false }, "104": { high: true }, "123": { high: true }, "124": { high: false } }
    }
  ]
});

// packages/nodes/src/indicators/ichimoku.ts
var PIN_SHORT6 = {
  conversion: l("Umwandlungslinie", "conversion line"),
  base: l("Basislinie", "base line"),
  spanA: l("Wolke Span A", "cloud span A"),
  spanB: l("Wolke Span B", "cloud span B"),
  above: l("über der Wolke", "above the cloud"),
  below: l("unter der Wolke", "below the cloud")
};
function midpoint(high, low, length) {
  return series_exports.mul(series_exports.add(series_exports.highest(high, length), series_exports.lowest(low, length)), 0.5);
}
var ichimoku = defineNode({
  id: "core.ichimoku",
  version: "1.0.0",
  category: "ind",
  label: l("Ichimoku", "Ichimoku"),
  description: l("Zeigt mit der Wolke, wohin der Trend geht", "Shows with a cloud where the trend goes"),
  help: l(
    "Fasst den Trend in Linien aus Hoch und Tief der letzten Kerzen zusammen. Die Umwandlungslinie zeigt den kurzen Trend, die Basislinie den mittleren. Span A und Span B bilden die Wolke: Liegt der Kurs darüber, zeigt der Trend nach oben, darunter nach unten, in der Wolke ist er unentschieden. Im Chart wird die Wolke nach vorn verschoben gezeichnet; dieser Baustein liefert sie an der aktuellen Kerze, also so, wie sie im Chart über ihr liegt. Beispiel: „Umwandlungslinie kreuzt Basislinie nach oben“ zusammen mit „über der Wolke“ meldet das klassische Signal für einen Aufwärtstrend. Die nachlaufende Linie gibt es nicht als Ausgang, weil sie in die Vergangenheit verschoben gezeichnet wird. Ihre Regel „Kurs über dem Kurs vor 25 Kerzen“ (so weit verschiebt der Chart sie bei Verschiebung 26) baust du mit dem Baustein Veränderung %: 25 Kerzen zurück, über 0.",
    "Sums up the trend in lines made from the high and low of the last candles. The conversion line shows the short-term trend, the base line the medium-term one. Span A and span B form the cloud: when the price is above it, the trend points up, below it down, inside the cloud it is undecided. Charts draw the cloud shifted forward; this node gives it at the current candle, the way it sits above that candle on the chart. Example: “Conversion line crosses above base line” together with “above the cloud” reports the classic signal for an uptrend. The lagging line is not an output, because it is drawn shifted into the past. Its rule “price above the price 25 candles ago” (the chart shifts it that far with displacement 26) is built with the Change % node: 25 candles back, above 0."
  ),
  technical: l(
    "Umwandlungs- und Basislinie als Mitte aus höchstem Hoch und tiefstem Tief über 9 und 26 Kerzen, Span A als Mittel der beiden, Span B als Mitte über 52 Kerzen, beide um Verschiebung − 1 Kerzen verzögert, damit sie an der aktuellen Kerze stehen; dieselben Werte wie der eingebaute Indikator Ichimoku Cloud von TradingView, der die Wolke um diese Kerzen nach vorn zeichnet.",
    "Conversion and base line as the midpoint of the highest high and lowest low over 9 and 26 candles, span A as the mean of both, span B as the midpoint over 52 candles, both delayed by displacement − 1 candles so they sit at the current candle; the same values as TradingView’s built-in Ichimoku Cloud indicator, which draws the cloud that many candles ahead."
  ),
  icon: "cloud",
  keywords: {
    de: ["ichimoku", "wolke", "kumo", "tenkan", "kijun", "trend"],
    en: ["ichimoku", "cloud", "kumo", "tenkan", "kijun", "trend"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "conversion", type: "series", label: l("Umwandlungslinie", "Conversion line"), unit: "price" },
    { id: "base", type: "series", label: l("Basislinie", "Base line"), unit: "price" },
    { id: "spanA", type: "series", label: l("Span A", "Span A"), unit: "price" },
    { id: "spanB", type: "series", label: l("Span B", "Span B"), unit: "price" },
    { id: "above", type: "signal", label: l("über der Wolke", "above cloud") },
    { id: "below", type: "signal", label: l("unter der Wolke", "below cloud") }
  ],
  settings: {
    conversion: lengthSetting(
      9,
      1,
      500,
      l("Über wie viele Kerzen die Umwandlungslinie Hoch und Tief nimmt. Üblich sind 9.", "How many candles the conversion line takes the high and low from. Usually 9."),
      l("Umwandlungslinie", "Conversion line")
    ),
    base: lengthSetting(
      26,
      1,
      500,
      l("Über wie viele Kerzen die Basislinie Hoch und Tief nimmt. Üblich sind 26.", "How many candles the base line takes the high and low from. Usually 26."),
      l("Basislinie", "Base line")
    ),
    spanB: lengthSetting(
      52,
      1,
      500,
      l("Über wie viele Kerzen Span B rechnet, die langsame Grenze der Wolke. Üblich sind 52.", "How many candles span B covers, the slow edge of the cloud. Usually 52."),
      l("Span B", "Span B")
    ),
    displacement: lengthSetting(
      26,
      1,
      500,
      l(
        "Um wie viele Kerzen die Wolke nach vorn verschoben ist, üblich sind 26. Gezählt wird ab der aktuellen Kerze, die Wolke an einer Kerze stammt bei 26 also aus den Werten von vor 25 Kerzen. Die Standardwerte 9, 26, 52 und 26 nutzen fast alle; ändern musst du sie selten.",
        "How many candles the cloud is shifted forward, usually 26. The count starts at the current candle, so with 26 the cloud at a candle comes from the values 25 candles earlier. Almost everyone uses the defaults 9, 26, 52 and 26; you rarely need to change them."
      ),
      l("Verschiebung", "Displacement")
    )
  },
  sentence: ({ settings }) => `${settings.conversion} · ${settings.base} · ${settings.spanB} · ${settings.displacement}`,
  short: ({ pin, locale }) => (PIN_SHORT6[pin] ?? PIN_SHORT6.conversion)[locale],
  warmup: ({ settings }) => Math.max(settings.conversion, settings.base, settings.spanB) + settings.displacement - 1,
  compute({ inputs: inputs2, settings }) {
    const conversion = midpoint(inputs2.high, inputs2.low, settings.conversion);
    const base = midpoint(inputs2.high, inputs2.low, settings.base);
    const shift = settings.displacement - 1;
    const spanA = series_exports.lag(series_exports.mul(series_exports.add(conversion, base), 0.5), shift);
    const spanB = series_exports.lag(midpoint(inputs2.high, inputs2.low, settings.spanB), shift);
    const above = inputs2.close.map((c, i) => {
      const a = spanA[i];
      const b = spanB[i];
      return c != null && a != null && b != null && c > Math.max(a, b);
    });
    const below = inputs2.close.map((c, i) => {
      const a = spanA[i];
      const b = spanB[i];
      return c != null && a != null && b != null && c < Math.min(a, b);
    });
    return { conversion, base, spanA, spanB, above, below };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { conversion: 9, base: 26, spanB: 52, displacement: 26 },
      expectAt: {
        "7": { conversion: null },
        "8": { conversion: 84092.935 },
        "25": { base: 84246.01 },
        "49": { spanA: null },
        "50": { spanA: 84294.095 },
        "75": { spanB: null, above: false, below: false },
        "76": { spanB: 83932.025, above: false, below: true }
      },
      expectLast: { conversion: 81393.63, base: 81875.03, spanA: 81296.1475, spanB: 81973.36, above: false, below: false }
    }
  ]
});

// packages/nodes/src/indicators/keltner.ts
var PIN_SHORT7 = {
  upper: l("oberes Keltner-Band", "upper Keltner band"),
  middle: l("Keltner-Mitte", "Keltner middle"),
  lower: l("unteres Keltner-Band", "lower Keltner band")
};
var keltner = defineNode({
  id: "core.keltner",
  version: "1.0.0",
  category: "ind",
  label: l("Keltner-Kanal", "Keltner Channel"),
  description: l("Kanal aus Durchschnitt und üblicher Spanne", "Channel from the average and usual range"),
  help: l(
    "Legt einen Kanal um den Durchschnitt der letzten Kerzen. Die Breite richtet sich nach der üblichen Spanne der Kerzen (ATR), deshalb verläuft der Kanal ruhiger als die Bollinger-Bänder. Schließt der Kurs außerhalb, ist er für seine übliche Bewegung weit gelaufen; oft beginnt so ein starker Trend. Beispiel: „Kurs kreuzt oberes Keltner-Band nach oben“ meldet einen Ausbruch nach oben.",
    "Draws a channel around the average of the last candles. Its width follows the usual range of the candles (ATR), which makes the channel calmer than Bollinger Bands. When the price closes outside, it has moved far for its usual swings; that is often how a strong trend begins. Example: “Price crosses above upper Keltner band” reports a breakout to the upside."
  ),
  technical: l(
    "Mitte als EMA oder SMA des Schlusskurses, Bänder im Abstand Breite × ATR (RMA der True Range); dieselben Werte wie der eingebaute Indikator Keltner Channels von TradingView mit dem Bandstil Average True Range.",
    "Middle as an EMA or SMA of the close, bands at width × ATR (RMA of the true range); the same values as TradingView’s built-in Keltner Channels indicator with the band style Average True Range."
  ),
  icon: "between-horizontal-start",
  keywords: { de: ["kanal", "band", "ausbruch", "atr", "volatilität"], en: ["channel", "band", "breakout", "atr", "volatility"] },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "upper", type: "series", label: l("Oben", "Upper"), unit: "price" },
    { id: "middle", type: "series", label: l("Mitte", "Middle"), unit: "price" },
    { id: "lower", type: "series", label: l("Unten", "Lower"), unit: "price" }
  ],
  settings: {
    length: lengthSetting(20, 1, 500, l("Über wie viele Kerzen der Durchschnitt in der Mitte rechnet. 20 ist der übliche Wert.", "How many candles the average in the middle covers. 20 is the usual value.")),
    mult: {
      type: "number",
      label: l("Breite", "Width"),
      help: l(
        "Wie weit die Bänder von der Mitte entfernt liegen, als Vielfaches der ATR. 2 ist üblich. Mit 1,5 erreicht der Kurs die Bänder öfter, mit 3 nur bei sehr starken Bewegungen.",
        "How far the bands sit from the middle, as a multiple of the ATR. 2 is usual. With 1.5 the price reaches the bands more often, with 3 only on very strong moves."
      ),
      default: 2,
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: l("ATR", "ATR")
    },
    atrLength: lengthSetting(
      10,
      1,
      500,
      l(
        "Über wie viele Kerzen die übliche Spanne (ATR) gemessen wird, nach der sich die Breite richtet. 10 ist der übliche Wert.",
        "How many candles the usual range (ATR) is measured over, which sets the width. 10 is the usual value."
      ),
      l("ATR-Kerzen", "ATR candles")
    ),
    kind: {
      type: "select",
      label: l("Durchschnitt", "Average"),
      help: l("Wie die Mitte gerechnet wird. Im Zweifel EMA nehmen.", "How the middle is calculated. If unsure, use EMA."),
      default: "ema",
      options: [
        {
          value: "ema",
          label: l("EMA · neue Kerzen zählen mehr", "EMA · recent candles count more"),
          help: l("Exponentieller Durchschnitt: Folgt dem Kurs schneller. Die übliche Wahl.", "Exponential average: follows the price faster. The usual choice.")
        },
        {
          value: "sma",
          label: l("SMA · jede Kerze zählt gleich", "SMA · every candle counts equally"),
          help: l("Einfacher Durchschnitt: Ruhiger, reagiert aber später auf Wenden.", "Simple average: calmer, but slower to react to turns.")
        }
      ],
      advanced: true
    }
  },
  sentence: ({ settings, locale }) => (locale === "de" ? `${settings.length} Kerzen · Breite ${formatNumber(settings.mult, locale)}` : `${settings.length} candles · width ${formatNumber(settings.mult, locale)}`) + (settings.kind === "sma" ? " · SMA" : ""),
  short: ({ pin, locale }) => (PIN_SHORT7[pin] ?? PIN_SHORT7.middle)[locale],
  warmup: ({ settings }) => Math.max(settings.kind === "ema" ? 5 * settings.length : settings.length, 10 * settings.atrLength + 1),
  visual: {
    kind: "channel",
    series: { input: "close" },
    middle: { output: "middle" },
    upper: { output: "upper" },
    lower: { output: "lower" },
    width: "mult",
    high: { input: "high" },
    low: { input: "low" }
  },
  compute({ inputs: inputs2, settings }) {
    const middle = settings.kind === "ema" ? series_exports.ema(inputs2.close, settings.length) : series_exports.sma(inputs2.close, settings.length);
    const range2 = series_exports.mul(series_exports.atr(inputs2.high, inputs2.low, inputs2.close, settings.atrLength), settings.mult);
    return { upper: series_exports.add(middle, range2), middle, lower: series_exports.sub(middle, range2) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 20, mult: 2, atrLength: 10, kind: "ema" },
      expectAt: { "18": { middle: null, upper: null }, "19": { upper: 84456.36194339122, middle: 84091.7245, lower: 83727.08705660878 } },
      expectLast: { upper: 82648.39895961258, middle: 81776.51399910267, lower: 80904.62903859276 }
    }
  ]
});

// packages/nodes/src/indicators/ma.ts
var KINDS3 = {
  sma: {
    label: l("SMA · jede Kerze zählt gleich", "SMA · every candle counts equally"),
    help: l(
      "Einfacher Durchschnitt: Jede Kerze zählt gleich viel. Ruhig, reagiert aber spät auf Wenden. Üblich als SMA 50 oder SMA 200.",
      "Simple average: every candle counts the same. Calm, but slow to react to turns. Common as SMA 50 or SMA 200."
    )
  },
  ema: {
    label: l("EMA · neue Kerzen zählen mehr", "EMA · recent candles count more"),
    help: l(
      "Exponentieller Durchschnitt: Neue Kerzen zählen mehr als alte. Reagiert schneller als die SMA und ist die übliche Wahl, etwa als EMA 20 oder EMA 200.",
      "Exponential average: recent candles count more than old ones. Reacts faster than the SMA and is the usual choice, for example as EMA 20 or EMA 200."
    )
  },
  wma: {
    label: l("WMA · Gewicht nimmt gleichmäßig ab", "WMA · weight drops evenly"),
    help: l(
      "Gewichteter Durchschnitt: Die neueste Kerze zählt am meisten, jede ältere gleichmäßig weniger. Folgt dem Kurs enger als die SMA.",
      "Weighted average: the newest candle counts most, each older one evenly less. Follows the price more closely than the SMA."
    )
  },
  hma: {
    label: l("HMA · schnell, wenig Verzögerung", "HMA · fast, little lag"),
    help: l(
      "Hull-Durchschnitt: Folgt dem Kurs mit sehr wenig Verzögerung und bleibt trotzdem glatt. Bei Wenden schießt er manchmal etwas über.",
      "Hull average: follows the price with very little lag and still stays smooth. At turns it sometimes overshoots a little."
    )
  }
};
var movingAverage = defineNode({
  id: "core.ma",
  version: "1.0.0",
  category: "ind",
  label: l("Gleitender Durchschnitt", "Moving average"),
  description: l("Glättet den Kurs zu einer Trendlinie", "Smooths the price into a trend line"),
  help: l(
    "Bildet den Durchschnitt der letzten Kerzen. Kurze Ausschläge fallen dabei weg, übrig bleibt der Trend: Liegt der Kurs über dem Durchschnitt, zeigt der Trend eher nach oben, darunter eher nach unten. Beispiel: Der EMA 200 gilt als Linie für den langfristigen Trend. Kreuzt der Kurs ihn nach oben, sehen viele darin den Beginn eines Aufwärtstrends.",
    "Averages the last candles. Short spikes drop out and the trend remains: when the price is above the average, the trend tends to point up, below it down. Example: the EMA 200 is a common line for the long-term trend. When the price crosses above it, many see the start of an uptrend."
  ),
  technical: l(
    "Einfacher, exponentieller (Start mit der SMA der ersten Werte), linear gewichteter und Hull-Durchschnitt; dieselben Formeln wie ta.sma, ta.ema, ta.wma und ta.hma in TradingView.",
    "Simple, exponential (seeded with the SMA of the first values), linearly weighted and Hull average; the same formulas as ta.sma, ta.ema, ta.wma and ta.hma in TradingView."
  ),
  icon: "trending-up",
  keywords: {
    de: ["gleitender durchschnitt", "trend", "sma", "ema", "wma", "hma", "hull"],
    en: ["moving average", "trend", "sma", "ema", "wma", "hma", "hull"]
  },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [{ id: "out", type: "series", label: l("Durchschnitt", "Average"), unit: "input" }],
  settings: {
    kind: {
      type: "select",
      label: l("Art", "Type"),
      help: l("Wie stark neue Kerzen zählen. Im Zweifel EMA nehmen.", "How much weight recent candles get. If unsure, use EMA."),
      default: "ema",
      options: Object.keys(KINDS3).map((value) => ({ value, label: KINDS3[value].label, help: KINDS3[value].help }))
    },
    length: lengthSetting(
      20,
      2,
      500,
      l(
        "Über wie viele Kerzen der Durchschnitt rechnet. Üblich sind 20 für den kurzfristigen, 50 für den mittleren und 200 für den langfristigen Trend. Mehr Kerzen machen die Linie ruhiger, aber langsamer.",
        "How many candles the average covers. Common are 20 for the short-term, 50 for the medium-term and 200 for the long-term trend. More candles make the line calmer but slower."
      )
    )
  },
  sentence: ({ settings }) => `${settings.kind.toUpperCase()} ${settings.length}`,
  short: ({ settings }) => `${settings.kind.toUpperCase()} ${settings.length}`,
  warmup: ({ settings }) => {
    const n = settings.length;
    if (settings.kind === "ema") return 5 * n;
    if (settings.kind === "hma") return n + Math.floor(Math.sqrt(n));
    return n;
  },
  compute({ inputs: inputs2, settings }) {
    const n = settings.length;
    switch (settings.kind) {
      case "sma":
        return { out: series_exports.sma(inputs2.in, n) };
      case "ema":
        return { out: series_exports.ema(inputs2.in, n) };
      case "wma":
        return { out: series_exports.wma(inputs2.in, n) };
      case "hma":
        return { out: series_exports.hma(inputs2.in, n) };
    }
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    { name: "SMA 20", fixture: FIXTURE, settings: { kind: "sma", length: 20 }, expectAt: { "18": { out: null }, "19": { out: 84091.7245 } }, expectLast: { out: 81876.3555 } },
    { name: "EMA 20", fixture: FIXTURE, settings: { kind: "ema", length: 20 }, expectAt: { "18": { out: null }, "19": { out: 84091.7245 } }, expectLast: { out: 81776.51399910267 } },
    { name: "EMA 200", fixture: FIXTURE, settings: { kind: "ema", length: 200 }, expectAt: { "199": { out: 84269.57515 } }, expectLast: { out: 82705.30635421898 } },
    { name: "WMA 20", fixture: FIXTURE, settings: { kind: "wma", length: 20 }, expectAt: { "19": { out: 84127.356 } }, expectLast: { out: 81729.11004761905 } },
    { name: "HMA 21", fixture: FIXTURE, settings: { kind: "hma", length: 21 }, expectAt: { "22": { out: null }, "23": { out: 84404.86879307359 } }, expectLast: { out: 81372.42333679654 } }
  ]
});

// packages/nodes/src/indicators/macd.ts
var PIN_SHORT8 = {
  macd: l("MACD", "MACD"),
  signal: l("MACD-Signal", "MACD signal"),
  hist: l("MACD-Histogramm", "MACD histogram")
};
var macd2 = defineNode({
  id: "core.macd",
  version: "1.0.0",
  category: "ind",
  label: l("MACD", "MACD"),
  description: l("Zeigt, ob ein Trend Schwung bekommt", "Shows whether a trend gains momentum"),
  help: l(
    "Vergleicht einen schnellen und einen langsamen Durchschnitt des Kurses. Laufen sie auseinander, gewinnt der Trend an Schwung, nähern sie sich, lässt er nach. Dazu kommen die Signallinie (die geglättete MACD-Linie) und das Histogramm (der Abstand zwischen beiden). Beispiel: Kreuzt die MACD-Linie die Signallinie nach oben, bekommt der Kurs gerade neuen Schwung nach oben.",
    "Compares a fast and a slow average of the price. When they move apart, the trend gains momentum; when they converge, it fades. You also get the signal line (the smoothed MACD line) and the histogram (the gap between the two). Example: when the MACD line crosses above the signal line, the price is picking up upward momentum."
  ),
  technical: l(
    "Differenz zweier EMA, Signallinie als EMA dieser Differenz, Histogramm als Abstand beider; dieselbe Formel wie ta.macd in TradingView.",
    "Difference of two EMAs, signal line as an EMA of that difference, histogram as the gap between both; the same formula as ta.macd in TradingView."
  ),
  icon: "chart-column",
  keywords: { de: ["momentum", "trend", "signal", "histogramm"], en: ["momentum", "trend", "signal", "histogram"] },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "macd", type: "series", label: l("MACD", "MACD") },
    { id: "signal", type: "series", label: l("Signallinie", "Signal line") },
    { id: "hist", type: "series", label: l("Histogramm", "Histogram") }
  ],
  settings: {
    fast: lengthSetting(12, 2, 200, l("Kerzen für den schnellen Durchschnitt, üblich sind 12.", "Candles for the fast average, usually 12."), l("Schneller Durchschnitt", "Fast average")),
    slow: lengthSetting(
      26,
      2,
      400,
      l("Kerzen für den langsamen Durchschnitt, üblich sind 26. Sollte größer sein als der schnelle.", "Candles for the slow average, usually 26. Should be larger than the fast one."),
      l("Langsamer Durchschnitt", "Slow average")
    ),
    signal: lengthSetting(
      9,
      1,
      100,
      l(
        "Über wie viele Kerzen die MACD-Linie zur Signallinie geglättet wird, üblich sind 9. Die Standardwerte 12, 26 und 9 nutzen fast alle; ändern musst du sie selten.",
        "How many candles the MACD line is smoothed over to form the signal line, usually 9. Almost everyone uses the defaults 12, 26 and 9; you rarely need to change them."
      ),
      l("Signallinie", "Signal line")
    )
  },
  sentence: ({ settings }) => `${settings.fast} · ${settings.slow} · ${settings.signal}`,
  short: ({ pin, locale }) => (PIN_SHORT8[pin] ?? PIN_SHORT8.macd)[locale],
  warmup: ({ settings }) => 5 * Math.max(settings.fast, settings.slow) + 5 * settings.signal,
  compute({ inputs: inputs2, settings }) {
    const result = series_exports.macd(inputs2.in, settings.fast, settings.slow, settings.signal);
    return { macd: result.macd, signal: result.signal, hist: result.hist };
  },
  tests: [
    {
      fixture: FIXTURE,
      settings: { fast: 12, slow: 26, signal: 9 },
      expectAt: { "24": { macd: null }, "32": { signal: null }, "33": { signal: 206.06754808019429 } },
      expectLast: { macd: -117.5166251286245, signal: -95.89832146556154, hist: -21.618303663062957 },
      tolerance: 1e-7
    }
  ]
});

// packages/nodes/src/indicators/mfi.ts
var RANGE2 = { oversold: 20, overbought: 80, min: 0, max: 100, step: 1 };
var mfi2 = defineNode({
  id: "core.mfi",
  version: "1.0.0",
  category: "ind",
  label: l("MFI", "MFI"),
  description: l("RSI mit Volumen: Geldfluss, 0–100", "RSI with volume: money flow, 0–100"),
  help: l(
    "Wie der RSI, aber mit Volumen: Der Money Flow Index vergleicht das Geld, das in den letzten Kerzen bei steigendem Kurs geflossen ist, mit dem bei fallendem Kurs und macht daraus eine Zahl von 0 bis 100. Gerechnet wird mit dem typischen Kurs, dem Mittelwert aus Hoch, Tief und Schluss, mal Volumen. Über 80 gilt als überkauft, unter 20 als überverkauft; die Ausgänge „überkauft“ und „überverkauft“ melden das, die Schwellen ziehst du im Bild unter dem Kurs. Beispiel: „MFI 14 unter 20“ meldet einen Abverkauf, bei dem fast das ganze Volumen auf fallende Kerzen kam, oft kurz vor einer Gegenbewegung.",
    "Like the RSI, but with volume: the Money Flow Index compares the money that flowed on rising candles over the last candles with the money on falling candles and turns that into a number from 0 to 100. It works with the typical price, the mean of high, low and close, times volume. Above 80 counts as overbought, below 20 as oversold; the “overbought” and “oversold” outputs report this, and you drag the thresholds in the chart below the price. Example: “MFI 14 below 20” reports a sell-off in which almost all of the volume came on falling candles, often shortly before a rebound."
  ),
  technical: l(
    "Geldfluss als typischer Kurs (Hoch + Tief + Schluss) / 3 mal Volumen, aufgeteilt nach steigendem und fallendem typischem Kurs und über die Kerzen summiert, MFI als 100 − 100 / (1 + Zufluss / Abfluss), ohne Abfluss 100; dieselbe Formel wie ta.mfi in TradingView, wie der eingebaute Money Flow Index mit hlc3.",
    "Money flow as typical price (high + low + close) / 3 times volume, split by rising and falling typical price and summed over the candles, MFI as 100 − 100 / (1 + inflow / outflow), 100 without outflow; the same formula as ta.mfi in TradingView, like the built-in Money Flow Index with hlc3."
  ),
  icon: "droplet",
  keywords: {
    de: ["mfi", "money flow index", "geldfluss", "volumen", "überkauft", "überverkauft"],
    en: ["mfi", "money flow index", "money flow", "volume", "overbought", "oversold"]
  },
  inputs: CANDLE_HLCV_INPUTS,
  outputs: [{ id: "out", type: "series", label: l("MFI", "MFI") }, ...THRESHOLD_OUTPUTS],
  settings: {
    length: lengthSetting(
      14,
      2,
      100,
      l(
        "Über wie viele Kerzen Zufluss und Abfluss summiert werden. 14 ist der übliche Wert. Weniger Kerzen machen den MFI schneller und unruhiger, mehr Kerzen ruhiger.",
        "How many candles inflow and outflow are summed over. 14 is the usual value. Fewer candles make the MFI faster and jumpier, more candles calmer."
      )
    ),
    ...thresholdSettings(RANGE2, {
      oversold: l(
        "Unter dieser Linie gilt der MFI als überverkauft: Fast das ganze Volumen kam auf fallende Kerzen. Dann ist der Ausgang „überverkauft“ wahr. Üblich ist 20, enger 10.",
        "Below this line the MFI counts as oversold: almost all of the volume came on falling candles. The “oversold” output is then true. 20 is usual, tighter 10."
      ),
      overbought: l(
        "Über dieser Linie gilt der MFI als überkauft: Fast das ganze Volumen kam auf steigende Kerzen. Dann ist der Ausgang „überkauft“ wahr. Üblich ist 80, enger 90.",
        "Above this line the MFI counts as overbought: almost all of the volume came on rising candles. The “overbought” output is then true. 80 is usual, tighter 90."
      )
    })
  },
  sentence: ({ settings, locale, output }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + thresholdSentence(settings, output, locale),
  short: ({ settings, pin, locale }) => pin === "out" ? `MFI ${settings.length}` : thresholdShort(`MFI ${settings.length}`, pin, settings, locale),
  // Eine Kerze mehr: Die erste hat keine Kerze davor und zählt auf beiden Seiten.
  warmup: ({ settings }) => settings.length + 1,
  visual: { kind: "zone", series: { output: "out" }, low: "oversold", high: "overbought", price: { input: "close" }, signal: ["oversold", "overbought"] },
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.mfi(series_exports.hlc3(inputs2.high, inputs2.low, inputs2.close), inputs2.volume, settings.length);
    return { out, ...thresholdSignals(out, settings.oversold, settings.overbought) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung); an Kerze 13 zählt die erste Kerze noch mit.
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLCV,
      settings: { length: 14 },
      expectAt: { "12": { out: null }, "13": { out: 51.9887336793009 }, "14": { out: 47.518893893726776 } },
      expectLast: { out: 39.36389309852199 },
      tolerance: 1e-9
    },
    // Schwellen gegen die Referenz (scripts/pine-reference.py): überkauft ab Kerze 29, überverkauft an Kerze 53.
    {
      name: "Schwellen 20 und 80",
      fixture: FIXTURE,
      inputs: CANDLE_HLCV,
      settings: { length: 14, oversold: 20, overbought: 80 },
      expectAt: { "28": { overbought: false }, "29": { overbought: true }, "52": { oversold: false }, "53": { oversold: true } }
    }
  ]
});

// packages/nodes/src/indicators/periods.ts
function periodStart2(ms, period, timeZone) {
  const p = zonedParts(ms, timeZone);
  let date = Date.UTC(p.year, p.month - 1, period === "month" ? 1 : p.day);
  if (period === "week") date -= (weekdayOf(p.year, p.month, p.day) + 6) % 7 * DAY;
  const d = new Date(date);
  return zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 0, 0, timeZone);
}
function nextPeriodStart(start, period, timeZone) {
  const p = zonedParts(start, timeZone);
  const date = new Date(period === "month" ? Date.UTC(p.year, p.month, 1) : Date.UTC(p.year, p.month - 1, p.day + (period === "week" ? 7 : 1)));
  return zonedTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 0, 0, timeZone);
}
function periodStarts(bars, period, timeZone) {
  const starts = [];
  let start = Number.NaN;
  let end = Number.NaN;
  for (let i = 0; i < bars.length; i++) {
    const open = bars.openTime[i] ?? 0;
    if (!(open >= start && open < end)) {
      start = periodStart2(open, period, timeZone);
      end = nextPeriodStart(start, period, timeZone);
    }
    starts.push(start);
  }
  return starts;
}
function periodAnchors(bars, starts) {
  return starts.map((start, i) => i === 0 ? bars.openTime[0] === start : start !== starts[i - 1]);
}
function previousPeriodHlc(high, low, close, bars, period, timeZone) {
  const previous = previousPeriodOhlc(void 0, high, low, close, bars, period, timeZone);
  return { high: previous.high, low: previous.low, close: previous.close };
}
function previousPeriodOhlc(open, high, low, close, bars, period, timeZone) {
  const starts = periodStarts(bars, period, timeZone);
  const stats = /* @__PURE__ */ new Map();
  starts.forEach((start, i) => {
    let entry = stats.get(start);
    if (!entry) {
      entry = { open: null, high: Number.NEGATIVE_INFINITY, low: Number.POSITIVE_INFINITY, close: null, complete: i > 0 || bars.openTime[0] === start };
      stats.set(start, entry);
    }
    const o = open?.[i];
    const h = high[i];
    const lo = low[i];
    const c = close[i];
    if (o != null && entry.open === null) entry.open = o;
    if (h != null) entry.high = Math.max(entry.high, h);
    if (lo != null) entry.low = Math.min(entry.low, lo);
    if (c != null) entry.close = c;
  });
  const out = {
    open: new Array(bars.length).fill(null),
    high: new Array(bars.length).fill(null),
    low: new Array(bars.length).fill(null),
    close: new Array(bars.length).fill(null)
  };
  let current = Number.NaN;
  let previous;
  starts.forEach((start, i) => {
    if (start !== current) {
      current = start;
      previous = stats.get(periodStart2(start - 1, period, timeZone));
    }
    if (!previous?.complete || previous.close === null || !Number.isFinite(previous.high) || !Number.isFinite(previous.low)) return;
    out.open[i] = previous.open;
    out.high[i] = previous.high;
    out.low[i] = previous.low;
    out.close[i] = previous.close;
  });
  return out;
}
function periodOpen(open, bars, period, timeZone) {
  const out = new Array(bars.length).fill(null);
  let current = Number.NaN;
  let complete = false;
  let value = null;
  periodStarts(bars, period, timeZone).forEach((start, i) => {
    if (start !== current) {
      current = start;
      complete = i > 0 || bars.openTime[0] === start;
      value = null;
    }
    if (complete && value === null) value = open[i] ?? null;
    out[i] = value;
  });
  return out;
}
function barsForDays(days, timeframe) {
  return Math.ceil(days * DAY / timeframeMs(timeframe));
}
var utcTimezoneSetting = {
  ...timezoneSetting,
  help: l(
    "In welcher Zeitzone Tag, Woche und Monat beginnen. Standard ist UTC wie bei den Tageskerzen der Börsen, in Berlin ist das 1:00 Uhr im Winter und 2:00 Uhr im Sommer. Mit Europe/Berlin beginnt der Tag um Mitternacht deutscher Zeit.",
    "The time zone in which the day, week and month begin. The default is UTC, like the exchanges’ daily candles; in Berlin that is 1:00 AM in winter and 2:00 AM in summer. With Europe/Berlin the day begins at midnight German time."
  ),
  default: "UTC"
};

// packages/nodes/src/indicators/profile.ts
var SessionProfile = class {
  #rows;
  #share;
  #bins;
  #high = [];
  #low = [];
  #volume = [];
  #top = Number.NEGATIVE_INFINITY;
  #bottom = Number.POSITIVE_INFINITY;
  #total = 0;
  /** Die Spanne ist gewachsen, seit die Stufen zuletzt verteilt wurden. */
  #dirty = false;
  /** `rows` Preisstufen, `share` Anteil des Volumens in der Value Area (0,7 für 70 %). */
  constructor(rows, share) {
    this.#rows = rows;
    this.#share = share;
    this.#bins = new Float64Array(rows);
  }
  /** Nimmt eine Kerze auf. Ohne Hoch oder Tief zählt sie nicht, ohne Volumen nur für die Spanne. */
  add(high, low, volume2) {
    if (high == null || low == null) return;
    const top = Math.max(high, low);
    const bottom = Math.min(high, low);
    const amount = volume2 != null && volume2 > 0 ? volume2 : 0;
    this.#high.push(top);
    this.#low.push(bottom);
    this.#volume.push(amount);
    this.#total += amount;
    if (top > this.#top || bottom < this.#bottom) {
      this.#top = Math.max(this.#top, top);
      this.#bottom = Math.min(this.#bottom, bottom);
      this.#dirty = true;
    } else if (!this.#dirty) {
      this.#spread(top, bottom, amount);
    }
  }
  /** Verteilt das Volumen einer Kerze auf die Stufen, anteilig nach Überlappung ihrer Spanne mit jeder Stufe. */
  #spread(high, low, volume2) {
    if (volume2 === 0) return;
    const rows = this.#rows;
    const bottom = this.#bottom;
    const span = this.#top - bottom;
    if (span === 0) {
      this.#bins[0] = (this.#bins[0] ?? 0) + volume2;
      return;
    }
    const width = span / rows;
    const index = (price) => Math.min(rows - 1, Math.floor((price - bottom) / width));
    if (high === low) {
      const k = index(high);
      this.#bins[k] = (this.#bins[k] ?? 0) + volume2;
      return;
    }
    const range2 = high - low;
    const last = index(high);
    for (let k = index(low); k <= last; k++) {
      const upper = k === rows - 1 ? this.#top : bottom + (k + 1) * width;
      const overlap = Math.min(high, upper) - Math.max(low, bottom + k * width);
      if (overlap > 0) this.#bins[k] = (this.#bins[k] ?? 0) + volume2 * overlap / range2;
    }
  }
  /** Verteilt alle Kerzen neu, wenn die Spanne gewachsen ist. */
  #refresh() {
    if (!this.#dirty) return;
    this.#bins.fill(0);
    this.#dirty = false;
    for (let i = 0; i < this.#high.length; i++) this.#spread(this.#high[i] ?? 0, this.#low[i] ?? 0, this.#volume[i] ?? 0);
  }
  /** Die Preisstufen mit ihrem Volumen, von unten nach oben, etwa für Grafiken; leer ohne Kerzen oder ohne Spanne. */
  rows() {
    if (this.#high.length === 0 || this.#top === this.#bottom) return [];
    this.#refresh();
    const width = (this.#top - this.#bottom) / this.#rows;
    return Array.from(this.#bins, (volume2, k) => ({ low: this.#bottom + k * width, high: k === this.#rows - 1 ? this.#top : this.#bottom + (k + 1) * width, volume: volume2 }));
  }
  /** POC, VAH, VAL, Hoch und Tief der Kerzen bis jetzt; `null` ohne Kerzen. */
  levels() {
    if (this.#high.length === 0) return null;
    const rows = this.#rows;
    const bins = this.#bins;
    this.#refresh();
    const high = this.#top;
    const low = this.#bottom;
    if (this.#total === 0) return { poc: null, vah: null, val: null, high, low };
    if (high === low) return { poc: high, vah: high, val: high, high, low };
    const epsilon = this.#total * 1e-9;
    const middle = (rows - 1) / 2;
    let poc = 0;
    for (let k = 1; k < rows; k++) {
      const difference = (bins[k] ?? 0) - (bins[poc] ?? 0);
      if (difference > epsilon || Math.abs(difference) <= epsilon && Math.abs(k - middle) < Math.abs(poc - middle)) poc = k;
    }
    const target = this.#share * this.#total - epsilon;
    let up = poc;
    let down = poc;
    let sum2 = bins[poc] ?? 0;
    while (sum2 < target && (up < rows - 1 || down > 0)) {
      let takeAbove;
      if (up === rows - 1) takeAbove = false;
      else if (down === 0) takeAbove = true;
      else {
        const difference = (bins[up + 1] ?? 0) - (bins[down - 1] ?? 0);
        takeAbove = Math.abs(difference) > epsilon ? difference > 0 : up + 1 - poc <= poc - (down - 1);
      }
      if (takeAbove) sum2 += bins[++up] ?? 0;
      else sum2 += bins[--down] ?? 0;
    }
    const width = (high - low) / rows;
    return {
      poc: low + (poc + 0.5) * width,
      vah: up === rows - 1 ? high : low + (up + 1) * width,
      val: low + down * width,
      high,
      low
    };
  }
};
function emptyProfileSeries(length) {
  const empty = () => new Array(length).fill(null);
  return { poc: empty(), vah: empty(), val: empty(), high: empty(), low: empty() };
}
function write(out, i, levels) {
  if (!levels) return;
  out.poc[i] = levels.poc;
  out.vah[i] = levels.vah;
  out.val[i] = levels.val;
  out.high[i] = levels.high;
  out.low[i] = levels.low;
}
function volumeProfile(high, low, volume2, bars, options) {
  const out = emptyProfileSeries(bars.length);
  const starts = periodStarts(bars, options.period, options.timeZone);
  if (options.session === "current") {
    let current2 = Number.NaN;
    let profile = null;
    starts.forEach((start, i) => {
      if (start !== current2) {
        current2 = start;
        profile = i > 0 || bars.openTime[0] === start ? new SessionProfile(options.rows, options.share) : null;
      }
      if (!profile) return;
      profile.add(high[i], low[i], volume2[i]);
      write(out, i, profile.levels());
    });
    return out;
  }
  const finished = sessionLevels(high, low, volume2, bars, starts, options.rows, options.share);
  let current = Number.NaN;
  let previous;
  starts.forEach((start, i) => {
    if (start !== current) {
      current = start;
      previous = finished.get(periodStart2(start - 1, options.period, options.timeZone));
    }
    write(out, i, previous ?? null);
  });
  return out;
}
function sessionLevels(high, low, volume2, bars, starts, rows, share) {
  const profiles = /* @__PURE__ */ new Map();
  starts.forEach((start, i) => {
    let profile = profiles.get(start);
    if (profile === void 0) {
      profile = i > 0 || bars.openTime[0] === start ? new SessionProfile(rows, share) : null;
      profiles.set(start, profile);
    }
    profile?.add(high[i], low[i], volume2[i]);
  });
  const levels = /* @__PURE__ */ new Map();
  for (const [start, profile] of profiles) if (profile) levels.set(start, profile.levels());
  return levels;
}
function nakedPocs(close, high, low, volume2, bars, options) {
  const n = bars.length;
  const out = { above: new Array(n).fill(null), below: new Array(n).fill(null), touch: new Array(n).fill(false) };
  const starts = periodStarts(bars, options.period, options.timeZone);
  let open = [];
  let current = Number.NaN;
  let profile = null;
  starts.forEach((start, i) => {
    if (start !== current) {
      const poc = profile?.levels()?.poc;
      if (poc != null) open.push({ start: current, price: poc });
      current = start;
      profile = i > 0 || bars.openTime[0] === start ? new SessionProfile(options.rows, options.share) : null;
      let oldest = start;
      for (let k = 0; k < options.lookback; k++) oldest = periodStart2(oldest - 1, options.period, options.timeZone);
      open = open.filter((entry) => entry.start >= oldest);
    }
    const h = high[i];
    const lo = low[i];
    if (h != null && lo != null) {
      const reached = open.filter((entry) => entry.price >= Math.min(h, lo) && entry.price <= Math.max(h, lo));
      if (reached.length > 0) {
        out.touch[i] = true;
        open = open.filter((entry) => !reached.includes(entry));
      }
    }
    const c = close[i];
    if (c != null) {
      for (const entry of open) {
        if (entry.price > c && (out.above[i] == null || entry.price < out.above[i])) out.above[i] = entry.price;
        if (entry.price < c && (out.below[i] == null || entry.price > out.below[i])) out.below[i] = entry.price;
      }
    }
    profile?.add(h, lo, volume2[i]);
  });
  return out;
}

// packages/nodes/src/indicators/naked-poc.ts
var PERIODS = {
  day: {
    label: l("Tag", "day"),
    help: l("Ein POC pro Kalendertag. Üblich mit Kerzen von 15 Minuten bis 1 Stunde.", "One POC per calendar day. Usual with candles from 15 minutes to 1 hour.")
  },
  week: {
    label: l("Woche", "week"),
    help: l("Ein POC pro Kalenderwoche, Montag bis Sonntag. Passt zu 1- und 4-Stunden-Kerzen.", "One POC per calendar week, Monday to Sunday. Suits 1-hour and 4-hour candles.")
  }
};
var SHORT3 = {
  above: l("ungetesteter POC darüber", "naked POC above"),
  below: l("ungetesteter POC darunter", "naked POC below")
};
var nakedPoc = defineNode({
  id: "core.naked-poc",
  version: "1.0.0",
  category: "ind",
  label: l("Ungetesteter POC", "Naked POC"),
  description: l("POCs, die der Kurs nicht mehr erreicht hat", "POCs the price has not revisited"),
  help: l(
    "Merkt sich den POC jeder Sitzung, also den Preis mit dem meisten Volumen, solange keine spätere Kerze ihn erreicht hat. Solche ungetesteten POCs gelten als Magnet: Der Kurs läuft oft später zu ihnen zurück. Der Baustein nennt den nächsten darüber und den nächsten darunter und meldet die Kerze, die einen erreicht. Beispiel: Liegt der POC von vorgestern 1,2 % über dem Kurs und hat ihn seitdem keine Kerze berührt, meldet das Signal „erreicht“ den Moment, in dem BTC dort ankommt. Es zählen nur die POCs der letzten Sitzungen, Standard 10.",
    "Remembers the POC of each session, the price with the most volume, as long as no later candle has reached it. Such naked POCs count as magnets: the price often returns to them later. The node gives the nearest one above and the nearest one below and reports the candle that reaches one. Example: if the POC from two days ago sits 1.2 % above the price and no candle has touched it since, the signal “reached” reports the moment BTC gets there. Only the POCs of the last sessions count, 10 by default."
  ),
  technical: l(
    "POC je Sitzung wie im Baustein Volumenprofil; er gilt ab der ersten Kerze der nächsten Sitzung als ungetestet, bis eine Kerze ihn mit Tief ≤ POC ≤ Hoch erreicht. Es zählen die POCs der letzten N Sitzungen, damit kein Wert davon abhängt, wie weit die Daten zurückreichen. Darüber und darunter beziehen sich auf den Schlusskurs der Kerze, nachdem sie geprüft ist.",
    "POC per session as in the Volume profile node; from the first candle of the next session it counts as naked until a candle reaches it with low ≤ POC ≤ high. The POCs of the last N sessions count, so that no value depends on how far back the data reaches. Above and below refer to the candle’s close, after it has been checked."
  ),
  icon: "target",
  keywords: {
    de: ["naked poc", "ungetestet", "poc", "volumenprofil", "magnet", "virgin poc", "level"],
    en: ["naked poc", "untested", "poc", "volume profile", "magnet", "virgin poc", "level"]
  },
  inputs: CANDLE_HLCV_INPUTS,
  outputs: [
    { id: "above", type: "series", label: l("darüber", "above"), unit: "price" },
    { id: "below", type: "series", label: l("darunter", "below"), unit: "price" },
    { id: "touch", type: "signal", label: l("erreicht", "reached") }
  ],
  settings: {
    period: {
      type: "select",
      label: l("Zeitraum", "Period"),
      help: l("Wie lang eine Sitzung ist, deren POC zählt: ein Tag oder eine Woche ab Montag.", "How long a session whose POC counts is: one day or one week from Monday."),
      default: "day",
      options: Object.keys(PERIODS).map((value) => ({ value, label: PERIODS[value].label, help: PERIODS[value].help }))
    },
    lookback: lengthSetting(
      10,
      1,
      20,
      l(
        "Aus wie vielen Sitzungen davor POCs zählen. Mit 10 Tagen sind es die POCs der letzten anderthalb Wochen; ältere vergisst der Baustein, auch wenn sie noch ungetestet sind.",
        "How many previous sessions POCs count from. With 10 days these are the POCs of the last week and a half; the node forgets older ones even if they are still naked."
      ),
      l("Sitzungen zurück", "Sessions back")
    ),
    rows: {
      ...lengthSetting(
        50,
        10,
        200,
        l("In wie viele gleich hohe Stufen die Spanne einer Sitzung geteilt wird, wie beim Volumenprofil.", "How many levels of equal height a session’s range is split into, as in the Volume profile."),
        l("Preisstufen", "Price levels")
      ),
      advanced: true
    },
    timezone: utcTimezoneSetting
  },
  sentence: ({ settings, locale }) => locale === "de" ? `letzte ${settings.lookback} ${settings.period === "day" ? settings.lookback === 1 ? "Tag" : "Tage" : settings.lookback === 1 ? "Woche" : "Wochen"}` : `last ${settings.lookback} ${settings.period === "day" ? settings.lookback === 1 ? "day" : "days" : settings.lookback === 1 ? "week" : "weeks"}`,
  short: ({ pin, locale }) => (SHORT3[pin] ?? SHORT3.above)[locale],
  warmup: ({ settings, timeframe }) => barsForDays((settings.lookback + 2) * (settings.period === "week" ? 7 : 1), timeframe),
  compute({ inputs: inputs2, settings, bars }) {
    return nakedPocs(inputs2.close, inputs2.high, inputs2.low, inputs2.volume, bars, {
      period: settings.period,
      timeZone: settings.timezone,
      rows: settings.rows,
      share: 0.7,
      lookback: settings.lookback
    });
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "Tage, 10 Sitzungen zurück",
      fixture: FIXTURE,
      inputs: CANDLE_HLCV,
      settings: { period: "day", lookback: 10, timezone: "UTC" },
      expectAt: { "44": { touch: true }, "45": { touch: false }, "115": { above: null, below: null }, "116": { above: 83791.2004, below: null } },
      expectLast: { above: 83417.099, below: null, touch: false }
    }
  ]
});

// packages/nodes/src/indicators/obv.ts
var obv2 = defineNode({
  id: "core.obv",
  version: "1.0.0",
  category: "ind",
  label: l("OBV", "OBV"),
  description: l("Volumen nach Kursrichtung aufsummiert", "Volume added up by price direction"),
  help: l(
    "Die On-Balance-Volume-Linie zählt das Volumen jeder Kerze dazu, wenn der Kurs gestiegen ist, und zieht es ab, wenn er gefallen ist. Steigt sie, kommt das Volumen vor allem bei steigenden Kursen, fällt sie, bei fallenden. Die Höhe der OBV hängt davon ab, ab welcher Kerze gezählt wird, und sagt allein deshalb nichts. Nimm für Alarme ihre Richtung oder das Kreuzen mit der Signallinie, ihrem Durchschnitt der letzten Kerzen, aber keine festen Schwellen. Beispiel: „OBV kreuzt OBV-Signal 20 nach oben“ meldet, wenn wieder mehr Volumen bei steigenden Kursen kommt, manchmal noch bevor der Kurs ausbricht.",
    "The On-Balance Volume line adds each candle’s volume when the price rose and subtracts it when it fell. When it rises, the volume comes mainly on rising prices; when it falls, on falling ones. The height of the OBV depends on the candle where counting started, so on its own it means nothing. For alerts use its direction or its crossing with the signal line, its average over the last candles, not fixed thresholds. Example: “OBV crosses above OBV signal 20” fires when more volume comes on rising prices again, sometimes before the price breaks out."
  ),
  technical: l(
    "Laufende Summe aus dem Vorzeichen der Veränderung des Schlusskurses mal Volumen, die erste Kerze steht bei 0, Signallinie als SMA davon; dieselbe Formel wie ta.obv in TradingView.",
    "Running sum of the sign of the change in the close times volume, the first candle is 0, signal line as its SMA; the same formula as ta.obv in TradingView."
  ),
  icon: "layers",
  keywords: {
    de: ["obv", "on-balance-volume", "volumen", "akkumulation", "kaufdruck", "divergenz"],
    en: ["obv", "on-balance volume", "volume", "accumulation", "buying pressure", "divergence"]
  },
  inputs: CANDLE_CV_INPUTS,
  outputs: [
    { id: "out", type: "series", label: l("OBV", "OBV") },
    { id: "average", type: "series", label: l("Signallinie", "Signal line") }
  ],
  settings: {
    length: lengthSetting(
      20,
      2,
      500,
      l(
        "Über wie viele Kerzen die Signallinie die OBV mittelt. 20 ist üblich. Mit weniger Kerzen kreuzt die OBV ihre Signallinie öfter, mit mehr seltener, dafür bei deutlicheren Wechseln.",
        "How many candles the signal line averages the OBV over. 20 is usual. With fewer candles the OBV crosses its signal line more often, with more less often but on clearer shifts."
      ),
      l("Signallinie", "Signal line")
    )
  },
  sentence: ({ settings, locale }) => locale === "de" ? `Signallinie ${settings.length} Kerzen` : `${settings.length}-candle signal line`,
  short: ({ settings, pin, locale }) => {
    if (pin !== "average") return "OBV";
    return locale === "de" ? `OBV-Signal ${settings.length}` : `OBV signal ${settings.length}`;
  },
  // Die Höhe der OBV hat keinen Vorlauf, sie hängt immer vom Beginn ab; die Signallinie braucht ihre Kerzen und eine davor.
  warmup: ({ settings }) => settings.length + 1,
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.obv(inputs2.close, inputs2.volume);
    return { out, average: series_exports.sma(out, settings.length) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_CV,
      settings: { length: 20 },
      expectAt: { "0": { out: 0 }, "1": { out: -196.5401 }, "18": { average: null }, "19": { average: -6.9293755 } },
      expectLast: { out: -35790.05554, average: -33828.727799 },
      tolerance: 1e-8
    }
  ]
});

// packages/nodes/src/indicators/smart-money.ts
var MAX_AGE = series_exports.SWING_MAX_AGE;
var num = (values, i) => {
  const value = values[i];
  return value === null || value === void 0 ? void 0 : value;
};
function distance2(value, low, high) {
  return value < low ? low - value : value > high ? value - high : 0;
}
function marketStructure(close, high, low, left, right, trigger = "close") {
  const n = close.length;
  const swings2 = series_exports.swingList(high, low, left, right);
  const breaks = [];
  const trend2 = new Array(n).fill(0);
  const level = new Array(n).fill(null);
  let next = 0;
  let openHigh;
  let openLow;
  let direction = 0;
  let lastBreak = Number.NEGATIVE_INFINITY;
  let lastLevel = 0;
  for (let i = 0; i < n; i++) {
    while (next < swings2.length && swings2[next].confirmed <= i) {
      const swing = swings2[next++];
      if (swing.high) openHigh = swing;
      else openLow = swing;
    }
    if (openHigh && i - openHigh.at > MAX_AGE) openHigh = void 0;
    if (openLow && i - openLow.at > MAX_AGE) openLow = void 0;
    const before = i - lastBreak <= MAX_AGE ? direction : 0;
    const c = num(close, i);
    const upPrice = trigger === "close" ? c : num(high, i);
    const downPrice = trigger === "close" ? c : num(low, i);
    const brokenHigh = openHigh && upPrice !== void 0 && upPrice > openHigh.value ? openHigh : void 0;
    const brokenLow = openLow && downPrice !== void 0 && downPrice < openLow.value ? openLow : void 0;
    if (brokenHigh) {
      breaks.push({ at: i, up: true, choch: before === -1, swing: brokenHigh });
      openHigh = void 0;
    }
    if (brokenLow) {
      breaks.push({ at: i, up: false, choch: before === 1, swing: brokenLow });
      openLow = void 0;
    }
    if (brokenHigh || brokenLow) {
      direction = brokenHigh && brokenLow ? (c ?? 0) >= (brokenHigh.value + brokenLow.value) / 2 ? 1 : -1 : brokenHigh ? 1 : -1;
      lastBreak = i;
      lastLevel = direction === 1 ? brokenHigh.value : brokenLow.value;
    }
    if (i - lastBreak <= MAX_AGE && direction !== 0) {
      trend2[i] = direction;
      level[i] = lastLevel;
    }
  }
  return { swings: swings2, breaks, trend: trend2, level, openHigh, openLow };
}
function orderBlocks(close, high, low, left, right, up, mode) {
  const n = close.length;
  const structure = marketStructure(close, high, low, left, right, "close");
  const drafts = [];
  for (const brk of structure.breaks) {
    if (brk.up !== up) continue;
    let pick = -1;
    for (let k = brk.swing.at + 1; k < brk.at; k++) {
      const value = up ? num(low, k) : num(high, k);
      if (value === void 0 || num(high, k) === void 0 || num(low, k) === void 0) continue;
      const best = pick < 0 ? void 0 : up ? num(low, pick) : num(high, pick);
      if (best === void 0 || (up ? value <= best : value >= best)) pick = k;
    }
    if (pick < 0) continue;
    drafts.push({ at: pick, formed: brk.at, low: num(low, pick), high: num(high, pick), swing: brk.swing, reached: false });
  }
  const enter = new Array(n).fill(false);
  const inside = new Array(n).fill(false);
  const formed = new Array(n).fill(false);
  const broken = new Array(n).fill(false);
  const top = new Array(n).fill(null);
  const bottom = new Array(n).fill(null);
  const counts = (block, i) => block.formed < i && block.broken === void 0 && i - block.formed <= MAX_AGE && (mode === "all" || block.touched === void 0);
  let active = [];
  let known = 0;
  for (let i = 0; i < n; i++) {
    const c = num(close, i);
    const h = num(high, i);
    const lo = num(low, i);
    for (const block of active) {
      if (!counts(block, i)) continue;
      const reach = up ? lo !== void 0 && lo <= block.high : h !== void 0 && h >= block.low;
      if (reach && !block.reached) enter[i] = true;
      block.reached = reach;
      if (c !== void 0 && c >= block.low && c <= block.high) inside[i] = true;
      if (reach && block.touched === void 0) block.touched = i;
      if (c !== void 0 && (up ? c < block.low : c > block.high)) {
        broken[i] = true;
        block.broken = i;
      }
    }
    while (known < drafts.length && drafts[known].formed === i) {
      formed[i] = true;
      active.push(drafts[known]);
      known++;
    }
    active = active.filter((block) => counts(block, i + 1));
    if (c === void 0) continue;
    let best;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const block of active) {
      const d = distance2(c, block.low, block.high);
      if (d <= bestDistance) {
        best = block;
        bestDistance = d;
      }
    }
    if (best) {
      top[i] = best.high;
      bottom[i] = best.low;
    }
  }
  const blocks = drafts.map((block) => ({ up, at: block.at, formed: block.formed, low: block.low, high: block.high, swing: block.swing, touched: block.touched, broken: block.broken }));
  return { blocks, structure, enter, inside, formed, broken, top, bottom };
}
function fairValueGaps(close, high, low, up, minSize) {
  const n = close.length;
  const drafts = [];
  const enter = new Array(n).fill(false);
  const inside = new Array(n).fill(false);
  const formed = new Array(n).fill(false);
  const filled = new Array(n).fill(false);
  const top = new Array(n).fill(null);
  const bottom = new Array(n).fill(null);
  const fill = new Array(n).fill(null);
  const open = (gap, i) => gap.formed < i && gap.filled === void 0 && i - gap.formed <= MAX_AGE;
  let active = [];
  for (let i = 0; i < n; i++) {
    const c = num(close, i);
    const h = num(high, i);
    const lo = num(low, i);
    for (const gap of active) {
      if (!open(gap, i)) continue;
      const reach = up ? lo !== void 0 && lo <= gap.high : h !== void 0 && h >= gap.low;
      if (gap.counted && c !== void 0 && c >= gap.low && c <= gap.high) inside[i] = true;
      if (!reach) continue;
      if (gap.touched === void 0) {
        if (gap.counted) enter[i] = true;
        gap.touched = i;
      }
      gap.deepest = up ? Math.min(gap.deepest, lo) : Math.max(gap.deepest, h);
      if (up ? lo <= gap.low : h >= gap.high) {
        if (gap.counted) filled[i] = true;
        gap.filled = i;
      }
    }
    const first = i >= 2 ? up ? num(high, i - 2) : num(low, i - 2) : void 0;
    const third = up ? lo : h;
    if (first !== void 0 && third !== void 0 && (up ? third > first : third < first)) {
      const gapLow = up ? first : third;
      const gapHigh = up ? third : first;
      const size = (gapHigh - gapLow) / Math.abs(gapLow) * 100;
      const counted = size >= minSize;
      const gap = { at: i - 1, formed: i, low: gapLow, high: gapHigh, size, counted, deepest: up ? gapHigh : gapLow };
      drafts.push(gap);
      active.push(gap);
      if (counted) formed[i] = true;
    }
    active = active.filter((gap) => open(gap, i + 1));
    if (c === void 0) continue;
    let best;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const gap of active) {
      if (!gap.counted) continue;
      const d = distance2(c, gap.low, gap.high);
      if (d <= bestDistance) {
        best = gap;
        bestDistance = d;
      }
    }
    if (best) {
      top[i] = best.high;
      bottom[i] = best.low;
      const depth = up ? best.high - best.deepest : best.deepest - best.low;
      fill[i] = Math.min(100, Math.max(0, depth / (best.high - best.low) * 100));
    }
  }
  const gaps = drafts.map((gap) => ({ up, at: gap.at, low: gap.low, high: gap.high, size: gap.size, counted: gap.counted, touched: gap.touched, filled: gap.filled }));
  return { gaps, enter, inside, formed, filled, top, bottom, fill };
}
function liquiditySweeps(close, high, low, left, right, highs, tolerance, bars, equalOnly) {
  const n = close.length;
  const swings2 = series_exports.swingList(high, low, left, right).filter((swing) => swing.high === highs);
  const drafts = [];
  const sweep = new Array(n).fill(false);
  const equal = new Array(n).fill(false);
  const level = new Array(n).fill(null);
  const pool = new Array(n).fill(null);
  const open = (draft, i) => draft.swept === void 0 && draft.breakout === void 0 && i - draft.first <= MAX_AGE;
  const counts = (draft) => !equalOnly || draft.swings.length >= 2;
  let active = [];
  let next = 0;
  let lastSweep = Number.NEGATIVE_INFINITY;
  let lastLevel = 0;
  for (let i = 0; i < n; i++) {
    const c = num(close, i);
    const beyond = highs ? num(high, i) : num(low, i);
    let swept;
    for (const draft of active) {
      if (draft.confirmed >= i || !open(draft, i)) continue;
      const back = c !== void 0 && (highs ? c < draft.level : c > draft.level);
      if (draft.taken === void 0) {
        if (beyond === void 0 || !(highs ? beyond > draft.level : beyond < draft.level)) continue;
        draft.taken = i;
      }
      if (back) {
        draft.swept = i;
        if (counts(draft) && (swept === void 0 || (highs ? draft.level > swept : draft.level < swept))) swept = draft.level;
      } else if (i - draft.taken + 1 >= bars) {
        draft.breakout = i;
      }
    }
    if (swept !== void 0) {
      sweep[i] = true;
      lastSweep = i;
      lastLevel = swept;
    }
    while (next < swings2.length && swings2[next].confirmed <= i) {
      const swing = swings2[next++];
      let join;
      for (const draft of active) {
        if (!open(draft, i) || draft.taken !== void 0) continue;
        const gap = Math.abs(draft.level - swing.value);
        if (gap > tolerance / 100 * Math.max(Math.abs(draft.level), Math.abs(swing.value))) continue;
        if (!join || gap <= Math.abs(join.level - swing.value)) join = draft;
      }
      if (join) {
        join.swings.push(swing);
        join.level = highs ? Math.max(join.level, swing.value) : Math.min(join.level, swing.value);
        join.confirmed = swing.confirmed;
        equal[i] = true;
      } else {
        const draft = { swings: [swing], level: swing.value, confirmed: swing.confirmed, first: swing.at };
        drafts.push(draft);
        active.push(draft);
      }
    }
    if (i - lastSweep <= MAX_AGE) level[i] = lastLevel;
    active = active.filter((draft) => open(draft, i + 1));
    if (c === void 0) continue;
    let nearest;
    for (const draft of active) {
      if (draft.taken !== void 0 || !counts(draft)) continue;
      if (nearest === void 0 || Math.abs(draft.level - c) < Math.abs(nearest - c)) nearest = draft.level;
    }
    if (nearest !== void 0) pool[i] = nearest;
  }
  const pools = drafts.map((draft) => ({ high: highs, swings: draft.swings, level: draft.level, confirmed: draft.confirmed, taken: draft.taken, swept: draft.swept, breakout: draft.breakout }));
  return { swings: swings2, pools, sweep, equal, level, pool };
}
function premiumDiscount(close, high, low, left, right, band2) {
  const n = close.length;
  const swings2 = series_exports.swingList(high, low, left, right);
  const top = new Array(n).fill(null);
  const bottom = new Array(n).fill(null);
  const middle = new Array(n).fill(null);
  const position = new Array(n).fill(null);
  const discount = new Array(n).fill(false);
  const premium = new Array(n).fill(false);
  const equilibrium = new Array(n).fill(false);
  let next = 0;
  let lastHigh;
  let lastLow;
  let upper;
  let lower;
  for (let i = 0; i < n; i++) {
    while (next < swings2.length && swings2[next].confirmed <= i) {
      const swing = swings2[next++];
      if (swing.high) {
        lastHigh = swing;
        upper = void 0;
        for (let k = swing.at; k < i; k++) upper = Math.max(upper ?? Number.NEGATIVE_INFINITY, num(high, k) ?? Number.NEGATIVE_INFINITY);
      } else {
        lastLow = swing;
        lower = void 0;
        for (let k = swing.at; k < i; k++) lower = Math.min(lower ?? Number.POSITIVE_INFINITY, num(low, k) ?? Number.POSITIVE_INFINITY);
      }
    }
    const h = num(high, i);
    const lo = num(low, i);
    if (h !== void 0 && upper !== void 0) upper = Math.max(upper, h);
    if (lo !== void 0 && lower !== void 0) lower = Math.min(lower, lo);
    if (lastHigh && i - lastHigh.at > MAX_AGE) lastHigh = upper = void 0;
    if (lastLow && i - lastLow.at > MAX_AGE) lastLow = lower = void 0;
    const c = num(close, i);
    if (upper === void 0 || lower === void 0 || !(upper > lower)) continue;
    top[i] = upper;
    bottom[i] = lower;
    middle[i] = (upper + lower) / 2;
    if (c === void 0) continue;
    const share = (c - lower) / (upper - lower) * 100;
    position[i] = share;
    discount[i] = share < 50 - band2;
    premium[i] = share > 50 + band2;
    equilibrium[i] = !discount[i] && !premium[i];
  }
  return { swings: swings2, top, bottom, middle, position, discount, premium, equilibrium };
}
var MAX_ZONES = 10;
function supportResistance(close, high, low, left, right, width, touches, lookback) {
  const n = close.length;
  const swings2 = series_exports.swingList(high, low, left, right);
  const breakUp = new Array(n).fill(false);
  const breakDown = new Array(n).fill(false);
  const inZone = new Array(n).fill(false);
  const supportHigh = new Array(n).fill(null);
  const supportLow = new Array(n).fill(null);
  const resistanceHigh = new Array(n).fill(null);
  const resistanceLow = new Array(n).fill(null);
  let window = [];
  let oldest = Number.POSITIVE_INFINITY;
  let next = 0;
  let zones = [];
  let previous = [];
  for (let i = 0; i < n; i++) {
    let changed = false;
    while (next < swings2.length && swings2[next].confirmed <= i) {
      const swing = swings2[next++];
      if (i - swing.at > lookback) continue;
      window.push(swing);
      oldest = Math.min(oldest, swing.at);
      changed = true;
    }
    if (i - oldest > lookback) {
      window = window.filter((swing) => i - swing.at <= lookback);
      oldest = window.reduce((min, swing) => Math.min(min, swing.at), Number.POSITIVE_INFINITY);
      changed = true;
    }
    previous = zones;
    if (changed) zones = clusterZones(window, width, touches);
    const c = num(close, i);
    const before = i > 0 ? num(close, i - 1) : void 0;
    if (c === void 0) continue;
    if (before !== void 0) {
      for (const zone of previous) {
        if (before <= zone.high && c > zone.high) breakUp[i] = true;
        if (before >= zone.low && c < zone.low) breakDown[i] = true;
      }
    }
    let support;
    let resistance;
    for (const zone of zones) {
      if (c >= zone.low && c <= zone.high) inZone[i] = true;
      if (zone.middle <= c) {
        if (!support || zone.middle > support.middle) support = zone;
      } else if (!resistance || zone.middle < resistance.middle) {
        resistance = zone;
      }
    }
    if (support) {
      supportHigh[i] = support.high;
      supportLow[i] = support.low;
    }
    if (resistance) {
      resistanceHigh[i] = resistance.high;
      resistanceLow[i] = resistance.low;
    }
  }
  return { zones, breakUp, breakDown, inZone, supportHigh, supportLow, resistanceHigh, resistanceLow };
}
function clusterZones(swings2, width, touches) {
  let rest = [...swings2].sort((a, b) => a.value - b.value || a.at - b.at);
  const zones = [];
  const share = width / 100;
  const latest = (from, to) => {
    let at = Number.NEGATIVE_INFINITY;
    for (let k = from; k <= to; k++) at = Math.max(at, rest[k].at);
    return at;
  };
  while (rest.length >= touches && zones.length < MAX_ZONES) {
    let best;
    let to = 0;
    for (let from = 0; from + touches <= rest.length; from++) {
      const base = rest[from].value;
      const reach = share * Math.abs(base);
      if (to < from) to = from;
      while (to > from && rest[to].value - base > reach) to--;
      while (to + 1 < rest.length && rest[to + 1].value - base <= reach) to++;
      const count2 = to - from + 1;
      if (count2 < touches || best && count2 < best.to - best.from + 1) continue;
      const middle = (base + rest[to].value) / 2;
      const half = share / 2 * Math.abs(middle);
      if (zones.some((other) => middle - half <= other.high && middle + half >= other.low)) continue;
      if (!best || count2 > best.to - best.from + 1) {
        best = { from, to, middle, half };
        continue;
      }
      best.recent ??= latest(best.from, best.to);
      const recent = latest(from, to);
      if (recent > best.recent) best = { from, to, middle, half, recent };
    }
    if (!best) break;
    const chosen = best;
    zones.push({ low: chosen.middle - chosen.half, high: chosen.middle + chosen.half, middle: chosen.middle, swings: rest.slice(chosen.from, chosen.to + 1) });
    rest = rest.filter((_, index) => index < chosen.from || index > chosen.to);
  }
  return zones.sort((a, b) => a.middle - b.middle);
}
function latestSwing(swings2, high) {
  for (let k = swings2.length - 1; k >= 0; k--) {
    const swing = swings2[k];
    if (high === void 0 || swing.high === high) return swing;
  }
  return void 0;
}
function trendSpans(trend2) {
  const spans = [];
  let start = -1;
  for (let i = 0; i <= trend2.length; i++) {
    const value = i < trend2.length ? trend2[i] : 0;
    const previous = i > 0 ? trend2[i - 1] : 0;
    if (value === previous) continue;
    if (previous !== 0 && start >= 0) spans.push({ from: start, to: i - 1, tone: previous === 1 ? "up" : "down" });
    start = value !== 0 ? i : -1;
  }
  return spans;
}

// packages/nodes/src/indicators/order-blocks.ts
var SIDES = {
  bullish: {
    label: l("bullisch (unter dem Kurs)", "bullish (below the price)"),
    help: l(
      "Order Blocks aus Brüchen nach oben: Zonen unter dem Kurs, an denen der Anstieg begann. Kommt der Kurs zurück, erwarten viele dort Käufer.",
      "Order blocks from breaks upward: zones below the price where the rise began. When the price comes back, many expect buyers there."
    )
  },
  bearish: {
    label: l("bärisch (über dem Kurs)", "bearish (above the price)"),
    help: l(
      "Order Blocks aus Brüchen nach unten: Zonen über dem Kurs, an denen der Fall begann. Kommt der Kurs zurück, erwarten viele dort Verkäufer.",
      "Order blocks from breaks downward: zones above the price where the fall began. When the price comes back, many expect sellers there."
    )
  }
};
var MODES3 = {
  fresh: {
    label: l("nur unberührte", "untouched only"),
    help: l(
      "Ein Order Block zählt bis zur ersten Kerze, die ihn erreicht; danach ist er abgearbeitet. So meldet sich nur der erste Rücklauf, den viele für den stärksten halten.",
      "An order block counts until the first candle that reaches it; after that it is mitigated. This way only the first return reports, which many consider the strongest."
    )
  },
  all: {
    label: l("auch abgearbeitete", "mitigated too"),
    help: l(
      "Ein Order Block zählt auch nach Berührungen, bis eine Kerze jenseits schließt. Jeder neue Rücklauf meldet sich.",
      "An order block keeps counting after touches until a candle closes beyond it. Every new return reports."
    )
  }
};
var PIN_SHORT9 = {
  enter: l("Kurs erreicht OB", "price reaches OB"),
  inside: l("Schluss im OB", "close in OB"),
  formed: l("neuer OB", "new OB"),
  broken: l("OB gebrochen", "OB broken"),
  top: l("OB oben", "OB top"),
  bottom: l("OB unten", "OB bottom")
};
var OB = l("OB", "OB");
var orderBlocksNode = defineNode({
  id: "core.order-blocks",
  version: "1.0.0",
  category: "ind",
  label: l("Order Blocks", "Order blocks"),
  description: l("Zonen, von denen ein Strukturbruch ausging", "Zones a structure break started from"),
  help: l(
    "Findet die Kerze, von der ein Bruch der Marktstruktur ausging: Bricht der Kurs über ein Swing-Hoch, ist der bullische Order Block die Kerze mit dem tiefsten Tief dazwischen, dort begann der Anstieg. Viele Trader erwarten, dass der Kurs in diese Zone zurückkommt und dort dreht. Der Baustein meldet, wenn der Kurs einen Order Block erreicht, darin schließt oder ihn durchbricht, und nennt die nächste Zone. Bekannt ist ein Order Block erst mit dem Bruch, nicht schon an seiner Kerze. Beispiel: bullisch und nur unberührte meldet den ersten Rücklauf von BTC in die Zone, aus der der letzte Ausbruch kam.",
    "Finds the candle a break of market structure started from: when the price breaks above a swing high, the bullish order block is the candle with the lowest low in between, where the rise began. Many traders expect the price to return to this zone and turn there. The node reports when the price reaches an order block, closes inside it or breaks through it, and gives the nearest zone. An order block is only known with the break, not at its own candle. Example: bullish with untouched only reports the first return of BTC into the zone the last breakout came from."
  ),
  technical: l(
    "Bruch wie im Baustein Marktstruktur per Schlusskurs. Bullischer Order Block: die Kerze mit dem tiefsten Tief zwischen dem gebrochenen Swing-Hoch und der Bruchkerze (bei gleich tiefen die jüngere), Zone von ihrem Tief bis zu ihrem Hoch. Er zählt ab der Kerze nach dem Bruch, bis eine Kerze unter seinem Tief schließt, höchstens 500 Kerzen; „erreicht“ heißt: Tief höchstens beim Hoch des Order Blocks, gemeldet, wenn die Kerze davor ihn nicht erreichte. Oberkante und Unterkante nennen den zählenden Order Block, der dem Schluss am nächsten liegt. Bärisch spiegelbildlich mit dem höchsten Hoch.",
    "Break as in the Market structure node, by close. Bullish order block: the candle with the lowest low between the broken swing high and the break candle (the later one if equal), zone from its low to its high. It counts from the candle after the break until a candle closes below its low, at most 500 candles; “reaches” means a low at or below the order block’s high, reported when the candle before did not reach it. Top and bottom give the counting order block nearest to the close. Bearish mirrored with the highest high."
  ),
  icon: "boxes",
  keywords: {
    de: ["order block", "ob", "nachfrage", "angebot", "demand", "supply", "zone", "rücklauf", "mitigation", "smart money", "smc"],
    en: ["order block", "ob", "demand", "supply", "zone", "retest", "mitigation", "smart money", "smc"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "enter", type: "signal", label: l("Kurs erreicht OB", "Price reaches OB") },
    { id: "inside", type: "signal", label: l("Schluss im OB", "Close in OB") },
    { id: "formed", type: "signal", label: l("neuer OB", "New OB") },
    { id: "broken", type: "signal", label: l("OB gebrochen", "OB broken") },
    { id: "top", type: "series", label: l("Oberkante", "Top"), unit: "price" },
    { id: "bottom", type: "series", label: l("Unterkante", "Bottom"), unit: "price" }
  ],
  settings: {
    side: {
      type: "select",
      label: l("Richtung", "Direction"),
      help: l("Welche Order Blocks der Baustein sucht: unter dem Kurs aus Anstiegen oder über dem Kurs aus Abstiegen.", "Which order blocks the node looks for: below the price from rises or above the price from falls."),
      default: "bullish",
      options: Object.keys(SIDES).map((value) => ({ value, label: SIDES[value].label, help: SIDES[value].help }))
    },
    mode: {
      type: "select",
      label: l("Welche zählen", "Which count"),
      help: l("Ob ein Order Block nach der ersten Berührung weiter zählt.", "Whether an order block keeps counting after the first touch."),
      default: "fresh",
      options: Object.keys(MODES3).map((value) => ({ value, label: MODES3[value].label, help: MODES3[value].help }))
    },
    ...swingSettings(10, SWING_RIGHT_USED)
  },
  sentence: ({ settings, locale }) => `${SIDES[settings.side].label[locale].replace(/ \(.*\)$/, "")} · ${MODES3[settings.mode].label[locale]} · ${settings.left} · ${settings.right}`,
  short: ({ settings, pin, locale }) => `${(PIN_SHORT9[pin] ?? PIN_SHORT9.top)[locale]} ${settings.left} · ${settings.right}`,
  // Ein Order Block zählt bis zu 500 Kerzen nach seinem Bruch, der Bruch braucht einen Swing aus den 500 Kerzen davor.
  warmup: ({ settings }) => 2 * MAX_AGE + settings.left + settings.right,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    handles: [{ kind: "swing", left: "left", right: "right" }],
    signal: "enter",
    draw({ inputs: inputs2, settings }) {
      const up = settings.side === "bullish";
      const result = orderBlocks(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, up, settings.mode);
      const tone = up ? "up" : "down";
      const boxes = result.blocks.map((block) => {
        const end = Math.min((settings.mode === "fresh" ? block.touched ?? block.broken : block.broken) ?? Number.POSITIVE_INFINITY, block.formed + MAX_AGE);
        return {
          from: block.at,
          known: block.formed,
          ...end < inputs2.close.length - 1 ? { to: end } : {},
          low: block.low,
          high: block.high,
          tone,
          faded: settings.mode === "all" && block.touched !== void 0,
          label: OB
        };
      });
      const lines = result.blocks.map((block) => ({ from: block.swing.at, known: block.swing.confirmed, to: block.formed, value: block.swing.value, tone: "neutral" }));
      const swing = latestSwing(result.structure.swings, up);
      const top = result.top.at(-1);
      const bottom = result.bottom.at(-1);
      const legend = [
        { kind: "box", tone, label: settings.mode === "all" ? l("Order Block, unberührt", "Order block, untouched") : l("Order Block", "Order block") },
        ...settings.mode === "all" ? [{ kind: "box-faded", tone, label: l("abgearbeitet", "mitigated") }] : [],
        { kind: "dotted", tone, label: l("noch unbekannt, bis zum Bruch", "not known yet, until the break") },
        { kind: "line", tone: "neutral", label: l("gebrochenes Swing-Level", "broken swing level") }
      ];
      return {
        legend,
        boxes,
        lines,
        ...swing ? { swing: { at: swing.at, value: swing.value, high: swing.high } } : {},
        note: top == null || bottom == null ? l("kein Order Block, der zählt", "no order block that counts") : l(`nächster OB ${formatNumber(bottom, "de")} bis ${formatNumber(top, "de")}`, `nearest OB ${formatNumber(bottom, "en")} to ${formatNumber(top, "en")}`)
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const result = orderBlocks(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.side === "bullish", settings.mode);
    return { enter: result.enter, inside: result.inside, formed: result.formed, broken: result.broken, top: result.top, bottom: result.bottom };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { left: 5, right: 5 },
      expectAt: {
        "101": { formed: false, top: null },
        "102": { formed: true, top: 83470, bottom: 82956.11 },
        "105": { enter: false },
        "106": { enter: true }
      },
      expectLast: { top: null, bottom: null }
    }
  ]
});

// packages/nodes/src/indicators/fvg.ts
var SIDES2 = {
  up: {
    label: l("Aufwärtslücken (unter dem Kurs)", "up gaps (below the price)"),
    help: l(
      "Lücken aus einem schnellen Anstieg: Das Tief einer Kerze liegt über dem Hoch der vorletzten. Sie liegen unter dem Kurs; viele erwarten, dass er hineinfällt und dort Halt findet.",
      "Gaps from a fast rise: the low of a candle lies above the high of the one two before. They sit below the price; many expect it to fall back in and find support there."
    )
  },
  down: {
    label: l("Abwärtslücken (über dem Kurs)", "down gaps (above the price)"),
    help: l(
      "Lücken aus einem schnellen Fall: Das Hoch einer Kerze liegt unter dem Tief der vorletzten. Sie liegen über dem Kurs; viele erwarten, dass er hineinsteigt und dort abprallt.",
      "Gaps from a fast fall: the high of a candle lies below the low of the one two before. They sit above the price; many expect it to rise back in and get rejected there."
    )
  }
};
var PIN_SHORT10 = {
  enter: l("Kurs läuft in Lücke ≥ {size}", "price enters gap ≥ {size}"),
  inside: l("Schluss in Lücke ≥ {size}", "close in gap ≥ {size}"),
  formed: l("neue Lücke ≥ {size}", "new gap ≥ {size}"),
  filled: l("Lücke ≥ {size} gefüllt", "gap ≥ {size} filled"),
  top: l("Lücke ≥ {size} oben", "top of gap ≥ {size}"),
  bottom: l("Lücke ≥ {size} unten", "bottom of gap ≥ {size}"),
  fill: l("Lücke ≥ {size} gefüllt", "gap ≥ {size} filled")
};
var FVG = l("FVG", "FVG");
var fairValueGapsNode = defineNode({
  id: "core.fvg",
  version: "1.0.0",
  category: "ind",
  label: l("Fair Value Gaps", "Fair value gaps"),
  description: l("Kurslücken zwischen drei Kerzen", "Price gaps between three candles"),
  help: l(
    "Findet Lücken, die ein schneller Anstieg oder Fall hinterlässt: Liegt das Tief einer Kerze über dem Hoch der vorletzten, hat dazwischen nie ein Handel stattgefunden. Viele Trader erwarten, dass der Kurs solche Lücken später füllt. Der Baustein meldet neue Lücken, den ersten Rücklauf in eine offene Lücke, einen Schluss darin und eine ganz gefüllte Lücke, dazu Ober- und Unterkante der nächsten Lücke und wie weit sie schon gefüllt ist. Bekannt ist eine Lücke mit dem Schluss ihrer dritten Kerze. Beispiel: Aufwärtslücken ab 0,2 % mit „Kurs läuft in Lücke“ melden, wenn ETH nach einem Sprung nach oben in die Lücke zurückfällt.",
    "Finds gaps a fast rise or fall leaves behind: if the low of a candle lies above the high of the one two before, no trade happened in between. Many traders expect the price to fill such gaps later. The node reports new gaps, the first return into an open gap, a close inside one and a completely filled gap, plus top and bottom of the nearest gap and how far it is filled. A gap is known with the close of its third candle. Example: up gaps from 0.2 % with “price enters gap” report when ETH falls back into the gap after a jump."
  ),
  technical: l(
    "Aufwärtslücke an Kerze i: Tief[i] > Hoch[i − 2], Zone von Hoch[i − 2] bis Tief[i], Größe (oben − unten) / unten × 100. Abwärtslücke: Hoch[i] < Tief[i − 2]. Offen bis zur ersten Kerze, die hineinreicht (Tief höchstens an der Oberkante), dann teilweise gefüllt; ganz gefüllt, sobald ein Tief die Unterkante erreicht. Danach und nach 500 Kerzen zählt sie nicht mehr. „gefüllt %“ ist der tiefste Punkt seit der Entstehung in Prozent der Höhe; die Werte gelten für die nicht gefüllte Lücke, die dem Schluss am nächsten liegt.",
    "Up gap at candle i: low[i] > high[i − 2], zone from high[i − 2] to low[i], size (top − bottom) / bottom × 100. Down gap: high[i] < low[i − 2]. Open until the first candle that reaches in (a low at or below the top), then partially filled; completely filled once a low reaches the bottom. After that, and after 500 candles, it no longer counts. “Filled %” is the deepest point since it formed, in percent of its height; the values refer to the unfilled gap nearest to the close."
  ),
  icon: "square-dashed",
  keywords: {
    de: ["fair value gap", "fvg", "lücke", "imbalance", "ungleichgewicht", "gap", "füllen", "rücklauf", "smart money", "smc"],
    en: ["fair value gap", "fvg", "gap", "imbalance", "fill", "retest", "smart money", "smc"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "enter", type: "signal", label: l("Kurs läuft in Lücke", "Price enters gap") },
    { id: "inside", type: "signal", label: l("Schluss in Lücke", "Close in gap") },
    { id: "formed", type: "signal", label: l("neue Lücke", "New gap") },
    { id: "filled", type: "signal", label: l("Lücke gefüllt", "Gap filled") },
    { id: "top", type: "series", label: l("Oberkante", "Top"), unit: "price" },
    { id: "bottom", type: "series", label: l("Unterkante", "Bottom"), unit: "price" },
    { id: "fill", type: "series", label: l("gefüllt %", "Filled %"), unit: "percent" }
  ],
  settings: {
    side: {
      type: "select",
      label: l("Richtung", "Direction"),
      help: l("Welche Lücken der Baustein sucht: aus Anstiegen unter dem Kurs oder aus Abstiegen über dem Kurs.", "Which gaps the node looks for: from rises below the price or from falls above the price."),
      default: "up",
      options: Object.keys(SIDES2).map((value) => ({ value, label: SIDES2[value].label, help: SIDES2[value].help }))
    },
    minSize: {
      type: "number",
      label: l("Mindestgröße", "Minimum size"),
      help: l(
        "Wie hoch eine Lücke mindestens sein muss, in Prozent des Kurses. Kleinere zählt der Baustein nicht, im Bild stehen sie nur als Umriss. Bei BTC mit Stundenkerzen ist die Hälfte aller Lücken kleiner als 0,12 %; mit 4-Stunden-Kerzen passen 0,2 bis 0,5 %.",
        "How tall a gap has to be at least, in percent of the price. Smaller ones do not count; the chart only shows their outline. For BTC on hourly candles half of all gaps are smaller than 0.12 %; on 4-hour candles 0.2 to 0.5 % fit."
      ),
      default: 0.1,
      min: 0,
      max: 10,
      step: 0.05,
      unit: l("%", "%")
    }
  },
  sentence: ({ settings, locale }) => `${SIDES2[settings.side].label[locale].replace(/ \(.*\)$/, "")} · ${locale === "de" ? "ab" : "from"} ${fmt(settings.minSize, locale)} %`,
  short: ({ settings, pin, locale }) => (PIN_SHORT10[pin] ?? PIN_SHORT10.top)[locale].replace("{size}", `${fmt(settings.minSize, locale)} %`),
  // Eine Lücke zählt bis zu 500 Kerzen nach ihrer dritten Kerze.
  warmup: () => MAX_AGE + 2,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    handles: [{ kind: "size", setting: "minSize" }],
    signal: "enter",
    draw({ inputs: inputs2, settings }) {
      const up = settings.side === "up";
      const result = fairValueGaps(inputs2.close, inputs2.high, inputs2.low, up, settings.minSize);
      const last = inputs2.close.length - 1;
      const boxes = result.gaps.map((gap) => {
        const end = Math.min(gap.filled ?? Number.POSITIVE_INFINITY, gap.at + 1 + MAX_AGE);
        return {
          from: gap.at,
          known: gap.at + 1,
          ...end < last ? { to: end } : {},
          low: gap.low,
          high: gap.high,
          tone: up ? "up" : "down",
          faded: gap.touched !== void 0,
          ghost: !gap.counted,
          ...gap.counted ? { label: FVG } : {}
        };
      });
      const top = result.top.at(-1);
      const fill = result.fill.at(-1);
      const counted = result.gaps.filter((gap) => gap.counted).length;
      const tone = up ? "up" : "down";
      return {
        legend: [
          { kind: "box", tone, label: l("offene Lücke", "open gap") },
          { kind: "box-faded", tone, label: l("teilweise gefüllt", "partially filled") },
          { kind: "box-ghost", tone: "neutral", label: l("kleiner als die Mindestgröße", "below the minimum size") }
        ],
        boxes,
        note: top == null || fill == null ? l(`${counted} Lücken, keine offen`, `${counted} gaps, none open`) : l(`nächste Lücke bei ${formatNumber(top, "de")}, gefüllt ${formatNumber(fill, "de", 0)} %`, `nearest gap at ${formatNumber(top, "en")}, ${formatNumber(fill, "en", 0)} % filled`)
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const result = fairValueGaps(inputs2.close, inputs2.high, inputs2.low, settings.side === "up", settings.minSize);
    return { enter: result.enter, inside: result.inside, formed: result.formed, filled: result.filled, top: result.top, bottom: result.bottom, fill: result.fill };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { minSize: 0.1 },
      expectAt: {
        "38": { formed: false, top: null },
        "39": { formed: true, top: 84666, bottom: 84574.01, fill: 0 },
        "40": { enter: true, filled: true }
      },
      expectLast: { top: 81755.01, bottom: 80772.98, fill: 96.30663014368197 }
    }
  ]
});

// packages/nodes/src/indicators/opening-range.ts
var SHORT4 = {
  high: l("Hoch der Eröffnungsspanne", "opening range high"),
  low: l("Tief der Eröffnungsspanne", "opening range low"),
  mid: l("Mitte der Eröffnungsspanne", "opening range mid")
};
function sessionStartOn(ms, days, hour, minute, timeZone) {
  const p = zonedParts(ms, timeZone);
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return zonedTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, minute, timeZone);
}
function openingRangeSeries(high, low, bars, options) {
  const n = bars.length;
  const out = { high: new Array(n).fill(null), low: new Array(n).fill(null) };
  const duration = options.minutes * MINUTE;
  let start = Number.NaN;
  let next = Number.NaN;
  let valid = false;
  let done = false;
  let top = null;
  let bottom = null;
  for (let i = 0; i < n; i++) {
    const opened = bars.openTime[i] ?? 0;
    const closed = bars.closeTime[i] ?? 0;
    if (!(opened >= start && opened < next)) {
      start = sessionStartOn(opened, 0, options.hour, options.minute, options.timeZone);
      if (start > opened) start = sessionStartOn(opened, -1, options.hour, options.minute, options.timeZone);
      next = sessionStartOn(start, 1, options.hour, options.minute, options.timeZone);
      valid = opened === start;
      done = false;
      top = null;
      bottom = null;
    }
    if (!valid) continue;
    if (!done) {
      const h = high[i];
      const lo = low[i];
      if (closed <= start + duration && h != null && lo != null) {
        top = top === null ? Math.max(h, lo) : Math.max(top, h, lo);
        bottom = bottom === null ? Math.min(h, lo) : Math.min(bottom, h, lo);
      }
      done = closed >= start + duration;
    }
    if (done && top !== null && bottom !== null) {
      out.high[i] = top;
      out.low[i] = bottom;
    }
  }
  return out;
}
var timezone = {
  ...timezoneSetting,
  help: l(
    "In welcher Zeitzone der Beginn gilt. Standard ist UTC wie bei den Tageskerzen der Börsen. Für die Eröffnung der US-Börse um 9:30 Uhr America/New_York wählen; Sommer- und Winterzeit stellt Bellchain selbst um.",
    "The time zone in which the start applies. The default is UTC, like the exchanges’ daily candles. For the US stock market open at 9:30 AM choose America/New_York; Bellchain handles daylight saving time."
  ),
  default: "UTC"
};
var openingRange = defineNode({
  id: "core.opening-range",
  version: "1.0.0",
  category: "ind",
  label: l("Eröffnungsspanne", "Opening range"),
  description: l("Hoch und Tief der ersten Minuten am Tag", "High and low of the day’s first minutes"),
  help: l(
    "Hoch und Tief der ersten Minuten einer Sitzung, etwa der ersten Stunde ab Mitternacht UTC oder ab der Eröffnung der US-Börse um 9:30 Uhr New Yorker Zeit. Viele Daytrader nehmen diese Spanne (Opening Range, im Market Profile Initial Balance) als Rahmen für den Tag: Ein Ausbruch darüber oder darunter zeigt oft die Richtung. Die Werte stehen fest, sobald die letzte Kerze der Spanne geschlossen ist, und gelten bis zum Beginn der nächsten Sitzung. Beispiel: „Kurs kreuzt Hoch der Eröffnungsspanne nach oben“ mit 60 Minuten ab 0:00 Uhr UTC meldet den Ausbruch über das Hoch der ersten Stunde.",
    "High and low of the first minutes of a session, such as the first hour from midnight UTC or from the US stock market open at 9:30 AM New York time. Many day traders take this range (opening range, called initial balance in market profile) as the frame for the day: a breakout above or below often shows the direction. The values are fixed once the last candle of the range has closed and hold until the next session begins. Example: “Price crosses above opening range high” with 60 minutes from 0:00 UTC reports the breakout above the high of the first hour."
  ),
  technical: l(
    "Sitzung ab der eingestellten Uhrzeit in der Zeitzone, ein Kalendertag lang. Hoch und Tief aller Kerzen, die ganz zwischen Beginn und Beginn + Dauer liegen, Mitte (Hoch + Tief) / 2; leer, bis die letzte davon geschlossen ist, und wenn keine Kerze genau zum Beginn öffnet.",
    "Session from the set time in the time zone, one calendar day long. High and low of all candles lying entirely between start and start + duration, middle (high + low) / 2; empty until the last of them has closed, and if no candle opens exactly at the start."
  ),
  icon: "sunrise",
  keywords: {
    de: ["eröffnungsspanne", "opening range", "orb", "initial balance", "ib", "ausbruch", "erste stunde", "session"],
    en: ["opening range", "orb", "initial balance", "ib", "breakout", "first hour", "session", "open"]
  },
  inputs: CANDLE_HL_INPUTS,
  outputs: [
    { id: "high", type: "series", label: l("Hoch", "High"), unit: "price" },
    { id: "mid", type: "series", label: l("Mitte", "Mid"), unit: "price" },
    { id: "low", type: "series", label: l("Tief", "Low"), unit: "price" }
  ],
  settings: {
    hour: {
      type: "number",
      label: l("Beginn (Uhr)", "Start (hour)"),
      help: l("Stunde, zu der die Sitzung beginnt, von 0 bis 23 in der eingestellten Zeitzone. 0 heißt Mitternacht.", "Hour the session starts, from 0 to 23 in the chosen time zone. 0 means midnight."),
      default: 0,
      min: 0,
      max: 23,
      integer: true,
      step: 1
    },
    minute: {
      type: "number",
      label: l("Beginn (Minute)", "Start (minute)"),
      help: l(
        "Minute zur Stunde, etwa 30 für 9:30 Uhr. Der Beginn muss auf den Anfang einer Kerze fallen: Mit Stundenkerzen gehen nur volle Stunden, mit 15-Minuten-Kerzen auch 9:30 Uhr.",
        "Minute of the hour, such as 30 for 9:30 AM. The start must fall on the beginning of a candle: with hourly candles only full hours work, with 15-minute candles 9:30 AM works too."
      ),
      default: 0,
      min: 0,
      max: 59,
      integer: true,
      step: 15,
      advanced: true
    },
    minutes: {
      type: "number",
      label: l("Dauer", "Duration"),
      help: l(
        "Wie viele Minuten die Spanne dauert. 60 ist üblich (Initial Balance), 15 oder 30 für eine kurze Opening Range. Die Kerzen der Chain dürfen nicht länger sein als die Spanne.",
        "How many minutes the range lasts. 60 is usual (initial balance), 15 or 30 for a short opening range. The chain’s candles must not be longer than the range."
      ),
      default: 60,
      min: 1,
      max: 720,
      integer: true,
      step: 15,
      unit: l("Min.", "min")
    },
    timezone
  },
  sentence: ({ settings, locale }) => {
    const zone = settings.timezone === "UTC" ? "UTC" : (settings.timezone.split("/").pop() ?? settings.timezone).replaceAll("_", " ");
    return locale === "de" ? `${settings.minutes} Min. ab ${clock(settings.hour, settings.minute, locale)} ${zone}` : `${settings.minutes} min from ${clock(settings.hour, settings.minute, locale)} ${zone}`;
  },
  short: ({ pin, locale }) => (SHORT4[pin] ?? SHORT4.high)[locale],
  warmup: ({ timeframe }) => barsForDays(2, timeframe),
  compute({ inputs: inputs2, settings, bars }) {
    const range2 = openingRangeSeries(inputs2.high, inputs2.low, bars, { hour: settings.hour, minute: settings.minute, minutes: settings.minutes, timeZone: settings.timezone });
    return { high: range2.high, mid: series_exports.div(series_exports.add(range2.high, range2.low), 2), low: range2.low };
  },
  // Referenzwerte aus scripts/pine-reference.py. Mit Stundenkerzen ist die erste Stunde eine Kerze: Kerze 20 öffnet am
  // 27.09. um 0:00 Uhr UTC.
  tests: [
    {
      name: "erste Stunde ab 0:00 Uhr UTC",
      fixture: FIXTURE,
      inputs: CANDLE_HL,
      settings: { hour: 0, minute: 0, minutes: 60, timezone: "UTC" },
      expectAt: { "19": { high: null }, "20": { high: 84443.26, low: 84257.07, mid: 84350.165 } },
      expectLast: { high: 82466.4, low: 82212, mid: 82339.2 }
    }
  ]
});

// packages/nodes/src/indicators/pivots.ts
var KINDS4 = {
  classic: {
    label: l("Klassisch", "Classic"),
    help: l(
      "Die übliche Rechnung: Der Pivot ist der Mittelwert aus Hoch, Tief und Schluss. R2 und S2 liegen eine ganze Spanne des vorigen Zeitraums vom Pivot entfernt, R3 und S3 zwei.",
      "The usual calculation: the pivot is the mean of high, low and close. R2 and S2 sit one full range of the previous period away from the pivot, R3 and S3 two."
    )
  },
  traditional: {
    label: l("Traditional", "Traditional"),
    help: l(
      "Wie Klassisch bis R2 und S2. R3 liegt eine ganze Spanne des vorigen Zeitraums über R1, S3 eine unter S1; so rechnen viele Chart-Programme ihre Standard-Pivots.",
      "Like Classic up to R2 and S2. R3 sits one full range of the previous period above R1, S3 one below S1; this is how many charting tools compute their standard pivots."
    )
  },
  fibonacci: {
    label: l("Fibonacci", "Fibonacci"),
    help: l(
      "Die Marken liegen 38,2 %, 61,8 % und 100 % der Spanne des vorigen Zeitraums über und unter dem Pivot.",
      "The levels sit 38.2 %, 61.8 % and 100 % of the previous period’s range above and below the pivot."
    )
  },
  camarilla: {
    label: l("Camarilla", "Camarilla"),
    help: l(
      "Enge Marken nah am Schlusskurs des vorigen Zeitraums, gedacht für Umkehrpunkte innerhalb des Tages. R3 und S3 gelten als die wichtigsten.",
      "Tight levels close to the previous period’s close, meant for turning points within the day. R3 and S3 count as the most important ones."
    )
  },
  woodie: {
    label: l("Woodie", "Woodie"),
    help: l(
      "Statt des Schlusskurses zählt die Eröffnung des laufenden Tages doppelt. Dadurch liegt der Pivot näher am aktuellen Kurs.",
      "Instead of the close, the current day’s open counts twice. That puts the pivot closer to the current price."
    )
  }
};
var PERIODS2 = {
  day: {
    label: l("Vortag", "previous day"),
    help: l(
      "Hoch, Tief und Schluss des gestrigen Tages. Die Marken gelten den ganzen Tag und kommen um Mitternacht neu. Üblich für Kerzen bis 1 Stunde.",
      "High, low and close of the previous day. The levels hold all day and are renewed at midnight. Usual for candles up to 1 hour."
    )
  },
  week: {
    label: l("Vorwoche", "previous week"),
    help: l(
      "Hoch, Tief und Schluss der letzten Kalenderwoche, Montag bis Sonntag. Die Marken gelten die ganze Woche. Passt zu 4-Stunden-Kerzen.",
      "High, low and close of the last calendar week, Monday to Sunday. The levels hold all week. Suits 4-hour candles."
    )
  },
  month: {
    label: l("Vormonat", "previous month"),
    help: l(
      "Hoch, Tief und Schluss des letzten Kalendermonats. Die Marken gelten den ganzen Monat. Passt zu Tageskerzen.",
      "High, low and close of the last calendar month. The levels hold all month. Suits daily candles."
    )
  }
};
var LEVEL_NAMES = { pivot: "Pivot", r1: "R1", r2: "R2", r3: "R3", s1: "S1", s2: "S2", s3: "S3" };
var LEVELS2 = {
  r3: l("Dritter Widerstand, weit über dem Pivot; der Kurs erreicht ihn nur an Tagen mit großer Spanne.", "Third resistance, far above the pivot; the price only reaches it on days with a large range."),
  r2: l("Zweiter Widerstand über dem Pivot.", "Second resistance above the pivot."),
  r1: l("Erster Widerstand über dem Pivot, das meistbeachtete Ziel nach oben.", "First resistance above the pivot, the most watched target to the upside."),
  pivot: l("Die Mitte aus Hoch, Tief und Schluss des vorigen Zeitraums.", "The middle from the high, low and close of the previous period."),
  s1: l("Erste Stütze unter dem Pivot, das meistbeachtete Ziel nach unten.", "First support below the pivot, the most watched target to the downside."),
  s2: l("Zweite Stütze unter dem Pivot.", "Second support below the pivot."),
  s3: l("Dritte Stütze, weit unter dem Pivot.", "Third support, far below the pivot.")
};
function levelName(pin, period, locale) {
  const level = LEVEL_NAMES[pin] ?? LEVEL_NAMES.pivot;
  if (period === "day") return level;
  if (locale === "de") return `${level} ${period === "week" ? "Woche" : "Monat"}`;
  return `${period === "week" ? "weekly" : "monthly"} ${level}`;
}
var pivotPoints = defineNode({
  id: "core.pivots",
  version: "1.0.0",
  category: "ind",
  label: l("Pivot-Punkte", "Pivot points"),
  description: l("Stützen und Widerstände vom Zeitraum davor", "Support and resistance of the prior period"),
  help: l(
    "Rechnet aus Hoch, Tief und Schluss des Vortags feste Marken für den laufenden Tag: den Pivot in der Mitte, darüber die Widerstände R1 bis R3, darunter die Stützen S1 bis S3. Viele Händler achten auf diese Marken, deshalb dreht der Kurs dort oft oder zieht an, wenn er sie durchbricht. Statt des Vortags gehen auch Vorwoche und Vormonat. Der Ausgang „nahe“ meldet, wenn eine Kerze einem gewählten Level bis auf ein Band von ±x % nahekommt. Beispiel: „Kurs kreuzt R1 nach oben“ meldet, wenn BTC über den ersten Widerstand des Tages steigt; „nahe R1 ±0,3 %“ schon, wenn er bis auf 0,3 % herankommt.",
    "Calculates fixed levels for the current day from the previous day’s high, low and close: the pivot in the middle, the resistances R1 to R3 above, the supports S1 to S3 below. Many traders watch these levels, so the price often turns there or speeds up when it breaks through. Instead of the previous day you can use the previous week or month. The “near” output reports when a candle comes within a band of ±x % of a chosen level. Example: “Price crosses above R1” fires when BTC rises above the first resistance of the day; “near R1 ±0.3 %” already when it gets within 0.3 %."
  ),
  technical: l(
    "Pivot (H + L + C) / 3 aus Hoch, Tief und Schluss des vorigen Zeitraums, R1 bis R3 und S1 bis S3 je nach Art im Abstand der Spanne H − L; Traditional mit R3 = 2 × P + (H − 2 × L) und S3 = 2 × P − (2 × H − L); Woodie mit (H + L + 2 × O) / 4, O die Eröffnung des laufenden Zeitraums. Alle fünf Arten mit denselben Werten wie der eingebaute Indikator Pivot Points Standard von TradingView. Ist der Eingang Eröffnung nicht verbunden, nimmt Woodie den Schluss davor. „nahe“: Tief ≤ Level × (1 + x / 100) und Hoch ≥ Level × (1 − x / 100).",
    "Pivot (H + L + C) / 3 from the high, low and close of the previous period, R1 to R3 and S1 to S3 spaced by the range H − L depending on the type; Traditional with R3 = 2 × P + (H − 2 × L) and S3 = 2 × P − (2 × H − L); Woodie with (H + L + 2 × O) / 4, O being the current period’s open. All five types with the same values as TradingView’s built-in Pivot Points Standard indicator. If the Open input isn’t connected, Woodie uses the previous close. “near”: low ≤ level × (1 + x / 100) and high ≥ level × (1 − x / 100)."
  ),
  icon: "rows-3",
  keywords: {
    de: ["pivot", "widerstand", "unterstützung", "stütze", "r1", "s1", "level", "marke", "nahe", "traditional"],
    en: ["pivot", "resistance", "support", "r1", "s1", "level", "near", "traditional"]
  },
  inputs: CANDLE_COHL_INPUTS,
  outputs: [
    { id: "pivot", type: "series", label: l("Pivot", "Pivot"), unit: "price" },
    { id: "r1", type: "series", label: l("R1", "R1"), unit: "price" },
    { id: "r2", type: "series", label: l("R2", "R2"), unit: "price" },
    { id: "r3", type: "series", label: l("R3", "R3"), unit: "price" },
    { id: "s1", type: "series", label: l("S1", "S1"), unit: "price" },
    { id: "s2", type: "series", label: l("S2", "S2"), unit: "price" },
    { id: "s3", type: "series", label: l("S3", "S3"), unit: "price" },
    NEAR_OUTPUT
  ],
  settings: {
    kind: {
      type: "select",
      label: l("Art", "Type"),
      help: l("Nach welcher Rechnung die Marken entstehen. Im Zweifel Klassisch nehmen.", "Which calculation the levels come from. If unsure, use Classic."),
      default: "classic",
      options: Object.keys(KINDS4).map((value) => ({ value, label: KINDS4[value].label, help: KINDS4[value].help }))
    },
    period: {
      type: "select",
      label: l("Zeitraum", "Period"),
      help: l("Aus welchem Zeitraum Hoch, Tief und Schluss stammen.", "Which period the high, low and close come from."),
      default: "day",
      options: Object.keys(PERIODS2).map((value) => ({ value, label: PERIODS2[value].label, help: PERIODS2[value].help }))
    },
    timezone: utcTimezoneSetting,
    level: levelSetting(
      Object.keys(LEVELS2).map((value) => ({ value, label: l(LEVEL_NAMES[value], LEVEL_NAMES[value]), help: LEVELS2[value] })),
      "pivot"
    ),
    width: levelWidthSetting
  },
  // „nahe R1 ±0,3 %“ steht nur da, wenn der Ausgang „nahe“ verbunden ist.
  sentence: ({ settings, locale, output }) => `${KINDS4[settings.kind].label[locale]} · ${PERIODS2[settings.period].label[locale]}` + (output?.("near") ? ` · ${nearText(levelName(settings.level, settings.period, locale), settings.width, locale)}` : ""),
  short: ({ settings, pin, locale }) => pin === "near" ? nearText(levelName(settings.level, settings.period, locale), settings.width, locale) : levelName(pin, settings.period, locale),
  warmup: ({ settings, timeframe }) => barsForDays(settings.period === "day" ? 2 : settings.period === "week" ? 14 : 62, timeframe),
  compute({ inputs: inputs2, settings, bars }) {
    const previous = previousPeriodHlc(inputs2.high, inputs2.low, inputs2.close, bars, settings.period, settings.timezone);
    const open = settings.kind === "woodie" && inputs2.open ? periodOpen(inputs2.open, bars, settings.period, settings.timezone) : void 0;
    const levels = series_exports.pivotLevels(settings.kind, previous.high, previous.low, previous.close, open);
    const near = nearLevel(inputs2.high, inputs2.low, levels[settings.level], settings.width);
    return { pivot: levels.pivot, r1: levels.r1, r2: levels.r2, r3: levels.r3, s1: levels.s1, s2: levels.s2, s3: levels.s3, near };
  },
  visual: {
    kind: "levels",
    series: { input: "close" },
    high: { input: "high" },
    low: { input: "low" },
    levels: Object.keys(LEVELS2),
    level: "level",
    width: "width",
    signal: "near"
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung). Die Kerzen beginnen am 26.09. um 4:00 UTC:
  // Der 26. ist angeschnitten, der 27. der erste volle Tag, seine Marken gelten ab dem 28. um 0:00 UTC (Kerze 44).
  tests: [
    {
      name: "Klassisch, Vortag in UTC",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { kind: "classic", period: "day", timezone: "UTC" },
      expectAt: { "43": { pivot: null }, "44": { pivot: 84587.67666666667, r1: 85043.35333333333, s1: 84016.32333333333 } },
      expectLast: {
        pivot: 81560.07666666666,
        r1: 83320.15333333334,
        r2: 84394.37666666666,
        r3: 87228.67666666667,
        s1: 80485.85333333333,
        s2: 78725.77666666667,
        s3: 75891.47666666667
      }
    },
    {
      name: "Camarilla, Vortag in UTC",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { kind: "camarilla", period: "day", timezone: "UTC" },
      expectLast: { r3: 83025.3625, s3: 81466.4975 }
    },
    {
      name: "Woodie mit der Eröffnung des laufenden Tages",
      fixture: FIXTURE,
      inputs: CANDLE_OHLC,
      settings: { kind: "woodie", period: "day", timezone: "UTC" },
      expectAt: { "43": { pivot: null }, "44": { pivot: 84558.7625, r3: 86012.555, s3: 82931.465 } },
      expectLast: { pivot: 81731.54, r3: 86497.38, s3: 77994.48 }
    }
  ]
});

// packages/nodes/src/indicators/premium-discount.ts
var PIN_SHORT11 = {
  discount: l("im Discount", "in discount"),
  premium: l("im Premium", "in premium"),
  equilibrium: l("im Gleichgewicht", "at equilibrium"),
  position: l("Lage in der Spanne", "position in range"),
  top: l("Spanne oben", "range high"),
  bottom: l("Spanne unten", "range low"),
  middle: l("Gleichgewicht", "equilibrium")
};
var ZONE = {
  premium: l("Premium", "Premium"),
  discount: l("Discount", "Discount"),
  equilibrium: l("Gleichgewicht", "Equilibrium")
};
var premiumDiscountNode = defineNode({
  id: "core.premium-discount",
  version: "1.0.0",
  category: "ind",
  label: l("Premium/Discount", "Premium/discount"),
  description: l("Lage des Kurses in der Swing-Spanne", "Where the price sits in the swing range"),
  help: l(
    "Teilt die Spanne zwischen dem letzten Swing-Hoch und dem letzten Swing-Tief: In der oberen Hälfte ist der Kurs teuer (Premium), in der unteren günstig (Discount), um die Mitte im Gleichgewicht. Viele Trader kaufen lieber im Discount und verkaufen im Premium. Steigt der Kurs über das Swing-Hoch, wächst die Spanne mit, ein neuer Swing setzt sie neu. Der Baustein meldet, in welcher Zone der Kurs schließt, und nennt seine Lage in Prozent. Beispiel: „im Discount“ mit UND vor einem bullischen Order Block lässt nur Rückläufe in der günstigen Hälfte durch.",
    "Splits the range between the last swing high and the last swing low: in the upper half the price is expensive (premium), in the lower half cheap (discount), around the middle at equilibrium. Many traders prefer to buy in discount and sell in premium. If the price rises above the swing high, the range grows with it; a new swing sets it anew. The node reports which zone the price closes in and gives its position in percent. Example: “in discount” with AND in front of a bullish order block lets only returns in the cheap half through."
  ),
  technical: l(
    "Oben: höchstes Hoch seit dem letzten bestätigten Swing-Hoch, unten: tiefstes Tief seit dem letzten bestätigten Swing-Tief, je höchstens 500 Kerzen zurück. Lage = (Schluss − unten) / (oben − unten) × 100. Discount: Lage unter 50 − Gleichgewicht, Premium: über 50 + Gleichgewicht, sonst Gleichgewicht.",
    "High: highest high since the last confirmed swing high, low: lowest low since the last confirmed swing low, each at most 500 candles back. Position = (close − low) / (high − low) × 100. Discount: position below 50 − equilibrium, premium: above 50 + equilibrium, otherwise equilibrium."
  ),
  icon: "scale",
  keywords: {
    de: ["premium", "discount", "gleichgewicht", "equilibrium", "spanne", "dealing range", "günstig", "teuer", "ote", "smart money", "smc"],
    en: ["premium", "discount", "equilibrium", "range", "dealing range", "cheap", "expensive", "ote", "smart money", "smc"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "discount", type: "signal", label: l("im Discount", "In discount") },
    { id: "premium", type: "signal", label: l("im Premium", "In premium") },
    { id: "equilibrium", type: "signal", label: l("im Gleichgewicht", "At equilibrium") },
    { id: "position", type: "series", label: l("Lage %", "Position %"), unit: "percent" },
    { id: "top", type: "series", label: l("Spanne oben", "Range high"), unit: "price" },
    { id: "bottom", type: "series", label: l("Spanne unten", "Range low"), unit: "price" },
    { id: "middle", type: "series", label: l("Gleichgewicht", "Equilibrium"), unit: "price" }
  ],
  settings: {
    band: {
      type: "number",
      label: l("Gleichgewicht ±", "Equilibrium ±"),
      help: l(
        "Wie breit das Gleichgewicht um die Mitte ist, in Prozent der Spanne. 5 heißt 45 bis 55 %: darunter Discount, darüber Premium. Mit 0 teilt die Mitte die Spanne genau, mit 25 zählen nur das untere und das obere Viertel.",
        "How wide the equilibrium around the middle is, in percent of the range. 5 means 45 to 55 %: below is discount, above is premium. With 0 the middle splits the range exactly, with 25 only the lower and upper quarter count."
      ),
      default: 5,
      min: 0,
      max: 45,
      step: 1,
      unit: l("%", "%")
    },
    ...swingSettings(10, SWING_RIGHT_USED)
  },
  sentence: ({ settings, locale }) => `${locale === "de" ? "Gleichgewicht" : "equilibrium"} ±${fmt(settings.band, locale)} % · ${settings.left} · ${settings.right}`,
  short: ({ settings, pin, locale }) => `${(PIN_SHORT11[pin] ?? PIN_SHORT11.position)[locale]} ${settings.left} · ${settings.right}`,
  warmup: ({ settings }) => MAX_AGE + settings.left + settings.right,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    handles: [
      { kind: "center", setting: "band" },
      { kind: "swing", left: "left", right: "right" }
    ],
    draw({ inputs: inputs2, settings }) {
      const result = premiumDiscount(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.band);
      const share = settings.band / 100;
      const edge = (sign) => result.top.map((top2, i) => top2 === null || result.bottom[i] == null ? null : result.middle[i] + sign * share * (top2 - result.bottom[i]));
      const upperEdge = edge(1);
      const lowerEdge = edge(-1);
      const top = result.top.at(-1);
      const bottom = result.bottom.at(-1);
      const position = result.position.at(-1);
      const zone = position == null ? void 0 : position < 50 - settings.band ? ZONE.discount : position > 50 + settings.band ? ZONE.premium : ZONE.equilibrium;
      const swing = latestSwing(result.swings);
      return {
        legend: [
          { kind: "area", tone: "down", label: ZONE.premium },
          { kind: "area", tone: "neutral", label: ZONE.equilibrium },
          { kind: "area", tone: "up", label: ZONE.discount }
        ],
        paths: [
          { upper: result.top, lower: upperEdge, tone: "down", label: ZONE.premium },
          { upper: upperEdge, lower: lowerEdge, tone: "neutral", label: ZONE.equilibrium },
          { upper: lowerEdge, lower: result.bottom, tone: "up", label: ZONE.discount },
          { upper: result.middle, tone: "neutral" }
        ],
        ...top != null && bottom != null ? { range: { low: bottom, high: top } } : {},
        ...swing ? { swing: { at: swing.at, value: swing.value, high: swing.high } } : {},
        note: position == null || zone === void 0 ? l("noch keine Spanne", "no range yet") : l(`Lage ${formatNumber(position, "de", 0)} %, ${zone.de}`, `position ${formatNumber(position, "en", 0)} %, ${zone.en.toLowerCase()}`)
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const result = premiumDiscount(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.band);
    return {
      discount: result.discount,
      premium: result.premium,
      equilibrium: result.equilibrium,
      position: result.position,
      top: result.top,
      bottom: result.bottom,
      middle: result.middle
    };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { left: 5, right: 5, band: 5 },
      expectAt: {
        "37": { position: null },
        "38": { position: 74.2503955247042, top: 85159.03, bottom: 83838, premium: true }
      },
      expectLast: { discount: true, premium: false, equilibrium: false, position: 37.83097825067087, top: 82940.81, bottom: 80809.25, middle: 81875.03 }
    }
  ]
});

// packages/nodes/src/indicators/percent-rank.ts
var NAME = l("Rang", "Rank");
var percentRank2 = defineNode({
  id: "core.percent-rank",
  version: "1.0.0",
  category: "ind",
  label: l("Prozentrang", "Percent rank"),
  description: l("Rang unter den letzten Werten, 0–100", "Rank among the last values, 0–100"),
  help: l(
    "Sagt, wo der aktuelle Wert unter den Werten der Kerzen davor steht: 90 heißt, er ist höher als oder gleich wie 90 % von ihnen, 0 heißt, so tief war er dort nie. So vergleichst du Werte, deren übliche Größe je Coin verschieden ist, etwa Volumen, Schwankung oder den Abstand zu einem Durchschnitt, ohne für jeden Coin eine eigene Zahl zu suchen. Beispiel: Historische Volatilität 20, dahinter Prozentrang 365 auf Tageskerzen unter 10, meldet, wenn die Schwankung so niedrig ist wie an kaum einem Tag im letzten Jahr.",
    "Tells you where the current value stands among the values of the candles before: 90 means it is higher than or equal to 90 % of them, 0 means it was never that low there. This lets you compare values whose usual size differs from coin to coin, such as volume, volatility or the distance to an average, without finding a separate number for each coin. Example: Historical volatility 20 followed by Percent rank 365 on daily candles below 10 reports when the swings are as low as on hardly any day in the past year."
  ),
  technical: l(
    "Anteil der Werte der eingestellten Kerzen davor, die kleiner oder gleich dem aktuellen sind, mal 100; der aktuelle zählt nicht mit, leere Werte zählen nicht. Dieselbe Formel wie ta.percentrank in TradingView.",
    "Share of the values of the chosen candles before that are less than or equal to the current one, times 100; the current one does not count, empty values do not count. The same formula as ta.percentrank in TradingView."
  ),
  icon: "gauge",
  keywords: {
    de: ["perzentil", "prozentrang", "rang", "percentile", "statistik", "jahrestief", "jahreshoch", "normalisieren"],
    en: ["percentile", "percent rank", "rank", "statistics", "yearly low", "yearly high", "normalize"]
  },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "out", type: "series", label: NAME },
    { id: "low", type: "signal", label: l("niedrig", "low") },
    { id: "high", type: "signal", label: l("hoch", "high") }
  ],
  settings: {
    length: lengthSetting(
      100,
      2,
      1e3,
      l(
        "Mit wie vielen Kerzen davor der Wert verglichen wird. Auf Tageskerzen sind 365 ein Jahr, auf Stundenkerzen 168 eine Woche. Mehr Kerzen brauchen mehr Vorlauf.",
        "How many candles before the value is compared with. On daily candles 365 is a year, on hourly candles 168 a week. More candles need more lead time."
      )
    ),
    low: {
      type: "number",
      label: l("Niedrig unter", "Low below"),
      help: l(
        "Unter dieser Linie ist der Ausgang „niedrig“ wahr. 20 heißt: niedriger als 80 % der Werte davor. Mit 5 oder 10 meldet er nur ungewöhnlich tiefe Werte.",
        "Below this line the “low” output is true. 20 means lower than 80 % of the values before. With 5 or 10 it only reports unusually low values."
      ),
      default: 20,
      min: 0,
      max: 100,
      step: 1
    },
    high: {
      type: "number",
      label: l("Hoch über", "High above"),
      help: l(
        "Über dieser Linie ist der Ausgang „hoch“ wahr. 80 heißt: höher als 80 % der Werte davor. Mit 95 meldet er nur Werte, die es dort selten gab.",
        "Above this line the “high” output is true. 80 means higher than 80 % of the values before. With 95 it only reports values that were rare there."
      ),
      default: 80,
      min: 0,
      max: 100,
      step: 1
    }
  },
  sentence: ({ settings, locale, output }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + limitSentence(settings, output, "", locale),
  short: ({ settings, pin, locale }) => pin === "out" ? `${NAME[locale]} ${settings.length}` : limitShort(`${NAME[locale]} ${settings.length}`, pin, settings, "", locale),
  warmup: ({ settings }) => settings.length + 1,
  visual: { kind: "zone", series: { output: "out" }, low: "low", high: "high", price: { input: "in" }, signal: ["low", "high"] },
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.percentRank(inputs2.in, settings.length);
    return { out, ...limitSignals(out, settings.low, settings.high) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      settings: { length: 100 },
      expectAt: { "99": { out: null }, "100": { out: 8, low: true }, "101": { low: false }, "104": { high: true }, "250": { out: 97 } },
      expectLast: { out: 19, low: true }
    },
    {
      name: "Volumen über 50 Kerzen",
      fixture: FIXTURE,
      inputs: { in: "volume" },
      settings: { length: 50 },
      expectAt: { "49": { out: null }, "50": { out: 84 }, "250": { out: 92 } },
      expectLast: { out: 22 }
    }
  ]
});

// packages/nodes/src/indicators/previous-period.ts
var PERIODS3 = {
  day: {
    label: l("Vortag", "previous day"),
    help: l("Die Werte des gestrigen Tages. Sie gelten den ganzen Tag und kommen um Mitternacht neu.", "The values of the previous day. They hold all day and are renewed at midnight.")
  },
  week: {
    label: l("Vorwoche", "previous week"),
    help: l("Die Werte der letzten Kalenderwoche, Montag bis Sonntag. Sie gelten die ganze Woche.", "The values of the last calendar week, Monday to Sunday. They hold all week.")
  },
  month: {
    label: l("Vormonat", "previous month"),
    help: l("Die Werte des letzten Kalendermonats. Sie gelten den ganzen Monat.", "The values of the last calendar month. They hold all month.")
  }
};
var STEMS = { day: l("Vortages", "previous day"), week: l("Vorwochen", "previous week"), month: l("Vormonats", "previous month") };
var PARTS = {
  open: l("eröffnung", "open"),
  high: l("hoch", "high"),
  low: l("tief", "low"),
  close: l("schluss", "close"),
  mid: l("mitte", "mid")
};
var previousPeriod2 = defineNode({
  id: "core.previous-period",
  version: "1.0.0",
  category: "ind",
  label: l("Voriger Zeitraum", "Previous period"),
  description: l("Hoch, Tief und Schluss von gestern", "Yesterday’s high, low and close"),
  help: l(
    "Liefert Eröffnung, Hoch, Tief und Schluss des Vortags, der Vorwoche oder des Vormonats und die Mitte zwischen Hoch und Tief. Viele Trader zeichnen diese Marken jeden Tag ein: Das Hoch von gestern ist oft ein Widerstand, das Tief eine Stütze, und ein Ausbruch darüber gilt als Zeichen von Stärke. Beispiel: „Kurs kreuzt Vortageshoch nach oben“ meldet, wenn BTC über das Hoch von gestern steigt.",
    "Gives the open, high, low and close of the previous day, week or month and the middle between high and low. Many traders mark these levels every day: yesterday’s high is often resistance, its low support, and a breakout above counts as a sign of strength. Example: “Price crosses above previous day high” reports when BTC rises above yesterday’s high."
  ),
  technical: l(
    "Erste Eröffnung, höchstes Hoch, tiefstes Tief und letzter Schluss der Kerzen des vorigen Kalenderzeitraums in der eingestellten Zeitzone, Mitte (Hoch + Tief) / 2. In UTC sind das die Werte der Tageskerze von gestern bei der Börse. Ein Zeitraum, der vor der ersten geladenen Kerze begonnen hat, zählt nicht.",
    "First open, highest high, lowest low and last close of the candles of the previous calendar period in the chosen time zone, middle (high + low) / 2. In UTC these are the values of the exchange’s daily candle from yesterday. A period that began before the first loaded candle does not count."
  ),
  icon: "history",
  keywords: {
    de: ["vortag", "vortageshoch", "vortagestief", "vorwoche", "vormonat", "pdh", "pdl", "gestern", "schluss", "level"],
    en: ["previous day", "prior day", "yesterday", "pdh", "pdl", "previous week", "previous month", "close", "level"]
  },
  inputs: CANDLE_BODY_INPUTS,
  outputs: [
    { id: "open", type: "series", label: l("Eröffnung", "Open"), unit: "price" },
    { id: "high", type: "series", label: l("Hoch", "High"), unit: "price" },
    { id: "low", type: "series", label: l("Tief", "Low"), unit: "price" },
    { id: "close", type: "series", label: l("Schluss", "Close"), unit: "price" },
    { id: "mid", type: "series", label: l("Mitte", "Mid"), unit: "price" }
  ],
  settings: {
    period: {
      type: "select",
      label: l("Zeitraum", "Period"),
      help: l("Aus welchem Zeitraum die Werte stammen.", "Which period the values come from."),
      default: "day",
      options: Object.keys(PERIODS3).map((value) => ({ value, label: PERIODS3[value].label, help: PERIODS3[value].help }))
    },
    timezone: utcTimezoneSetting
  },
  sentence: ({ settings, locale }) => PERIODS3[settings.period].label[locale],
  short: ({ settings, pin, locale }) => {
    const part = (PARTS[pin] ?? PARTS.high)[locale];
    return locale === "de" ? `${STEMS[settings.period].de}${part}` : `${STEMS[settings.period].en} ${part}`;
  },
  warmup: ({ settings, timeframe }) => barsForDays(settings.period === "day" ? 2 : settings.period === "week" ? 14 : 62, timeframe),
  compute({ inputs: inputs2, settings, bars }) {
    const previous = previousPeriodOhlc(inputs2.open, inputs2.high, inputs2.low, inputs2.close, bars, settings.period, settings.timezone);
    return { open: previous.open, high: previous.high, low: previous.low, close: previous.close, mid: series_exports.div(series_exports.add(previous.high, previous.low), 2) };
  },
  // Referenzwerte aus scripts/pine-reference.py; der 27.09. ist der erste volle Tag in UTC, seine Werte gelten ab Kerze 44.
  tests: [
    {
      name: "Vortag in UTC",
      fixture: FIXTURE,
      inputs: CANDLE_OHLC,
      settings: { period: "day", timezone: "UTC" },
      expectAt: { "43": { high: null }, "44": { open: 84433.11, high: 85159.03, low: 84132, close: 84472, mid: 84645.515 } },
      expectLast: { open: 81682.02, high: 82634.3, low: 79800, close: 82245.93, mid: 81217.15 }
    }
  ]
});

// packages/nodes/src/indicators/psar.ts
var SETTINGS2 = {
  start: {
    type: "number",
    label: l("Start", "Start"),
    help: l(
      "Wie schnell die Punkte zu Beginn eines Trends nachziehen, üblich ist 0,02. Größere Werte ziehen sie schneller an den Kurs heran.",
      "How fast the dots trail at the start of a trend, usually 0.02. Larger values pull them towards the price faster."
    ),
    default: 0.02,
    min: 1e-3,
    max: 1,
    step: 0.01
  },
  increment: {
    type: "number",
    label: l("Schritt", "Step"),
    help: l(
      "Um so viel werden die Punkte schneller, wenn der Kurs im Aufwärtstrend ein neues Hoch macht, im Abwärtstrend ein neues Tief. Üblich ist 0,02.",
      "How much faster the dots get when the price makes a new high in an uptrend, a new low in a downtrend. Usually 0.02."
    ),
    default: 0.02,
    min: 1e-3,
    max: 1,
    step: 0.01
  },
  max: {
    type: "number",
    label: l("Höchstwert", "Maximum"),
    help: l(
      "Grenze für das Tempo der Punkte, üblich ist 0,2. Kleinere Werte lassen ihnen in langen Trends mehr Abstand zum Kurs.",
      "Limit for the speed of the dots, usually 0.2. Smaller values give them more room to the price in long trends."
    ),
    default: 0.2,
    min: 1e-3,
    max: 1,
    step: 0.01
  }
};
function name2(settings, locale) {
  return `SAR ${fmt(settings.start, locale)} · ${fmt(settings.increment, locale)} · ${fmt(settings.max, locale)}`;
}
function sarWarmup(settings) {
  return Math.ceil(10 / (settings.start + settings.increment)) + 200;
}
var parabolicSar = defineNode({
  id: "core.psar",
  version: "1.0.0",
  category: "ind",
  label: l("Parabolic SAR", "Parabolic SAR"),
  description: l("Trendstopp, der bei einer Wende umspringt", "Trend stop that flips when the trend turns"),
  help: l(
    "Setzt Punkte unter den Kurs, solange er steigt, und darüber, solange er fällt. Mit jedem neuen Hoch im Aufwärtstrend, jedem neuen Tief im Abwärtstrend rücken sie schneller nach. Berührt der Kurs die Punkte, dreht der Trend und sie springen auf die andere Seite. Viele nutzen sie als nachgezogenen Stopp. Die Signale „aufwärts“ und „abwärts“ sind wahr, solange der Trend in diese Richtung zeigt. Beispiel: „Parabolic SAR abwärts“ meldet, sobald der Trend nach unten dreht.",
    "Places dots below the price while it rises and above it while it falls. With every new high in an uptrend, every new low in a downtrend, they trail faster. When the price touches the dots, the trend turns and they jump to the other side. Many use them as a trailing stop. The “up” and “down” signals are true as long as the trend points that way. Example: “Parabolic SAR down” reports as soon as the trend turns down."
  ),
  technical: l(
    "Parabolic SAR nach Wilder: Der Punkt läuft mit dem Beschleunigungsfaktor auf das Extrem des Trends zu; der Faktor beginnt beim Start und steigt mit jedem neuen Extrem um den Schritt bis zum Höchstwert. Der Punkt bleibt außerhalb der Spanne der zwei Kerzen davor; berührt der Kurs ihn, dreht der Trend. Die erste Richtung folgt an der zweiten Kerze aus dem Schluss davor. Dieselbe Rechnung wie ta.sar in TradingView.",
    "Parabolic SAR after Wilder: the dot moves towards the extreme of the trend by the acceleration factor; the factor starts at the start value and rises by the step with every new extreme up to the maximum. The dot stays outside the range of the two candles before; when the price touches it, the trend turns. The first direction follows on the second candle from the close before. The same calculation as ta.sar in TradingView."
  ),
  icon: "chart-scatter",
  keywords: {
    de: ["parabolic", "sar", "stopp", "nachgezogener stopp", "trend", "wende", "punkte"],
    en: ["parabolic", "sar", "stop", "trailing stop", "trend", "reversal", "dots"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "line", type: "series", label: l("SAR", "SAR"), unit: "price" },
    { id: "up", type: "signal", label: l("aufwärts", "up") },
    { id: "down", type: "signal", label: l("abwärts", "down") }
  ],
  settings: SETTINGS2,
  sentence: ({ settings, locale }) => `${fmt(settings.start, locale)} · ${fmt(settings.increment, locale)} · ${fmt(settings.max, locale)}`,
  short: ({ settings, pin, locale }) => {
    if (pin === "up") return `${name2(settings, locale)} ${locale === "de" ? "aufwärts" : "up"}`;
    if (pin === "down") return `${name2(settings, locale)} ${locale === "de" ? "abwärts" : "down"}`;
    return name2(settings, locale);
  },
  warmup: ({ settings }) => sarWarmup(settings),
  compute({ inputs: inputs2, settings }) {
    const sar2 = series_exports.sar(inputs2.high, inputs2.low, inputs2.close, settings.start, settings.increment, settings.max);
    return { line: sar2.line, up: sar2.direction.map((d) => d === 1), down: sar2.direction.map((d) => d === -1) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { start: 0.02, increment: 0.02, max: 0.2 },
      expectAt: { "0": { line: null, up: false, down: false }, "1": { line: 84045.65, up: false, down: true }, "3": { up: true } },
      expectLast: { line: 81975.88284735812, up: false, down: true }
    }
  ]
});

// packages/nodes/src/indicators/round-numbers.ts
var LEVELS3 = {
  above: { label: l("darüber", "above"), help: l("Die nächste runde Zahl über dem Kurs, etwa ein Widerstand.", "The next round number above the price, such as resistance.") },
  below: { label: l("darunter", "below"), help: l("Die runde Zahl am oder unter dem Kurs, etwa eine Unterstützung.", "The round number at or below the price, such as support.") }
};
var PIN_SHORT12 = {
  above: l("Runde Zahl darüber", "Round number above"),
  below: l("Runde Zahl darunter", "Round number below"),
  crossUp: l("Runde Zahl nach oben gekreuzt", "Round number crossed up"),
  crossDown: l("Runde Zahl nach unten gekreuzt", "Round number crossed down")
};
var EPSILON = 1e-9;
function autoStep(price) {
  return 10 ** (Math.floor(Math.log10(price) + EPSILON) - 1);
}
function multiple(k, step) {
  return Number((k * step).toPrecision(12));
}
function bucket(value, step) {
  return Math.floor(value / step + EPSILON);
}
function roundLevels(close, step) {
  const n = close.length;
  const out = { above: new Array(n).fill(null), below: new Array(n).fill(null), crossUp: new Array(n).fill(false), crossDown: new Array(n).fill(false) };
  for (let i = 0; i < n; i++) {
    const c = close[i];
    if (c == null || c <= 0) continue;
    const size = step > 0 ? step : autoStep(c);
    const k = bucket(c, size);
    out.below[i] = multiple(k, size);
    out.above[i] = multiple(k + 1, size);
    const previous = i > 0 ? close[i - 1] : null;
    if (previous == null || previous <= 0) continue;
    const before = bucket(previous, size);
    out.crossUp[i] = k > before;
    out.crossDown[i] = k < before;
  }
  return out;
}
function stepText(step, locale) {
  return step > 0 ? formatNumber(step, locale) : locale === "de" ? "automatisch" : "automatic";
}
var roundNumbers = defineNode({
  id: "core.round-numbers",
  version: "1.0.0",
  category: "ind",
  label: l("Runde Zahlen", "Round numbers"),
  description: l("Runde Marken über und unter dem Kurs", "Round levels above and below the price"),
  help: l(
    "Findet die runden Zahlen über und unter dem Kurs, etwa 85.000 $ und 84.000 $ bei BTC, und meldet, wenn der Schluss eine davon kreuzt. Viele Händler setzen Orders an solche Marken; deshalb reagiert der Kurs dort oft. Die Stufe stellst du fest ein, etwa 5.000, oder lässt sie automatisch: eine Zehnerpotenz unter der Größe des Kurses. Der Ausgang „nahe“ meldet, wenn eine Kerze der gewählten Marke bis auf ±x % nahekommt. Beispiel: Mit Stufe 10.000 meldet „nach oben gekreuzt“ jede neue Zehntausender-Marke, etwa „BTC über 100.000 $“.",
    "Finds the round numbers above and below the price, such as $85,000 and $84,000 for BTC, and reports when the close crosses one of them. Many traders place orders at such levels, so the price often reacts there. You set the step to a fixed value such as 5,000, or leave it automatic: one power of ten below the size of the price. The “near” output reports when a candle comes within ±x % of the chosen level. Example: with step 10,000, “crossed up” reports every new ten-thousand level, such as “BTC above $100,000”."
  ),
  technical: l(
    "Darunter = ⌊Schluss / Stufe⌋ · Stufe, darüber eine Stufe mehr. Automatische Stufe: 10 hoch (⌊log₁₀ Schluss⌋ − 1). Nach oben gekreuzt, wenn ⌊Schluss / Stufe⌋ größer ist als beim Schluss davor (mit der Stufe der aktuellen Kerze), nach unten, wenn kleiner; ein Schluss genau auf der Marke zählt als darüber. „nahe“: Tief ≤ Marke · (1 + x / 100) und Hoch ≥ Marke · (1 − x / 100).",
    "Below = ⌊close / step⌋ · step, above one step more. Automatic step: 10 to the power (⌊log₁₀ close⌋ − 1). Crossed up when ⌊close / step⌋ is larger than for the previous close (with the step of the current candle), crossed down when smaller; a close exactly on the level counts as above. “near”: low ≤ level · (1 + x / 100) and high ≥ level · (1 − x / 100)."
  ),
  icon: "milestone",
  keywords: {
    de: ["runde zahlen", "runde marke", "psychologisch", "marke", "level", "meilenstein", "tausender"],
    en: ["round numbers", "round number", "psychological level", "big figure", "level", "milestone", "whole number"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "above", type: "series", label: l("darüber", "above"), unit: "price" },
    { id: "below", type: "series", label: l("darunter", "below"), unit: "price" },
    { id: "crossUp", type: "signal", label: l("nach oben gekreuzt", "crossed up") },
    { id: "crossDown", type: "signal", label: l("nach unten gekreuzt", "crossed down") },
    { id: "near", type: "signal", label: l("nahe", "near") }
  ],
  settings: {
    step: {
      type: "number",
      label: l("Stufe", "Step"),
      help: l(
        "Abstand der runden Zahlen im Kurs, etwa 1.000 oder 5.000 bei BTC, 100 bei ETH. 0 heißt automatisch: eine Zehnerpotenz unter der Größe des Kurses, bei 84.000 $ also 1.000 $, bei 0,25 $ 0,01 $.",
        "Distance between the round numbers in price terms, such as 1,000 or 5,000 for BTC, 100 for ETH. 0 means automatic: one power of ten below the size of the price, so $1,000 at $84,000 and $0.01 at $0.25."
      ),
      default: 0,
      min: 0
    },
    level: levelSetting(
      Object.keys(LEVELS3).map((value) => ({ value, label: LEVELS3[value].label, help: LEVELS3[value].help })),
      "above"
    ),
    width: levelWidthSetting
  },
  sentence: ({ settings, locale, output }) => `${locale === "de" ? "Stufe" : "Step"} ${stepText(settings.step, locale)}` + (output?.("near") ? ` · ${nearText(LEVELS3[settings.level].label[locale], settings.width, locale)}` : ""),
  short: ({ settings, pin, locale }) => pin === "near" ? nearText(PIN_SHORT12[settings.level][locale], settings.width, locale) : (PIN_SHORT12[pin] ?? PIN_SHORT12.above)[locale],
  warmup: () => 1,
  visual: { kind: "levels", series: { input: "close" }, high: { input: "high" }, low: { input: "low" }, levels: Object.keys(LEVELS3), level: "level", width: "width", signal: ["crossUp", "crossDown", "near"] },
  compute({ inputs: inputs2, settings }) {
    const levels = roundLevels(inputs2.close, settings.step);
    return { ...levels, near: nearLevel(inputs2.high, inputs2.low, levels[settings.level], settings.width) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "automatisch, bei BTC 1.000",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      expectAt: { "0": { below: 83e3, above: 84e3 }, "3": { crossUp: true }, "9": { crossDown: true }, "250": { below: 86e3, above: 87e3 } },
      expectLast: { below: 81e3, above: 82e3 }
    },
    {
      name: "Stufe 5.000",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { step: 5e3 },
      expectAt: { "0": { below: 8e4, above: 85e3 }, "32": { crossUp: false }, "33": { crossUp: true }, "34": { crossDown: true }, "250": { below: 85e3 } },
      expectLast: { below: 8e4, above: 85e3 }
    }
  ]
});

// packages/nodes/src/indicators/rsi.ts
var RANGE3 = { oversold: 30, overbought: 70, min: 0, max: 100, step: 1 };
var rsi2 = defineNode({
  id: "core.rsi",
  version: "1.0.0",
  category: "ind",
  label: l("RSI", "RSI"),
  description: l("Zeigt überkauft und überverkauft, 0–100", "Shows overbought and oversold, 0–100"),
  help: l(
    "Vergleicht die Gewinne der letzten Kerzen mit den Verlusten und macht daraus eine Zahl von 0 bis 100. Unter 30 ist der Kurs in kurzer Zeit stark gefallen (überverkauft), über 70 stark gestiegen (überkauft). Um 50 halten sich Gewinne und Verluste die Waage. Die Ausgänge „überverkauft“ und „überkauft“ sind wahr, solange der RSI unter bzw. über seinen Schwellen liegt; im Bild unter dem Kurs ziehst du sie. Beispiel: „RSI 14 unter 30“ meldet sich nach einem schnellen Abverkauf.",
    "Compares the gains of the last candles with the losses and turns that into a number from 0 to 100. Below 30 the price has fallen hard in a short time (oversold), above 70 it has risen hard (overbought). Around 50, gains and losses are balanced. The “oversold” and “overbought” outputs are true while the RSI is below or above its thresholds; you drag them in the chart below the price. Example: “RSI 14 below 30” fires after a quick sell-off."
  ),
  technical: l(
    "Relative Strength Index nach Wilder, geglättet mit RMA; dieselbe Formel wie ta.rsi in TradingView.",
    "Wilder’s Relative Strength Index, smoothed with RMA; the same formula as ta.rsi in TradingView."
  ),
  icon: "activity",
  keywords: { de: ["momentum", "überverkauft", "überkauft", "relative stärke"], en: ["momentum", "oversold", "overbought", "relative strength"] },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [{ id: "out", type: "series", label: l("RSI", "RSI") }, ...THRESHOLD_OUTPUTS],
  settings: {
    length: lengthSetting(
      14,
      2,
      100,
      l(
        "Über wie viele Kerzen der RSI rechnet. 14 ist der übliche Wert. Weniger Kerzen, etwa 7, machen ihn schneller und unruhiger, mehr Kerzen ruhiger.",
        "How many candles the RSI looks at. 14 is the usual value. Fewer candles, such as 7, make it faster and jumpier, more candles calmer."
      )
    ),
    ...thresholdSettings(RANGE3, {
      oversold: l(
        "Unter dieser Linie gilt der RSI als überverkauft, und der Ausgang „überverkauft“ ist wahr. Üblich ist 30; mit 20 oder 25 meldet er nur stärkere Abverkäufe.",
        "Below this line the RSI counts as oversold, and the “oversold” output is true. 30 is usual; with 20 or 25 it only reports stronger sell-offs."
      ),
      overbought: l(
        "Über dieser Linie gilt der RSI als überkauft, und der Ausgang „überkauft“ ist wahr. Üblich ist 70; mit 75 oder 80 meldet er nur stärkere Anstiege.",
        "Above this line the RSI counts as overbought, and the “overbought” output is true. 70 is usual; with 75 or 80 it only reports stronger rallies."
      )
    })
  },
  sentence: ({ settings, locale, output }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + thresholdSentence(settings, output, locale),
  short: ({ settings, pin, locale }) => pin === "out" ? `RSI ${settings.length}` : thresholdShort(`RSI ${settings.length}`, pin, settings, locale),
  warmup: ({ settings }) => 10 * settings.length + 1,
  visual: { kind: "zone", series: { output: "out" }, low: "oversold", high: "overbought", price: { input: "in" }, signal: ["oversold", "overbought"] },
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.rsi(inputs2.in, settings.length);
    return { out, ...thresholdSignals(out, settings.oversold, settings.overbought) };
  },
  tests: [
    {
      fixture: FIXTURE,
      settings: { length: 14 },
      expectAt: { "13": { out: null }, "14": { out: 50.804586283719544 } },
      expectLast: { out: 46.067765140416704 },
      tolerance: 1e-9
    },
    // Schwellen gegen die Referenz (scripts/pine-reference.py): überverkauft ab Kerze 51, überkauft an Kerze 29, nicht an 30.
    {
      name: "Schwellen 30 und 70",
      fixture: FIXTURE,
      settings: { length: 14, oversold: 30, overbought: 70 },
      expectAt: { "29": { overbought: true, oversold: false }, "30": { overbought: false }, "50": { oversold: false }, "51": { oversold: true } }
    }
  ]
});

// packages/nodes/src/indicators/squeeze.ts
var squeeze2 = defineNode({
  id: "core.squeeze",
  version: "1.0.0",
  category: "ind",
  label: l("Squeeze", "Squeeze"),
  description: l("Ruhephase, auf die oft ein Ausbruch folgt", "Quiet phase that often ends in a breakout"),
  help: l(
    "Erkennt Phasen, in denen der Kurs ungewöhnlich ruhig läuft: Die Bollinger-Bänder ziehen sich so eng zusammen, dass sie in den Keltner-Kanal passen. Solche Phasen enden oft mit einer kräftigen Bewegung. „an“ ist wahr, solange die Ruhe anhält, „löst sich“ an der Kerze, an der sie endet. Das Momentum zeigt die Richtung: über 0 drückt der Kurs nach oben, unter 0 nach unten. Beispiel: „löst sich“ zusammen mit „Momentum über 0“ meldet einen Ausbruch nach oben.",
    "Detects phases in which the price moves unusually calmly: the Bollinger Bands contract so much that they fit inside the Keltner Channel. Such phases often end with a strong move. “on” is true while the calm lasts, “fires” on the candle where it ends. The momentum shows the direction: above 0 the price pushes up, below 0 down. Example: “fires” together with “momentum above 0” reports a breakout to the upside."
  ),
  technical: l(
    "Bollinger-Bänder SMA ± Bollinger-Breite × Standardabweichung, Keltner-Kanal dieselbe SMA ± Keltner-Breite × SMA der True Range, alles über dieselben Kerzen; „an“, solange beide Bollinger-Bänder innerhalb des Kanals liegen. Momentum ist die lineare Regression von Schluss − ((höchstes Hoch + tiefstes Tief) / 2 + SMA) / 2, ausgewertet an der aktuellen Kerze. Mit Bollinger-Breite 1,5 stimmen die Werte mit dem Squeeze Momentum Indicator von LazyBear in TradingView überein.",
    "Bollinger Bands SMA ± Bollinger width × standard deviation, Keltner Channel the same SMA ± Keltner width × SMA of the true range, all over the same candles; “on” while both Bollinger Bands lie inside the channel. Momentum is the linear regression of close − ((highest high + lowest low) / 2 + SMA) / 2, evaluated at the current candle. With Bollinger width 1.5 the values match LazyBear’s Squeeze Momentum Indicator on TradingView."
  ),
  icon: "shrink",
  keywords: {
    de: ["squeeze", "ruhephase", "ausbruch", "bollinger", "keltner", "momentum", "volatilität", "enge"],
    en: ["squeeze", "quiet", "breakout", "bollinger", "keltner", "momentum", "volatility", "tight"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "momentum", type: "series", label: l("Momentum", "Momentum") },
    { id: "on", type: "signal", label: l("an", "on") },
    { id: "fired", type: "signal", label: l("löst sich", "fires") }
  ],
  settings: {
    length: lengthSetting(
      20,
      2,
      500,
      l("Über wie viele Kerzen Bänder, Kanal und Momentum rechnen. 20 ist der übliche Wert.", "How many candles the bands, the channel and the momentum cover. 20 is the usual value.")
    ),
    bbMult: {
      type: "number",
      label: l("Bollinger-Breite", "Bollinger width"),
      help: l(
        "Abstand der Bollinger-Bänder als Vielfaches der Standardabweichung, üblich ist 2. Mit 1,5 liegen die Bänder enger, der Squeeze ist dann öfter an.",
        "Distance of the Bollinger Bands as a multiple of the standard deviation, usually 2. With 1.5 the bands sit closer and the squeeze is on more often."
      ),
      default: 2,
      min: 0.1,
      max: 10,
      step: 0.1
    },
    kcMult: {
      type: "number",
      label: l("Keltner-Breite", "Keltner width"),
      help: l(
        "Abstand des Keltner-Kanals als Vielfaches der üblichen Spanne einer Kerze, üblich ist 1,5. Ein breiterer Kanal meldet den Squeeze öfter.",
        "Distance of the Keltner Channel as a multiple of the usual range of a candle, usually 1.5. A wider channel reports the squeeze more often."
      ),
      default: 1.5,
      min: 0.1,
      max: 10,
      step: 0.1
    }
  },
  sentence: ({ settings, locale }) => `${settings.length} ${locale === "de" ? "Kerzen" : "candles"} · Bollinger ${fmt(settings.bbMult, locale)} · Keltner ${fmt(settings.kcMult, locale)}`,
  short: ({ settings, pin, locale }) => {
    if (pin === "on") return locale === "de" ? `Squeeze ${settings.length} an` : `Squeeze ${settings.length} on`;
    if (pin === "fired") return locale === "de" ? `Squeeze ${settings.length} löst sich` : `Squeeze ${settings.length} fires`;
    return locale === "de" ? `Squeeze-Momentum ${settings.length}` : `Squeeze momentum ${settings.length}`;
  },
  // Bänder nach `length` Kerzen, die Regression des Momentums braucht noch einmal so viele.
  warmup: ({ settings }) => 2 * settings.length,
  compute({ inputs: inputs2, settings }) {
    return series_exports.squeeze(inputs2.close, inputs2.high, inputs2.low, settings.length, settings.bbMult, settings.kcMult);
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 20, bbMult: 2, kcMult: 1.5 },
      expectAt: {
        "18": { on: false },
        "19": { on: true },
        "20": { on: false, fired: true },
        "37": { momentum: null },
        "38": { momentum: 149.21963214285714 },
        "45": { fired: true }
      },
      expectLast: { momentum: -650.6587928571429, on: false, fired: false }
    }
  ]
});

// packages/nodes/src/indicators/sr-zones.ts
var PIN_SHORT13 = {
  breakUp: l("Ausbruch über Zone", "breakout above zone"),
  breakDown: l("Ausbruch unter Zone", "breakdown below zone"),
  inZone: l("Schluss in Zone", "close in zone"),
  supportHigh: l("Unterstützung oben", "support top"),
  supportLow: l("Unterstützung unten", "support bottom"),
  resistanceHigh: l("Widerstand oben", "resistance top"),
  resistanceLow: l("Widerstand unten", "resistance bottom")
};
var srZonesNode = defineNode({
  id: "core.sr-zones",
  version: "1.0.0",
  category: "ind",
  label: l("S/R-Zonen", "S/R zones"),
  description: l("Unterstützung und Widerstand aus Swings", "Support and resistance from swings"),
  help: l(
    "Findet Preiszonen, an denen der Kurs mehrmals gedreht hat: Liegen mehrere Swing-Hochs und -Tiefs nah beieinander, bilden sie eine Zone, und je mehr Swings, desto stärker ist sie. Zonen unter dem Kurs sind Unterstützung, Zonen darüber Widerstand. Der Baustein meldet, wenn der Kurs über oder unter eine Zone ausbricht oder in einer schließt, und nennt die nächste Unterstützung und den nächsten Widerstand. Die Zonen entstehen bei jeder Kerze neu aus den bestätigten Swings. Beispiel: „Ausbruch über Zone“ meldet, wenn SOL über einer Zone schließt, an der er mindestens dreimal gedreht hat.",
    "Finds price zones where the price turned several times: if several swing highs and lows sit close together, they form a zone, and the more swings, the stronger it is. Zones below the price are support, zones above resistance. The node reports when the price breaks out above or below a zone or closes inside one, and gives the nearest support and resistance. The zones form anew on every candle from the confirmed swings. Example: “breakout above zone” reports when SOL closes above a zone where it turned at least three times."
  ),
  technical: l(
    "Swings wie beim Baustein Swing-Punkte, deren Hoch oder Tief höchstens „Kerzen zurück“ zurückliegt. Swings, deren Werte höchstens „Breite“ Prozent auseinanderliegen, bilden eine Zone: zuerst die mit den meisten Swings (bei gleich vielen die mit dem jüngsten, dann die tiefere), dann aus den übrigen die nächste ohne Überschneidung, solange eine Zone mindestens „Swings je Zone“ hat. Jede Zone ist „Breite“ Prozent hoch um die Mitte ihrer Swings. Unterstützung: die nächste Zone, deren Mitte nicht über dem Schluss liegt, Widerstand die nächste darüber. Ausbruch: Schluss über einer Zone der Kerze davor, wenn der Schluss davor nicht darüber lag.",
    "Swings as in the Swing points node whose high or low is at most “Lookback” candles back. Swings whose values are at most “Width” percent apart form a zone: first the one with the most swings (if equal, the one with the latest swing, then the lower one), then from the rest the next one without overlap, as long as a zone has at least “Swings per zone”. Each zone is “Width” percent tall around the middle of its swings. Support: the nearest zone whose middle is not above the close, resistance the nearest above. Breakout: a close above a zone of the previous candle when the previous close was not above it."
  ),
  icon: "rows-3",
  keywords: {
    de: ["unterstützung", "widerstand", "support", "resistance", "zone", "level", "ausbruch", "swing", "smart money", "smc"],
    en: ["support", "resistance", "zone", "level", "breakout", "swing", "smart money", "smc"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "breakUp", type: "signal", label: l("Ausbruch über Zone", "Breakout above zone") },
    { id: "breakDown", type: "signal", label: l("Ausbruch unter Zone", "Breakdown below zone") },
    { id: "inZone", type: "signal", label: l("Schluss in Zone", "Close in zone") },
    { id: "supportHigh", type: "series", label: l("Unterstützung oben", "Support top"), unit: "price" },
    { id: "supportLow", type: "series", label: l("Unterstützung unten", "Support bottom"), unit: "price" },
    { id: "resistanceHigh", type: "series", label: l("Widerstand oben", "Resistance top"), unit: "price" },
    { id: "resistanceLow", type: "series", label: l("Widerstand unten", "Resistance bottom"), unit: "price" }
  ],
  settings: {
    width: {
      type: "number",
      label: l("Breite", "Width"),
      help: l(
        "Wie hoch eine Zone ist und wie nah ihre Swings beieinanderliegen müssen, in Prozent des Kurses. 0,5 % sind bei BTC um 400 $. Mit mehr Breite entstehen weniger, aber größere Zonen.",
        "How tall a zone is and how close its swings have to be, in percent of the price. 0.5 % is about $400 for BTC. With more width there are fewer but larger zones."
      ),
      default: 0.5,
      min: 0.05,
      max: 10,
      step: 0.05,
      unit: l("%", "%")
    },
    touches: {
      type: "number",
      label: l("Swings je Zone", "Swings per zone"),
      help: l(
        "Wie viele Swings eine Zone mindestens braucht. Mit 2 entstehen viele Zonen, mit 3 oder mehr nur die, an denen der Kurs öfter gedreht hat.",
        "How many swings a zone needs at least. With 2 there are many zones, with 3 or more only those where the price turned more often."
      ),
      default: 3,
      min: 2,
      max: 10,
      integer: true,
      step: 1
    },
    lookback: lengthSetting(
      300,
      20,
      500,
      l(
        "Aus wie vielen Kerzen die Swings kommen. 300 Stundenkerzen sind 12,5 Tage; ältere Wendepunkte zählen nicht mehr.",
        "How many candles the swings come from. 300 hourly candles are 12.5 days; older turning points no longer count."
      ),
      l("Kerzen zurück", "Lookback")
    ),
    // Ab 2 Kerzen: Mit 1 · 1 gäbe es an fast jeder Kerze einen Swing und die Zonen müssten ständig neu entstehen.
    left: { ...swingSettings(5).left, min: 2 },
    right: { ...swingSettings(5, SWING_RIGHT_USED).right, min: 2 }
  },
  sentence: ({ settings, locale }) => `${fmt(settings.width, locale)} % · ${locale === "de" ? `ab ${settings.touches} Swings` : `${settings.touches}+ swings`} · ${settings.lookback} ${locale === "de" ? "Kerzen" : "candles"}`,
  short: ({ settings, pin, locale }) => `${(PIN_SHORT13[pin] ?? PIN_SHORT13.supportHigh)[locale]} ${fmt(settings.width, locale)} %`,
  // Zonen aus den Swings der letzten Kerzen; der Ausbruch prüft die Zonen der Kerze davor.
  warmup: ({ settings }) => settings.lookback + settings.left + settings.right + 1,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    handles: [
      { kind: "size", setting: "width" },
      { kind: "swing", left: "left", right: "right" }
    ],
    signal: "breakUp",
    // Das Bild zeigt die Zonen nach der letzten Kerze mit ihren Swings; Ausbrüche über frühere Zonen markiert das Signal.
    draw({ inputs: inputs2, settings }) {
      const result = supportResistance(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.width, settings.touches, settings.lookback);
      let close;
      for (let i = inputs2.close.length - 1; i >= 0 && close === void 0; i--) close = inputs2.close[i] ?? void 0;
      const boxes = result.zones.map((zone) => ({
        from: Math.min(...zone.swings.map((swing2) => swing2.at)),
        low: zone.low,
        high: zone.high,
        tone: close !== void 0 && zone.middle <= close ? "up" : "down",
        label: l(`${zone.swings.length}×`, `${zone.swings.length}×`)
      }));
      const marks = result.zones.flatMap((zone) => zone.swings.map((swing2) => ({ at: swing2.at, value: swing2.value, tone: "neutral", side: swing2.high ? "above" : "below" })));
      const swings2 = result.zones.flatMap((zone) => zone.swings).sort((a, b) => a.confirmed - b.confirmed);
      const swing = latestSwing(swings2);
      const support = result.supportHigh.at(-1);
      const resistance = result.resistanceLow.at(-1);
      const parts = (locale) => [
        `${result.zones.length} ${locale === "de" ? result.zones.length === 1 ? "Zone" : "Zonen" : result.zones.length === 1 ? "zone" : "zones"}`,
        support != null ? `${locale === "de" ? "Unterstützung bis" : "support up to"} ${formatNumber(support, locale)}` : "",
        resistance != null ? `${locale === "de" ? "Widerstand ab" : "resistance from"} ${formatNumber(resistance, locale)}` : ""
      ].filter(Boolean).join(", ");
      return {
        legend: [
          { kind: "box", tone: "up", label: l("Unterstützung, Zahl der Swings", "Support, number of swings") },
          { kind: "box", tone: "down", label: l("Widerstand", "Resistance") },
          { kind: "mark", tone: "neutral", label: l("Swing in einer Zone", "Swing in a zone") }
        ],
        boxes,
        marks,
        ...swing ? { swing: { at: swing.at, value: swing.value, high: swing.high } } : {},
        note: l(parts("de"), parts("en"))
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const result = supportResistance(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.width, settings.touches, settings.lookback);
    return {
      breakUp: result.breakUp,
      breakDown: result.breakDown,
      inZone: result.inZone,
      supportHigh: result.supportHigh,
      supportLow: result.supportLow,
      resistanceHigh: result.resistanceHigh,
      resistanceLow: result.resistanceLow
    };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { width: 0.5, touches: 3, lookback: 300 },
      expectAt: {
        "88": { supportHigh: null },
        "89": { supportHigh: 82938.32875, supportLow: 82524.67125 },
        "104": { breakUp: true }
      },
      expectLast: { inZone: false, supportHigh: null, resistanceHigh: 82637.007325, resistanceLow: 82224.852675 }
    }
  ]
});

// packages/nodes/src/indicators/stoch.ts
var RANGE4 = { oversold: 20, overbought: 80, min: 0, max: 100, step: 1 };
var stochastic = defineNode({
  id: "core.stoch",
  version: "1.0.0",
  category: "ind",
  label: l("Stochastik", "Stochastic"),
  description: l("Wo der Kurs in seiner Spanne steht, 0–100", "Where the price sits in its range, 0–100"),
  help: l(
    "Zeigt, wo der Schlusskurs in der Spanne der letzten Kerzen liegt: 0 heißt am tiefsten Tief, 100 am höchsten Hoch. Über 80 schließt der Kurs nahe am Hoch (überkauft), unter 20 nahe am Tief (überverkauft). %K ist diese Lage, %D ihr Durchschnitt über wenige Kerzen und damit die ruhigere Signallinie. Die Ausgänge „überverkauft“ und „überkauft“ prüfen %K gegen die Schwellen, die du im Bild unter dem Kurs ziehst. Beispiel: „%K unter 20“ zusammen mit „%K kreuzt %D nach oben“ meldet, wenn der Kurs im überverkauften Bereich wieder nach oben dreht.",
    "Shows where the close sits within the range of the last candles: 0 means at the lowest low, 100 at the highest high. Above 80 the price closes near the high (overbought), below 20 near the low (oversold). %K is this position, %D its average over a few candles and so the calmer signal line. The “oversold” and “overbought” outputs check %K against the thresholds you drag in the chart below the price. Example: “%K below 20” together with “%K crosses above %D” fires when the price turns up again in the oversold zone."
  ),
  technical: l(
    "%K als SMA von 100 · (Schluss − tiefstes Tief) / (höchstes Hoch − tiefstes Tief) über die Kerzen, %D als SMA von %K, leer, wenn Hoch und Tief gleich sind; dieselbe Formel wie der eingebaute Stochastic in TradingView mit ta.stoch.",
    "%K as the SMA of 100 · (close − lowest low) / (highest high − lowest low) over the candles, %D as the SMA of %K, empty when high and low are equal; the same formula as TradingView’s built-in Stochastic with ta.stoch."
  ),
  icon: "waves",
  keywords: {
    de: ["stochastik", "oszillator", "überkauft", "überverkauft", "momentum", "%k", "%d"],
    en: ["stochastic", "oscillator", "overbought", "oversold", "momentum", "%k", "%d"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "k", type: "series", label: l("%K", "%K") },
    { id: "d", type: "series", label: l("%D", "%D") },
    ...THRESHOLD_OUTPUTS
  ],
  settings: {
    length: lengthSetting(
      14,
      2,
      200,
      l(
        "Aus wie vielen Kerzen das höchste Hoch und das tiefste Tief stammen. 14 ist der übliche Wert. Weniger Kerzen, etwa 5, machen die Stochastik schneller und unruhiger, mehr Kerzen ruhiger.",
        "How many candles the highest high and the lowest low are taken from. 14 is the usual value. Fewer candles, such as 5, make the stochastic faster and jumpier, more candles calmer."
      )
    ),
    smooth: lengthSetting(
      1,
      1,
      50,
      l(
        "Über wie viele Kerzen %K geglättet wird. Mit 1 bleibt %K ungeglättet, das ist die schnelle Stochastik. Mit 3 entsteht die verbreitete langsame Stochastik, die seltener falsche Signale gibt.",
        "How many candles %K is smoothed over. With 1 %K stays unsmoothed, the fast stochastic. With 3 you get the common slow stochastic, which gives fewer false signals."
      ),
      l("Glättung %K", "%K smoothing")
    ),
    signal: lengthSetting(
      3,
      1,
      50,
      l(
        "Über wie viele Kerzen %K zur Signallinie %D gemittelt wird, üblich sind 3. Kreuzt %K die Linie %D, dreht der Schwung.",
        "How many candles %K is averaged over to form the %D signal line, usually 3. When %K crosses %D, the momentum turns."
      ),
      l("Signallinie %D", "%D signal line")
    ),
    ...thresholdSettings(RANGE4, {
      oversold: l(
        "Liegt %K unter dieser Linie, schließt der Kurs nahe am Tief seiner Spanne, und der Ausgang „überverkauft“ ist wahr. Üblich ist 20.",
        "When %K is below this line, the price closes near the low of its range, and the “oversold” output is true. 20 is usual."
      ),
      overbought: l(
        "Liegt %K über dieser Linie, schließt der Kurs nahe am Hoch seiner Spanne, und der Ausgang „überkauft“ ist wahr. Üblich ist 80.",
        "When %K is above this line, the price closes near the high of its range, and the “overbought” output is true. 80 is usual."
      )
    })
  },
  sentence: ({ settings, locale, output }) => `${settings.length} ${locale === "de" ? "Kerzen" : "candles"} · ${settings.smooth} · ${settings.signal}${thresholdSentence(settings, output, locale)}`,
  short: ({ settings, pin, locale }) => pin === "oversold" || pin === "overbought" ? thresholdShort(`Stoch %K ${settings.length}`, pin, settings, locale) : `Stoch ${pin === "d" ? "%D" : "%K"} ${settings.length}`,
  warmup: ({ settings }) => settings.length + settings.smooth + settings.signal,
  visual: { kind: "zone", series: { output: "k" }, low: "oversold", high: "overbought", price: { input: "close" }, signal: ["oversold", "overbought"] },
  compute({ inputs: inputs2, settings }) {
    const k = series_exports.sma(series_exports.stoch(inputs2.close, inputs2.high, inputs2.low, settings.length), settings.smooth);
    return { k, d: series_exports.sma(k, settings.signal), ...thresholdSignals(k, settings.oversold, settings.overbought) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "schnelle Stochastik 14 · 1 · 3",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, smooth: 1, signal: 3 },
      expectAt: { "12": { k: null }, "13": { k: 58.08626165351911 }, "14": { d: null }, "15": { d: 40.36140076182489 } },
      expectLast: { k: 37.83097825067087, d: 41.48870623705955 },
      tolerance: 1e-9
    },
    {
      name: "langsame Stochastik 14 · 3 · 3",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, smooth: 3, signal: 3 },
      expectAt: { "14": { k: null }, "15": { k: 40.36140076182489 }, "16": { d: null }, "17": { d: 39.86979290260627 } },
      expectLast: { k: 41.48870623705955, d: 41.661141240322685 },
      tolerance: 1e-9
    },
    // Schwellen gegen die Referenz (scripts/pine-reference.py): %K der langsamen Stochastik über 80 ab Kerze 20, unter 20 ab 44.
    {
      name: "Schwellen 20 und 80",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, smooth: 3, signal: 3, oversold: 20, overbought: 80 },
      expectAt: { "19": { overbought: false }, "20": { overbought: true }, "43": { oversold: false }, "44": { oversold: true } }
    }
  ]
});

// packages/nodes/src/indicators/stochrsi.ts
var stochRsi = defineNode({
  id: "core.stochrsi",
  version: "1.0.0",
  category: "ind",
  label: l("Stoch RSI", "Stoch RSI"),
  description: l("Wo der RSI in seiner Spanne steht, 0–100", "Where the RSI sits in its range, 0–100"),
  help: l(
    "Wendet die Stochastik auf den RSI an: 0 heißt, der RSI steht am Tief der letzten Kerzen, 100 an ihrem Hoch. Dadurch reagiert der Stoch RSI deutlich schneller als der RSI selbst und erreicht die Enden öfter. Über 80 gilt als überkauft, unter 20 als überverkauft. %K ist die geglättete Linie, %D ihr Durchschnitt. Beispiel: „%K kreuzt %D nach oben“, während %K unter 20 liegt, zeigt einen frühen Wendepunkt nach einem Rücksetzer.",
    "Applies the stochastic to the RSI: 0 means the RSI is at the low of the last candles, 100 at their high. This makes the Stoch RSI react much faster than the RSI itself and reach the extremes more often. Above 80 counts as overbought, below 20 as oversold. %K is the smoothed line, %D its average. Example: “%K crosses above %D” while %K is below 20 shows an early turning point after a pullback."
  ),
  technical: l(
    "RSI nach Wilder, darauf 100 · (RSI − tiefster RSI) / (höchster RSI − tiefster RSI) über die Stochastik-Kerzen, %K als SMA davon, %D als SMA von %K; dieselbe Formel wie der eingebaute Stoch RSI in TradingView mit ta.rsi und ta.stoch.",
    "Wilder’s RSI, then 100 · (RSI − lowest RSI) / (highest RSI − lowest RSI) over the stochastic candles, %K as its SMA, %D as the SMA of %K; the same formula as TradingView’s built-in Stoch RSI with ta.rsi and ta.stoch."
  ),
  icon: "chart-spline",
  keywords: {
    de: ["stoch rsi", "stochrsi", "rsi", "stochastik", "überkauft", "überverkauft", "momentum"],
    en: ["stoch rsi", "stochrsi", "rsi", "stochastic", "overbought", "oversold", "momentum"]
  },
  inputs: [{ id: "in", type: "series", label: LABEL_VALUE }],
  outputs: [
    { id: "k", type: "series", label: l("%K", "%K") },
    { id: "d", type: "series", label: l("%D", "%D") }
  ],
  settings: {
    rsiLength: lengthSetting(
      14,
      2,
      100,
      l("Über wie viele Kerzen der RSI rechnet, auf dem der Baustein aufsetzt. 14 ist der übliche Wert.", "How many candles the underlying RSI looks at. 14 is the usual value."),
      l("RSI-Kerzen", "RSI candles")
    ),
    length: lengthSetting(
      14,
      2,
      200,
      l(
        "Aus wie vielen Kerzen das Hoch und das Tief des RSI stammen. 14 ist üblich. Weniger Kerzen machen die Linie noch schneller und unruhiger.",
        "How many candles the high and the low of the RSI are taken from. 14 is usual. Fewer candles make the line even faster and jumpier."
      ),
      l("Stochastik-Kerzen", "Stochastic candles")
    ),
    smooth: lengthSetting(
      3,
      1,
      50,
      l("Über wie viele Kerzen %K geglättet wird, üblich sind 3. Mit 1 springt %K oft zwischen 0 und 100 hin und her.", "How many candles %K is smoothed over, usually 3. With 1, %K often jumps back and forth between 0 and 100."),
      l("Glättung %K", "%K smoothing")
    ),
    signal: lengthSetting(
      3,
      1,
      50,
      l(
        "Über wie viele Kerzen %K zur Signallinie %D gemittelt wird, üblich sind 3. Kreuzt %K die Linie %D, dreht der Schwung.",
        "How many candles %K is averaged over to form the %D signal line, usually 3. When %K crosses %D, the momentum turns."
      ),
      l("Signallinie %D", "%D signal line")
    )
  },
  sentence: ({ settings, locale }) => `RSI ${settings.rsiLength} · ${settings.length} ${locale === "de" ? "Kerzen" : "candles"} · ${settings.smooth} · ${settings.signal}`,
  short: ({ settings, pin }) => {
    const lengths = settings.rsiLength === settings.length ? `${settings.length}` : `${settings.rsiLength} · ${settings.length}`;
    return `Stoch RSI ${pin === "d" ? "%D" : "%K"} ${lengths}`;
  },
  warmup: ({ settings }) => 10 * settings.rsiLength + 1 + settings.length + settings.smooth + settings.signal,
  compute({ inputs: inputs2, settings }) {
    const rsi3 = series_exports.rsi(inputs2.in, settings.rsiLength);
    const k = series_exports.sma(series_exports.stoch(rsi3, rsi3, rsi3, settings.length), settings.smooth);
    return { k, d: series_exports.sma(k, settings.signal) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      name: "Stoch RSI 14 · 14 · 3 · 3",
      fixture: FIXTURE,
      settings: { rsiLength: 14, length: 14, smooth: 3, signal: 3 },
      expectAt: { "28": { k: null }, "29": { k: 100 }, "30": { d: null }, "31": { d: 93.62993068903731 } },
      expectLast: { k: 46.076703287570574, d: 46.11882151842401 },
      tolerance: 1e-9
    },
    {
      name: "Stoch RSI 7 · 21 · 1 · 5",
      fixture: FIXTURE,
      settings: { rsiLength: 7, length: 21, smooth: 1, signal: 5 },
      expectAt: { "30": { d: null }, "31": { d: 92.53739075060277 } },
      expectLast: { d: 52.68750384096757 },
      tolerance: 1e-9
    }
  ]
});

// packages/nodes/src/indicators/structure.ts
var TRIGGERS = {
  close: {
    label: l("Schlusskurs", "Close"),
    help: l(
      "Die Kerze muss jenseits des Swings schließen. Ein Docht darüber allein zählt nicht; so bleiben kurze Ausflüge außen vor.",
      "The candle has to close beyond the swing. A wick alone does not count, so brief excursions stay out."
    )
  },
  wick: {
    label: l("Docht", "Wick"),
    help: l(
      "Schon ein Hoch über dem Swing-Hoch, ein Tief unter dem Swing-Tief zählt. Meldet früher, auch bei Ausbrüchen, die gleich wieder zurückfallen.",
      "A high above the swing high or a low below the swing low is enough. Reports sooner, also for breakouts that fall back right away."
    )
  }
};
var PIN_SHORT14 = {
  bosUp: l("BOS nach oben", "BOS up"),
  bosDown: l("BOS nach unten", "BOS down"),
  chochUp: l("CHoCH nach oben", "CHoCH up"),
  chochDown: l("CHoCH nach unten", "CHoCH down"),
  bullish: l("Trend aufwärts", "uptrend"),
  bearish: l("Trend abwärts", "downtrend"),
  level: l("Marktstruktur", "Market structure")
};
var BOS = l("BOS", "BOS");
var CHOCH = l("CHoCH", "CHoCH");
var marketStructureNode = defineNode({
  id: "core.structure",
  version: "1.0.0",
  category: "ind",
  label: l("Marktstruktur", "Market structure"),
  description: l("Trend, BOS und CHoCH aus Swings", "Trend, BOS and CHoCH from swings"),
  help: l(
    "Liest den Trend aus den Swings: Schließt der Kurs über dem letzten bestätigten Swing-Hoch, ist die Struktur nach oben gebrochen, schließt er unter dem letzten Swing-Tief, nach unten. Geht der Bruch in Richtung des Trends, ist es ein Bruch der Struktur (BOS); geht er gegen den Trend, ein Wechsel des Charakters (CHoCH), oft das erste Zeichen einer Wende. Ein Swing zählt erst, wenn die Kerzen danach ihn bestätigt haben, deshalb bricht ein ganz frisches Hoch noch keine Struktur. Beispiel: CHoCH nach oben auf 4-Stunden-Kerzen meldet, wenn BTC nach einem Abwärtstrend zum ersten Mal über dem letzten tieferen Hoch schließt.",
    "Reads the trend from the swings: if the price closes above the last confirmed swing high, the structure has broken upward; if it closes below the last swing low, downward. A break in the direction of the trend is a break of structure (BOS); a break against the trend is a change of character (CHoCH), often the first sign of a reversal. A swing only counts once the candles after it have confirmed it, so a brand-new high cannot break structure yet. Example: CHoCH up on 4-hour candles reports when BTC, after a downtrend, closes above the last lower high for the first time."
  ),
  technical: l(
    "Swings wie beim Baustein Swing-Punkte; verfolgt wird das jüngste bestätigte Swing-Hoch und -Tief, jedes höchstens 500 Kerzen nach seinem Hoch oder Tief und höchstens einmal gebrochen. Bruch nach oben: Schluss (mit „Docht“ das Hoch) über dem Swing-Hoch. CHoCH, wenn der letzte Bruch in den 500 Kerzen davor in die andere Richtung ging, sonst BOS; ohne Bruch davor gibt es keinen Trend. Der Trend folgt dem letzten Bruch und gilt bis zu 500 Kerzen. Bricht eine Kerze mit dem Docht beide Seiten, gilt die Seite, auf der sie schließt (ab der Mitte beider Levels aufwärts).",
    "Swings as in the Swing points node; the latest confirmed swing high and low are tracked, each up to 500 candles after its high or low and broken at most once. Break up: a close (with “Wick” the high) above the swing high. CHoCH when the last break within the previous 500 candles went the other way, otherwise BOS; without an earlier break there is no trend. The trend follows the last break and lasts up to 500 candles. If a candle breaks both sides with its wicks, the side it closes on counts (from the middle of both levels upward)."
  ),
  icon: "trending-up-down",
  keywords: {
    de: ["marktstruktur", "struktur", "bos", "choch", "bruch der struktur", "wechsel des charakters", "trendwende", "smart money", "smc", "swing"],
    en: ["market structure", "structure", "bos", "choch", "break of structure", "change of character", "reversal", "smart money", "smc", "swing"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "bosUp", type: "signal", label: PIN_SHORT14.bosUp },
    { id: "bosDown", type: "signal", label: PIN_SHORT14.bosDown },
    { id: "chochUp", type: "signal", label: PIN_SHORT14.chochUp },
    { id: "chochDown", type: "signal", label: PIN_SHORT14.chochDown },
    { id: "bullish", type: "signal", label: l("Trend aufwärts", "Uptrend") },
    { id: "bearish", type: "signal", label: l("Trend abwärts", "Downtrend") },
    { id: "level", type: "series", label: l("Level des Bruchs", "Break level"), unit: "price" }
  ],
  settings: {
    ...swingSettings(10, SWING_RIGHT_USED),
    trigger: {
      type: "select",
      label: l("Bruch durch", "Break by"),
      help: l("Womit der Kurs einen Swing brechen muss: mit dem Schlusskurs oder schon mit dem Docht.", "What the price needs to break a swing: the close, or just the wick."),
      default: "close",
      options: Object.keys(TRIGGERS).map((value) => ({ value, label: TRIGGERS[value].label, help: TRIGGERS[value].help }))
    }
  },
  sentence: ({ settings, locale }) => `${swingSentence(settings, locale)}${settings.trigger === "wick" ? locale === "de" ? " · Docht" : " · wick" : ""}`,
  short: ({ settings, pin, locale }) => `${(PIN_SHORT14[pin] ?? PIN_SHORT14.level)[locale]} ${settings.left} · ${settings.right}`,
  // Ein Bruch braucht einen Swing aus den 500 Kerzen davor, der Trend einen Bruch aus den 500 Kerzen davor.
  warmup: ({ settings }) => 2 * MAX_AGE + settings.left + settings.right,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    handles: [{ kind: "swing", left: "left", right: "right" }],
    draw({ inputs: inputs2, settings }) {
      const result = marketStructure(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.trigger);
      const lines = result.breaks.map((brk) => ({
        from: brk.swing.at,
        known: brk.swing.confirmed,
        to: brk.at,
        value: brk.swing.value,
        tone: brk.up ? "up" : "down"
      }));
      const marks = result.breaks.map((brk) => ({
        at: Math.round((brk.swing.at + brk.at) / 2),
        value: brk.swing.value,
        tone: brk.up ? "up" : "down",
        label: brk.choch ? CHOCH : BOS,
        side: brk.up ? "above" : "below"
      }));
      for (const swing2 of [result.openHigh, result.openLow]) {
        if (swing2) lines.push({ from: swing2.at, known: swing2.confirmed, value: swing2.value, tone: "neutral" });
      }
      const swing = latestSwing(result.swings);
      const last = result.trend.at(-1) ?? 0;
      const level = result.level.at(-1);
      return {
        legend: [
          { kind: "line", tone: "up", label: l("Bruch nach oben", "Break up") },
          { kind: "line", tone: "down", label: l("Bruch nach unten", "Break down") },
          { kind: "dotted", tone: "neutral", label: l("Swing noch nicht bestätigt", "Swing not yet confirmed") },
          { kind: "line", tone: "neutral", label: l("nächster Bruch", "next break") },
          { kind: "span", tone: "up", label: l("Trend", "Trend") }
        ],
        lines,
        marks,
        spans: trendSpans(result.trend),
        ...swing ? { swing: { at: swing.at, value: swing.value, high: swing.high } } : {},
        note: last === 0 || level == null ? l("noch kein Trend", "no trend yet") : l(
          `Trend ${last === 1 ? "aufwärts" : "abwärts"} seit Bruch bei ${formatNumber(level, "de")}`,
          `${last === 1 ? "Uptrend" : "Downtrend"} since break at ${formatNumber(level, "en")}`
        )
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const result = marketStructure(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.trigger);
    const n = inputs2.close.length;
    const bosUp = new Array(n).fill(false);
    const bosDown = new Array(n).fill(false);
    const chochUp = new Array(n).fill(false);
    const chochDown = new Array(n).fill(false);
    for (const brk of result.breaks) {
      if (brk.up) (brk.choch ? chochUp : bosUp)[brk.at] = true;
      else (brk.choch ? chochDown : bosDown)[brk.at] = true;
    }
    return {
      bosUp,
      bosDown,
      chochUp,
      chochDown,
      bullish: result.trend.map((value) => value === 1),
      bearish: result.trend.map((value) => value === -1),
      level: [...result.level]
    };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { left: 5, right: 5 },
      expectAt: {
        "44": { bosDown: false, level: null },
        "45": { bosDown: true, bearish: true, level: 83838 },
        "101": { chochUp: false, bearish: true },
        "102": { chochUp: true, bullish: true, bearish: false },
        "133": { bosUp: true },
        "227": { chochDown: true, bearish: true }
      },
      expectLast: { bullish: false, bearish: true, level: 81688 }
    }
  ]
});

// packages/nodes/src/indicators/supertrend.ts
var SETTINGS3 = {
  length: lengthSetting(
    10,
    1,
    500,
    l(
      "Über wie viele Kerzen die übliche Spanne (ATR) gemessen wird, nach der sich der Abstand der Linie richtet. 10 ist der übliche Wert.",
      "How many candles the usual range (ATR) is measured over, which sets the distance of the line. 10 is the usual value."
    ),
    l("ATR-Kerzen", "ATR candles")
  ),
  factor: {
    type: "number",
    label: l("Faktor", "Factor"),
    help: l(
      "Wie weit die Linie vom Kurs entfernt liegt, als Vielfaches der ATR. Mit 3 dreht der Trend erst bei einer deutlichen Gegenbewegung. Kleinere Werte wie 2 melden Wenden früher, aber auch öfter falsch.",
      "How far the line sits from the price, as a multiple of the ATR. With 3 the trend only turns on a clear counter move. Smaller values like 2 report turns earlier, but also more often wrongly."
    ),
    default: 3,
    min: 0.1,
    max: 20,
    step: 0.1
  }
};
function name3(settings, locale) {
  return `Supertrend ${settings.length} · ${fmt(settings.factor, locale)}`;
}
var supertrend2 = defineNode({
  id: "core.supertrend",
  version: "1.0.0",
  category: "ind",
  label: l("Supertrend", "Supertrend"),
  description: l("Trendlinie, die bei einer Wende umspringt", "Trend line that flips when the trend turns"),
  help: l(
    "Zieht eine Linie im Abstand der üblichen Schwankung hinter dem Kurs her: im Aufwärtstrend darunter, im Abwärtstrend darüber. Die Linie bewegt sich nur in Trendrichtung. Schließt der Kurs auf ihrer anderen Seite, dreht der Trend und die Linie springt auf die andere Seite. Viele nutzen sie als nachgezogenen Stopp. Beispiel: „Kurs kreuzt Supertrend 10 · 3 nach oben“ meldet, wenn der Trend nach oben dreht. Die Signale „aufwärts“ und „abwärts“ sind wahr, solange der Trend in diese Richtung zeigt.",
    "Trails a line behind the price at the distance of its usual swings: below it in an uptrend, above it in a downtrend. The line only moves in the direction of the trend. When the price closes on its other side, the trend turns and the line jumps to the other side. Many use it as a trailing stop. Example: “Price crosses above Supertrend 10 · 3” fires when the trend turns up. The “up” and “down” signals are true as long as the trend points that way."
  ),
  technical: l(
    "Bänder (Hoch + Tief) / 2 ± Faktor × ATR, die nur in Trendrichtung nachgezogen werden, bis der Schluss davor sie durchbricht; die Richtung dreht, wenn der Schluss das gültige Band kreuzt; dieselbe Formel wie ta.supertrend in TradingView.",
    "Bands (high + low) / 2 ± factor × ATR that only trail in the direction of the trend until the previous close breaks them; the direction turns when the close crosses the active band; the same formula as ta.supertrend in TradingView."
  ),
  icon: "chart-spline",
  keywords: {
    de: ["trend", "stopp", "nachgezogener stopp", "atr", "wende", "trendwende"],
    en: ["trend", "stop", "trailing stop", "atr", "reversal", "trend change"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "line", type: "series", label: l("Supertrend", "Supertrend"), unit: "price" },
    { id: "up", type: "signal", label: l("aufwärts", "up") },
    { id: "down", type: "signal", label: l("abwärts", "down") }
  ],
  settings: SETTINGS3,
  sentence: ({ settings, locale }) => locale === "de" ? `${settings.length} Kerzen · Faktor ${fmt(settings.factor, locale)}` : `${settings.length} candles · factor ${fmt(settings.factor, locale)}`,
  short: ({ settings, pin, locale }) => {
    if (pin === "up") return `${name3(settings, locale)} ${locale === "de" ? "aufwärts" : "up"}`;
    if (pin === "down") return `${name3(settings, locale)} ${locale === "de" ? "abwärts" : "down"}`;
    return name3(settings, locale);
  },
  // ATR mit RMA wie beim RSI, dazu Zeit, bis die nachgezogenen Bänder vom Startpunkt unabhängig sind.
  warmup: ({ settings }) => 10 * settings.length + 100,
  compute({ inputs: inputs2, settings }) {
    const result = series_exports.supertrend(inputs2.high, inputs2.low, inputs2.close, settings.factor, settings.length);
    return { line: result.line, up: result.direction.map((d) => d === -1), down: result.direction.map((d) => d === 1) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 10, factor: 3 },
      expectAt: { "8": { line: null, up: false, down: false }, "9": { line: 84551.174, up: false, down: true } },
      expectLast: { line: 82800.51000739193, up: false, down: true }
    }
  ]
});

// packages/nodes/src/indicators/sweeps.ts
var SIDES3 = {
  highs: {
    label: l("über Hochs", "above highs"),
    help: l(
      "Sweeps über Swing-Hochs: Der Kurs sticht über ein Hoch und schließt wieder darunter. Die Kaufaufträge und Stopps darüber sind abgeholt, oft ein Zeichen von Schwäche.",
      "Sweeps above swing highs: the price spikes above a high and closes back below it. The buy orders and stops above are taken, often a sign of weakness."
    )
  },
  lows: {
    label: l("unter Tiefs", "below lows"),
    help: l(
      "Sweeps unter Swing-Tiefs: Der Kurs sticht unter ein Tief und schließt wieder darüber. Die Stopps darunter sind abgeholt, oft ein Zeichen von Stärke.",
      "Sweeps below swing lows: the price spikes below a low and closes back above it. The stops below are taken, often a sign of strength."
    )
  }
};
var POOLS = {
  all: {
    label: l("alle Swings", "all swings"),
    help: l("Jedes bestätigte Swing-Hoch (bei Tiefs jedes Swing-Tief) zählt als Liquidität.", "Every confirmed swing high (for lows every swing low) counts as liquidity.")
  },
  equal: {
    label: l("nur gleiche Hochs und Tiefs", "equal highs and lows only"),
    help: l(
      "Nur Stellen, an denen mindestens zwei Swings fast gleich hoch liegen. Seltener, aber dort sammeln sich besonders viele Aufträge.",
      "Only places where at least two swings sit at almost the same price. Rarer, but that is where especially many orders gather."
    )
  }
};
var PIN_SHORT15 = {
  sweep: l("Sweep", "Sweep"),
  equal: l("gleiche Swings", "equal swings"),
  level: l("Sweep", "Sweep"),
  pool: l("Liquidität", "liquidity")
};
var SWEEP = l("Sweep", "Sweep");
var EQUAL_HIGHS = l("EQH", "EQH");
var EQUAL_LOWS = l("EQL", "EQL");
var liquiditySweepsNode = defineNode({
  id: "core.sweeps",
  version: "1.0.0",
  category: "ind",
  label: l("Liquiditäts-Sweeps", "Liquidity sweeps"),
  description: l("Kurs holt Liquidität und kehrt um", "Price takes liquidity and turns"),
  help: l(
    "Über Swing-Hochs und unter Swing-Tiefs liegen viele Stopps und Aufträge, die Liquidität. Ein Sweep ist ein kurzer Ausflug darüber, nach dem der Kurs gleich wieder darunter schließt: Die Aufträge sind abgeholt, der Ausbruch hält nicht. Liegen mehrere Hochs fast gleich hoch (gleiche Hochs), sammelt sich dort besonders viel. Der Baustein meldet Sweeps und neue gleiche Hochs oder Tiefe und nennt das nächste Level, an dem Liquidität liegt. Ein Swing zählt erst nach seiner Bestätigung. Beispiel: „unter Tiefs“ meldet, wenn BTC unter das letzte Swing-Tief sticht und in derselben Kerze wieder darüber schließt.",
    "Above swing highs and below swing lows sit many stops and orders, the liquidity. A sweep is a brief excursion beyond, after which the price closes back inside right away: the orders are taken, the breakout does not hold. If several highs sit at almost the same price (equal highs), especially much gathers there. The node reports sweeps and new equal highs or lows and gives the next level holding liquidity. A swing only counts once it is confirmed. Example: “below lows” reports when BTC spikes below the last swing low and closes back above it in the same candle."
  ),
  technical: l(
    "Jedes bestätigte Swing-Hoch ist ein Pool. Ein neues Swing-Hoch höchstens „Gleich bis“ Prozent neben einem Pool, den noch keine Kerze erreicht hat, kommt dazu (gleiche Hochs); das Level ist das höchste. Sweep: Eine Kerze steigt über das Level, und sie selbst oder eine der Kerzen bis „Rückkehr innerhalb“ schließt darunter; sonst gilt der Pool als durchbrochen. Ein Pool zählt 500 Kerzen ab seinem ersten Swing. „Level des Sweeps“ gilt 500 Kerzen. Tiefs spiegelbildlich.",
    "Every confirmed swing high is a pool. A new swing high at most “Equal within” percent from a pool no candle has reached yet joins it (equal highs); the level is the highest. Sweep: a candle rises above the level and it, or one of the candles up to “Return within”, closes below it; otherwise the pool counts as broken. A pool counts for 500 candles from its first swing. “Sweep level” lasts 500 candles. Lows mirrored."
  ),
  icon: "droplets",
  keywords: {
    de: ["liquidität", "sweep", "stop hunt", "stopp", "gleiche hochs", "gleiche tiefs", "eqh", "eql", "fehlausbruch", "smart money", "smc"],
    en: ["liquidity", "sweep", "stop hunt", "stops", "equal highs", "equal lows", "eqh", "eql", "false breakout", "smart money", "smc"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [
    { id: "sweep", type: "signal", label: l("Sweep", "Sweep") },
    { id: "equal", type: "signal", label: l("neue gleiche Swings", "New equal swings") },
    { id: "level", type: "series", label: l("Level des Sweeps", "Sweep level"), unit: "price" },
    { id: "pool", type: "series", label: l("nächste Liquidität", "Next liquidity"), unit: "price" }
  ],
  settings: {
    side: {
      type: "select",
      label: l("Liquidität", "Liquidity"),
      help: l("Ob der Baustein Sweeps über Swing-Hochs oder unter Swing-Tiefs sucht.", "Whether the node looks for sweeps above swing highs or below swing lows."),
      default: "lows",
      options: Object.keys(SIDES3).map((value) => ({ value, label: SIDES3[value].label, help: SIDES3[value].help }))
    },
    pools: {
      type: "select",
      label: l("Welche Swings", "Which swings"),
      help: l("Ob jeder Swing zählt oder nur Stellen mit gleichen Hochs oder Tiefen.", "Whether every swing counts or only places with equal highs or lows."),
      default: "all",
      options: Object.keys(POOLS).map((value) => ({ value, label: POOLS[value].label, help: POOLS[value].help }))
    },
    tolerance: {
      type: "number",
      label: l("Gleich bis", "Equal within"),
      help: l(
        "Wie weit zwei Swings auseinanderliegen dürfen, um als gleich zu gelten, in Prozent des Kurses. 0,1 % sind bei BTC um 80 $; mit 0 zählen nur genau gleiche.",
        "How far apart two swings may be to count as equal, in percent of the price. 0.1 % is about $80 for BTC; with 0 only exactly equal ones count."
      ),
      default: 0.1,
      min: 0,
      max: 2,
      step: 0.01,
      unit: l("%", "%")
    },
    bars: lengthSetting(
      1,
      1,
      10,
      l(
        "In wie vielen Kerzen der Kurs wieder diesseits schließen muss. 1 heißt: Dieselbe Kerze, die über das Level sticht, schließt wieder darunter. Mit mehr Kerzen zählen auch Ausflüge, die kurz jenseits schließen.",
        "Within how many candles the price has to close back inside. 1 means the same candle that spikes above the level closes back below it. With more candles, excursions that briefly close beyond count too."
      ),
      l("Rückkehr innerhalb", "Return within")
    ),
    ...swingSettings(10, SWING_RIGHT_USED)
  },
  sentence: ({ settings, locale }) => `${SIDES3[settings.side].label[locale]}${settings.pools === "equal" ? locale === "de" ? " · nur gleiche" : " · equal only" : ""} · ${settings.left} · ${settings.right}`,
  short: ({ settings, pin, locale }) => `${(PIN_SHORT15[pin] ?? PIN_SHORT15.sweep)[locale]} ${SIDES3[settings.side].label[locale]} ${settings.left} · ${settings.right}`,
  // Ein Pool zählt 500 Kerzen ab seinem ersten Swing, das Level des Sweeps 500 Kerzen danach.
  warmup: ({ settings }) => 2 * MAX_AGE + settings.left + settings.right + settings.bars,
  visual: {
    kind: "overlay",
    series: { input: "close" },
    handles: [
      { kind: "swing", left: "left", right: "right" },
      { kind: "size", setting: "tolerance" }
    ],
    draw({ inputs: inputs2, settings }) {
      const highs = settings.side === "highs";
      const result = liquiditySweeps(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, highs, settings.tolerance, settings.bars, settings.pools === "equal");
      const last = inputs2.close.length - 1;
      const lines = [];
      const marks = [];
      for (const pool2 of result.pools) {
        const first = pool2.swings[0];
        if (!first) continue;
        const counts = settings.pools === "all" || pool2.swings.length >= 2;
        const end = Math.min(pool2.swept ?? pool2.breakout ?? Number.POSITIVE_INFINITY, first.at + MAX_AGE);
        lines.push({
          from: first.at,
          known: pool2.swings.length >= 2 ? pool2.swings[1]?.confirmed ?? first.confirmed : first.confirmed,
          ...end < last ? { to: end } : {},
          value: pool2.level,
          tone: counts ? highs ? "down" : "up" : "neutral",
          ...pool2.swings.length >= 2 ? { label: highs ? EQUAL_HIGHS : EQUAL_LOWS } : {}
        });
        if (pool2.swept !== void 0 && counts) {
          const extreme2 = highs ? inputs2.high[pool2.taken ?? pool2.swept] : inputs2.low[pool2.taken ?? pool2.swept];
          marks.push({ at: pool2.swept, value: extreme2 ?? pool2.level, tone: highs ? "down" : "up", label: SWEEP, side: highs ? "above" : "below" });
        }
      }
      const swing = latestSwing(result.swings);
      const pool = result.pool.at(-1);
      const tone = highs ? "down" : "up";
      const legend = [
        { kind: "line", tone, label: highs ? l("Liquidität über Swing-Hochs", "Liquidity above swing highs") : l("Liquidität unter Swing-Tiefs", "Liquidity below swing lows") },
        { kind: "dotted", tone: "neutral", label: l("Swing noch nicht bestätigt", "Swing not yet confirmed") },
        { kind: "mark", tone, label: l("Sweep", "Sweep") }
      ];
      if (result.pools.some((pool2) => pool2.swings.length >= 2)) legend.push({ kind: "line", tone, label: highs ? l("EQH: gleiche Hochs", "EQH: equal highs") : l("EQL: gleiche Tiefs", "EQL: equal lows") });
      return {
        legend,
        lines,
        marks,
        ...swing ? { swing: { at: swing.at, value: swing.value, high: swing.high } } : {},
        note: pool == null ? l("keine offene Liquidität", "no open liquidity") : l(`nächste Liquidität bei ${formatNumber(pool, "de")}`, `next liquidity at ${formatNumber(pool, "en")}`)
      };
    }
  },
  compute({ inputs: inputs2, settings }) {
    const result = liquiditySweeps(inputs2.close, inputs2.high, inputs2.low, settings.left, settings.right, settings.side === "highs", settings.tolerance, settings.bars, settings.pools === "equal");
    return { sweep: result.sweep, equal: result.equal, level: result.level, pool: result.pool };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { left: 5, right: 5 },
      expectAt: {
        "14": { pool: 83856.23 },
        "15": { sweep: false, level: null },
        "16": { sweep: true, level: 83856.23 },
        "104": { equal: true }
      },
      expectLast: { level: 80393.56, pool: 80809.25 }
    }
  ]
});

// packages/nodes/src/indicators/trendline.ts
function orderedPoints(settings) {
  const a = parseUtcTime(settings.time1);
  const b = parseUtcTime(settings.time2);
  if (a === void 0 || b === void 0 || a === b) return void 0;
  return a < b ? { t1: a, v1: settings.value1, t2: b, v2: settings.value2 } : { t1: b, v1: settings.value2, t2: a, v2: settings.value1 };
}
var NAME2 = l("Trendlinie", "Trend line");
function trendText(first, second, locale) {
  const trend2 = second > first ? l("steigt", "rising") : second < first ? l("fällt", "falling") : l("waagrecht", "flat");
  return `${trend2[locale]} · ${formatNumber(first, locale)} → ${formatNumber(second, locale)}`;
}
var trendline = defineNode({
  id: "core.trendline",
  version: "1.0.0",
  category: "ind",
  label: NAME2,
  description: l("Linie durch zwei Punkte im Chart", "Line through two points on the chart"),
  help: l(
    "Eine gerade Linie durch zwei Punkte, die du im Chart zeichnest, etwa durch zwei Hochs. Ab dem ersten Punkt läuft sie nach rechts weiter, auch über die letzte Kerze hinaus. Mit einem Vergleich A/B meldet sich die Chain, wenn der Kurs die Linie kreuzt. Beispiel: „Kurs kreuzt Trendlinie nach oben“ meldet den Ausbruch über eine fallende Linie.",
    "A straight line through two points you draw on the chart, such as two highs. From the first point it continues to the right, past the last candle too. With a Compare A/B the chain alerts you when the price crosses the line. Example: “Price crosses above trend line” reports the breakout above a falling line."
  ),
  technical: l(
    "Wert an jeder Kerze ab dem ersten Punkt: Wert 1 + (Wert 2 − Wert 1) · (Eröffnung − Zeit 1) / (Zeit 2 − Zeit 1), linear in der Zeit; vor dem ersten Punkt und ohne Wert am Eingang leer.",
    "Value on every candle from the first point: value 1 + (value 2 − value 1) · (open time − time 1) / (time 2 − time 1), linear in time; empty before the first point and without a value at the input."
  ),
  icon: "pencil-line",
  keywords: {
    de: ["trendlinie", "linie", "zeichnen", "ausbruch", "widerstand", "unterstützung", "diagonal"],
    en: ["trend line", "trendline", "line", "draw", "breakout", "resistance", "support"]
  },
  inputs: [{ id: "in", type: "series", label: l("Wert", "Value") }],
  outputs: [{ id: "out", type: "series", label: l("Linie", "Line"), unit: "input" }],
  settings: {
    time1: {
      type: "text",
      label: l("Punkt 1: Zeit", "Point 1: time"),
      help: l(
        "Wo die Linie beginnt: die Kerze des ersten Punkts, in deiner Zeitzone. Im Chart setzt du den Punkt mit einem Klick und ziehst ihn mit der Maus oder dem Finger.",
        "Where the line starts: the candle of the first point, in your time zone. On the chart you set the point with a click and drag it with the mouse or your finger."
      ),
      default: "",
      format: "datetime",
      required: true
    },
    value1: {
      type: "number",
      label: l("Punkt 1: Wert", "Point 1: value"),
      help: l(
        "Der Wert am ersten Punkt, meist ein Kurs wie 84.120. Liegt der Punkt an einem Hoch, nimm den Kurs des Hochs.",
        "The value at the first point, usually a price like 84,120. If the point sits on a high, take the price of the high."
      ),
      default: 0
    },
    time2: {
      type: "text",
      label: l("Punkt 2: Zeit", "Point 2: time"),
      help: l(
        "Die Kerze des zweiten Punkts. Die Linie läuft durch beide Punkte und danach weiter nach rechts.",
        "The candle of the second point. The line runs through both points and then on to the right."
      ),
      default: "",
      format: "datetime",
      required: true
    },
    value2: {
      type: "number",
      label: l("Punkt 2: Wert", "Point 2: value"),
      help: l(
        "Der Wert am zweiten Punkt. Ist er höher als der erste, steigt die Linie, ist er tiefer, fällt sie.",
        "The value at the second point. Higher than the first means a rising line, lower means a falling one."
      ),
      default: 0
    }
  },
  sentence: ({ settings, locale }) => {
    const points = orderedPoints(settings);
    return points ? trendText(points.v1, points.v2, locale) : l("noch nicht gezeichnet", "not drawn yet")[locale];
  },
  short: ({ locale }) => NAME2[locale],
  warmup: () => 0,
  visual: {
    kind: "line",
    series: { input: "in" },
    line: { output: "out" },
    points: [
      { time: "time1", value: "value1" },
      { time: "time2", value: "value2" }
    ]
  },
  compute({ inputs: inputs2, settings, bars }) {
    const out = new Array(bars.length).fill(null);
    const points = orderedPoints(settings);
    if (!points) return { out };
    const slope = (points.v2 - points.v1) / (points.t2 - points.t1);
    for (let i = 0; i < bars.length; i++) {
      const time = bars.openTime[i];
      if (time < points.t1 || inputs2.in[i] == null) continue;
      out[i] = points.v1 + slope * (time - points.t1);
    }
    return { out };
  },
  // Referenzwerte von Hand: Die Kursdaten haben 500 Stundenkerzen ohne Lücke, Kerze 100 öffnet am 30.09. um 08:00 UTC,
  // Kerze 200 am 04.10. um 12:00 UTC und Kerze 300 am 08.10. um 16:00 UTC.
  tests: [
    {
      name: "steigend",
      fixture: FIXTURE,
      settings: { time1: "2026-09-30T08:00:00Z", value1: 8e4, time2: "2026-10-04T12:00:00Z", value2: 82e3 },
      expectAt: { "99": { out: null }, "100": { out: 8e4 }, "150": { out: 81e3 }, "200": { out: 82e3 }, "300": { out: 84e3 } },
      expectLast: { out: 87980 }
    },
    {
      name: "fallend, Punkte in umgekehrter Reihenfolge",
      fixture: FIXTURE,
      settings: { time1: "2026-10-08T16:00:00Z", value1: 81e3, time2: "2026-10-04T12:00:00Z", value2: 85e3 },
      expectAt: { "199": { out: null }, "200": { out: 85e3 }, "250": { out: 83e3 }, "300": { out: 81e3 } },
      expectLast: { out: 73040 }
    },
    { name: "noch nicht gezeichnet", fixture: FIXTURE, expectLast: { out: null } }
  ]
});

// packages/nodes/src/indicators/value-when.ts
var VALUE_MAX_AGE = 500;
var NAME3 = l("Wert bei Signal", "Value at signal");
function nearWords(width, locale) {
  return `${locale === "de" ? "nahe" : "near"} ±${formatNumber(width, locale)} %`;
}
var valueWhen2 = defineNode({
  id: "core.value-when",
  version: "1.0.0",
  category: "ind",
  label: NAME3,
  description: l("Merkt sich den Kurs beim Signal als Linie", "Remembers the price at a signal as a line"),
  help: l(
    "Merkt sich einen Wert, meist den Kurs, an der Kerze, an der das Signal wahr ist, und gibt ihn als waagrechte Linie weiter, bis das Signal wieder kommt. So lassen sich Regeln bauen, die sich auf den Auslöser beziehen: Rückkehr zum Kurs des Ausbruchs, Schluss wieder über dem Kurs beim letzten Alarm, 10 % unter dem Kurs beim Signal. „nahe“ meldet, wenn der Wert ab der Kerze danach bis auf ±x % an die Linie zurückkommt. Beispiel: Signal „Kurs kreuzt 20-Tage-Hoch nach oben“, dann „nahe ±1 %“ meldet den Rücklauf an die Ausbruchsmarke.",
    "Remembers a value, usually the price, on the candle where the signal is true and passes it on as a horizontal line until the signal comes again. This lets you build rules that refer to the trigger: a return to the breakout price, a close back above the price at the last alert, 10 % below the price at the signal. “near” reports when the value comes back within ±x % of the line, from the candle after. Example: signal “price crosses above the 20-day high”, then “near ±1 %” reports the pullback to the breakout level."
  ),
  technical: l(
    "Der Wert an der letzten Kerze, an der das Signal wahr war, die aktuelle eingeschlossen, wie ta.valuewhen(Signal, Wert, 0) in TradingView; höchstens 500 Kerzen lang. Abstand = (Wert − Linie) / |Linie| · 100. „nahe“ ab der Kerze nach dem Signal, wenn |Abstand| ≤ x.",
    "The value on the last candle where the signal was true, the current one included, like ta.valuewhen(signal, value, 0) in TradingView; for at most 500 candles. Distance = (value − line) / |line| · 100. “near” from the candle after the signal when |distance| ≤ x."
  ),
  icon: "bookmark",
  keywords: {
    de: ["wert bei signal", "merken", "einstieg", "ausbruchskurs", "retest", "rücklauf", "level", "valuewhen"],
    en: ["value at signal", "value when", "remember", "entry", "breakout price", "retest", "pullback", "level", "valuewhen"]
  },
  inputs: [
    { id: "in", type: "series", label: LABEL_VALUE },
    { id: "signal", type: "signal", label: LABEL_SIGNAL }
  ],
  outputs: [
    { id: "out", type: "series", label: NAME3, unit: "input" },
    { id: "distance", type: "series", label: l("Abstand %", "Distance %"), unit: "percent" },
    { id: "near", type: "signal", label: l("nahe", "near") }
  ],
  settings: {
    width: {
      type: "number",
      label: l("Band ±", "Band ±"),
      help: l(
        "Wie nah der Wert der Linie kommen muss, damit „nahe“ wahr ist, in Prozent der Linie. 1 heißt 1 % darüber und darunter, bei 80.000 $ also 800 $.",
        "How close the value has to come to the line for “near” to be true, in percent of the line. 1 means 1 % above and below, so $800 at $80,000."
      ),
      default: 1,
      min: 0,
      max: 50,
      step: 0.05,
      unit: l("%", "%")
    }
  },
  sentence: ({ settings, locale, output }) => output?.("near") ? nearWords(settings.width, locale) : locale === "de" ? "gemerkt beim Signal" : "remembered at the signal",
  short: ({ settings, pin, locale }) => {
    if (pin === "near") return `${NAME3[locale]} ${nearWords(settings.width, locale)}`;
    if (pin === "distance") return locale === "de" ? "Abstand zum Wert bei Signal" : "Distance to value at signal";
    return NAME3[locale];
  },
  warmup: () => VALUE_MAX_AGE,
  visual: { kind: "band", series: { input: "in" }, line: { output: "out" }, width: "width", signal: "near" },
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.valueWhen(inputs2.signal, inputs2.in, VALUE_MAX_AGE);
    const distance3 = series_exports.map(series_exports.sub(inputs2.in, out), (difference, i) => {
      const line = out[i];
      return line == null || line === 0 ? null : 100 * difference / Math.abs(line);
    });
    const since = series_exports.barsSince(inputs2.signal);
    const near = distance3.map((value, i) => value !== null && (since[i] ?? 0) > 0 && Math.abs(value) <= settings.width);
    return { out, distance: distance3, near };
  }
});

// packages/nodes/src/indicators/volume.ts
var volume = defineNode({
  id: "core.volume",
  version: "1.0.0",
  category: "ind",
  label: l("Volumen", "Volume"),
  description: l("Erkennt ungewöhnlich hohes Volumen", "Spots unusually high volume"),
  help: l(
    "Vergleicht das Volumen einer Kerze mit dem Durchschnitt der letzten Kerzen. Verbinde dafür den Eingang mit dem Ausgang Volumen der Kerze. Der Ausgang Relativ zeigt das Verhältnis: 1 ist normal, 2 doppelt so viel wie üblich. Beispiel: „Relativ über 2“ meldet Kerzen mit mehr als doppeltem Volumen, wie sie bei Nachrichten oder Ausbrüchen vorkommen.",
    "Compares a candle’s volume with the average of the last candles. Connect the input to the candle’s Volume output for this. The Relative output shows the ratio: 1 is normal, 2 is twice the usual amount. Example: “Relative above 2” fires on candles with more than double the volume, as seen with news or breakouts."
  ),
  technical: l("Durchschnitt als SMA, Relativ als Volumen geteilt durch diesen Durchschnitt.", "Average as an SMA, Relative as volume divided by that average."),
  icon: "chart-column",
  keywords: { de: ["volumen", "umsatz", "relatives volumen", "durchschnitt"], en: ["volume", "turnover", "relative volume", "average"] },
  inputs: [{ id: "in", type: "series", label: l("Volumen", "Volume") }],
  outputs: [
    { id: "volume", type: "series", label: l("Volumen", "Volume"), unit: "input" },
    { id: "average", type: "series", label: l("Durchschnitt", "Average") },
    { id: "relative", type: "series", label: l("Relativ", "Relative") }
  ],
  settings: {
    length: lengthSetting(
      20,
      2,
      500,
      l("Über wie viele Kerzen der Durchschnitt rechnet. 20 ist üblich; mit 1-Stunden-Kerzen ist das knapp ein Tag.", "How many candles the average covers. 20 is usual; with 1-hour candles that is almost a day.")
    )
  },
  sentence: ({ settings, locale }) => locale === "de" ? `Ø ${settings.length} Kerzen` : `${settings.length}-candle average`,
  short: ({ settings, pin, locale }) => {
    if (pin === "average") return locale === "de" ? `Ø-Volumen ${settings.length}` : `avg volume ${settings.length}`;
    if (pin === "relative") return locale === "de" ? `rel. Volumen ${settings.length}` : `relative volume ${settings.length}`;
    return locale === "de" ? "Volumen" : "Volume";
  },
  warmup: ({ settings }) => settings.length,
  compute({ inputs: inputs2, settings }) {
    const average = series_exports.sma(inputs2.in, settings.length);
    return { volume: inputs2.in, average, relative: series_exports.div(inputs2.in, average) };
  },
  tests: [
    {
      fixture: FIXTURE,
      inputs: { in: "volume" },
      settings: { length: 20 },
      expectLast: { volume: 436.16879, average: 612.02253, relative: 0.712667865348029 },
      tolerance: 1e-9
    }
  ]
});

// packages/nodes/src/indicators/volume-profile.ts
var SESSIONS = {
  previous: {
    label: l("vorige", "previous"),
    help: l(
      "Das Profil der letzten abgeschlossenen Sitzung, etwa von gestern. Es steht ab der ersten Kerze der neuen Sitzung fest und ändert sich bis zu ihrem Ende nicht.",
      "The profile of the last completed session, such as yesterday. It is fixed from the first candle of the new session and does not change until it ends."
    )
  },
  current: {
    label: l("laufende", "current"),
    help: l(
      "Das Profil der laufenden Sitzung bis zur gerade geschlossenen Kerze. POC und Value Area wandern mit; an der letzten Kerze sind sie genau das Profil, das ab der nächsten Sitzung als vorige gilt.",
      "The profile of the current session up to the candle that just closed. POC and value area move along; on the last candle they are exactly the profile that counts as the previous one from the next session on."
    )
  }
};
var PERIODS4 = {
  day: {
    label: l("Tag", "day"),
    help: l("Eine Sitzung pro Kalendertag. Am genauesten mit Kerzen von 15 Minuten bis 1 Stunde.", "One session per calendar day. Most accurate with candles from 15 minutes to 1 hour.")
  },
  week: {
    label: l("Woche", "week"),
    help: l("Eine Sitzung pro Kalenderwoche, Montag bis Sonntag. Passt zu 1- und 4-Stunden-Kerzen.", "One session per calendar week, Monday to Sunday. Suits 1-hour and 4-hour candles.")
  },
  month: {
    label: l("Monat", "month"),
    help: l("Eine Sitzung pro Kalendermonat. Passt zu 4-Stunden- und Tageskerzen.", "One session per calendar month. Suits 4-hour and daily candles.")
  }
};
var SPANS = {
  previous: {
    day: { sentence: l("Vortag", "previous day"), short: l("Vortag", "prior day") },
    week: { sentence: l("Vorwoche", "previous week"), short: l("Vorwoche", "prior week") },
    month: { sentence: l("Vormonat", "previous month"), short: l("Vormonat", "prior month") }
  },
  current: {
    day: { sentence: l("heute bis jetzt", "today so far"), short: l("heute", "today’s") },
    week: { sentence: l("diese Woche bis jetzt", "this week so far"), short: l("diese Woche", "this week’s") },
    month: { sentence: l("dieser Monat bis jetzt", "this month so far"), short: l("dieser Monat", "this month’s") }
  }
};
var PIN_NAMES = { poc: l("POC", "POC"), vah: l("VAH", "VAH"), val: l("VAL", "VAL"), high: l("Hoch", "high"), low: l("Tief", "low") };
var NEAR_LEVELS2 = {
  high: { label: l("Hoch", "High"), help: l("Der höchste Preis der Sitzung.", "The highest price of the session.") },
  vah: { label: l("VAH", "VAH"), help: l("Die Oberkante der Value Area.", "The upper edge of the value area.") },
  poc: { label: l("POC", "POC"), help: l("Der Preis mit dem meisten Volumen.", "The price with the most volume.") },
  val: { label: l("VAL", "VAL"), help: l("Die Unterkante der Value Area.", "The lower edge of the value area.") },
  low: { label: l("Tief", "Low"), help: l("Der tiefste Preis der Sitzung.", "The lowest price of the session.") }
};
function profileName(pin, session, period, locale) {
  const name4 = (PIN_NAMES[pin] ?? PIN_NAMES.poc)[locale];
  const span = SPANS[session][period].short[locale];
  return locale === "de" ? `${name4} ${span}` : `${span} ${name4}`;
}
function profileWarmup(session, period) {
  if (session === "previous") return period === "day" ? 2 : period === "week" ? 14 : 62;
  return period === "day" ? 2 : period === "week" ? 8 : 32;
}
var volumeProfile2 = defineNode({
  id: "core.volume-profile",
  version: "1.0.0",
  category: "ind",
  label: l("Volumenprofil", "Volume profile"),
  description: l("POC und Value Area der vorigen Sitzung", "POC and value area of the prior session"),
  help: l(
    "Zeigt, auf welchen Preisen in einer Sitzung am meisten gehandelt wurde. Der POC ist der Preis mit dem meisten Volumen, die Value Area der Bereich um ihn mit 70 % des Volumens, VAH und VAL sind ihre Ober- und Untergrenze. Viele Trader sehen in der Value Area den fairen Preis des Vortags: Der Kurs kehrt oft dorthin zurück oder pendelt um den POC, ein Schluss außerhalb gilt als Zeichen für einen Trend. Der Ausgang „nahe“ meldet, wenn eine Kerze einem gewählten Level bis auf ±x % nahekommt. Beispiel: „nahe POC ±0,3 %“ meldet, wenn BTC bis auf 0,3 % an den meistgehandelten Preis von gestern herankommt; mit dem Baustein Band meldet „Kurs pendelt um POC Vortag ±0,3 %“, wenn er um diesen Preis schwankt. Bellchain rechnet das Profil aus den Kerzen der Chain, am genauesten mit 15-Minuten- oder 1-Stunden-Kerzen.",
    "Shows at which prices most trading happened in a session. The POC is the price with the most volume, the value area the range around it holding 70 % of the volume, VAH and VAL are its upper and lower edge. Many traders see the value area as the previous day’s fair price: the price often returns there or rotates around the POC, and a close outside it counts as a sign of a trend. The “near” output reports when a candle comes within ±x % of a chosen level. Example: “near POC ±0.3 %” reports when BTC gets within 0.3 % of yesterday’s most traded price; with the Band node, “Price rotates around prior day POC ±0.3 %” reports when it swings around that price. Bellchain builds the profile from the chain’s candles, most accurately with 15-minute or 1-hour candles."
  ),
  technical: l(
    "Preisstufen gleicher Höhe über die Spanne der Sitzung; das Volumen jeder Kerze verteilt sich gleichmäßig über ihre Spanne, anteilig nach Überlappung mit jeder Stufe. POC ist die Mitte der Stufe mit dem meisten Volumen, bei Gleichstand die näher an der Mitte der Spanne. Die Value Area wächst vom POC Stufe für Stufe zur Nachbarstufe mit mehr Volumen, bei Gleichstand zur näheren, dann zur oberen, bis sie den eingestellten Anteil hält; VAH ist ihre Oberkante, VAL ihre Unterkante. Dieselbe Regel für die Value Area wie die Volumenprofile von TradingView, die aber aus Kerzen einer kleineren Zeiteinheit rechnen. „nahe“: Tief ≤ Level × (1 + x / 100) und Hoch ≥ Level × (1 − x / 100).",
    "Price levels of equal height across the session’s range; each candle’s volume is spread evenly over its range, in proportion to its overlap with each level. The POC is the middle of the level with the most volume, on a tie the one closer to the middle of the range. The value area grows from the POC level by level towards the neighbouring level with more volume, on a tie the closer one, then the upper one, until it holds the set share; VAH is its top edge, VAL its bottom edge. The same value area rule as TradingView’s volume profiles, which however compute from candles of a smaller timeframe. “near”: low ≤ level × (1 + x / 100) and high ≥ level × (1 − x / 100)."
  ),
  icon: "chart-bar",
  keywords: {
    de: ["volumenprofil", "volume profile", "poc", "vah", "val", "value area", "market profile", "vpoc", "vortag"],
    en: ["volume profile", "poc", "vah", "val", "value area", "market profile", "vpoc", "point of control", "prior day"]
  },
  inputs: CANDLE_HLV_INPUTS,
  outputs: [
    { id: "poc", type: "series", label: l("POC", "POC"), unit: "price" },
    { id: "vah", type: "series", label: l("VAH", "VAH"), unit: "price" },
    { id: "val", type: "series", label: l("VAL", "VAL"), unit: "price" },
    { id: "high", type: "series", label: l("Hoch", "High"), unit: "price" },
    { id: "low", type: "series", label: l("Tief", "Low"), unit: "price" },
    NEAR_OUTPUT
  ],
  settings: {
    session: {
      type: "select",
      label: l("Sitzung", "Session"),
      help: l("Ob das Profil einer abgeschlossenen Sitzung gilt oder das der laufenden bis jetzt.", "Whether the profile of a completed session applies or that of the current session so far."),
      default: "previous",
      options: Object.keys(SESSIONS).map((value) => ({ value, label: SESSIONS[value].label, help: SESSIONS[value].help }))
    },
    period: {
      type: "select",
      label: l("Zeitraum", "Period"),
      help: l("Wie lang eine Sitzung ist: ein Tag, eine Woche ab Montag oder ein Kalendermonat.", "How long a session is: one day, one week from Monday or one calendar month."),
      default: "day",
      options: Object.keys(PERIODS4).map((value) => ({ value, label: PERIODS4[value].label, help: PERIODS4[value].help }))
    },
    valueArea: {
      type: "number",
      label: l("Value Area", "Value area"),
      help: l(
        "Welcher Anteil des Volumens in der Value Area liegt. 70 % ist üblich; mit mehr wird sie breiter, mit weniger enger um den POC.",
        "Which share of the volume lies inside the value area. 70 % is usual; more makes it wider, less tighter around the POC."
      ),
      default: 70,
      min: 50,
      max: 95,
      step: 1,
      unit: l("%", "%"),
      advanced: true
    },
    rows: {
      ...lengthSetting(
        50,
        10,
        200,
        l(
          "In wie viele gleich hohe Stufen die Spanne der Sitzung geteilt wird. Mit 50 ist eine Stufe bei 2,5 % Tagesspanne 0,05 % hoch; mehr Stufen bringen selten mehr Genauigkeit, weil die Kerzen selbst grob sind.",
          "How many levels of equal height the session’s range is split into. With 50, one level is 0.05 % high at a 2.5 % daily range; more levels rarely add accuracy because the candles themselves are coarse."
        ),
        l("Preisstufen", "Price levels")
      ),
      advanced: true
    },
    timezone: utcTimezoneSetting,
    level: levelSetting(
      Object.keys(NEAR_LEVELS2).map((value) => ({ value, label: NEAR_LEVELS2[value].label, help: NEAR_LEVELS2[value].help })),
      "poc"
    ),
    width: levelWidthSetting
  },
  sentence: ({ settings, locale, output }) => SPANS[settings.session][settings.period].sentence[locale] + (settings.valueArea === 70 ? "" : ` · Value Area ${formatNumber(settings.valueArea, locale)} %`) + (output?.("near") ? ` · ${nearText(NEAR_LEVELS2[settings.level].label[locale], settings.width, locale)}` : ""),
  short: ({ settings, pin, locale }) => pin === "near" ? nearText(profileName(settings.level, settings.session, settings.period, locale), settings.width, locale) : profileName(pin, settings.session, settings.period, locale),
  warmup: ({ settings, timeframe }) => barsForDays(profileWarmup(settings.session, settings.period), timeframe),
  compute({ inputs: inputs2, settings, bars }) {
    const levels = volumeProfile(inputs2.high, inputs2.low, inputs2.volume, bars, {
      period: settings.period,
      timeZone: settings.timezone,
      session: settings.session,
      rows: settings.rows,
      share: settings.valueArea / 100
    });
    return { ...levels, near: nearLevel(inputs2.high, inputs2.low, levels[settings.level], settings.width) };
  },
  visual: { kind: "levels", high: { input: "high" }, low: { input: "low" }, levels: Object.keys(NEAR_LEVELS2), level: "level", width: "width", signal: "near" },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung). Der erste volle Tag in UTC beginnt bei Kerze 20,
  // sein Profil gilt ab dem 28.09. um 0:00 Uhr UTC (Kerze 44) als das des Vortags.
  tests: [
    {
      name: "Vortag in UTC",
      fixture: FIXTURE,
      inputs: CANDLE_HLV,
      settings: { session: "previous", period: "day", timezone: "UTC" },
      expectAt: { "43": { poc: null, vah: null }, "44": { poc: 84512.0011, vah: 84892.0022, val: 84440.109, high: 85159.03, low: 84132 } },
      expectLast: { poc: 82435.899, vah: 82577.614, val: 80877.034, high: 82634.3, low: 79800 }
    },
    {
      name: "laufender Tag in UTC",
      fixture: FIXTURE,
      inputs: CANDLE_HLV,
      settings: { session: "current", period: "day", timezone: "UTC" },
      expectAt: { "19": { poc: null }, "20": { poc: 84348.3031, vah: 84413.4696, val: 84283.1366, high: 84443.26 } },
      expectLast: { poc: 82237.3952, vah: 82471.8668, val: 81533.9804, high: 82940.81 }
    }
  ]
});

// packages/nodes/src/indicators/vwap.ts
var ANCHORS = {
  day: {
    label: l("Tag", "day"),
    help: l("Beginnt jeden Tag um Mitternacht neu. Die übliche Wahl für Kerzen bis 1 Stunde.", "Starts over every day at midnight. The usual choice for candles up to 1 hour."),
    since: l("seit Tagesbeginn", "since start of day")
  },
  week: {
    label: l("Woche", "week"),
    help: l("Beginnt jeden Montag neu und läuft die ganze Woche. Passt zu 4-Stunden-Kerzen.", "Starts over every Monday and runs all week. Suits 4-hour candles."),
    since: l("seit Wochenbeginn", "since start of week")
  },
  month: {
    label: l("Monat", "month"),
    help: l("Beginnt am Ersten jedes Monats neu. Passt zu Kerzen ab 4 Stunden.", "Starts over on the first of every month. Suits candles from 4 hours up."),
    since: l("seit Monatsbeginn", "since start of month")
  }
};
var SHORT5 = {
  out: { day: l("VWAP", "VWAP"), week: l("VWAP Woche", "weekly VWAP"), month: l("VWAP Monat", "monthly VWAP") },
  upper: { day: l("oberes VWAP-Band", "upper VWAP band"), week: l("oberes VWAP-Band Woche", "upper weekly VWAP band"), month: l("oberes VWAP-Band Monat", "upper monthly VWAP band") },
  lower: { day: l("unteres VWAP-Band", "lower VWAP band"), week: l("unteres VWAP-Band Woche", "lower weekly VWAP band"), month: l("unteres VWAP-Band Monat", "lower monthly VWAP band") }
};
var vwap2 = defineNode({
  id: "core.vwap",
  version: "1.0.0",
  category: "ind",
  label: l("VWAP", "VWAP"),
  description: l("Durchschnittspreis des Tages nach Volumen", "Volume-weighted average price of the day"),
  help: l(
    "Der Durchschnittspreis seit Tagesbeginn, gewichtet nach dem Volumen: Kerzen mit viel Umsatz zählen mehr. Viele große Händler messen ihre Käufe daran. Liegt der Kurs über dem VWAP, sind die Käufer des Tages im Schnitt im Plus, darunter im Minus. Die Bänder zeigen die übliche Streuung um den VWAP. Beispiel: „Kurs kreuzt VWAP nach oben“ meldet, wenn BTC wieder über den Durchschnittspreis des Tages steigt. Den ersten Zeitraum, von dem nicht alle Kerzen geladen sind, lässt der Baustein leer.",
    "The average price since the start of the day, weighted by volume: candles with a lot of trading count more. Many large traders measure their buys against it. When the price is above the VWAP, the day’s buyers are in profit on average, below it at a loss. The bands show the usual spread around the VWAP. Example: “Price crosses above VWAP” fires when BTC rises back above the day’s average price. The node leaves the first period empty if not all of its candles are loaded."
  ),
  technical: l(
    "Summe aus (Hoch + Tief + Schluss) / 3 × Volumen geteilt durch die Summe des Volumens seit Beginn des Zeitraums, Bänder im Abstand Breite × volumengewichtete Standardabweichung; dieselben Werte wie der eingebaute Indikator VWAP von TradingView mit Bändern nach Standardabweichung, ab dem ersten vollständigen Zeitraum.",
    "Sum of (high + low + close) / 3 × volume divided by the sum of volume since the start of the period, bands at width × the volume-weighted standard deviation; the same values as TradingView’s built-in VWAP indicator with standard deviation bands, from the first complete period on."
  ),
  icon: "anchor",
  keywords: {
    de: ["vwap", "durchschnittspreis", "volumen", "anker", "intraday", "band"],
    en: ["vwap", "average price", "volume", "anchor", "intraday", "band"]
  },
  inputs: CANDLE_HLCV_INPUTS,
  outputs: [
    { id: "out", type: "series", label: l("VWAP", "VWAP"), unit: "price" },
    { id: "upper", type: "series", label: l("Oben", "Upper"), unit: "price" },
    { id: "lower", type: "series", label: l("Unten", "Lower"), unit: "price" }
  ],
  settings: {
    anchor: {
      type: "select",
      label: l("Neustart", "Reset"),
      help: l("Wann der VWAP neu zu rechnen beginnt. Bis dahin zählen alle Kerzen seit dem letzten Neustart.", "When the VWAP starts over. Until then, every candle since the last reset counts."),
      default: "day",
      options: Object.keys(ANCHORS).map((value) => ({ value, label: ANCHORS[value].label, help: ANCHORS[value].help }))
    },
    timezone: utcTimezoneSetting,
    mult: {
      type: "number",
      label: l("Breite", "Width"),
      help: l(
        "Wie weit die Bänder vom VWAP entfernt liegen, gemessen in Standardabweichungen. Mit 1 liegen sie nah am VWAP, mit 2 oder 3 erreicht der Kurs sie nur bei starken Bewegungen.",
        "How far the bands sit from the VWAP, measured in standard deviations. With 1 they are close to the VWAP, with 2 or 3 the price only reaches them on strong moves."
      ),
      default: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: l("σ", "σ")
    }
  },
  sentence: ({ settings, locale }) => ANCHORS[settings.anchor].since[locale] + (settings.mult === 1 ? "" : ` · ${locale === "de" ? "Breite" : "width"} ${formatNumber(settings.mult, locale)}`),
  short: ({ settings, pin, locale }) => (SHORT5[pin] ?? SHORT5.out)[settings.anchor][locale],
  warmup: ({ settings, timeframe }) => barsForDays(settings.anchor === "day" ? 2 : settings.anchor === "week" ? 8 : 32, timeframe),
  visual: {
    kind: "channel",
    series: { input: "close" },
    middle: { output: "out" },
    upper: { output: "upper" },
    lower: { output: "lower" },
    width: "mult",
    high: { input: "high" },
    low: { input: "low" }
  },
  compute({ inputs: inputs2, settings, bars }) {
    const anchors = periodAnchors(bars, periodStarts(bars, settings.anchor, settings.timezone));
    const typical = series_exports.div(series_exports.add(series_exports.add(inputs2.high, inputs2.low), inputs2.close), 3);
    const result = series_exports.vwap(typical, inputs2.volume, anchors, settings.mult);
    return { out: result.vwap, upper: result.upper, lower: result.lower };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung). Der erste volle Tag in UTC beginnt bei Kerze 20.
  tests: [
    {
      name: "Tag in UTC, Breite 1",
      fixture: FIXTURE,
      inputs: CANDLE_HLCV,
      settings: { anchor: "day", timezone: "UTC", mult: 1 },
      expectAt: { "19": { out: null, upper: null }, "20": { out: 84335.44666666667, upper: 84335.44666666667, lower: 84335.44666666667 } },
      expectLast: { out: 81884.86638015654, upper: 82311.16844404647, lower: 81458.56431626662 }
    }
  ]
});

// packages/nodes/src/indicators/willr.ts
var RANGE5 = { oversold: -80, overbought: -20, min: -100, max: 0, step: 1 };
var williamsR = defineNode({
  id: "core.willr",
  version: "1.0.0",
  category: "ind",
  label: l("Williams %R", "Williams %R"),
  description: l("Schluss nahe Hoch oder Tief, −100 bis 0", "Close near the high or low, −100 to 0"),
  help: l(
    "Zeigt wie die Stochastik, wo der Schlusskurs in der Spanne der letzten Kerzen liegt, nur auf einer Skala von −100 bis 0: 0 heißt am höchsten Hoch, −100 am tiefsten Tief. Über −20 schließt der Kurs nahe am Hoch (überkauft), unter −80 nahe am Tief (überverkauft); die Ausgänge „überkauft“ und „überverkauft“ melden das, die Schwellen ziehst du im Bild unter dem Kurs. Beispiel: „Williams %R 14 kreuzt −80 nach oben“ meldet, wenn sich der Kurs nach einem Abverkauf vom Tief löst.",
    "Like the stochastic, shows where the close sits within the range of the last candles, but on a scale from −100 to 0: 0 means at the highest high, −100 at the lowest low. Above −20 the price closes near the high (overbought), below −80 near the low (oversold); the “overbought” and “oversold” outputs report this, and you drag the thresholds in the chart below the price. Example: “Williams %R 14 crosses above −80” fires when the price pulls away from the low after a sell-off."
  ),
  technical: l(
    "100 · (Schluss − höchstes Hoch) / (höchstes Hoch − tiefstes Tief) über die Kerzen, leer, wenn Hoch und Tief gleich sind; dieselbe Formel wie ta.wpr in TradingView.",
    "100 · (close − highest high) / (highest high − lowest low) over the candles, empty when high and low are equal; the same formula as ta.wpr in TradingView."
  ),
  icon: "percent",
  keywords: {
    de: ["williams %r", "williams", "wpr", "oszillator", "überkauft", "überverkauft"],
    en: ["williams %r", "williams", "wpr", "oscillator", "overbought", "oversold"]
  },
  inputs: CANDLE_HLC_INPUTS,
  outputs: [{ id: "out", type: "series", label: l("%R", "%R") }, ...THRESHOLD_OUTPUTS],
  settings: {
    length: lengthSetting(
      14,
      2,
      200,
      l(
        "Aus wie vielen Kerzen das höchste Hoch und das tiefste Tief stammen. 14 ist der übliche Wert. Weniger Kerzen machen die Linie schneller und unruhiger, mehr Kerzen ruhiger.",
        "How many candles the highest high and the lowest low are taken from. 14 is the usual value. Fewer candles make the line faster and jumpier, more candles calmer."
      )
    ),
    ...thresholdSettings(RANGE5, {
      oversold: l(
        "Unter dieser Linie schließt der Kurs nahe am tiefsten Tief der letzten Kerzen, und der Ausgang „überverkauft“ ist wahr. Üblich ist −80.",
        "Below this line the price closes near the lowest low of the last candles, and the “oversold” output is true. −80 is usual."
      ),
      overbought: l(
        "Über dieser Linie schließt der Kurs nahe am höchsten Hoch der letzten Kerzen, und der Ausgang „überkauft“ ist wahr. Üblich ist −20.",
        "Above this line the price closes near the highest high of the last candles, and the “overbought” output is true. −20 is usual."
      )
    })
  },
  sentence: ({ settings, locale, output }) => (locale === "de" ? `${settings.length} Kerzen` : `${settings.length} candles`) + thresholdSentence(settings, output, locale),
  short: ({ settings, pin, locale }) => pin === "out" ? `Williams %R ${settings.length}` : thresholdShort(`Williams %R ${settings.length}`, pin, settings, locale),
  warmup: ({ settings }) => settings.length,
  visual: { kind: "zone", series: { output: "out" }, low: "oversold", high: "overbought", price: { input: "close" }, signal: ["oversold", "overbought"] },
  compute({ inputs: inputs2, settings }) {
    const out = series_exports.wpr(inputs2.high, inputs2.low, inputs2.close, settings.length);
    return { out, ...thresholdSignals(out, settings.oversold, settings.overbought) };
  },
  // Referenzwerte aus scripts/pine-reference.py (exakte Dezimalrechnung)
  tests: [
    {
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14 },
      expectAt: { "12": { out: null }, "13": { out: -41.91373834648089 } },
      expectLast: { out: -62.16902174932913 },
      tolerance: 1e-9
    },
    // Schwellen gegen die Referenz (scripts/pine-reference.py): über −20 an Kerze 19, unter −80 an Kerze 35.
    {
      name: "Schwellen −80 und −20",
      fixture: FIXTURE,
      inputs: CANDLE_HLC,
      settings: { length: 14, oversold: -80, overbought: -20 },
      expectAt: { "19": { overbought: true }, "20": { overbought: false }, "34": { oversold: false }, "35": { oversold: true } }
    }
  ]
});

// packages/nodes/src/logic/confluence.ts
var VARIADIC = { min: 2, max: 8 };
function connected(input) {
  let count2 = 0;
  for (let index = 0; index < VARIADIC.max; index++) if (input(`in${index}`) !== void 0) count2++;
  return count2;
}
var atLeast = defineNode({
  id: "core.atleast",
  version: "1.0.0",
  category: "logic",
  label: l("Mindestens X von N", "At least X of N"),
  description: l("Wahr, wenn genug Bedingungen zutreffen", "True when enough conditions are met"),
  help: l(
    "Zählt bei jeder Kerze, wie viele der verbundenen Signale wahr sind, und ist wahr, sobald es mindestens so viele sind wie eingestellt. Strenger als ODER, lockerer als UND: Nicht alles muss passen, aber genug. Beispiel: RSI unter 30, Kurs am unteren Bollinger-Band und Volumen über dem Doppelten, mit Mindestens 2 meldet sich der Alarm, wenn zwei der drei zutreffen.",
    "Counts on every candle how many of the connected signals are true and is true as soon as at least the set number are. Stricter than OR, looser than AND: not everything has to match, but enough. Example: RSI below 30, price at the lower Bollinger Band and volume above double, with at least 2 the alert fires when two of the three are met."
  ),
  technical: l("Wahr, wenn die Zahl der wahren Eingänge an der Kerze mindestens die Einstellung erreicht; unverbundene Eingänge zählen nicht.", "True when the number of true inputs on the candle reaches at least the setting; unconnected inputs do not count."),
  icon: "list-checks",
  keywords: { de: ["konfluenz", "mehrheit", "zwei von drei", "x von n", "zählen"], en: ["confluence", "majority", "two of three", "x of n", "count"] },
  inputs: [{ id: "in", type: "signal", label: LABEL_SIGNAL, variadic: VARIADIC }],
  outputs: [{ id: "out", type: "signal", label: l("genug wahr", "enough true") }],
  settings: {
    count: lengthSetting(
      2,
      1,
      8,
      l(
        "Wie viele der verbundenen Signale gleichzeitig wahr sein müssen. Mit 2 von 3 bestätigen sich Signale gegenseitig, ohne dass alle passen müssen.",
        "How many of the connected signals must be true at the same time. With 2 of 3, signals confirm each other without all having to match."
      ),
      l("Mindestens", "At least")
    )
  },
  sentence: ({ settings, locale, input }) => {
    const total = connected(input);
    if (locale === "de") return total > 0 ? `mindestens ${settings.count} von ${total}` : `mindestens ${settings.count}`;
    return total > 0 ? `at least ${settings.count} of ${total}` : `at least ${settings.count}`;
  },
  short: ({ settings, locale }) => locale === "de" ? `mindestens ${settings.count}` : `at least ${settings.count}`,
  compute({ inputs: inputs2, settings, bars }) {
    const out = new Array(bars.length).fill(false);
    for (let i = 0; i < bars.length; i++) {
      let count2 = 0;
      for (const signal of inputs2.in) if (signal[i] === true) count2++;
      out[i] = inputs2.in.length > 0 && count2 >= settings.count;
    }
    return { out };
  }
});
var sequence = defineNode({
  id: "core.sequence",
  version: "1.0.0",
  category: "logic",
  label: l("Danach", "Then"),
  description: l("Erst A, dann B innerhalb von Kerzen", "First A, then B within candles"),
  help: l(
    "Wartet auf eine Reihenfolge: Erst muss Signal A wahr werden, dann innerhalb der eingestellten Kerzen Signal B. Wahr ist der Baustein in der Kerze, in der B nach A kommt. So baust du Muster wie Ausbruch und Rücksetzer. Beispiel: A ist RSI unter 30, B ist Kurs kreuzt EMA 20 nach oben, mit 6 Kerzen meldet sich der Alarm, wenn sich der Kurs nach einem Abverkauf innerhalb von 6 Stunden erholt.",
    "Waits for an order of events: first signal A must become true, then signal B within the set number of candles. The node is true on the candle where B follows A. That is how you build patterns like a breakout and pullback. Example: A is RSI below 30, B is price crosses above EMA 20, with 6 candles the alert fires when the price recovers within 6 hours after a sell-off."
  ),
  technical: l("Wahr an Kerze i, wenn B an i wahr ist und A an mindestens einer der Kerzen i − N bis i − 1; A an derselben Kerze zählt nicht.", "True on candle i when B is true on i and A on at least one of the candles i − N to i − 1; A on the same candle does not count."),
  icon: "route",
  keywords: { de: ["reihenfolge", "danach", "sequenz", "retest", "erst dann", "muster"], en: ["order", "then", "sequence", "retest", "first then", "pattern"] },
  inputs: [
    { id: "first", type: "signal", label: l("Erst A", "First A") },
    { id: "then", type: "signal", label: l("Dann B", "Then B") }
  ],
  outputs: [{ id: "out", type: "signal", label: l("B nach A", "B after A") }],
  settings: {
    bars: lengthSetting(
      6,
      1,
      500,
      l(
        "Innerhalb wie vieler Kerzen nach A das Signal B kommen muss. Mit 1-Stunden-Kerzen sind 6 Kerzen sechs Stunden, 24 ein Tag.",
        "Within how many candles after A signal B must follow. With 1-hour candles, 6 candles are six hours, 24 a day."
      ),
      l("Innerhalb (Kerzen)", "Within (candles)")
    )
  },
  sentence: ({ settings, locale, input }) => {
    const a = input("first") ?? "A";
    const b = input("then") ?? "B";
    return locale === "de" ? `${a}, dann ${b} in ${settings.bars} Kerzen` : `${a}, then ${b} within ${settings.bars} candles`;
  },
  short: ({ settings, locale }) => locale === "de" ? `danach in ${settings.bars}` : `then within ${settings.bars}`,
  warmup: ({ settings }) => settings.bars,
  compute({ inputs: inputs2, settings, bars }) {
    const out = new Array(bars.length).fill(false);
    let lastA = null;
    for (let i = 0; i < bars.length; i++) {
      out[i] = inputs2.then[i] === true && lastA !== null && i - lastA <= settings.bars;
      if (inputs2.first[i] === true) lastA = i;
    }
    return { out };
  }
});

// packages/nodes/src/logic/gates.ts
var VARIADIC2 = { min: 1, max: 8 };
var and = defineNode({
  id: "core.and",
  version: "1.0.0",
  category: "logic",
  label: l("UND", "AND"),
  description: l("Wahr, wenn alle Bedingungen zutreffen", "True when all conditions are met"),
  help: l(
    "Verknüpft mehrere Signale: Es ist nur wahr, wenn alle verbundenen Eingänge gleichzeitig wahr sind. Sobald alle Eingänge belegt sind, kommt ein weiterer dazu, bis zu acht. Beispiel: „RSI 14 unter 30“ und „Kurs über EMA 200“ an UND melden einen Rücksetzer in einem Aufwärtstrend.",
    "Combines several signals: it is only true when all connected inputs are true at the same time. Once every input is used, another one appears, up to eight. Example: “RSI 14 below 30” and “Price above EMA 200” into AND report a dip within an uptrend."
  ),
  icon: "git-merge",
  keywords: { de: ["and", "und", "kombinieren", "konfluenz", "alle"], en: ["and", "combine", "confluence", "all"] },
  inputs: [{ id: "in", type: "signal", label: LABEL_SIGNAL, variadic: VARIADIC2 }],
  outputs: [{ id: "out", type: "signal", label: l("alle wahr", "all true") }],
  settings: {},
  sentence: ({ locale }) => locale === "de" ? "alle Eingänge wahr" : "all inputs true",
  short: ({ locale }) => locale === "de" ? "UND" : "AND",
  compute: ({ inputs: inputs2, bars }) => ({ out: series_exports.all(inputs2.in, bars.length) })
});
var or = defineNode({
  id: "core.or",
  version: "1.0.0",
  category: "logic",
  label: l("ODER", "OR"),
  description: l("Wahr, sobald eine Bedingung zutrifft", "True as soon as one condition is met"),
  help: l(
    "Verknüpft mehrere Signale: Es ist wahr, sobald mindestens ein verbundener Eingang wahr ist. Bis zu acht Eingänge. Beispiel: „Veränderung 4 unter -5“ oder „Veränderung 4 über 5“ meldet starke Bewegungen in beide Richtungen.",
    "Combines several signals: it is true as soon as at least one connected input is true. Up to eight inputs. Example: “change 4 below -5” or “change 4 above 5” reports strong moves in either direction."
  ),
  icon: "split",
  keywords: { de: ["or", "oder", "eines von", "mindestens eins"], en: ["or", "any", "one of"] },
  inputs: [{ id: "in", type: "signal", label: LABEL_SIGNAL, variadic: VARIADIC2 }],
  outputs: [{ id: "out", type: "signal", label: l("einer wahr", "one true") }],
  settings: {},
  sentence: ({ locale }) => locale === "de" ? "mindestens ein Eingang" : "at least one input",
  short: ({ locale }) => locale === "de" ? "ODER" : "OR",
  compute: ({ inputs: inputs2, bars }) => ({ out: series_exports.any(inputs2.in, bars.length) })
});
var not2 = defineNode({
  id: "core.not",
  version: "1.0.0",
  category: "logic",
  label: l("NICHT", "NOT"),
  description: l("Macht aus wahr falsch und umgekehrt", "Turns true into false and back"),
  help: l(
    "Dreht ein Signal um: Aus wahr wird falsch, aus falsch wird wahr. So schließt du eine Bedingung aus. Beispiel: Zeitfenster von 22 bis 6 Uhr an NICHT, das Ergebnis an UND: Alarme kommen nur außerhalb der Nacht.",
    "Flips a signal: true becomes false, false becomes true. That is how you exclude a condition. Example: a time window from 10 PM to 6 AM into NOT, the result into AND: alerts only arrive outside the night."
  ),
  icon: "circle-slash",
  keywords: { de: ["not", "nicht", "negation", "umkehren"], en: ["not", "negation", "invert"] },
  inputs: [{ id: "in", type: "signal", label: LABEL_SIGNAL }],
  outputs: [{ id: "out", type: "signal", label: l("umgekehrt", "inverted") }],
  settings: {},
  sentence: ({ locale }) => locale === "de" ? "kehrt das Signal um" : "inverts the signal",
  short: ({ locale }) => locale === "de" ? "NICHT" : "NOT",
  compute: ({ inputs: inputs2 }) => ({ out: series_exports.not(inputs2.in) })
});

// packages/nodes/src/logic/timing.ts
var confirm = defineNode({
  id: "core.confirm",
  version: "1.0.0",
  category: "logic",
  label: l("Bestätigung", "Confirmation"),
  description: l("Signal muss mehrere Kerzen halten", "Signal must hold for several candles"),
  help: l(
    "Lässt ein Signal erst durch, wenn es mehrere Kerzen in Folge wahr ist, und hält es, solange es wahr bleibt. Einzelne Ausreißer lösen dann keinen Alarm aus. Beispiel: Mit 3 Kerzen meldet sich „Kurs unter EMA 200“ erst, wenn drei Kerzen nacheinander unter dem EMA schließen.",
    "Only lets a signal through once it has been true for several candles in a row, and holds it while it stays true. Single outliers then do not trigger an alert. Example: with 3 candles, “Price below EMA 200” only fires once three candles in a row close below the EMA."
  ),
  technical: l("Wirkt wie eine Einschaltverzögerung: wahr ab der N-ten wahren Kerze in Folge, bis das Signal falsch wird.", "Works like an on-delay: true from the N-th true candle in a row until the signal turns false."),
  icon: "timer",
  keywords: { de: ["halten", "verzögerung", "docht", "wick", "bestätigen"], en: ["hold", "delay", "wick", "confirm"] },
  inputs: [{ id: "in", type: "signal", label: LABEL_SIGNAL }],
  outputs: [{ id: "out", type: "signal", label: l("bestätigt", "confirmed") }],
  settings: {
    bars: lengthSetting(
      2,
      1,
      50,
      l(
        "Wie viele Kerzen in Folge das Signal wahr sein muss. 2 oder 3 filtern die meisten Ausreißer. Jede Kerze mehr bestätigt sicherer, meldet aber eine Kerze später. 1 lässt sofort durch.",
        "How many candles in a row the signal must be true. 2 or 3 filter most outliers. Each extra candle confirms more surely but reports one candle later. 1 passes at once."
      )
    )
  },
  sentence: ({ settings, locale }) => locale === "de" ? `hält ${settings.bars} ${settings.bars === 1 ? "Kerze" : "Kerzen"}` : `holds for ${settings.bars} ${settings.bars === 1 ? "candle" : "candles"}`,
  short: ({ settings, locale }) => locale === "de" ? `bestätigt ${settings.bars}` : `confirmed ${settings.bars}`,
  warmup: ({ settings }) => settings.bars,
  compute: ({ inputs: inputs2, settings }) => ({ out: series_exports.holds(inputs2.in, settings.bars) })
});
var cooldown2 = defineNode({
  id: "core.cooldown",
  version: "1.0.0",
  category: "logic",
  label: l("Cooldown", "Cooldown"),
  description: l("Höchstens ein Signal pro Zeitraum", "At most one signal per time span"),
  help: l(
    "Lässt nur den Moment durch, in dem ein Signal wahr wird, und sperrt danach für die eingestellte Zeit. Das hilft gegen eine Flut von Alarmen, wenn ein Wert lange um eine Schwelle pendelt. Jede Aktion hat schon einen eigenen Cooldown; diesen Baustein brauchst du, wenn mehrere Aktionen gemeinsam ruhen sollen. Beispiel: Mit 12 Stunden vor Push und Telegram kommt nach einem Crash-Alarm einen halben Tag lang kein weiterer, auf beiden Kanälen.",
    "Only lets through the moment a signal turns true, then blocks for the set time. That helps against a flood of alerts when a value swings around a threshold for a long time. Every action already has its own cooldown; use this node when several actions should rest together. Example: with 12 hours in front of Push and Telegram, after a crash alert no further one comes for half a day, on both channels."
  ),
  technical: l("Merkt sich den Schluss der Kerze, an der zuletzt ein Signal durchkam; ab dort zählt die Sperrzeit.", "Remembers the close of the candle where a signal last got through; the blocking time counts from there."),
  icon: "hourglass",
  keywords: { de: ["drosseln", "spam", "pause", "throttle", "sperre"], en: ["throttle", "spam", "pause", "rate limit"] },
  inputs: [{ id: "in", type: "signal", label: LABEL_SIGNAL }],
  outputs: [{ id: "out", type: "signal", label: l("Auslösung", "Trigger") }],
  settings: {
    hours: {
      type: "number",
      label: l("Cooldown (Stunden)", "Cooldown (hours)"),
      help: l(
        "So lange bleibt der Ausgang gesperrt, nachdem ein Signal durchkam. 4 Stunden passen für die meisten Alarme, 12 oder 24 für seltene Ereignisse wie einen Crash. Mit 0 kommt jedes neue Signal durch.",
        "How long the output stays blocked after a signal got through. 4 hours suit most alerts, 12 or 24 rare events like a crash. With 0 every new signal gets through."
      ),
      default: 4,
      min: 0,
      max: 168,
      step: 0.5,
      unit: l("h", "h")
    }
  },
  sentence: ({ settings, locale }) => locale === "de" ? `max. 1× pro ${formatNumber(settings.hours, locale)} h` : `max. once per ${formatNumber(settings.hours, locale)} h`,
  short: ({ settings, locale }) => locale === "de" ? `Cooldown ${formatNumber(settings.hours, locale)} h` : `cooldown ${formatNumber(settings.hours, locale)} h`,
  state: {
    init: () => ({ previous: false, lastPass: null }),
    step({ state, inputs: inputs2, settings, bar }) {
      const rising2 = inputs2.in && !state.previous;
      const free = state.lastPass === null || bar.closeTime - state.lastPass >= settings.hours * HOUR;
      const pass = rising2 && free;
      return {
        state: { previous: inputs2.in, lastPass: pass ? bar.closeTime : state.lastPass },
        outputs: { out: pass }
      };
    }
  }
});

// packages/nodes/src/sources/candle.ts
var PIN_LABELS = {
  close: l("Kurs", "Price"),
  open: l("Eröffnung", "Open"),
  high: l("Hoch", "High"),
  low: l("Tief", "Low"),
  volume: l("Volumen", "Volume")
};
function exchangeOption(exchange) {
  const note2 = historyNote(exchange);
  if (!note2) return { value: exchange.id, label: l(exchange.label, exchange.label), help: exchange.help };
  return {
    value: exchange.id,
    label: l(`${exchange.label} (Replay begrenzt)`, `${exchange.label} (limited replay)`),
    help: l(`${exchange.help.de} ${note2.de}`, `${exchange.help.en} ${note2.en}`)
  };
}
var candle = defineNode({
  id: "core.candle",
  version: "1.0.0",
  category: "src",
  label: l("Kerze", "Candle"),
  description: l("Holt Kurs und Volumen von einer Börse", "Gets price and volume from an exchange"),
  help: l(
    "Holt die Kurse eines Handelspaars wie BTC/USDT von einer Börse. Bei jedem Kerzenschluss gibt der Baustein Eröffnung, Hoch, Tief, Schlusskurs und Volumen der Kerze weiter. Beispiel: Mit der Zeiteinheit 1 Stunde schließt zu jeder vollen Stunde eine Kerze, und die ganze Chain prüft neu. Meist brauchst du nur den Ausgang Kurs, das ist der Schlusskurs.",
    "Fetches the prices of a trading pair such as BTC/USDT from an exchange. At every candle close the node passes on the open, high, low, close and volume of that candle. Example: with the timeframe 1 hour, a candle closes at the top of every hour and the whole chain checks again. Most chains only need the Price output, which is the closing price."
  ),
  icon: "chart-candlestick",
  keywords: { de: ["preis", "kurs", "ohlc", "börse", "coin"], en: ["price", "ohlc", "exchange", "coin", "market"] },
  inputs: [],
  outputs: [
    { id: "close", type: "series", label: PIN_LABELS.close, unit: "price" },
    { id: "open", type: "series", label: PIN_LABELS.open, unit: "price" },
    { id: "high", type: "series", label: PIN_LABELS.high, unit: "price" },
    { id: "low", type: "series", label: PIN_LABELS.low, unit: "price" },
    { id: "volume", type: "series", label: PIN_LABELS.volume }
  ],
  settings: {
    exchange: {
      type: "select",
      label: l("Börse", "Exchange"),
      help: l(
        "Von welcher Börse die Kurse kommen. Welche Paare und Zeiteinheiten es gibt, hängt von der Börse ab.",
        "Which exchange the prices come from. The pairs and timeframes on offer depend on the exchange."
      ),
      default: DEFAULT_EXCHANGE,
      options: EXCHANGES.map(exchangeOption)
    },
    pair: {
      type: "text",
      label: l("Handelspaar", "Trading pair"),
      help: l(
        "Coin und Gegenwährung mit Schrägstrich, in Großbuchstaben, bei jeder Börse gleich geschrieben: BTC/USDT, ETH/EUR, SOL/USDC. Welche Paare es gibt, hängt von der Börse ab: Ein Klick ins Feld zeigt alle, die gängigen zuerst; Tippen filtert, und Knöpfe zeigen nur Paare gegen eine Währung.",
        "Coin and quote currency with a slash, in capitals, written the same for every exchange: BTC/USDT, ETH/EUR, SOL/USDC. Which pairs exist depends on the exchange: a click into the field shows them all, the common ones first; typing filters, and buttons show only pairs against one currency."
      ),
      default: "BTC/USDT",
      pattern: "^[A-Z0-9]{1,15}/[A-Z0-9]{2,10}$",
      maxLength: 26,
      required: true
    },
    timeframe: {
      type: "select",
      label: l("Zeiteinheit", "Timeframe"),
      help: l(
        "Wie lange eine Kerze dauert und damit, wie oft die Chain prüft. 1 Stunde passt für die meisten Alarme. Kurze Zeiteinheiten wie 5 Minuten reagieren schnell, melden sich aber auch bei kurzen Ausschlägen. 4 Stunden oder 1 Tag zeigen den großen Trend. Alle Kerzen einer Chain brauchen dieselbe Zeiteinheit.",
        "How long one candle lasts, which is how often the chain checks. 1 hour suits most alerts. Short timeframes like 5 minutes react fast but also fire on brief spikes. 4 hours or 1 day show the bigger trend. All candles in a chain need the same timeframe."
      ),
      default: "1h",
      options: TIMEFRAME_OPTIONS
    }
  },
  source: {
    kind: "candles",
    market: (settings) => ({ exchange: settings.exchange, symbol: settings.pair, timeframe: settings.timeframe })
  },
  // Die Standardbörse steht nur in der Auswahl, nicht im Satz: Texte nennen Börsen nur, wo man sie wählt.
  sentence: ({ settings }) => settings.exchange === DEFAULT_EXCHANGE ? `${settings.pair} · ${settings.timeframe}` : `${settings.pair} · ${exchangeLabel(settings.exchange)} · ${settings.timeframe}`,
  short: ({ pin, locale }) => (PIN_LABELS[pin] ?? PIN_LABELS.close)[locale],
  compute({ candles }) {
    if (!candles) throw new Error("Die Engine hat keine Kerzen geliefert");
    return { close: candles.close, open: candles.open, high: candles.high, low: candles.low, volume: candles.volume };
  },
  tests: [
    {
      fixture: FIXTURE,
      expectLast: { close: 81615.64, open: 81781.18, high: 81814.68, low: 81586.53, volume: 436.16879 },
      expectAt: { "0": { close: 83976, volume: 366.5919 } }
    }
  ]
});

// packages/nodes/src/sources/schedule.ts
var DAY_OPTIONS = Object.keys(DAY_SETS).map((value) => ({ value, label: DAY_SETS[value] }));
function scheduledInstants(from, to, hour, minute, days, timeZone) {
  const instants = [];
  const start = zonedParts(from, timeZone);
  let date = Date.UTC(start.year, start.month - 1, start.day);
  for (let guard = 0; guard < 1e5; guard++) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const instant = zonedTimeToUtc(year, month, day, hour, minute, timeZone);
    if (instant > to) break;
    if (dayMatches(days, weekdayOf(year, month, day))) instants.push(instant);
    date += 864e5;
  }
  return instants;
}
var schedule = defineNode({
  id: "core.schedule",
  version: "1.0.0",
  category: "src",
  label: l("Zeitplan", "Schedule"),
  description: l("Löst zu einer festen Uhrzeit aus", "Fires at a set time of day"),
  help: l(
    "Gibt zu einer festen Uhrzeit ein Signal, etwa werktags um 8:00. So baust du ein tägliches Briefing: Zeitplan an die Aktion, dazu eine Nachrichtenvorlage mit dem aktuellen Kurs. Der Alarm kommt beim Schluss der Kerze, in die die Uhrzeit fällt. Mit 1-Stunden-Kerzen ist er pünktlich, mit 4-Stunden-Kerzen kann er bis zu vier Stunden später kommen.",
    "Sends a signal at a set time, for example at 8 AM on weekdays. That is how you build a daily briefing: schedule into the action, plus a message template with the current price. The alert goes out when the candle containing that time closes. With 1-hour candles it is on time, with 4-hour candles it can come up to four hours later."
  ),
  icon: "calendar-clock",
  keywords: { de: ["cron", "täglich", "uhrzeit", "briefing"], en: ["cron", "daily", "time", "briefing"] },
  inputs: [],
  outputs: [{ id: "out", type: "signal", label: l("Signal", "Signal") }],
  settings: {
    hour: {
      type: "number",
      label: l("Stunde", "Hour"),
      help: l("Uhrzeit in deiner Zeitzone, von 0 bis 23. 8 heißt 8:00 Uhr morgens, 20 heißt 20:00 Uhr.", "Hour in your time zone, from 0 to 23. 8 means 8 AM, 20 means 8 PM."),
      default: 8,
      min: 0,
      max: 23,
      integer: true,
      step: 1
    },
    minute: {
      type: "number",
      label: l("Minute", "Minute"),
      help: l(
        "Minuten nach der vollen Stunde, meist 0. Mit 1-Stunden-Kerzen kommt der Alarm trotzdem erst zur nächsten vollen Stunde. Für 8:30 brauchst du Kerzen von 30 Minuten oder kürzer.",
        "Minutes past the hour, usually 0. With 1-hour candles the alert still only goes out at the next full hour. For 8:30 you need candles of 30 minutes or shorter."
      ),
      default: 0,
      min: 0,
      max: 59,
      integer: true,
      step: 1,
      advanced: true
    },
    days: {
      type: "select",
      label: l("Tage", "Days"),
      help: l("An welchen Tagen der Zeitplan auslöst. Mo–Fr passt für ein Briefing vor der Arbeit.", "Which days the schedule fires on. Mon–Fri suits a briefing before work."),
      default: "daily",
      options: DAY_OPTIONS
    },
    timezone: timezoneSetting
  },
  sentence: ({ settings, locale }) => `${DAY_SETS[settings.days][locale]} ${locale === "de" ? "um" : "at"} ${clock(settings.hour, settings.minute, locale)}`,
  short: ({ locale }) => l("Zeitplan", "Schedule")[locale],
  warmup: () => 0,
  compute({ bars, settings }) {
    const out = new Array(bars.length).fill(false);
    if (bars.length === 0) return { out };
    const first = bars.openTime[0] ?? 0;
    const last = bars.closeTime[bars.length - 1] ?? first;
    const instants = scheduledInstants(first, last, settings.hour, settings.minute, settings.days, settings.timezone);
    let k = 0;
    for (let i = 0; i < bars.length; i++) {
      const open = bars.openTime[i] ?? 0;
      const close = bars.closeTime[i] ?? 0;
      while (k < instants.length && (instants[k] ?? 0) <= open) k++;
      out[i] = k < instants.length && (instants[k] ?? 0) <= close;
    }
    return { out };
  }
});

// packages/nodes/src/tools/tools.ts
var testSignal = defineNode({
  id: "core.inject",
  version: "1.0.0",
  category: "tool",
  label: l("Test-Signal", "Test signal"),
  description: l("Löst Aktionen zum Testen per Knopf aus", "Fires actions on demand, for testing"),
  help: l(
    "Schickt auf Knopfdruck ein Signal durch die Chain, ohne auf den Markt zu warten. Verbinde es mit Aktionen und klick auf der Karte auf „Auslösen“: Der Editor zeigt, welche Aktionen jetzt senden würden. Echte Test-Nachrichten an deine Kanäle schickst du mit „Test senden“ unter Benachrichtigungen. Im Replay löst es nie aus.",
    "Sends a signal through the chain on demand, without waiting for the market. Connect it to actions and click “Fire” on the card: the editor shows which actions would send now. Real test messages to your channels are sent with “Send test” under Notifications. It never fires in the replay."
  ),
  icon: "zap",
  keywords: { de: ["test", "inject", "simulieren", "knopf"], en: ["test", "inject", "simulate", "button"] },
  inputs: [],
  outputs: [{ id: "out", type: "signal", label: l("Signal", "Signal") }],
  settings: {},
  source: { kind: "manual" },
  sentence: ({ locale }) => locale === "de" ? "auf Knopfdruck" : "on demand",
  short: ({ locale }) => l("Test-Signal", "test signal")[locale],
  compute: ({ manual, bars }) => ({ out: manual ? [...manual] : new Array(bars.length).fill(false) })
});
var note = defineNode({
  id: "core.note",
  version: "1.0.0",
  category: "tool",
  label: l("Notiz", "Note"),
  description: l("Freier Text, etwa die Idee der Chain", "Free text, such as the idea of the chain"),
  help: l(
    "Ein Zettel auf dem Board für Erklärungen, etwa warum die Chain so gebaut ist oder welche Schwelle du getestet hast. Die Notiz rechnet nicht mit und hat keine Ein- oder Ausgänge. Beispiel: „Idee: RSI unter 30 heißt überverkauft. Im Replay 2 Alarme in 90 Tagen.“",
    "A sticky note on the board for explanations, such as why the chain is built this way or which threshold you tested. The note does not compute and has no inputs or outputs. Example: “Idea: RSI below 30 means oversold. 2 alerts in 90 days in the replay.”"
  ),
  icon: "sticky-note",
  keywords: { de: ["kommentar", "doku", "notiz"], en: ["comment", "docs", "note"] },
  inputs: [],
  outputs: [],
  settings: {
    text: {
      type: "text",
      label: l("Text", "Text"),
      help: l("Bis zu 2.000 Zeichen. Der Text steht so auf der Karte, wie du ihn schreibst.", "Up to 2,000 characters. The text appears on the card as you write it."),
      default: "",
      maxLength: 2e3,
      multiline: true,
      placeholder: l("Idee der Chain …", "Idea of the chain …")
    }
  },
  sentence: ({ settings }) => settings.text.length > 60 ? `${settings.text.slice(0, 59)}…` : settings.text
});

// packages/nodes/src/index.ts
var coreNodes = [
  candle,
  schedule,
  movingAverage,
  rsi2,
  macd2,
  stochastic,
  stochRsi,
  cci2,
  williamsR,
  divergence,
  bollinger,
  volume,
  mfi2,
  obv2,
  highLow,
  change2,
  percentRank2,
  atr2,
  historicalVolatility2,
  supertrend2,
  atrStop,
  parabolicSar,
  keltner,
  donchian,
  squeeze2,
  adx,
  aroon2,
  ichimoku,
  heikinAshi2,
  pivotPoints,
  previousPeriod2,
  openingRange,
  swings,
  fibonacci,
  trendline,
  roundNumbers,
  valueWhen2,
  candlePattern2,
  vwap2,
  volumeProfile2,
  nakedPoc,
  marketStructureNode,
  orderBlocksNode,
  fairValueGapsNode,
  liquiditySweepsNode,
  premiumDiscountNode,
  srZonesNode,
  compare2,
  compareAB,
  range,
  band,
  newHighLow,
  timeWindow,
  dateRange,
  and,
  or,
  not2,
  atLeast,
  sequence,
  confirm,
  cooldown2,
  messageTemplate,
  push,
  email,
  telegram,
  webhook,
  discord,
  pushover,
  ntfy,
  tradingBot,
  slack,
  teams,
  googleChat,
  logOnly,
  testSignal,
  note
];
function createCoreRegistry(extra = []) {
  return new NodeRegistry([...coreNodes, ...extra]);
}

// packages/community/src/report.ts
function jsonLines(text) {
  const lines = /* @__PURE__ */ new Map();
  let index = 0;
  let line = 1;
  const skip = () => {
    while (index < text.length) {
      const char = text[index];
      if (char === "\n") line++;
      else if (char !== " " && char !== "	" && char !== "\r") return;
      index++;
    }
  };
  const string = () => {
    let out = "";
    index++;
    while (index < text.length && text[index] !== '"') {
      if (text[index] === "\\") {
        const next = text[index + 1];
        if (next === "u") {
          out += String.fromCharCode(Number.parseInt(text.slice(index + 2, index + 6), 16));
          index += 6;
          continue;
        }
        out += next === "n" ? "\n" : next === "t" ? "	" : next ?? "";
        index += 2;
        continue;
      }
      out += text[index];
      index++;
    }
    index++;
    return out;
  };
  const escape = (key) => key.replace(/~/g, "~0").replace(/\//g, "~1");
  const value = (pointer) => {
    skip();
    lines.set(pointer || "/", line);
    const char = text[index];
    if (char === "{") {
      index++;
      skip();
      if (text[index] === "}") {
        index++;
        return;
      }
      while (index < text.length) {
        skip();
        const keyLine = line;
        const key = string();
        skip();
        index++;
        const child = `${pointer}/${escape(key)}`;
        value(child);
        lines.set(child, keyLine);
        skip();
        if (text[index] === ",") {
          index++;
          continue;
        }
        index++;
        return;
      }
    } else if (char === "[") {
      index++;
      skip();
      if (text[index] === "]") {
        index++;
        return;
      }
      for (let item = 0; index < text.length; item++) {
        value(`${pointer}/${item}`);
        skip();
        if (text[index] === ",") {
          index++;
          continue;
        }
        index++;
        return;
      }
    } else if (char === '"') {
      string();
    } else {
      while (index < text.length && !/[\s,\]}]/.test(text[index] ?? "")) index++;
    }
  };
  try {
    value("");
  } catch {
  }
  return lines;
}
function lineAt(lines, pointer) {
  for (let current = pointer; ; current = current.slice(0, current.lastIndexOf("/"))) {
    const found = lines.get(current || "/");
    if (found !== void 0) return found;
    if (current === "" || current === "/") return void 0;
  }
}
function parseErrorLine(text, error) {
  const message2 = error instanceof Error ? error.message : String(error);
  const byLine = /line (\d+)/.exec(message2);
  if (byLine) return Number(byLine[1]);
  const byPosition = /position (\d+)/.exec(message2);
  if (byPosition) return text.slice(0, Number(byPosition[1])).split("\n").length;
  return void 0;
}
function formatFinding(finding, locale) {
  const where = finding.line !== void 0 ? `${finding.file}:${finding.line}` : finding.file;
  const label = finding.severity === "error" ? locale === "de" ? "Fehler" : "error" : locale === "de" ? "Hinweis" : "warning";
  const path2 = finding.path === "/" ? "" : `  ${finding.path}`;
  return `${where}  ${label}${path2}
    ${finding.message[locale]}`;
}
function githubAnnotation(finding, locale) {
  const data = (value) => value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  const prop = (value) => data(value).replace(/:/g, "%3A").replace(/,/g, "%2C");
  const props = [`file=${prop(finding.file)}`, ...finding.line !== void 0 ? [`line=${finding.line}`] : [], `title=${prop(finding.path)}`].join(",");
  return `::${finding.severity} ${props}::${data(finding.message[locale])}`;
}

// packages/community/src/nodes.ts
var NODE_FILE_PATTERN = /^(community|examples)\/([a-z0-9][a-z0-9-]{0,47})\.json$/;
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function checkNodeFile(file, text, options) {
  const findings = [];
  const lines = jsonLines(text);
  const add2 = (severity, path2, message2) => {
    const line = lineAt(lines, path2);
    findings.push({ file, severity, path: path2, message: message2, ...line !== void 0 ? { line } : {} });
  };
  const error = (path2, message2) => add2("error", path2, message2);
  const location = NODE_FILE_PATTERN.exec(file);
  if (!location) {
    error("/", l("Bausteine liegen als community/<name>.json; der Name hat Kleinbuchstaben, Ziffern und Bindestriche", "Nodes live in community/<name>.json; the name has lowercase letters, digits and hyphens"));
  }
  const community = location?.[1] === "community";
  let data;
  try {
    data = JSON.parse(text);
  } catch (cause) {
    const line = parseErrorLine(text, cause);
    findings.push({ file, severity: "error", path: "/", message: l(`Kein gültiges JSON: ${String(cause)}`, `Not valid JSON: ${String(cause)}`), ...line !== void 0 ? { line } : {} });
    return { findings };
  }
  const checked = checkCustomNode(data);
  for (const issue of checked.issues) add2(issue.severity, issue.path, issue.message);
  if (!isRecord2(data) || !checked.spec) return { findings };
  const { spec } = checked;
  if (location && spec.id !== `custom.${location[2]}`) {
    error("/id", l(`Die Kennung passt zum Dateinamen: custom.${location[2]}`, `The id matches the file name: custom.${location[2]}`));
  }
  if (data["$schema"] !== void 0 && data["$schema"] !== CUSTOM_NODE_SCHEMA_URL) error("/$schema", l(`$schema ist ${CUSTOM_NODE_SCHEMA_URL} oder fehlt`, `$schema is ${CUSTOM_NODE_SCHEMA_URL} or is left out`));
  for (const key of ["label", "description"]) {
    for (const locale of LOCALES) {
      const value = data[key];
      if (!isRecord2(value) || typeof value[locale] !== "string" || value[locale].trim() === "") {
        error(
          `/${key}`,
          l(
            `${key === "label" ? "Der Name" : "Die Beschreibung"} auf ${locale === "de" ? "Deutsch" : "Englisch"} fehlt, etwa { "de": "…", "en": "…" }. Kannst du eine Sprache nicht, schreib in beide dieselbe und sag es im Pull Request; wir übersetzen.`,
            `${key === "label" ? "The name" : "The description"} in ${locale === "de" ? "German" : "English"} is missing, e.g. { "de": "…", "en": "…" }. If you don't speak one of the languages, write the same text in both and say so in the pull request; we'll translate.`
          )
        );
      }
    }
  }
  if (community && spec.help === void 0) add2("warning", "/help", l("Eine Erklärung (help) hilft beim Einsetzen: was der Baustein rechnet und ein Beispiel", "An explanation (help) helps people use it: what the node calculates and an example"));
  if (community && spec.author === void 0) error("/author", l("Der Autor fehlt: dein Name oder GitHub-Name", "The author is missing: your name or GitHub name"));
  const tests = Array.isArray(data["tests"]) ? data["tests"] : [];
  if (tests.length === 0) {
    error("/tests", l("Tests mit Referenzwerten fehlen; siehe CONTRIBUTING.md, „Referenzwerte“", 'Tests with reference values are missing; see CONTRIBUTING.md, "Reference values"'));
    return { id: spec.id, findings };
  }
  let results;
  try {
    results = runCustomNodeTests(data, options.fixture);
  } catch (cause) {
    error("/tests", l(`Die Tests lassen sich nicht rechnen: ${String(cause)}`, `The tests cannot run: ${String(cause)}`));
    return { id: spec.id, findings };
  }
  results.forEach((result, index) => {
    for (const failure of result.failures) error(`/tests/${index}`, l(`Test „${result.name}“: ${failure.de}`, `Test "${result.name}": ${failure.en}`));
  });
  const covered = new Set(results.flatMap((result) => result.checks.map((check) => check.pin)));
  for (const pin of spec.outputs) {
    if (!covered.has(pin.id)) error("/tests", l(`Für den Ausgang „${pin.id}“ fehlt ein Referenzwert`, `The output "${pin.id}" has no reference value`));
  }
  const definition = compileCustomNode(data).definition;
  if (definition) {
    const ctx = customNodeTestContext(definition, spec, fixtureData(options.fixture));
    for (const problem of [...checkDeterminism(definition, ctx), ...checkCausality(definition, ctx, [1, 50, 250, 499])]) {
      error("/", l(`Rechnet nicht verlässlich: ${problem}`, `Does not compute reliably: ${problem}`));
    }
  }
  return { id: spec.id, findings, results };
}

// packages/community/src/markets.ts
var SAMPLE_MARKETS = {
  "BTC/USDT": ["15m", "1h", "4h", "1d", "1w"],
  "ETH/USDT": ["15m", "1h", "4h", "1d"],
  "SOL/USDT": ["1h", "1d"],
  "XRP/USDT": ["1h"],
  "BNB/USDT": ["1h"],
  "DOGE/USDT": ["1h"],
  "ADA/USDT": ["1h"],
  "AVAX/USDT": ["1h"],
  "LINK/USDT": ["1h"]
};
function hasSampleMarket(pair, timeframe) {
  return SAMPLE_MARKETS[pair]?.includes(timeframe) ?? false;
}
function sampleMarketList() {
  return Object.entries(SAMPLE_MARKETS).map(([pair, timeframes]) => `${pair} ${timeframes.join(", ")}`).join("; ");
}

// packages/community/src/templates.ts
var TEMPLATE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;
var TEMPLATE_LIMITS = { bytes: 100 * 1024, title: 60, description: 140, author: 80, tips: 2 };
var TEMPLATE_PHRASES = /garantiert|guarantee|\bgewinne?n?\b|gewinnchance|\bprofit|rendite|kinderleicht|ganz einfach|super einfach|perfekt|perfect|ultimativ|ultimate|nie wieder|never miss|geheimtipp|to the moon|kaufsignal|verkaufssignal|buy signal|sell signal|jetzt kaufen|buy now|sell now|risikolos|risk-free|tradingview|pine script/i;
var PLACEHOLDER_NAMES = {
  de: /* @__PURE__ */ new Set(["kette", "werte", "kurs", "paar", "zeit", "coin", "a", "b", "c", "d"]),
  en: /* @__PURE__ */ new Set(["chain", "values", "price", "pair", "time", "coin", "a", "b", "c", "d"])
};
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var typeId = (node) => parseTypeRef(node.type)?.id ?? node.type;
function checkTemplate(file, text, options) {
  const findings = [];
  const lines = jsonLines(text);
  const add2 = (severity, path2, message2) => {
    const line = lineAt(lines, path2);
    findings.push({ file, severity, path: path2, message: message2, ...line !== void 0 ? { line } : {} });
  };
  const error = (path2, message2) => add2("error", path2, message2);
  const { registry } = options;
  const name4 = file.split("/").pop() ?? file;
  const id = name4.replace(/\.json$/, "");
  if (!/^templates\/[^/]+\.json$/.test(file) || !TEMPLATE_ID_PATTERN.test(id)) {
    error("/", l("Vorlagen liegen als templates/<name>.json; der Name hat 2 bis 40 Kleinbuchstaben, Ziffern und Bindestriche", "Templates live in templates/<name>.json; the name has 2 to 40 lowercase letters, digits and hyphens"));
  }
  if (new TextEncoder().encode(text).length > TEMPLATE_LIMITS.bytes) {
    error("/", l(`Die Datei ist größer als ${TEMPLATE_LIMITS.bytes / 1024} KB`, `The file is larger than ${TEMPLATE_LIMITS.bytes / 1024} KB`));
    return findings;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (cause) {
    const line = parseErrorLine(text, cause);
    findings.push({ file, severity: "error", path: "/", message: l(`Kein gültiges JSON: ${String(cause)}`, `Not valid JSON: ${String(cause)}`), ...line !== void 0 ? { line } : {} });
    return findings;
  }
  if (!isRecord3(data)) {
    error("/", l("Eine Vorlage ist ein JSON-Objekt im Chain-Format", "A template is a JSON object in the chain format"));
    return findings;
  }
  const schema = data["$schema"];
  if (schema !== void 0 && (typeof schema !== "string" || !/(^|\/)chain\.schema\.json$|^https:\/\/bellchain\.app\/schema\/chain-1\.json$/.test(schema))) {
    error("/$schema", l("$schema zeigt auf schema/chain.schema.json oder fehlt", "$schema points to schema/chain.schema.json or is left out"));
  }
  const validation = validateChain(data, registry, { strict: true });
  const chain = data;
  const nodes = Array.isArray(chain.nodes) ? chain.nodes : [];
  const settingSpec = (index, key) => {
    const node = nodes[index];
    return node ? registry.resolve(node.type)?.settings[key] : void 0;
  };
  for (const issue of validation.issues) {
    const match = /^\/nodes\/(\d+)\/settings\/([^/]+)$/.exec(issue.path);
    if (issue.code === "required-setting" && match) {
      const spec = settingSpec(Number(match[1]), match[2] ?? "");
      if (spec?.type === "text" && spec.secret) continue;
    }
    add2(issue.severity, issue.path, issue.message);
  }
  if (validation.issues.some((issue) => issue.code === "schema")) return findings;
  const openAddresses = [];
  nodes.forEach((node, index) => {
    const definition = registry.resolve(node.type);
    if (!definition) return;
    for (const [key, spec] of Object.entries(definition.settings)) {
      if (spec.type !== "text" || !spec.secret) continue;
      const value = node.settings[key];
      if (typeof value === "string" && value !== "") {
        error(`/nodes/${index}/settings/${key}`, l("Geheime Einstellungen wie Adressen und Tokens bleiben in Vorlagen leer; die Notiz sagt, was einzutragen ist", "Secret settings such as addresses and tokens stay empty in templates; the note says what to enter"));
      } else if (key === "url") openAddresses.push(node.id);
    }
    if (typeId(node) === "core.telegram" && typeof node.settings["chat"] === "string" && node.settings["chat"] !== "") {
      error(`/nodes/${index}/settings/chat`, l("Das Feld Chat bleibt in Vorlagen leer; die Notiz sagt, wohin die Nachricht gehen kann", "The chat field stays empty in templates; the note says where the message can go"));
    }
  });
  nodes.forEach((node, index) => {
    if (typeId(node) !== "core.candle") return;
    const definition = registry.resolve(node.type);
    if (!definition) return;
    const values = normalizeSettings(definition.settings, node.settings).values;
    const exchangeSpec = definition.settings["exchange"];
    if (exchangeSpec && values["exchange"] !== exchangeSpec.default) {
      error(`/nodes/${index}/settings/exchange`, l("Vorlagen nutzen die Standard-Börse der Kerze; nur dafür gibt es Beispielkurse", "Templates use the default exchange of the candle; sample prices exist only for it"));
    }
    const timeframe = String(values["timeframe"]);
    const scanner = chain.scanner?.node === node.id ? chain.scanner : void 0;
    if (scanner?.top) {
      error("/scanner/top", l("Scanner mit Top N lassen sich nicht mit Beispielkursen nachrechnen; nimm eine feste Liste von Paaren", "Scanners with top N cannot be tested with sample prices; use a fixed list of pairs"));
    }
    const pairs = scanner ? scannerPairs(chain) : [String(values["pair"])];
    for (const pair of pairs) {
      if (!hasSampleMarket(pair, timeframe)) {
        error(
          scanner ? "/scanner/pairs" : `/nodes/${index}/settings/pair`,
          l(`Für ${pair} ${timeframe} gibt es keine Beispielkurse. Möglich sind: ${sampleMarketList()}`, `There are no sample prices for ${pair} ${timeframe}. Available: ${sampleMarketList()}`)
        );
      }
    }
  });
  const meta = isRecord3(data["meta"]) ? data["meta"] : void 0;
  if (!meta) {
    error("/meta", l("meta fehlt: Titel, Beschreibung, Schlagworte, Autor, Notizen, Nachrichten und Tipps", "meta is missing: title, description, tags, author, notes, messages and tips"));
    return findings;
  }
  const localized = (key, max, what) => {
    const value = meta[key];
    const out = {};
    for (const locale of LOCALES) {
      const text2 = isRecord3(value) ? value[locale] : void 0;
      if (typeof text2 !== "string" || text2.trim() === "") error(`/meta/${key}/${locale}`, l(`${what.de} auf ${locale === "de" ? "Deutsch" : "Englisch"} fehlt`, `${what.en} in ${locale === "de" ? "German" : "English"} is missing`));
      else {
        out[locale] = text2;
        if (text2.length > max) error(`/meta/${key}/${locale}`, l(`${what.de} hat mehr als ${max} Zeichen`, `${what.en} has more than ${max} characters`));
      }
    }
    return out;
  };
  const title = localized("title", TEMPLATE_LIMITS.title, l("Der Titel", "The title"));
  const description = localized("description", TEMPLATE_LIMITS.description, l("Die Beschreibung", "The description"));
  const sameText = (path2, what) => add2(options.official ? "error" : "warning", path2, l(`${what.de} ist auf Deutsch und Englisch gleich; beim Review übersetzen wir`, `${what.en} is the same in German and English; we translate during review`));
  if (description.de && description.de === description.en) sameText("/meta/description/en", l("Die Beschreibung", "The description"));
  if (title.de && chain.name !== title.de) error("/name", l("name ist der deutsche Titel aus meta.title.de", "name is the German title from meta.title.de"));
  if (description.de && chain.description !== void 0 && chain.description !== description.de) {
    error("/description", l("description ist die deutsche Beschreibung aus meta.description.de", "description is the German description from meta.description.de"));
  }
  const author = meta["author"];
  if (typeof author !== "string" || author.trim() === "" || author.length > TEMPLATE_LIMITS.author) {
    error("/meta/author", l(`Der Autor fehlt: dein Name oder GitHub-Name, bis ${TEMPLATE_LIMITS.author} Zeichen`, `The author is missing: your name or GitHub name, up to ${TEMPLATE_LIMITS.author} characters`));
  }
  const tags = Array.isArray(meta["tags"]) ? meta["tags"] : [];
  const topics = TEMPLATE_TOPICS;
  if (!tags.some((tag) => typeof tag === "string" && topics.includes(tag))) {
    error("/meta/tags", l(`Mindestens ein Thema der Galerie: ${topics.join(", ")}`, `At least one gallery topic: ${topics.join(", ")}`));
  }
  tags.forEach((tag, index) => {
    if (typeof tag !== "string" || !topics.includes(tag) && tag !== BEGINNER_TAG) {
      error(`/meta/tags/${index}`, l(`Unbekanntes Schlagwort; erlaubt sind ${topics.join(", ")} und ${BEGINNER_TAG}`, `Unknown tag; allowed are ${topics.join(", ")} and ${BEGINNER_TAG}`));
    }
  });
  const notes = isRecord3(meta["notes"]) ? meta["notes"] : {};
  const noteNodes = nodes.map((node, index) => [node, index]).filter(([node]) => typeId(node) === "core.note");
  if (noteNodes.length === 0) error("/nodes", l("Eine Notiz (core.note) erklärt die Idee der Vorlage", "A note (core.note) explains the idea of the template"));
  for (const [node, index] of noteNodes) {
    const text2 = notes[node.id];
    if (!isRecord3(text2) || typeof text2["de"] !== "string" || typeof text2["en"] !== "string" || text2["en"].trim() === "") {
      error(`/meta/notes/${node.id}`, l(`Die Notiz ${node.id} braucht meta.notes.${node.id} mit de und en`, `The note ${node.id} needs meta.notes.${node.id} with de and en`));
    } else {
      if (node.settings["text"] !== text2["de"]) error(`/nodes/${index}/settings/text`, l(`In settings.text steht die deutsche Fassung aus meta.notes.${node.id}.de`, `settings.text holds the German text from meta.notes.${node.id}.de`));
      if (text2["en"] === text2["de"]) sameText(`/meta/notes/${node.id}/en`, l("Die Notiz", "The note"));
    }
  }
  for (const key of Object.keys(notes)) {
    if (!noteNodes.some(([node]) => node.id === key)) error(`/meta/notes/${key}`, l(`Es gibt keine Notiz ${key}`, `There is no note ${key}`));
  }
  if (openAddresses.length > 0) {
    const texts2 = Object.values(notes).filter(isRecord3);
    if (!texts2.some((text2) => /Adresse/.test(String(text2["de"] ?? ""))) || !texts2.some((text2) => /address/i.test(String(text2["en"] ?? "")))) {
      error("/meta/notes", l("Die Notiz sagt, welche Adresse einzutragen ist (de: „Adresse“, en: „address“)", 'The note says which address to enter (de: "Adresse", en: "address")'));
    }
  }
  const messages = isRecord3(meta["messages"]) ? meta["messages"] : {};
  const edges = Array.isArray(chain.edges) ? chain.edges : [];
  const messageNodes = nodes.map((node, index) => [node, index]).filter(([node]) => typeId(node) === "core.message" || registry.resolve(node.type)?.category === "act" && !edges.some((edge) => edge.to === `${node.id}.message`));
  for (const [node, index] of messageNodes) {
    const text2 = messages[node.id];
    const key = typeId(node) === "core.message" ? "text" : "message";
    if (!isRecord3(text2)) {
      error(`/meta/messages/${node.id}`, l(`Die Aktion ${node.id} braucht meta.messages.${node.id} mit de und en`, `The action ${node.id} needs meta.messages.${node.id} with de and en`));
      continue;
    }
    for (const locale of LOCALES) {
      const message2 = text2[locale];
      if (typeof message2 !== "string" || message2.trim() === "") {
        error(`/meta/messages/${node.id}/${locale}`, l(`Die Nachricht auf ${locale === "de" ? "Deutsch" : "Englisch"} fehlt`, `The message in ${locale === "de" ? "German" : "English"} is missing`));
        continue;
      }
      const unknown = unknownPlaceholders(message2);
      const foreign = templatePlaceholders(message2).filter((name5) => !unknown.includes(name5) && !PLACEHOLDER_NAMES[locale].has(name5));
      if (unknown.length > 0 || foreign.length > 0) {
        const allowed = [...PLACEHOLDER_NAMES[locale]].map((name5) => `{{${name5}}}`).join(", ");
        error(`/meta/messages/${node.id}/${locale}`, l(`Platzhalter ${[...unknown, ...foreign].map((name5) => `{{${name5}}}`).join(", ")} gehen hier nicht; erlaubt: ${allowed}`, `Placeholders ${[...unknown, ...foreign].map((name5) => `{{${name5}}}`).join(", ")} are not allowed here; allowed: ${allowed}`));
      }
    }
    if (typeof text2["de"] === "string" && node.settings[key] !== text2["de"]) {
      error(`/nodes/${index}/settings/${key}`, l(`In settings.${key} steht die deutsche Fassung aus meta.messages.${node.id}.de`, `settings.${key} holds the German text from meta.messages.${node.id}.de`));
    }
  }
  for (const key of Object.keys(messages)) {
    if (!messageNodes.some(([node]) => node.id === key)) error(`/meta/messages/${key}`, l(`${key} ist keine Aktion und keine Nachrichtenvorlage, die einen Text braucht`, `${key} is not an action or message template that needs a text`));
  }
  const tips = Array.isArray(meta["tips"]) ? meta["tips"] : [];
  if (tips.length < TEMPLATE_LIMITS.tips) error("/meta/tips", l(`Mindestens ${TEMPLATE_LIMITS.tips} Tipps zum Anpassen, je auf Deutsch und Englisch`, `At least ${TEMPLATE_LIMITS.tips} tips for adjusting, each in German and English`));
  tips.forEach((tip, index) => {
    for (const locale of LOCALES) {
      if (!isRecord3(tip) || typeof tip[locale] !== "string" || tip[locale].trim() === "") {
        error(`/meta/tips/${index}/${locale}`, l(`Der Tipp auf ${locale === "de" ? "Deutsch" : "Englisch"} fehlt`, `The tip in ${locale === "de" ? "German" : "English"} is missing`));
      }
    }
  });
  const texts = [
    ...LOCALES.flatMap((locale) => [[`/meta/title/${locale}`, title[locale]], [`/meta/description/${locale}`, description[locale]]]),
    ...Object.entries(notes).flatMap(([key, text2]) => LOCALES.map((locale) => [`/meta/notes/${key}/${locale}`, isRecord3(text2) ? text2[locale] : void 0])),
    ...Object.entries(messages).flatMap(([key, text2]) => LOCALES.map((locale) => [`/meta/messages/${key}/${locale}`, isRecord3(text2) ? text2[locale] : void 0])),
    ...tips.flatMap((tip, index) => LOCALES.map((locale) => [`/meta/tips/${index}/${locale}`, isRecord3(tip) ? tip[locale] : void 0]))
  ];
  for (const [path2, text2] of texts) {
    const found = typeof text2 === "string" ? TEMPLATE_PHRASES.exec(text2) : null;
    if (found) error(path2, l(`„${found[0]}“: keine Versprechen, keine Werbung, keine Namen anderer Plattformen. Bellchain meldet nur, was du festlegst.`, `"${found[0]}": no promises, no advertising, no names of other platforms. Bellchain only alerts on what you define.`));
  }
  const test = meta["test"];
  if (test === void 0) {
    if (options.official) error("/meta/test", l("meta.test fehlt: pnpm templates:test --write", "meta.test is missing: pnpm templates:test --write"));
  } else if (!isRecord3(test) || !Number.isInteger(test["alerts"]) || test["alerts"] < 0 || !Number.isInteger(test["days"]) || typeof test["until"] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(test["until"])) {
    error("/meta/test", l('meta.test hat die Form { "alerts": 12, "days": 90, "until": "2026-10-17" } oder fehlt', 'meta.test has the form { "alerts": 12, "days": 90, "until": "2026-10-17" } or is left out'));
  }
  return findings;
}

// packages/community/src/cli.ts
var FIXTURE_FILE = "fixtures/btcusdt-1h-500.json";
var HELP = {
  en: `Checks Bellchain templates and custom nodes.

  node scripts/check.mjs                  check every file in this repository
  node scripts/check.mjs community/x.json check single files
  node scripts/check.mjs --values         also print the computed values of the node tests
  node scripts/check.mjs --lang de        messages in German`,
  de: `Prüft Vorlagen und eigene Bausteine für Bellchain.

  node scripts/check.mjs                  alle Dateien in diesem Repo prüfen
  node scripts/check.mjs community/x.json einzelne Dateien prüfen
  node scripts/check.mjs --values         dazu die gerechneten Werte der Tests ausgeben
  node scripts/check.mjs --lang en        Meldungen auf Englisch`
};
function listJson(cwd, dir) {
  const full = path.join(cwd, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter((name4) => name4.endsWith(".json")).sort().map((name4) => `${dir}/${name4}`);
}
function main(argv, io) {
  let locale = "en";
  let values = false;
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg === "--lang") {
      const next = argv[++i];
      if (next !== "de" && next !== "en") {
        io.out("--lang de | en");
        return 2;
      }
      locale = next;
    } else if (arg === "--values") values = true;
    else if (arg === "--help" || arg === "-h") {
      io.out(HELP[locale]);
      return 0;
    } else if (arg.startsWith("-")) {
      io.out(`${locale === "de" ? "Unbekannte Option" : "Unknown option"} ${arg}

${HELP[locale]}`);
      return 2;
    } else files.push(path.relative(io.cwd, path.resolve(io.cwd, arg)).split(path.sep).join("/"));
  }
  if (files.length === 0) files.push(...listJson(io.cwd, "templates"), ...listJson(io.cwd, "examples"), ...listJson(io.cwd, "community"));
  const t = (de, en) => locale === "de" ? de : en;
  if (files.length === 0) {
    io.out(t("Keine Dateien gefunden: erwartet templates/*.json oder community/*.json.", "No files found: expected templates/*.json or community/*.json."));
    return 2;
  }
  let registry;
  let fixture;
  function loadFixture() {
    const file = path.join(io.cwd, FIXTURE_FILE);
    const data = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : void 0;
    if (!isCandleFixture(data)) throw new Error(t(`${FIXTURE_FILE} fehlt oder ist kaputt`, `${FIXTURE_FILE} is missing or broken`));
    return data;
  }
  const findings = [];
  const ids = /* @__PURE__ */ new Map();
  let checkedFiles = 0;
  for (const file of files) {
    const full = path.join(io.cwd, file);
    if (!existsSync(full)) {
      findings.push({ file, severity: "error", path: "/", message: l("Datei nicht gefunden", "File not found") });
      continue;
    }
    const text = readFileSync(full, "utf8");
    checkedFiles++;
    if (file.startsWith("templates/")) {
      registry ??= createCoreRegistry();
      findings.push(...checkTemplate(file, text, { registry }));
      continue;
    }
    if (NODE_FILE_PATTERN.test(file)) {
      try {
        fixture ??= loadFixture();
      } catch (cause) {
        findings.push({ file: FIXTURE_FILE, severity: "error", path: "/", message: l(String(cause), String(cause)) });
        break;
      }
      const result = checkNodeFile(file, text, { fixture });
      findings.push(...result.findings);
      if (result.id) {
        const other = ids.get(result.id);
        if (other) findings.push({ file, severity: "error", path: "/id", message: l(`Die Kennung ${result.id} hat schon ${other}`, `The id ${result.id} is already used by ${other}`) });
        else ids.set(result.id, file);
      }
      if (values && result.results) {
        io.out(`${file}`);
        for (const test of result.results) {
          io.out(`  ${test.name}`);
          for (const check of test.checks) {
            const time = new Date(check.time).toISOString().slice(0, 16).replace("T", " ");
            io.out(`    ${String(check.index).padStart(3)}  ${time} UTC  ${check.pin} = ${JSON.stringify(check.actual)}${check.ok ? "" : `  (${t("erwartet", "expected")} ${JSON.stringify(check.expected)})`}`);
          }
        }
      }
      continue;
    }
    findings.push({ file, severity: "error", path: "/", message: l("Hier prüft der Prüfer nichts: Vorlagen liegen in templates/, Bausteine in community/", "Nothing to check here: templates go in templates/, nodes in community/") });
  }
  if (values) {
    io.out(t(
      "\nDiese Werte rechnet Bellchain. Referenzwerte bestimmst du unabhängig davon, etwa mit einer Tabellenkalkulation, einem Skript oder einem anderen Chart-Programm; erst wenn beide übereinstimmen, gehören sie in tests.",
      "\nThese are the values Bellchain computes. Determine reference values independently, e.g. with a spreadsheet, a script or another charting tool; only when both agree do they belong in tests."
    ));
  }
  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");
  for (const finding of findings) io.out(formatFinding(finding, locale));
  if (io.env["GITHUB_ACTIONS"] === "true") for (const finding of findings) io.out(githubAnnotation(finding, locale));
  const summary = locale === "de" ? `${checkedFiles} ${checkedFiles === 1 ? "Datei" : "Dateien"} geprüft: ${errors.length} Fehler, ${warnings.length} ${warnings.length === 1 ? "Hinweis" : "Hinweise"}.` : `${checkedFiles} ${checkedFiles === 1 ? "file" : "files"} checked: ${errors.length} ${errors.length === 1 ? "error" : "errors"}, ${warnings.length} ${warnings.length === 1 ? "warning" : "warnings"}.`;
  io.out(`${findings.length > 0 ? "\n" : ""}${errors.length === 0 ? "✓" : "✗"} ${summary}`);
  return errors.length > 0 ? 1 : 0;
}

// packages/community/src/bin.ts
process.exitCode = main(process.argv.slice(2), { cwd: process.cwd(), env: process.env, out: (line) => console.log(line) });
