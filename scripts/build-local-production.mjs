import { spawn } from "node:child_process";
import { request } from "node:http";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const datalayerPort = process.env.TINA_DATALAYER_PORT || "9100";
const nodeCommand = process.execPath;
const tinaCli = path.join(cwd, "node_modules", "@tinacms", "cli", "dist", "index.js");
const nextCli = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isServerReady() {
  return new Promise((resolve) => {
    const req = request(
      "http://localhost:4001/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        res.resume();
        resolve(Boolean(res.statusCode) && res.statusCode >= 200 && res.statusCode < 500);
      }
    );

    req.on("error", () => resolve(false));
    req.write(JSON.stringify({ query: "{ __typename }" }));
    req.end();
  });
}

async function waitForServer(maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isServerReady()) {
      return;
    }
    await wait(1000);
  }

  throw new Error("Tina local server did not become ready on http://localhost:4001/graphql");
}

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

async function run() {
  const tina = spawnCommand(nodeCommand, [tinaCli, "dev", "--noWatch", "--datalayer-port", datalayerPort]);
  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (!tina.killed) {
      tina.kill("SIGTERM");
      setTimeout(() => {
        if (!tina.killed) {
          tina.kill("SIGKILL");
        }
      }, 2000).unref();
    }
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  tina.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      process.exit(code ?? 1);
    }
  });

  try {
    await waitForServer();

    const nextBuild = spawnCommand(nodeCommand, [nextCli, "build"], {
      env: { ...process.env, NODE_ENV: "production" },
    });

    const exitCode = await new Promise((resolve, reject) => {
      nextBuild.on("error", reject);
      nextBuild.on("exit", (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    shutdown();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
