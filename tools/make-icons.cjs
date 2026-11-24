// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、色のちがう3つの炎。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <g><path d="M28 80 C14 64 24 46 30 30 C34 44 42 48 40 62 C46 56 46 50 44 44 C52 54 50 70 28 80 Z" fill="#f6d77a"/><path d="M60 82 C48 70 54 56 60 44 C64 56 70 60 68 70 C72 66 72 62 71 58 C78 66 76 76 60 82 Z" fill="#7fd4b0"/><path d="M80 70 C72 62 76 52 80 44 C83 52 88 56 86 62 C90 60 90 56 89 54 C94 60 92 68 80 70 Z" fill="#e57373"/></g></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
