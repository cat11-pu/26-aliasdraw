// app.js：把事件流跑成一张落点阵要用的视图（给定，不写）
import { scaledOf, buildTable, bucketOf } from "./table.js";
import { build, addWeight, setWeight, wind, draw } from "./engine.js";
import { sumOk, aliasOk, recordsOk, hitsOk } from "./audit.js";

function copy(state) {
  return JSON.parse(JSON.stringify(state));
}

function apply(state, event) {
  if (event.kind === "build") {
    return build(state);
  }
  if (event.kind === "add") {
    return addWeight(state, event.weight);
  }
  if (event.kind === "set") {
    return setWeight(state, event.at, event.weight);
  }
  if (event.kind === "wind") {
    return wind(state, event.seed);
  }
  if (event.kind === "draw") {
    return draw(state, event.count);
  }
  const error = new Error("E_BAD_EVENT");
  error.code = "E_BAD_EVENT";
  throw error;
}

export function render(spec) {
  let state = copy(spec.state);
  const failed = [];
  for (const event of spec.events || []) {
    try {
      state = apply(state, event);
    } catch (error) {
      failed.push([event.kind, error && error.code ? error.code : "E_BAD_EVENT"]);
    }
  }
  const width = (state.draws || []).length;
  const rows = [];
  for (let at = 0; at < (state.weights || []).length; at += 1) {
    const cells = [];
    for (let step = 0; step < width; step += 1) {
      const record = (state.draws || [])[step] || [];
      if (record[3] === at) {
        cells.push(record[2] === 1 ? "改" : "自");
      } else {
        cells.push("");
      }
    }
    rows.push({
      at: at,
      weight: state.weights[at],
      prob: state.prob[at],
      alias: state.alias[at],
      hits: state.hits[at],
      cells: cells
    });
  }
  const steps = [];
  for (let step = 0; step < width; step += 1) {
    const record = (state.draws || [])[step] || [];
    steps.push({
      step: step,
      pick: record[0],
      cut: record[1],
      byAlias: record[2],
      item: record[3],
      rng: record[4]
    });
  }
  return {
    weights: state.weights,
    prob: state.prob,
    alias: state.alias,
    total: state.total,
    rng: state.rng,
    draws: state.draws,
    hits: state.hits,
    built: state.built,
    added: state.added,
    changed: state.changed,
    drawn: state.drawn,
    rows: rows,
    steps: steps,
    sum_ok: sumOk(state),
    alias_ok: aliasOk(state),
    records_ok: recordsOk(state),
    hits_ok: hitsOk(state),
    alias_used: steps.filter((step) => step.byAlias === 1).length,
    count_events: (spec.events || []).length,
    failed_events: failed.length,
    failed_marks: failed
  };
}
