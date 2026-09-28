import fs from "node:fs";
import { scaledOf, buildTable, bucketOf } from "./table.js";
import { build, addWeight, setWeight, wind, draw } from "./engine.js";
import { sumOk, aliasOk, recordsOk, hitsOk } from "./audit.js";

const __lines = [];
function emit(label, value) {
  __lines.push([String(label).replace(/ =$/, ""), value]);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/table.json", "utf8"));

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

function run(events) {
  let state = copy(spec.state);
  const failed = [];
  for (const event of events) {
    try {
      state = apply(state, event);
    } catch (error) {
      failed.push([event.kind, error && error.code ? error.code : "E_BAD_EVENT"]);
    }
  }
  return { state: state, failed: failed };
}

function fingerprint(state) {
  return JSON.stringify([state.weights, state.prob, state.alias, state.total, state.rng,
                         state.draws, state.hits, state.built, state.added, state.changed,
                         state.drawn]);
}

const whole = run(spec.events || []);
const state = whole.state;
const half = Math.ceil((spec.events || []).length / 2);
const part = run((spec.events || []).slice(0, half));
let tail = part.state;
let tailFailed = 0;
for (const event of (spec.events || []).slice(half)) {
  try {
    tail = apply(tail, event);
  } catch (error) {
    tailFailed += 1;
  }
}
const replay = run(spec.events || []);

emit("权重表", state.weights);
emit("份数表", state.prob);
emit("别名表", state.alias);
emit("总和", state.total);
emit("抽取记录", state.draws);
emit("命中分布", state.hits);
emit("建表与抽取", [state.built, state.drawn]);
emit("加权与改权", [state.added, state.changed]);
emit("收尾随机数", state.rng);
emit("份数守恒", sumOk(state));
emit("别名闭合", aliasOk(state));
emit("记录自洽", recordsOk(state));
emit("命中自洽", hitsOk(state));
emit("判定复核", [0, 1, state.prob[1] - 1, state.prob[1], state.total - 1].map(
  (cut) => bucketOf(state.prob, state.alias, state.total, 1, cut)));
emit("重放不新增", fingerprint(replay.state) === fingerprint(state) ? 0 : 1);
emit("重放报错", replay.failed.length);
emit("中态不同", fingerprint(part.state) !== fingerprint(state));
emit("拆两轮一致", fingerprint(tail) === fingerprint(state)
  && tailFailed === whole.failed.length - part.failed.length);
emit("异常事件数", whole.failed.length);

// ---- 异常路径探针：真调用实现，看它报出什么码 ----
try {
  buildTable([]);
  emit("空权重表", "没有报错");
} catch (error) {
  emit("空权重表", error && error.code ? error.code : String(error.message));
}
try {
  scaledOf([2, -1]);
  emit("负权重", "没有报错");
} catch (error) {
  emit("负权重", error && error.code ? error.code : String(error.message));
}
try {
  buildTable([0, 0]);
  emit("全零权重", "没有报错");
} catch (error) {
  emit("全零权重", error && error.code ? error.code : String(error.message));
}
try {
  wind(copy(spec.state), -1);
  emit("坏种子", "没有报错");
} catch (error) {
  emit("坏种子", error && error.code ? error.code : String(error.message));
}
try {
  draw(copy(state), -3);
  emit("坏抽取次数", "没有报错");
} catch (error) {
  emit("坏抽取次数", error && error.code ? error.code : String(error.message));
}
try {
  setWeight(copy(state), 99, 1);
  emit("坏下标", "没有报错");
} catch (error) {
  emit("坏下标", error && error.code ? error.code : String(error.message));
}
try {
  bucketOf(state.prob, state.alias, state.total, 99, 0);
  emit("坏候选项", "没有报错");
} catch (error) {
  emit("坏候选项", error && error.code ? error.code : String(error.message));
}

// ---- 期望值（参考模型算出）----
const EXPECTED = {
  "权重表": [
    5,
    2,
    0,
    3,
    4,
    0,
    3
  ],
  "份数表": [
    17,
    14,
    0,
    4,
    11,
    0,
    8
  ],
  "别名表": [
    -1,
    0,
    3,
    6,
    0,
    4,
    0
  ],
  "总和": 17,
  "抽取记录": [
    [
      2,
      1,
      0,
      2,
      1186735221
    ],
    [
      0,
      0,
      0,
      0,
      322324079
    ],
    [
      2,
      2,
      0,
      2,
      3636235385
    ],
    [
      1,
      7,
      0,
      1,
      3082576147
    ],
    [
      3,
      9,
      1,
      4,
      917967549
    ],
    [
      3,
      13,
      1,
      4,
      1161786359
    ],
    [
      2,
      11,
      1,
      3,
      806866057
    ],
    [
      2,
      5,
      1,
      3,
      2709482403
    ],
    [
      1,
      11,
      0,
      1,
      3754216397
    ],
    [
      6,
      2,
      0,
      6,
      3109052295
    ]
  ],
  "命中分布": [
    1,
    2,
    2,
    2,
    2,
    0,
    1
  ],
  "建表与抽取": [
    2,
    10
  ],
  "加权与改权": [
    7,
    1
  ],
  "收尾随机数": 3109052295,
  "份数守恒": true,
  "别名闭合": true,
  "记录自洽": true,
  "命中自洽": true,
  "判定复核": [
    1,
    1,
    1,
    0,
    0
  ],
  "重放不新增": 0,
  "重放报错": 7,
  "中态不同": true,
  "拆两轮一致": true,
  "异常事件数": 7,
  "空权重表": "E_EMPTY_TABLE",
  "负权重": "E_BAD_WEIGHT",
  "全零权重": "E_ZERO_WEIGHT",
  "坏种子": "E_BAD_SEED",
  "坏抽取次数": "E_BAD_DRAWS",
  "坏下标": "E_BAD_AT",
  "坏候选项": "E_BAD_PICK"
};
function __same(got, want) {
  if (typeof got === "string") {
    try {
      const parsed = JSON.parse(got);
      if (JSON.stringify(parsed) === JSON.stringify(want)) {
        return true;
      }
    } catch (error) {
      return JSON.stringify(got) === JSON.stringify(want);
    }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) {
    __bad += 1;
    console.log("缺失验收项 " + label);
    continue;
  }
  if (__same(found[1], want)) {
    console.log("一致 " + label + " = " + JSON.stringify(found[1]));
  } else {
    __bad += 1;
    console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(found[1]));
  }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
