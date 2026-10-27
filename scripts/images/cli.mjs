import fs from "node:fs/promises";
import path from "node:path";
import {
  prepareImages,
  finalizeHtml,
  publishImages,
  validateImages,
} from "./pipeline.mjs";
const root = process.cwd(),
  generatedDir = path.join(root, ".generated/images");
const command = process.argv[2];
const start = Date.now();
if (command === "prepare") {
  const manifest = await prepareImages({ root });
  console.log(
    `Prepared ${Object.keys(manifest.images).length} images, ${Object.values(manifest.images).reduce((n, e) => n + e.variants.length, 0)} variants in ${Date.now() - start}ms`,
  );
} else {
  const manifest = JSON.parse(
    await fs.readFile(path.join(generatedDir, "manifest.json"), "utf8"),
  );
  if (command === "finalize") {
    const usages = await finalizeHtml({ root, manifest });
    await publishImages({ root, manifest });
    await fs.writeFile(
      path.join(generatedDir, "usages.json"),
      JSON.stringify(usages, null, 2),
    );
    console.log(`Finalized ${usages.length} image usages`);
  } else if (command === "validate")
    console.log("Image output gate:", await validateImages({ root, manifest }));
  else throw new Error(`Unknown image command: ${command}`);
}
