#!/usr/bin/env node

import { command } from "./config/command"


const startApplication = () => {
  console.log(command.root)
}


startApplication()