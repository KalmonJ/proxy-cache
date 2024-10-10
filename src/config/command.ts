import { Command } from "../lib/command";
import { config } from "dotenv"
import { startServer } from "../lib/server";
import { memoryCache } from "./cache";

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
      action: function (value: string) {
        startServer(value, PORT)
      }
    }
  }).option({
    isRoot: true,
    type: "standalone",
    value: "--clear-cache",
    action: function () {
      memoryCache.clear()
      console.log("cache clear successfully")
    },
  })

export { command }

