const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Function to download a file (if it doesn't exist)
async function downloadFile(fileUrl, filePath) {
  if (!fs.existsSync(filePath)) {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      if (response.status === 200) {
        fs.writeFileSync(filePath, response.data);
        console.log(`Downloaded: ${filePath}`);
      } else {
        console.error(
          `Error downloading ${fileUrl}: Status ${response.status}`
        );
      }
    } catch (error) {
      console.error(`Error downloading ${fileUrl}: ${error.message}`);
    }
  } else {
    console.log(`File already exists: ${filePath}`);
  }
}

// Function to get all links from a page
async function getLinksFromPage(pageUrl) {
  const response = await axios.get(pageUrl);
  const $ = cheerio.load(response.data);

  const links = [];
  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      links.push(url.resolve(pageUrl, href));
    }
  });

  return links;
}

// Recursive function to download links
async function downloadLinksRecursively(pageUrl, depth, initialHostname) {
  if (depth === 0) {
    return;
  }

  try {
    const response = await axios.head(pageUrl);

    if (response.status !== 200) {
      console.log(`Skipping ${pageUrl} due to non-200 response`);
      return;
    }
  } catch (error) {
    console.error(`Error checking response for ${pageUrl}:`, error);
    return;
  }

  const links = await getLinksFromPage(pageUrl);

  for (const link of links) {
    const parsedUrl = new URL(link);
    const hostName = parsedUrl.hostname;
    const filePath = path.join(
      __dirname,
      hostName,
      parsedUrl.pathname.replace(/[^a-zA-Z0-9]/g, "_")
    );

    console.log(filePath);

    if (hostName === initialHostname) {
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
          await downloadFile(link, filePath);
          await downloadLinksRecursively(link, depth - 1, initialHostname);
        }
      }
    }
  }
}

const uniqueTags = new Set();

// Recursive function to read and parse HTML files
async function parseHTMLFiles(directory) {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      parseHTMLFiles(filePath);
    } else {
      // if (file.endsWith(".html"))
      const content = fs.readFileSync(filePath, "utf-8");
      const $ = cheerio.load(content);
      $("*").each((index, element) => {
        uniqueTags.add(element.name);
      });
    }
  });
}

function compareLists(neededStrings, userInput) {
  const presentStrings = [];
  const missingStrings = [];

  neededStrings.forEach((input) => {
    if (userInput.includes(input)) {
      presentStrings.push(input);
    } else {
      missingStrings.push(input);
    }
  });

  const totalNeeded = neededStrings.length;
  const totalPresent = presentStrings.length;
  const totalMissing = missingStrings.length;

  console.log(`Total needed strings: ${totalNeeded}`);
  console.log(`Total present strings: ${totalPresent}`);
  console.log(`Total missing strings: ${totalMissing}`);

  if (totalMissing > 0) {
    console.log(`Missing strings: ${missingStrings.join(", ")}`);
  }
}

async function run() {
  const startUrl = process.argv[2]; // Replace with your desired URL
  const maxDepth = 2; // Set the maximum depth of recursion
  const parsedUrl = new URL(startUrl);

  await downloadLinksRecursively(startUrl, maxDepth, parsedUrl.hostname);

  const folderPath = `./${startUrl.replace(/^https?:\/\//i, "")}`;
  //   console.log(folderPath);

  if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
    console.log(`Folder "${folderPath}" exists and is a directory.`);
  } else {
    console.error(
      `Error: Folder "${folderPath}" does not exist or is not a directory.`
    );
  }

  // Initialize an empty set to store unique tags

  await parseHTMLFiles(folderPath);

  const uniqueTagsArray = Array.from(uniqueTags);

  const needed_tags = [
    "html",
    "head",
    "title",
    "meta",
    "link",
    "script",
    "style",
    "body",
    "main",
    "h1",
    "h2",
    "h3",
    "p",
    "section",
    "header",
    "footer",
    "aside",
    "nav",
    "div",
    "span",
    "br",
    "b",
    "i",
    "strong",
    "em",
    "code",
    "pre",
    "hr",
    "a",
    "img",
    "picture",
    "iframe",
    "audio",
    "video",
    "source",
    "canvas",
    "svg",
    "ul",
    "ol",
    "optgroup",
    "li",
    "form",
    "label",
    "fieldset",
    "legend",
    "input",
    "textarea",
    "datalist",
    "select",
    "option",
    "details",
    "summary",
    "button",
    "template",
    "table",
    "tr",
    "td",
    "th",
    "caption",
    "col",
    "colgroup",
    "figure",
    "figcaption",
  ];

  compareLists(needed_tags, uniqueTagsArray);
}

run();
