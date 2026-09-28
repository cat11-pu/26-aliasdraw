// engine.js：建表、加权、改权、拨种子、抽取
import { buildTable, bucketOf } from "./table.js";

const MASK = 4294967295;
const MULTIPLIER = 1664525;
const INCREMENT = 1013904223;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function validWeight(weight) {
  return Number.isInteger(weight) && weight >= 0;
}

function cloneState(state) {
  return {
    ...state,
    weights: Array.isArray(state.weights) ? [...state.weights] : [],
    prob: Array.isArray(state.prob) ? [...state.prob] : [],
    alias: Array.isArray(state.alias) ? [...state.alias] : [],
    draws: Array.isArray(state.draws) ? [...state.draws] : [],
    hits: Array.isArray(state.hits) ? [...state.hits] : []
  };
}

function rebuild(state) {
  const table = buildTable(state.weights);
  state.prob = table.prob;
  state.alias = table.alias;
  state.total = table.total;
}

function nextRandom(rng) {
  return (Math.imul(rng, MULTIPLIER) + INCREMENT) >>> 0;
}

export function build(state) {
  const next = cloneState(state);
  rebuild(next);
  next.built = (next.built || 0) + 1;
  return next;
}

export function addWeight(state, weight) {
  if (!validWeight(weight)) {
    fail("E_BAD_WEIGHT", "weight must be a non-negative integer");
  }

  const next = cloneState(state);
  next.weights.push(weight);
  next.hits.push(0);
  rebuild(next);
  next.added = (next.added || 0) + 1;
  return next;
}

export function setWeight(state, at, weight) {
  if (!validWeight(weight)) {
    fail("E_BAD_WEIGHT", "weight must be a non-negative integer");
  }
  if (!Number.isInteger(at) || at < 0 || at >= state.weights.length) {
    fail("E_BAD_AT", "index is out of range");
  }

  const next = cloneState(state);
  next.weights[at] = weight;
  rebuild(next);
  next.changed = (next.changed || 0) + 1;
  return next;
}

export function wind(state, seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > MASK) {
    fail("E_BAD_SEED", "seed must be between 0 and 4294967295");
  }

  return { ...state, rng: seed };
}

export function draw(state, count) {
  if (!Number.isInteger(count) || count < 0) {
    fail("E_BAD_DRAWS", "draw count must be a non-negative integer");
  }

  const next = cloneState(state);
  let rng = Number.isInteger(next.rng) ? next.rng >>> 0 : 0;

  for (let step = 0; step < count; step += 1) {
    rng = nextRandom(rng);
    const pick = rng % next.weights.length;

    rng = nextRandom(rng);
    const cut = rng % next.total;
    const byAlias = cut < next.prob[pick] ? 0 : 1;
    const item = bucketOf(next.prob, next.alias, next.total, pick, cut);

    next.draws.push([pick, cut, byAlias, item, rng]);
    next.hits[item] = (next.hits[item] || 0) + 1;
  }

  next.rng = rng;
  next.drawn = (next.drawn || 0) + count;
  return next;
}
