import { Command } from "../lib/command";

const command = new Command();

command
  .option({
    type: "option",
    value: "--port",
    isRoot: true,
    arguments: {
      type: "number",
      name: "port",
      action: function () {
        console.log("hello world")
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
      action: function () {
        console.log("hello world")
      }
    }
  });

export { command }

