/**
 * CCNA 2 Quiz Scraper
 * Fetches exam pages from itexamanswers.net, parses questions/options/answers
 * using DOM selectors, downloads images to /images, saves JSON to /data.
 *
 * Technologies: Node.js, axios, cheerio
 * Run: npm install && npm run scrape
 */

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = "https://itexamanswers.net";
const CHAPTER_URLS = [
  { num: 6, url: `${BASE_URL}/ccna-2-v5-0-3-v6-0-chapter-6-exam-answers-100-full.html` },
  { num: 7, url: `${BASE_URL}/ccna-2-v5-0-3-v6-0-chapter-7-exam-answers-100-full.html` },
  { num: 8, url: `${BASE_URL}/ccna-2-v5-0-3-v6-0-chapter-8-exam-answers-100-full.html` },
  { num: 9, url: `${BASE_URL}/ccna-2-v5-0-3-v6-0-chapter-9-exam-answers-100-full.html` },
  { num: 10, url: `${BASE_URL}/ccna-2-v5-0-3-v6-0-chapter-10-exam-answers-100-full.html` },
];

const DATA_DIR = path.join(__dirname, "data");
const IMAGES_DIR = path.join(__dirname, "images");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("Created directory:", DATA_DIR);
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log("Created directory:", IMAGES_DIR);
  }
}

function norm(s) {
  return (s || "").trim().replace(/\s+/g, " ");
}

/**
 * Get first image URL from a question block: inside the question <p> or in the next element(s) before <ul>.
 */
function getQuestionImage($, $questionP) {
  let src = $questionP.find("img").first().attr("src");
  if (src) return src.startsWith("http") ? src : new URL(src, BASE_URL).href;
  const next = $questionP.nextAll();
  for (let i = 0; i < next.length; i++) {
    const el = next[i];
    const tag = el.tagName && el.tagName.toLowerCase();
    if (tag === "ul") break;
    const $el = $(el);
    const img = $el.find("img").first().attr("src") || (tag === "img" ? $el.attr("src") : null);
    if (img) return img.startsWith("http") ? img : new URL(img, BASE_URL).href;
  }
  return "";
}

/**
 * Parse one question block: <p><strong>N. Question text</strong></p> [optional img] <ul><li>...</li></ul>
 * Correct answers are <li> that contain span[style*="color: red"] (or color:red).
 */
function parseQuestionsFromDom($, container) {
  const questions = [];
  const $container = $(container);

  const $questionParas = $container.find("p").filter(function () {
    const $p = $(this);
    const $strong = $p.find("strong").first();
    if (!$strong.length) return false;
    const text = norm($strong.text());
    return /^\d+\.\s+.+/.test(text);
  });

  if (!$questionParas.length) {
    console.warn("  [Selector] No <p><strong>N. ...</strong></p> found in container. Check .thecontent.clearfix / .entry-content.");
    return questions;
  }

  $questionParas.each(function (idx) {
    const $p = $(this);
    const $strong = $p.find("strong").first();
    let questionText = norm($strong.text());
    const numMatch = questionText.match(/^(\d+)\.\s+(.*)$/s);
    if (numMatch) questionText = norm(numMatch[2]);
    if (!questionText) return;

    const $ul = $p.nextAll("ul").first();
    if (!$ul.length) {
      console.warn("  [Selector] No <ul> after question:", questionText.slice(0, 60) + "...");
      return;
    }

    const options = [];
    const correctTexts = [];
    $ul.find("li").each(function () {
      const $li = $(this);
      const text = norm($li.text());
      if (!text) return;
      const isCorrect = $li.find('[style*="color: red"]').length > 0 || $li.find('[style*="color:red"]').length > 0;
      options.push(text);
      if (isCorrect) correctTexts.push(text);
    });

    if (options.length === 0) {
      console.warn("  [Selector] No <li> options for question:", questionText.slice(0, 60) + "...");
      return;
    }

    const imageUrl = getQuestionImage($, $p);

    const q = {
      question: questionText,
      image: imageUrl,
      options,
      answer: correctTexts[0] || options[0],
      ...(correctTexts.length > 1 ? { answers: correctTexts } : {}),
    };
    questions.push(q);

    if (idx < 3) {
      console.log("  Question text extracted:", questionText.slice(0, 70) + (questionText.length > 70 ? "..." : ""));
      console.log("  Options extracted:", options.length, "->", options.slice(0, 2).map((o) => o.slice(0, 50)) + "...");
      console.log("  Correct answer(s) detected:", correctTexts.length, correctTexts.slice(0, 2));
      if (imageUrl) console.log("  Image URL:", imageUrl);
    }
  });

  return questions;
}

