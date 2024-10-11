import { Command } from "../lib/command";
import { config } from "dotenv"
import { memoryCache } from "./cache";
import { join } from "path";
import { ChildProcess, fork } from "child_process"
import { nodeProcess } from "../lib/node-process";


config()

const command = new Command();

let PORT = 4040
let PROCESS: ChildProcess;

command
  .option({
    type: "option",
    value: "--port",
    isRoot: true,
    arguments: {
      type: "number",
      name: "port",
      required: true,
      action: function (argument: string) {
        PORT = Number(argument)
      }
    }
  })
  .option({
    type: "option",
    value: "--origin",
    isRoot: false,
    ref: "--port",
    arguments: {
      type: "string",
      name: "url",
      required: true,
      action: function (url: string) {
        const path = join(__dirname, "../dist/lib", "server.js")
        nodeProcess()
        const cp = fork(path)
        cp.send({ port: PORT, url, pid: process.pid })
      }
    }
  }).option({
    isRoot: true,
    type: "standalone",
    value: "--clear-cache",
    action: function () {
      console.log(process.pid, PROCESS)
      memoryCache.clear()
      console.log("cache clear successfully")
    },
  })

export { command }

