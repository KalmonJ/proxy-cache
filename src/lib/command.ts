import { isAsyncFunction } from "util/types";
import { CommandError } from "./error";

export type CommandType = "option" | "argument";

type Maybe<T> = T | undefined;

type OptionBaseConfig = {
  type: "option";
  value: string;
  action?: Function
  isRoot: false;
  ref: string;
  arguments: Argument[] | Argument;
};

type OptionRootConfig = {
  type: "option";
  value: string;
  action?: Function
  isRoot: true;
  arguments: Argument[] | Argument;
  ref?: string;
};

type StandaloneOption = {
  type: "standalone"
  value: string
  action: Function
  isRoot: boolean
  arguments?: Argument[] | Argument
  ref?: string
}

type OptionUnion = OptionBaseConfig | OptionRootConfig | StandaloneOption;

type OptionConfig = OptionUnion;

type Argument = {
  type: "string" | "number";
  name: string;
  action: Maybe<Function>;
  required: boolean;
};

type RegisterOptionProps = OptionConfig & {
  node: OptionNode;
};

export class OptionNode {
  type: "option" | "standalone" = "option";
  value: string;
  ref: Maybe<string>;
  next: Maybe<OptionNode>;
  isRoot: boolean;
  arguments?: Argument[] | Argument;
  runtimeValue: string | null = null
  action?: Function

  constructor(
    value: string,
    isRoot: boolean,
    ref: Maybe<string>,
    type: "option" | "standalone",
    optionArguments?: Argument[] | Argument,
    action?: Function
  ) {
    this.value = value;
    this.isRoot = isRoot;
    this.arguments = optionArguments;
    this.ref = ref;
    this.action = action
    this.type = type
  }

  setRuntimeValue(value: string) {
    this.runtimeValue = value
  }
}

export class Command {
  root: Map<string, OptionNode> = new Map();
  private currentRoot?: OptionNode;

  option(config: OptionConfig) {
    const node = new OptionNode(
      config.value,
      config.isRoot,
      config.ref,
      config.type,
      config.arguments,
      config.action
    );

    if (node.isRoot && !this.root.size) {
      this.root.set(this.commandToCode(node.value), node);
      return this;
    }

    if (node.isRoot && this.root.size) {
      this.root.set(this.commandToCode(node.value), node)
      return this
    }

    if (!node.isRoot && node.ref) {
      const code = this.commandToCode(node.ref);
      const rootNode = this.root.get(code);

      if (!rootNode) throw new CommandError(`Invalid reference ${node.ref}`, {
        cause: "REFERENCE_ERROR"
      });

      this.registerOption({ ...config, node: rootNode });
    }

    return this;
  }

  private registerOption(props: RegisterOptionProps) {
    const node = new OptionNode(
      props.value,
      props.isRoot,
      props.ref,
      props.type,
      props.arguments,
      props.action
    );

    if (!props.node.next) {
      props.node.next = node;
      return;
    }

    this.registerOption({ ...props, node: props.node.next });
  }

  validate(...commands: string[]) {
    if (!commands.length) {
      throw new Error("Please provide an command", {
        cause: "VALIDATION_ERROR"
      })
    };

    if (!this.root.size)
      throw new Error("No options registered", {
        cause: "VALIDATION_ERROR",
      });

    const rootCommand = this.commandToCode(commands[0]);

    const rootNode = this.root.get(rootCommand);
    this.currentRoot = rootNode;

    for (let index = 0; index < commands.length; index++) {
      const command = commands[index];

      if (!rootNode)
        throw new CommandError(`invalid root command ${commands[0]}`, {
          cause: "VALIDATION_ERROR",
        });

      const node = this.inspect(command);
      const nextCommand = commands.at(index + 1);

      if (node) {
        const nextCommandValue = Number(nextCommand);

        if (Array.isArray(node.arguments)) {
          node.arguments.forEach((argument) => {
            if (argument.required && !nextCommand)
              throw new CommandError(`Missing argument ${argument.name}`, {
                cause: "VALIDATION_ERROR",
              });
            if (argument.type === "number" && Number.isNaN(nextCommandValue))
              throw new CommandError(
                `Invalid argument type, expected: ${argument.type}, received: ${nextCommand}`,
                {
                  cause: "VALIDATION_ERROR",
                },
              );
          });
        } else {

          if (node.arguments && node.arguments.required && !nextCommand)
            throw new CommandError(`Missing argument ${node.arguments.name}`, {
              cause: "VALIDATION_ERROR",
            });
          if (node.arguments && node.arguments.type === "number" && Number.isNaN(nextCommandValue))
            throw new CommandError(
              `Invalid argument type, expected: ${node.arguments.type}, received: ${nextCommand}`,
              {
                cause: "VALIDATION_ERROR",
              },
            );
        }

        node.setRuntimeValue(nextCommand || "")
      }
    }

    return this;
  }

  exec() {

    if (!this.currentRoot) throw new CommandError("No currentRoot found", {
      cause: "EXECUTION_ERROR"
    });

    this.recursiveExecution(this.currentRoot);
  }

  private async recursiveExecution(node: OptionNode) {
    if (node.type === "standalone" && node.action && isAsyncFunction(node.action)) {
      await node.action()
    }

    if (node.type === "standalone" && node.action && !isAsyncFunction(node.action)) {
      node.action()
    }

    if (Array.isArray(node.arguments)) {
      node.arguments.forEach(async (argument) => {
        if (isAsyncFunction(argument.action) && argument.action) {
          await argument.action(node.runtimeValue);
        } else {
          if (argument.action) {
            argument.action(node.runtimeValue);
          }
        }
      });
    } else {
      if (isAsyncFunction(node.arguments) && node.arguments && node.arguments.action) {
        await node.arguments.action(node.runtimeValue);
      } else {
        if (node.arguments && node.arguments.action) {
          node.arguments.action(node.runtimeValue);
        }
      }
    }

    if (!node.next) {
      return;
    }

    this.recursiveExecution(node.next);
  }

  inspect(command: string) {
    const code = this.commandToCode(command);
    const rootNode = this.root.get(code);

    if (rootNode) {
      return rootNode;
    }

    if (!this.currentRoot) return

    return this.findNode(this.currentRoot, command)
  }

  private findNode(
    node: OptionNode,
    command: string,
  ): OptionNode | undefined {

    if (node.value === command) {
      return node;
    }

    if (!node.next) {
      return undefined;
    }

    return this.findNode(node.next, command);
  }

  private commandToCode(command: string) {
    let hash = 0;

    for (let i = 0; i < command.length; i++) {
      const charCode = command.charCodeAt(i);
      hash = (hash << 5) - hash + charCode;
    }

    return hash.toString();
  }
}