/**
 * Parse chapter HTML: use .thecontent.clearfix (or .entry-content) and DOM-based parsing.
 */
function parseChapterHtml(html, chapterNum) {
  const $ = cheerio.load(html);

  let container = $(".thecontent.clearfix").first();
  if (!container.length) {
    container = $(".entry-content").first();
  }
  if (!container.length) {
    console.warn("  [Selector] Neither .thecontent.clearfix nor .entry-content found. Using body.");
    container = $("body");
  }

  const questions = parseQuestionsFromDom($, container);
  return questions;
}

async function downloadFile(url, filePath) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });
    if (res.status !== 200) return false;
    fs.writeFileSync(filePath, res.data);
    return true;
  } catch (e) {
    console.warn("  Download failed:", url, e.message);
    return false;
  }
}

async function processChapter(chapterNum, url, options = {}) {
  const { verbose = true } = options;
  console.log("\n--- Chapter " + chapterNum + " ---");

  let html;
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 20000,
      validateStatus: (status) => status === 200,
    });
    html = res.data;
  } catch (e) {
    console.error("  Failed to fetch chapter " + chapterNum + ":", e.message);
    return [];
  }

  const questions = parseChapterHtml(html, chapterNum);
  console.log("  Number of questions detected:", questions.length);
  if (questions.length === 0) {
    console.error("  [Selector failed] No questions parsed. Check: .thecontent.clearfix or .entry-content, then p strong (text like '1. ...'), next ul, li with correct = span[style*='color: red'].");
    const jsonPath = path.join(DATA_DIR, "chapter" + chapterNum + ".json");
    fs.writeFileSync(jsonPath, "[]", "utf8");
    console.log("  Wrote empty array to", jsonPath);
    return [];
  }

  const prefix = "chapter" + chapterNum;
  let downloadedCount = 0;
  for (let q = 0; q < questions.length; q++) {
    const item = questions[q];
    if (item.image && item.image.startsWith("http")) {
      const ext = path.extname(new URL(item.image).pathname) || ".png";
      const localName = prefix + "-q" + (q + 1) + ext;
      const localPath = path.join(IMAGES_DIR, localName);
      const ok = await downloadFile(item.image, localPath);
      item.image = ok ? "images/" + localName : "";
      if (ok) downloadedCount++;
    }
  }
  if (downloadedCount > 0) console.log("  Downloaded", downloadedCount, "image(s) to /images");

  const out = questions.map((q) => ({
    question: q.question,
    image: q.image || "",
    options: q.options,
    answer: q.answer || "",
    ...(q.answers && q.answers.length > 1 ? { answers: q.answers } : {}),
  }));

  const jsonPath = path.join(DATA_DIR, prefix + ".json");
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");
  console.log("  Saved", out.length, "questions ->", jsonPath);
  return out;
}

async function main() {
  ensureDirs();
  console.log("CCNA 2 Quiz Scraper (axios + cheerio) – fetching and parsing chapters...");

  const counts = {};
  for (const ch of CHAPTER_URLS) {
    try {
      const list = await processChapter(ch.num, ch.url);
      counts["chapter" + ch.num] = list.length;
    } catch (e) {
      console.error("Chapter " + ch.num + " error:", e.message);
      counts["chapter" + ch.num] = 0;
    }
  }

  console.log("\n--- Total question count per chapter ---");
  Object.keys(counts)
    .sort()
    .forEach((k) => console.log("  " + k + ":", counts[k]));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
