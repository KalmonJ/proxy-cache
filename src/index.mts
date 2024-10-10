#!/usr/bin/env node

import { command } from "./config/command"
import { CommandError } from "./lib/error"


const startApplication = (...commands: string[]) => {
  try {
    command.validate(...commands)
    command.exec()
  } catch (error) {
    if (error instanceof CommandError) {
      console.log(error.message)
    }
  }

}


startApplication(...process.argv.slice(2))

