#!/usr/bin/env node

import { command } from "./config/command"


const startApplication = (...commands: string[]) => {

  command.validate(...commands)
}


startApplication(...process.argv.slice(2))