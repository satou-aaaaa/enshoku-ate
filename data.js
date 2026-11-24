// 炎色反応あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、名古屋市科学館「S519 炎色反応」と岩手県立総合教育センター 化学基礎「綿棒を使った炎色反応」（下の SRC）に書いてあることだけ
// （2026-11-24 に読んだ。要点は共有フォルダ games/enshoku-research.md）。
// 扱うのは「炎の色と元素」だけ。元素記号あて（genso-kigo）・実験器具あて（jikken-kigu）・水溶液あてとは重ねない。実験の手順・火の扱い方は教えない。
// 2つの資料で色の言い方が少しちがう元素（リチウム 赤／深紅色、ストロンチウム 紅／深紅色、カリウム 赤紫／淡紫色）は両方を書き、
// 似た色の元素（同じ「色のなかま」）を同じ問題の選び肢に並べない。答えはいつも1つになる。
// 1問は、炎の色から元素を選ぶ・元素から炎の色を選ぶ（正解したら2段目「どのなかまの元素？」）か、しくみの問いに答える。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回し・まちがいの選び肢は、足すだけでも過去の日の問題が変わる（選ぶ範囲が変わるため）。公開したあとは変えず、変えるときは qa/run.mjs の PINS を作り直して PR に理由を書く。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    ncsm: ["名古屋市科学館「炎色反応」", "https://www.ncsm.city.nagoya.jp/exhibit_files/pdf/S519.pdf"],
    iwate: ["岩手県立総合教育センター「綿棒を使った炎色反応」", "https://www1.iwate-ed.jp/07tantou/kagaku/kagakukiso/kagakukiso%202/sapoto06.pdf"],
  };

  // 元素：名前・炎の色・色のなかま（似た色。同じ問題に並べない）・2段目のなかま
  const EL = {
    li: { name: "リチウム", color: "赤色（深紅色）", fam: "aka", grp: "alkali" },
    na: { name: "ナトリウム", color: "黄色", fam: "ki", grp: "alkali" },
    k: { name: "カリウム", color: "赤紫色（淡紫色）", fam: "murasaki", grp: "alkali" },
    rb: { name: "ルビジウム", color: "暗赤色", fam: "aka", grp: "alkali" },
    cs: { name: "セシウム", color: "青紫色", fam: "murasaki", grp: "alkali" },
    ca: { name: "カルシウム", color: "橙赤色", fam: "aka", grp: "dorui" },
    sr: { name: "ストロンチウム", color: "紅色（深紅色）", fam: "aka", grp: "dorui" },
    ba: { name: "バリウム", color: "黄緑色", fam: "midori", grp: "dorui" },
    cu: { name: "銅", color: "青緑色", fam: "midori", grp: "sonota" },
    b: { name: "ホウ素", color: "緑色", fam: "midori", grp: "sonota" },
    ga: { name: "ガリウム", color: "青色", fam: "ao", grp: "sonota" },
    in: { name: "インジウム", color: "藍色", fam: "ao", grp: "sonota" },
  };
  const ELS = Object.keys(EL);
  const FAMS = ["aka", "ki", "murasaki", "midori", "ao"];
  const LEVELS = ELS.map((e) => EL[e].name);

  // 2段目「どのなかまの元素？」の3つ（名古屋市科学館の表の族の分け方）
  const GROUPS = {
    alkali: { name: "アルカリ金属", sub: "1族（リチウム・ナトリウムなど）" },
    dorui: { name: "アルカリ土類金属", sub: "2族（カルシウム・バリウムなど）" },
    sonota: { name: "そのほかの元素", sub: "11族の銅・13族のホウ素など" },
  };
  const GRP_WHY = {
    alkali: "リチウム・ナトリウム・カリウム・ルビジウム・セシウムは1族のアルカリ金属です（名古屋市科学館の表）。",
    dorui: "カルシウム・ストロンチウム・バリウムは2族のアルカリ土類金属です（名古屋市科学館の表）。",
    sonota: "銅は11族、ホウ素・ガリウム・インジウムは13族で、アルカリ金属でもアルカリ土類金属でもありません（名古屋市科学館の表）。",
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  const MEDIA = { iro: "炎の色から元素", gen: "元素から炎の色", hanabi: "花火と台所", shikumi: "しくみと歴史" };

  // まちがいの選び肢：答えと別の「色のなかま」から1つずつ（似た色を並べない）。やさしいは2つ、ほかは3つ
  function others(R, e, lv) {
    const fams = pickN(R, FAMS.filter((f) => f !== EL[e].fam), lv === 0 ? 2 : 3);
    return fams.map((f) => { const c = ELS.filter((x) => EL[x].fam === f); return c[ri(R, 0, c.length - 1)]; });
  }
  // 問いの言い方（c は炎の色、n は元素の名前）
  const SIT_E = [
    (c) => `試料を炎に入れると、炎が${c}になりました。ふくまれる元素は？`,
    (c) => `ガスバーナーの炎が${c}に変わりました。この色を出す元素は？`,
    (c) => `炎色反応で${c}の炎が見えました。元素はどれ？`,
    (c) => `ある金属の塩化物を炎に入れたら${c}。どの元素？`,
    (c) => `白金線につけた試料で、炎が${c}になりました。元素は？`,
    (c) => `炎の色が${c}になる元素はどれ？`,
    (c) => `${c}の炎。炎色反応からわかる元素は？`,
  ];
  const SIT_C = [
    (n) => `${n}をふくむ試料を炎に入れると、炎は何色？`,
    (n) => `${n}の炎色反応は何色？`,
    (n) => `炎色反応で、${n}が見せる炎の色は？`,
    (n) => `${n}の化合物を炎に入れました。炎の色は？`,
    (n) => `${n}を見分けるとき、炎はどんな色になる？`,
    (n) => `ガスバーナーの炎に${n}の試料。何色になる？`,
    (n) => `${n}の炎の色として正しいのは？`,
  ];
  function toEl(e) {
    return (R, lv) => {
      const si = ri(R, 0, SIT_E.length - 1), ds = others(R, e, lv), opts = shuffle(R, [e, ...ds]);
      return { type: "act", media: MEDIA.iro, q: SIT_E[si](EL[e].color), opts: opts.map((x) => EL[x].name), ans: EL[e].name, rev: false, v: `${si}:${opts.join(".")}` };
    };
  }
  function toColor(e) {
    return (R, lv) => {
      const si = ri(R, 0, SIT_C.length - 1), ds = others(R, e, lv), opts = shuffle(R, [e, ...ds]);
      return { type: "act", media: MEDIA.gen, q: SIT_C[si](EL[e].name), opts: opts.map((x) => EL[x].color), ans: EL[e].color, rev: false, v: `${si}:${opts.join(".")}` };
    };
  }
  const why = (e) => `${EL[e].name}の炎色反応は${EL[e].color}です。元素によって炎の色がちがうので、色から元素がわかります。`;
  // 炎の色から元素（id は e<元素>）
  const E = (e, lv, look) => ({ id: "e" + e, el: e, lv, a: ELS.indexOf(e), ans: EL[e].name, grp: EL[e].grp, col: "iro", name: `${EL[e].color}は${EL[e].name}`, look,
    key: `${EL[e].color}の炎は${EL[e].name}です。`, why: why(e), src: ["ncsm", "iwate"], make: toEl(e) });
  // 元素から炎の色（id は c<元素>）
  const C = (e, lv, look) => ({ id: "c" + e, el: e, lv, a: ELS.indexOf(e), ans: EL[e].color, grp: EL[e].grp, col: "gen", name: `${EL[e].name}は${EL[e].color}`, look,
    key: `${EL[e].name}の炎は${EL[e].color}です。`, why: why(e), src: ["ncsm", "iwate"], make: toColor(e) });
  // しくみの問題。ans：答え、ws：まちがいの選び肢の候補（やさしいは2つ、ほかは3つ使う）、sit：問いの言い方
  function fact(col, sit, ans, ws) {
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), ds = pickN(R, ws, lv === 0 ? 2 : 3);
      return { type: "fact", media: MEDIA[col], q: sit[si], opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${ds.map((d) => ws.indexOf(d)).join(".")}` };
    };
  }
  const F = (id, lv, col, src, name, look, key, why, sit, ans, ws) => ({ id, lv, a: -1, ans, grp: null, col, name, look, key, why, src: [src], make: fact(col, sit, ans, ws) });

  const KINDS = [
    // ---- やさしい ----
    E("na", 0, "食塩にもふくまれる元素です。"),
    E("cu", 0, "11族の金属です。"),
    E("li", 0, "赤のなかまの色を出す1族の元素です。"),
    C("na", 0, "食塩を炎にふりかけたときの色です。"),
    F("shokuen", 0, "hanabi", "ncsm", "食塩を炎にふりかけると黄色", "食塩はナトリウムをふくみます。", "食塩（塩化ナトリウム）をガスの炎にふりかけると、ナトリウムの炎色反応で黄色の炎が見えます。",
      "食塩をガスの炎にふりかけると黄色の炎が見えます。食塩の中のナトリウム原子による炎色反応の色です。",
      ["食塩をガスの炎にふりかけると、炎は何色になる？", "塩化ナトリウムを炎に入れたときの色は？", "なべの煮汁がふきこぼれてガスの炎が変わった。何色？"], "黄色", ["青緑色", "紫色", "黄緑色", "藍色", "白色"]),
    F("tokutei", 0, "shikumi", "iwate", "炎色反応で元素がわかる", "元素ごとに色がちがいます。", "元素ごとに特有な色が出るので、炎色反応から物質にふくまれる元素がわかります。",
      "それぞれの元素に特有な色が現れるので、炎色反応で物質にふくまれる元素を見分けられます。",
      ["炎色反応を使うと、何がわかる？", "炎の色を見て、試料の何を見分ける？", "炎色反応が見分けに使われるのは？"], "物質にふくまれる元素", ["物質の重さ", "物質の温度", "物質の値段", "物質のかたさ", "物質の古さ"]),
    // ---- ふつう ----
    E("k", 1, "赤と紫のあいだの色です。"),
    E("ca", 1, "2族の元素です。"),
    E("sr", 1, "花火の赤にも使われます。"),
    E("ba", 1, "2族の元素です。見分けにくい色です。"),
    C("cu", 1, "11族の金属です。"),
    C("li", 1, "赤のなかまの色です。"),
    F("hgreen", 1, "hanabi", "ncsm", "花火の緑色はバリウム化合物", "黄緑色の炎の元素です。", "花火の緑色には、一般的にバリウム化合物が使われます。",
      "花火の色は炎色反応を使っています。一般的に、緑色はバリウム化合物が使われます。",
      ["花火の緑色に、一般的に使われるのは？", "緑色の花火には、何の化合物が使われる？", "花火で緑を出すのに使われるのは？"], "バリウム化合物", ["ナトリウム化合物", "ストロンチウム化合物", "アルミニウムの粉", "リチウム化合物", "セシウム化合物"]),
    F("hblue", 1, "hanabi", "ncsm", "花火の青色は銅化合物", "青緑色の炎の元素です。", "花火の青色には、一般的に銅化合物が使われます。",
      "花火の色は炎色反応を使っています。一般的に、青色は銅化合物が使われます。",
      ["花火の青色に、一般的に使われるのは？", "青い花火には、何の化合物が使われる？", "花火で青を出すのに使われるのは？"], "銅化合物", ["ナトリウム化合物", "ストロンチウム化合物", "バリウム化合物", "カルシウム化合物", "アルミニウムの粉"]),
    F("hyellow", 1, "hanabi", "ncsm", "花火の黄色はナトリウム化合物", "食塩にもふくまれる元素です。", "花火の黄色には、一般的にナトリウム化合物が使われます。",
      "花火の色は炎色反応を使っています。一般的に、黄色はナトリウム化合物が使われます。",
      ["花火の黄色に、一般的に使われるのは？", "黄色い花火には、何の化合物が使われる？", "花火で黄色を出すのに使われるのは？"], "ナトリウム化合物", ["銅化合物", "バリウム化合物", "ストロンチウム化合物", "カリウム化合物", "アルミニウムの粉"]),
    F("mazeru", 1, "hanabi", "ncsm", "花火のほかの色は混ぜてつくる", "赤・黄・緑・青のほかの色です。", "花火の赤・黄・緑・青のほかの色は、これらの化合物を混ぜてつくります。",
      "花火では、赤色・黄色・緑色・青色の化合物を使い、ほかの色はこれらを混ぜてつくります。",
      ["花火の赤・黄・緑・青のほかの色は、どうやってつくる？", "花火の4色のほかの色のつくり方は？", "赤・黄・緑・青でない花火の色は？"], "これらの化合物を混ぜてつくる", ["色をぬった紙を燃やす", "火の温度を下げるだけ", "水を混ぜる", "どの色も1つの元素だけで出す", "電球で光らせる"]),
    // ---- むずかしい ----
    E("rb", 2, "炎色反応で見つかった1族の元素です。"),
    E("cs", 2, "1860年に炎色反応で見つかりました。"),
    E("b", 2, "13族の元素です。"),
    E("ga", 2, "13族の元素です。"),
    E("in", 2, "13族の元素です。"),
    C("ca", 2, "赤のなかまの色です。"),
    C("ba", 2, "緑のなかまの色です。"),
    F("shikumi", 2, "shikumi", "ncsm", "電子がもどるときに光を出す", "熱でエネルギーの高い状態になります。", "熱で高いエネルギー状態になった電子が、元の状態にもどるとき、差のエネルギーを光として出します。",
      "原子の中の電子は熱エネルギーを吸収して励起状態になり、基底状態にもどるとき差のエネルギーを光などとして出します。",
      ["炎色反応で色が出るのはなぜ？", "炎色反応の光は、原子の中で何が起きて出る？", "炎色反応のしくみとして正しいのは？"], "電子が元の状態にもどるとき光を出す", ["炎が試料に色をぬる", "試料の色がそのまま見える", "炎の温度が下がる", "空気が色を持つ", "試料がこおる"]),
    F("kashi", 2, "shikumi", "ncsm", "色が見えるのは可視光のときだけ", "赤外線や紫外線は目に見えません。", "出る光が赤外線や紫外線でなく可視光のときだけ、色のついた炎が見えます。",
      "炎色反応が見られる元素は限られています。出る電磁波が可視光のときだけ、色のついた炎が見えるからです。",
      ["炎色反応が見られる元素が限られるのはなぜ？", "色のついた炎が見えるのは、出る光がどんなとき？", "炎色反応で色が見えるための条件は？"], "出る光が可視光のときだけ", ["出る光が赤外線のとき", "出る光が紫外線のとき", "試料が液体のときだけ", "夜のときだけ", "試料が重いときだけ"]),
    F("dou", 2, "shikumi", "ncsm", "銅はハロゲンといっしょで炎色反応", "銅だけでは色が出ません。", "銅はそれだけでは炎色反応をおこさず、ハロゲン（塩素など）をふくむものといっしょで緑〜青色になります。",
      "銅はそれだけでは炎色反応をおこしません。ハロゲンをふくむものといっしょに炎に入れると、緑〜青色の炎になります。",
      ["銅線だけを炎に入れると、炎色反応は？", "銅の炎色反応が見えるのは、何といっしょのとき？", "銅が緑〜青色の炎を出すのは？"], "ハロゲンをふくむものといっしょのとき", ["銅だけでも必ず出る", "水にぬらしたときだけ", "鉄といっしょのとき", "冷やしたときだけ", "金といっしょのとき"]),
    F("beil", 2, "shikumi", "ncsm", "バイルシュタイン法はハロゲンを見つける", "銅の炎色反応を使います。", "銅の炎色反応を使うバイルシュタイン法は、微量のハロゲンを見つけるのに使われます。",
      "銅線をハロゲンをふくむものと炎に入れると緑〜青色になります。これをバイルシュタイン法といい、微量のハロゲンの検出に使います。",
      ["バイルシュタイン法で見つけるのは？", "銅の炎色反応を使って見つけるものは？", "バイルシュタイン法は何の検出に使う？"], "微量のハロゲン", ["微量の金", "水の量", "炎の温度", "鉄のさび", "酸素の量"]),
    F("cesium", 2, "shikumi", "ncsm", "1860年に炎色反応でセシウムを発見", "ブンゼンとキルヒホッフです。", "1860年、ブンゼンとキルヒホッフは、炎色反応と分光器を使って新元素セシウムを発見しました。",
      "1860年、ドイツのブンゼンとキルヒホッフは、炎色反応と分光器で新元素セシウムを発見しました。そのあとルビジウムなども見つかりました。",
      ["1860年に炎色反応と分光器で見つかった新元素は？", "ブンゼンとキルヒホッフが炎色反応で見つけた元素は？", "炎色反応と分光器で1860年に発見された元素は？"], "セシウム", ["ナトリウム", "銅", "カルシウム", "ホウ素", "バリウム"]),
    F("shiro", 2, "hanabi", "ncsm", "打上げ花火の白は金属の粉が燃える光", "炎色反応ではありません。", "打上げ花火の白色は、アルミニウムなどの金属の粉と酸化剤が燃えて高温になり、白い光が出るものです。",
      "打上げ花火の白色は、アルミニウムなどの金属微粉末と酸化剤が燃えて3000度近くになり、いろいろな光が混ざった白色光が出るものです。",
      ["打上げ花火の白色は、どうやって出る？", "花火の白い光のもとは？", "打上げ花火の白色のしくみは？"], "アルミニウムなどの金属の粉が燃える", ["ナトリウムの炎色反応", "銅の炎色反応", "バリウムの炎色反応", "水が光る", "白い紙が燃える"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "ena|2026-11-25:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: k.grp ? GRP_WHY[k.grp] : "", src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const ESK = { KINDS, BY, EL, ELS, FAMS, GROUPS, GRP_WHY, LV, SRC, LEVELS, RANGE: LEVELS, ORGS: LEVELS, MEDIA, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = ESK; else root.ESK = ESK;
})(typeof self !== "undefined" ? self : this);
