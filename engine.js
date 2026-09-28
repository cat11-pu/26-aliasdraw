// engine.js：建表、加权、改权、拨种子、抽取
import { buildTable, bucketOf } from "./table.js";

const MOD = 4294967296;
const MUL = 1664525;
const INC = 1013904223;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function clone(state) {
  return {
    weights: Array.isArray(state.weights) ? state.weights.slice() : [],
    prob: Array.isArray(state.prob) ? state.prob.slice() : [],
    alias: Array.isArray(state.alias) ? state.alias.slice() : [],
    total: state.total || 0,
    rng: state.rng || 0,
    draws: Array.isArray(state.draws) ? state.draws.map((record) => record.slice()) : [],
    hits: Array.isArray(state.hits) ? state.hits.slice() : [],
    built: state.built || 0,
    added: state.added || 0,
    changed: state.changed || 0,
    drawn: state.drawn || 0
  };
}

function isWeight(weight) {
  return typeof weight === "number" && Number.isInteger(weight) && weight >= 0;
}

function validateWeights(weights) {
  if (!Array.isArray(weights) || weights.length === 0) {
    fail("E_EMPTY_TABLE", "权重表为空");
  }
  for (const weight of weights) {
    if (!isWeight(weight)) {
      fail("E_BAD_WEIGHT", "权重必须是非负整数");
    }
  }
  if (weights.every((weight) => weight === 0)) {
    fail("E_ZERO_WEIGHT", "权重全为零");
  }
}

function rebuild(state) {
  validateWeights(state.weights);
  const table = buildTable(state.weights);
  state.prob = table.prob;
  state.alias = table.alias;
  state.total = table.total;
  if (state.hits.length < state.weights.length) {
    while (state.hits.length < state.weights.length) {
      state.hits.push(0);
    }
  } else if (state.hits.length > state.weights.length) {
    state.hits.length = state.weights.length;
  }
  return state;
}

function advance(rng) {
  return (rng * MUL + INC) % MOD;
}

export function build(state) {
  const next = clone(state);
  validateWeights(next.weights);
  rebuild(next);
  next.built += 1;
  return next;
}

export function addWeight(state, weight) {
  const next = clone(state);
  if (!isWeight(weight)) {
    fail("E_BAD_WEIGHT", "权重必须是非负整数");
  }
  next.weights.push(weight);
  rebuild(next);
  next.added += 1;
  return next;
}

export function setWeight(state, at, weight) {
  const next = clone(state);
  if (!Number.isInteger(at) || at < 0 || at >= next.weights.length) {
    fail("E_BAD_AT", "下标越界");
  }
  if (!isWeight(weight)) {
    fail("E_BAD_WEIGHT", "权重必须是非负整数");
  }
  next.weights[at] = weight;
  rebuild(next);
  next.changed += 1;
  return next;
}

export function wind(state, seed) {
  const next = clone(state);
  if (!Number.isInteger(seed) || seed < 0 || seed > MOD - 1) {
    fail("E_BAD_SEED", "种子越界");
  }
  next.rng = seed;
  return next;
}

export function draw(state, count) {
  const next = clone(state);
  if (!Number.isInteger(count) || count < 0) {
    fail("E_BAD_DRAWS", "抽取次数非法");
  }
  if (next.total === 0) {
    rebuild(next);
  }
  const itemCount = next.weights.length;
  for (let step = 0; step < count; step += 1) {
    const pickRng = advance(next.rng);
    const pick = pickRng % itemCount;
    const cutRng = advance(pickRng);
    const cut = cutRng % next.total;
    const byAlias = cut < next.prob[pick] ? 0 : 1;
    const item = bucketOf(next.prob, next.alias, next.total, pick, cut);
    next.draws.push([pick, cut, byAlias, item, cutRng]);
    next.hits[item] += 1;
    next.rng = cutRng;
  }
  next.drawn += count;
  return next;
}
