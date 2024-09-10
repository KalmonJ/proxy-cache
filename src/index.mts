#!/usr/bin/env node

import { command } from "./config/command"
import { CommandError } from "./lib/error"


const startApplication = (...commands: string[]) => {

  try {
    command.validate(...commands)
  } catch (error) {
    if (error instanceof CommandError) {
      console.log("is command")
    }
  }

}


startApplication(...process.argv.slice(2))

