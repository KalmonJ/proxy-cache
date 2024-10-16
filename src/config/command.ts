import { Command } from "../lib/command";
import { config } from "dotenv"
import { memoryCache } from "./cache";
import { fork } from "child_process"
import { join } from "path";
import { createConnection } from "net"

config()

const command = new Command();

let PORT = 4040


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
        const cp = fork(path)
        cp.send({ port: PORT, url })
        cp.unref()
      }
    }
  }).option({
    isRoot: true,
    type: "standalone",
    value: "--clear-cache",
    action: function () {
      memoryCache.clear()
      const server = createConnection({ port: 8000 })
      server.write("clear-cache")
      server.end()
      console.log("Cache successfully clear")
    },
  })

export { command }

