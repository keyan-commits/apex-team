import { spawn as cpSpawn } from "node:child_process";
import { spawn as ptySpawn } from "node-pty";

const BIN = process.argv[2] ?? "/opt/homebrew/bin/claude";
console.log("node:", process.version, "arch:", process.arch);
console.log("target:", BIN);

console.log("\n[A] child_process.spawn", BIN, "--version:");
const cp = cpSpawn(BIN, ["--version"], { stdio: "pipe" });
cp.stdout.on("data", (d) => process.stdout.write("  out: " + d));
cp.stderr.on("data", (d) => process.stdout.write("  err: " + d));
cp.on("error", (e) => console.log("  CP ERROR:", e.message));
cp.on("close", (c) => {
  console.log("  cp exit:", c);

  console.log("\n[B] node-pty.spawn", BIN, "--version:");
  try {
    const pty = ptySpawn(BIN, ["--version"], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      env: process.env,
    });
    let buf = "";
    pty.onData((d) => {
      buf += d;
    });
    pty.onExit(({ exitCode }) => {
      console.log("  pty out:", JSON.stringify(buf.slice(0, 200)));
      console.log("  pty exit:", exitCode);
      process.exit(0);
    });
  } catch (e) {
    console.log("  PTY ERROR:", e.message);
    process.exit(1);
  }
});
