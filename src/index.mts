#!/usr/bin/env node

import { command } from "./config/command"


const startApplication = (...commands: string[]) => {

  console.log(command.inspect('--origin'))
  command.validate(...commands)
}


startApplication(...process.argv.slice(2))