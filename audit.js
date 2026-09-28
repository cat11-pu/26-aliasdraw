// audit.js：四条不变量（给定，不写）
import { bucketOf } from "./table.js";

export function sumOk(state) {
  const prob = state.prob || [];
  const weights = state.weights || [];
  const count = weights.length;
  if (prob.length !== count || count === 0) {
    return false;
  }
  const chance = prob.slice();
  for (let at = 0; at < (state.alias || []).length; at += 1) {
    const to = state.alias[at];
    if (to === -1) {
      continue;
    }
    if (!Number.isInteger(to) || to < 0 || to >= count || to === at) {
      return false;
    }
    chance[to] += state.total - prob[at];
  }
  for (let at = 0; at < count; at += 1) {
    if (!Number.isInteger(prob[at]) || prob[at] < 0 || prob[at] > state.total) {
      return false;
    }
    if (chance[at] !== count * weights[at]) {
      return false;
    }
  }
  return state.total > 0;
}

export function aliasOk(state) {
  const alias = state.alias || [];
  const prob = state.prob || [];
  if (alias.length !== prob.length) {
    return false;
  }
  for (let at = 0; at < alias.length; at += 1) {
    if (alias[at] === -1) {
      if (prob[at] !== state.total) {
        return false;
      }
      continue;
    }
    if (!Number.isInteger(alias[at]) || alias[at] < 0 || alias[at] >= alias.length
        || alias[at] === at) {
      return false;
    }
  }
  return true;
}

export function recordsOk(state) {
  for (const record of state.draws || []) {
    if (!Array.isArray(record) || record.length !== 5) {
      return false;
    }
    if (!Number.isInteger(record[0]) || record[0] < 0) {
      return false;
    }
    if (!Number.isInteger(record[1]) || record[1] < 0) {
      return false;
    }
    if (record[2] !== 0 && record[2] !== 1) {
      return false;
    }
    if (!Number.isInteger(record[3]) || record[3] < 0) {
      return false;
    }
    if (record[2] === 0 && record[3] !== record[0]) {
      return false;
    }
  }
  return true;
}

export function hitsOk(state) {
  const hits = state.hits || [];
  if (hits.length !== (state.weights || []).length) {
    return false;
  }
  let sum = 0;
  for (const value of hits) {
    if (!Number.isInteger(value) || value < 0) {
      return false;
    }
    sum += value;
  }
  return sum === state.drawn;
}
