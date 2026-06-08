import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "market-crawler");
const SCREENSHOT_DIR = path.join(DATA_DIR, "screenshots");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");

async function ensureJsonFile(filePath) {
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]\n", "utf8");
  }
}

export async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await ensureJsonFile(TASKS_FILE);
  await ensureJsonFile(RESULTS_FILE);
}

async function readJson(filePath) {
  await ensureStore();
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeJson(filePath, value) {
  await ensureStore();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function readTasks() {
  return readJson(TASKS_FILE);
}

export async function writeTasks(tasks) {
  return writeJson(TASKS_FILE, tasks);
}

export async function readResults() {
  return readJson(RESULTS_FILE);
}

export async function writeResults(results) {
  return writeJson(RESULTS_FILE, results);
}

export async function appendResults(nextResults) {
  const current = await readResults();
  const merged = [...nextResults, ...current].sort((left, right) =>
    right.crawlTime.localeCompare(left.crawlTime),
  );
  await writeResults(merged);
  return merged;
}

export { DATA_DIR, SCREENSHOT_DIR, TASKS_FILE, RESULTS_FILE };
