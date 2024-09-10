import { isAsyncFunction } from "util/types";

export type CommandType = "option" | "argument";

type Maybe<T> = T | undefined;

type OptionBaseConfig = {
  type: "option";
  value: string;
  isRoot: false;
  ref: string;
  arguments: Argument[] | Argument;
};

type OptionRootConfig = {
  type: "option";
  value: string;
  isRoot: true;
  arguments: Argument[] | Argument;
  ref?: string;
};

type OptionUnion = OptionBaseConfig | OptionRootConfig;

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
  type: "option" = "option";
  value: string;
  ref: Maybe<string>;
  next: Maybe<OptionNode>;
  isRoot: boolean;
  arguments: Argument[] | Argument;

  constructor(
    value: string,
    isRoot: boolean,
    optionArguments: Argument[] | Argument,
    ref: Maybe<string>,
  ) {
    this.value = value;
    this.isRoot = isRoot;
    this.arguments = optionArguments;
    this.ref = ref;
  }
}

export class Command {
  root: Map<string, OptionNode> = new Map();
  private currentRoot?: OptionNode;
  private commands: string[] = [];

  option(config: OptionConfig) {
    const node = new OptionNode(
      config.value,
      config.isRoot,
      config.arguments,
      config.ref,
    );

    if (node.isRoot && !this.root.size) {
      this.root.set(this.commandToCode(node.value), node);
      return this;
    }

    if (!node.isRoot && node.ref) {
      const code = this.commandToCode(node.ref);
      const rootNode = this.root.get(code);
      if (!rootNode) throw new Error("Invalid reference");
      this.registerOption({ ...config, node: rootNode });
    }

    return this;
  }

  private registerOption(props: RegisterOptionProps) {
    const node = new OptionNode(
      props.value,
      props.isRoot,
      props.arguments,
      props.ref,
    );

    if (!props.node.next) {
      props.node.next = node;
      return;
    }

    this.registerOption({ ...props, node: props.node.next });
  }

  validate(...commands: string[]) {
    if (!commands.length) return;

    if (!this.root.size)
      throw new Error("No options registered", {
        cause: "VALIDATION_ERROR",
      });

    const rootCommand = this.commandToCode(commands[0]);

    const rootNode = this.root.get(rootCommand);
    this.currentRoot = rootNode;
    this.commands = commands;

    for (let index = 0; index < commands.length; index++) {
      const command = commands[index];

      if (!rootNode) throw new Error(`invalid root command ${rootCommand}`);

      const node = this.inspect(command);
      const nextCommand = commands.at(index + 1);

      if (node) {
        const nextCommandValue = Number(nextCommand);

        if (Array.isArray(node.arguments)) {
          node.arguments.forEach((argument) => {
            if (argument.required && !nextCommand)
              throw new Error(`Missing argument ${argument.name}`);
            if (argument.type === "number" && Number.isNaN(nextCommandValue))
              throw new Error(
                `Invalid argument type, expected: ${argument.type}, received: ${nextCommand}`,
              );
          });
        } else {
          if (node.arguments.required && !nextCommand)
            throw new Error(`Missing argument ${node.arguments.name}`);
          if (node.arguments.type === "number" && Number.isNaN(nextCommandValue))
            throw new Error(
              `Invalid argument type, expected: ${node.arguments.type}, received: ${nextCommand}`,
            );
        }
      }
    }

    return this;
  }

  exec() {
    if (!this.currentRoot) throw new Error("No currentRoot found");
    this.recursiveExecution(this.currentRoot);
  }

  private async recursiveExecution(node: OptionNode) {
    if (!node.next) {
      return;
    }

    if (Array.isArray(node.arguments)) {
      node.arguments.forEach(async (argument) => {
        if (isAsyncFunction(argument.action) && argument.action) {
          await argument.action();
        } else {
          if (argument.action) {
            argument.action();
          }
        }
      });
    } else {
      if (isAsyncFunction(node.arguments) && node.arguments.action) {
        await node.arguments.action();
      } else {
        if (node.arguments.action) {
          node.arguments.action();
        }
      }
    }

    this.recursiveExecution(node.next);
  }

  inspect(command: string) {
    const code = this.commandToCode(command);
    const rootNode = this.root.get(code);
    let findNode: OptionNode | undefined;

    if (rootNode) {
      return rootNode;
    }

    this.root.forEach((node) => {
      findNode = this.findNode(node, command);
    });

    return findNode;
  }

  private findNode(
    node: OptionNode,
    command: string,
    findNode?: OptionNode,
  ): OptionNode | undefined {
    if (node.value === command) {
      findNode = node;
      return findNode;
    }

    if (!node.next) {
      findNode = undefined;
      return findNode;
    }

    findNode = this.findNode(node.next, command, findNode);

    return findNode;
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
