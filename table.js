// table.js：份数表、别名表与判定
function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function validateWeights(weights) {
  if (!Array.isArray(weights) || weights.length === 0) {
    fail("E_EMPTY_TABLE", "empty weight table");
  }
  for (const weight of weights) {
    if (!Number.isInteger(weight) || weight < 0) {
      fail("E_BAD_WEIGHT", "weight must be a non-negative integer");
    }
  }
}

export function scaledOf(weights) {
  validateWeights(weights);
  const count = weights.length;
  return weights.map((weight) => weight * count);
}

export function buildTable(weights) {
  validateWeights(weights);

  const count = weights.length;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) {
    fail("E_ZERO_WEIGHT", "all weights are zero");
  }

  const prob = weights.map((weight) => weight * count);
  const alias = new Array(count).fill(-1);
  const small = [];
  const large = [];

  for (let item = 0; item < count; item += 1) {
    if (prob[item] < total) {
      small.push(item);
    } else {
      large.push(item);
    }
  }

  while (small.length > 0 && large.length > 0) {
    const smallItem = small.shift();
    const largeItem = large.shift();

    alias[smallItem] = largeItem;
    prob[largeItem] -= total - prob[smallItem];

    if (prob[largeItem] < total) {
      small.push(largeItem);
    } else {
      large.push(largeItem);
    }
  }

  for (const item of large) {
    prob[item] = total;
    alias[item] = -1;
  }

  return { prob: prob, alias: alias, total: total };
}

export function bucketOf(prob, alias, total, pick, cut) {
  if (!Number.isInteger(pick) || pick < 0 || pick >= prob.length) {
    fail("E_BAD_PICK", "pick is out of range");
  }
  if (!Number.isInteger(cut) || cut < 0 || cut >= total) {
    fail("E_BAD_CUT", "cut is out of range");
  }

  if (cut < prob[pick]) {
    return pick;
  }
  return alias[pick];
}
