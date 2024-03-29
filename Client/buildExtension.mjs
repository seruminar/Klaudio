// @ts-check
import { promises, createWriteStream } from "fs";
import archiver from "archiver";

const { writeFile, readdir, readFile } = promises;

const blankManifest = {
  manifest_version: 2,
  name: process.env.npm_package_niceName,
  version: process.env.npm_package_version,
  description: process.env.npm_package_description,
  icons: { "16": "logo192.png", "48": "logo192.png", "128": "logo192.png" },
  web_accessible_resources: ["favicon.ico"],
  browser_action: {
    default_title: process.env.npm_package_niceName,
  },
  background: {
    scripts: [],
  },
  content_scripts: [
    {
      matches: ["https://kentico.crm4.dynamics.com/WebResources/ken_SimpleCRM/*"],
      css: [],
      js: [],
    },
  ],
};

const build = "./build";

(async () => {
  const jsFiles = await readdir(`${build}/static/js`);

  let TEMP_responses;

  for (const file of jsFiles) {
    if (file.endsWith(".js")) {
      const fileContents = await readFile(`${build}/static/js/${file}`, "utf8");

      if (fileContents.indexOf("WhoAmIResponse") > -1) {
        TEMP_responses = file;
        continue;
      }

      blankManifest.content_scripts[0].js.push(`static/js/${file}`);
    }
  }

  const cssFiles = await readdir(`${build}/static/css`);

  for (const file of cssFiles) {
    if (file.endsWith(".css")) {
      blankManifest.content_scripts[0].css.push(`static/css/${file}`);
    }
  }

  const backgroundFiles = await readdir(`${build}/static/js/chrome`);

  for (const file of backgroundFiles) {
    if (file.endsWith(".js")) {
      blankManifest.background.scripts.push(`static/js/chrome/${file}`);
    }
  }

  await writeFile(`${build}/manifest.json`, JSON.stringify(blankManifest));

  const output = createWriteStream(`${build}/build_${process.env.npm_package_version}.zip`);

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(output);

  const packageFiles = ["favicon.ico", "logo192.png", "manifest.json"];

  packageFiles.map((file) => archive.file(`${build}/${file}`, { name: file }));

  archive.directory(`${build}/static`, "static", (data) => (data.name.indexOf(TEMP_responses) > -1 ? false : data));

  await archive.finalize();
})();
