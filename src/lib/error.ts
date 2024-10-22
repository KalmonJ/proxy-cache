
type Causes = "VALIDATION_ERROR" | "REFERENCE_ERROR" | "EXECUTION_ERROR"

type Options = {
  cause: Causes
}

export class CommandError extends Error {
  constructor(message: string, options: Options) {
    super(message, options)
  }
}

