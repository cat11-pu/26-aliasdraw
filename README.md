# aliasdraw

份数落点阵（原生 ES 模块，零依赖）：每项按权重乘项数得份数，份数不到总和的两两配对把超出的部分
让给别名项；抽取用线性同余推进随机数，先定候选项、再按切点决定自取还是改取别名项，每次抽取都
落在阵里并计入命中。

## 起服务看页面

    python3 -m http.server 8000

浏览器打开 http://127.0.0.1:8000/ 即可操作：上面是份数落点阵（行是项、列是第几次抽取，格子里
自取记自、改取记改），中间是抽取链，下面是别名对照表，页脚列出被拦下的事件与一排按钮。

## 要补的文件

    table.js    scaledOf / buildTable / bucketOf
    engine.js   build / addWeight / setWeight / wind / draw

app.js、audit.js、check_sample.js、tests/run.js 与页面都已写好，只调不写。

## 测试

    node tests/run.js

## 场景自检

    node check_sample.js
