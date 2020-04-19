// @ts-check
import { promises } from "fs";

const { writeFile, readdir } = promises;

const blankManifest = {
  manifest_version: 2,
  name: process.env.npm_package_niceName,
  version: process.env.npm_package_version,
  description: process.env.npm_package_description,
  icons: { "16": "logo192.png", "48": "logo192.png", "128": "logo192.png" },
  browser_action: {
    default_title: process.env.npm_package_niceName
  },
  background: {
    scripts: []
  },
  content_scripts: [
    {
      matches: ["https://kentico.crm4.dynamics.com/WebResources/ken_SimpleCRM/*"],
      css: [],
      js: []
    }
  ]
};

(async () => {
  const jsFiles = await readdir("./build/static/js");

  for (const file of jsFiles) {
    if (file.endsWith(".js")) {
      blankManifest.content_scripts[0].js.push(`static/js/${file}`);
    }
  }

  const cssFiles = await readdir("./build/static/css");

  for (const file of cssFiles) {
    if (file.endsWith(".css")) {
      blankManifest.content_scripts[0].css.push(`static/css/${file}`);
    }
  }

  const backgroundFiles = await readdir("./build/static/js/chrome");

  for (const file of backgroundFiles) {
    if (file.endsWith(".js")) {
      blankManifest.background.scripts.push(`static/js/chrome/${file}`);
    }
  }

  await writeFile("./build/manifest.json", JSON.stringify(blankManifest));
})();
