import assert from "node:assert";
import { scaledOf, buildTable, bucketOf } from "../table.js";
import { build, addWeight, setWeight, wind, draw } from "../engine.js";
import { render } from "../app.js";

const spec = {
  state: {
    weights: [2, 1],
    prob: [],
    alias: [],
    total: 0,
    rng: 3,
    draws: [],
    hits: [0, 0],
    built: 0,
    added: 0,
    changed: 0,
    drawn: 0
  },
  events: [{ kind: "build" }, { kind: "draw", count: 2 }]
};

let cases = 0;
let failed = 0;
function check(label, body) {
  cases += 1;
  try {
    body();
    console.log("ok " + label);
  } catch (error) {
    failed += 1;
    console.log("no " + label + " " + error.message);
  }
}

check("scaledOf 给数组", function () {
  assert.ok(Array.isArray(scaledOf([2, 1])));
});

check("buildTable 给份数与别名", function () {
  const table = buildTable([2, 1]);
  assert.ok(Array.isArray(table.prob));
  assert.ok(Array.isArray(table.alias));
  assert.ok(typeof table.total === "number");
});

check("bucketOf 给项号", function () {
  assert.ok(typeof bucketOf([2, 2], [-1, -1], 2, 0, 0) === "number");
});

check("build 给状态", function () {
  assert.ok(typeof build(JSON.parse(JSON.stringify(spec.state))) === "object");
});

check("addWeight 给状态", function () {
  assert.ok(typeof addWeight(JSON.parse(JSON.stringify(spec.state)), 1) === "object");
});

check("setWeight 给状态", function () {
  assert.ok(typeof setWeight(JSON.parse(JSON.stringify(spec.state)), 0, 3) === "object");
});

check("wind 给状态", function () {
  assert.ok(typeof wind(JSON.parse(JSON.stringify(spec.state)), 5) === "object");
});

check("draw 给状态", function () {
  const ready = build(JSON.parse(JSON.stringify(spec.state)));
  assert.ok(typeof draw(ready, 1) === "object");
});

check("render 数事件", function () {
  const view = render(JSON.parse(JSON.stringify(spec)));
  assert.ok(Array.isArray(view.rows));
  assert.ok(Array.isArray(view.steps));
  assert.ok(view.count_events === 2);
});

console.log(cases + " cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
