// table.js：份数表、别名表与判定
function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function validate(weights) {
  if (!Array.isArray(weights) || weights.length === 0) {
    fail("E_EMPTY_TABLE", "权重表为空");
  }
  for (const weight of weights) {
    if (typeof weight !== "number" || !Number.isInteger(weight) || weight < 0) {
      fail("E_BAD_WEIGHT", "权重必须是非负整数");
    }
  }
}

export function scaledOf(weights) {
  validate(weights);
  const count = weights.length;
  if (weights.every((weight) => weight === 0)) {
    fail("E_ZERO_WEIGHT", "权重全为零");
  }
  return weights.map((weight) => weight * count);
}

export function buildTable(weights) {
  validate(weights);
  const count = weights.length;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) {
    fail("E_ZERO_WEIGHT", "权重全为零");
  }
  const prob = weights.map((weight) => weight * count);
  const alias = new Array(count).fill(-1);
  const small = [];
  const large = [];
  for (let at = 0; at < count; at += 1) {
    if (prob[at] < total) {
      small.push(at);
    } else {
      large.push(at);
    }
  }
  while (small.length > 0) {
    const low = small.shift();
    const high = large.shift();
    alias[low] = high;
    prob[high] -= total - prob[low];
    if (prob[high] < total) {
      small.push(high);
    } else {
      large.push(high);
    }
  }
  for (const at of large) {
    prob[at] = total;
    alias[at] = -1;
  }
  return { prob: prob, alias: alias, total: total };
}

export function bucketOf(prob, alias, total, pick, cut) {
  if (!Number.isInteger(pick) || pick < 0 || pick >= prob.length) {
    fail("E_BAD_PICK", "候选项号越界");
  }
  if (!Number.isInteger(cut) || cut < 0 || cut >= total) {
    fail("E_BAD_CUT", "切点越界");
  }
  return cut < prob[pick] ? pick : alias[pick];
}
