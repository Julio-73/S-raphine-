import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("_candidates");
const ids = `
1483985988355-763728e1935b
1490481651871-ab68de25d43d
1529139574466-a303027c1d8b
1539109136881-3be0616acf4b
1509631179647-0177331693ae
1469334031218-e382a71b716b
1515886657613-9f3515b0c78f
1496747611176-843222e1e57c
1445205170230-053b83016050
1558769132-cb1aea458c5e
1487222477894-8943e31ef7b2
1550614000-4895a10e1bfd
1485462537746-965f33f7f6a7
1524504388940-b1c1722653e1
1517841905240-472988babdf9
1534528741775-53994a69daeb
1529626455594-4ff0802cfb7e
1524250502761-1ac6f2e30d43
1503342217505-b0a15ec3261c
1544022613-e87ca75a784a
1515372039744-b8f02a3ae446
1594633312681-425c7b97ccd1
1595777457583-95e059d581b8
1566174053879-31528523f8ae
1581044777550-4cfa60707c03
1581338834647-b0fb40704e21
1590739225287-bd31519780c3
1618354691373-d851c5c3a990
1542291026-7eec264c27ff
1543163521-1bf539c55dd2
1548036328-c9fa89d128fa
1584917865442-de89df76afd3
1492707892479-7bc8d5a4ee93
1487412720507-e7ab37603c6f
1512496015851-a90fb38ba796
1596462502278-27bfdc403348
1541643600914-78b084683601
1594035910387-fea47794261f
1522335789203-aabd1fc54bc9
1441986300917-64674bd600d8
1523381210434-271e8be1f52b
1516762689617-e1cffcef479d
1521572163474-6864f9cf17ab
1467043237213-65f2da53396f
1502716119720-b23a93e5fe1b
1490114538077-0a7f8cb49891
1485968579580-b6d095142e6e
1525507119028-ed4c629a60a3
1551232864-3f0890e580d9
1551803091-e20673f15770
1539008835657-9e8e9680c956
1605763240000-7e93b172d754
1617137968427-85924c800a22
1591369822096-ffd140ec948f
1596783074918-c84cb06531ca
1572804013309-59a88b7e92f1
1564859228273-274232fdb516
1504198453319-5ce911bafcde
1519699047748-de8e457a634e
1483985988355-763728e1935b
`.trim().split(/\s+/);

await fs.mkdir(OUT, { recursive: true });

const results = [];
for (const id of [...new Set(ids)]) {
  const file = path.join(OUT, `${id}.jpg`);
  try {
    await fs.access(file);
  } catch {
    const res = await fetch(
      `https://images.unsplash.com/photo-${id}?w=520&q=72&fm=jpg&fit=max`,
      { signal: AbortSignal.timeout(20000) }
    );
    if (!res.ok) { console.log("FAIL", id, res.status); continue; }
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  try {
    const meta = await sharp(file).metadata();
    results.push({ id, w: meta.width, h: meta.height });
  } catch { console.log("BAD", id); }
}

const COLS = 6;
const CW = 300, CH = 380, PAD = 8, LABEL = 26;
const rows = Math.ceil(results.length / COLS);
const composites = [];
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const buf = await sharp(path.join(OUT, `${r.id}.jpg`))
    .resize(CW, CH, { fit: "cover", position: "centre" })
    .toBuffer();
  composites.push({
    input: buf,
    left: PAD + (i % COLS) * (CW + PAD),
    top: PAD + Math.floor(i / COLS) * (CH + LABEL + PAD) + LABEL,
  });
  composites.push({
    input: Buffer.from(
      `<svg width="${CW}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="18" font-family="Arial" font-size="13" fill="#fff">${i}: ${r.id.slice(0, 22)} · ${r.w}x${r.h}</text></svg>`
    ),
    left: PAD + (i % COLS) * (CW + PAD),
    top: PAD + Math.floor(i / COLS) * (CH + LABEL + PAD),
  });
}

await sharp({
  create: {
    width: COLS * (CW + PAD) + PAD,
    height: rows * (CH + LABEL + PAD) + PAD,
    channels: 3,
    background: "#e8e4dc",
  },
})
  .composite(composites)
  .jpeg({ quality: 82 })
  .toFile(path.resolve("_contact-sheet.jpg"));

await fs.writeFile(path.resolve("_candidates.json"), JSON.stringify(results, null, 2));
console.log("OK", results.length, "images");
