import { spawn } from "node:child_process";
import { platform } from "node:os";

const isWindows = platform() === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const localMarketUrl = "http://127.0.0.1:8080/market";

function spawnProcess(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
}

function openUrl(url) {
  if (isWindows) {
    spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  const command = platform() === "darwin" ? "open" : "xdg-open";
  spawn(command, [url], {
    detached: true,
    stdio: "ignore",
  }).unref();
}

console.log("Starting Temu manual takeover mode...");
console.log("Crawler: http://127.0.0.1:8787");
console.log(`Frontend: ${localMarketUrl}`);

const crawler = spawnProcess("crawler", npmCommand, ["run", "crawler:headed"], {
  env: {
    TEMU_CRAWLER_HEADED: "1",
  },
});

const frontend = spawnProcess("frontend", npmCommand, ["run", "dev"]);

const openTimer = setTimeout(() => {
  openUrl(localMarketUrl);
}, 4500);

function shutdown() {
  clearTimeout(openTimer);
  crawler.kill();
  frontend.kill();
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
