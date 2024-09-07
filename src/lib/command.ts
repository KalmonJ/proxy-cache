// import { isAsyncFunction } from "util/types";
// import { CommandFactory } from "./command-factory";

export type CommandType = "option" | "argument";

type Maybe<T> = T | undefined;


type OptionBaseConfig = {
  type: "option";
  value: string;
  isRoot: false;
  ref: string;
  arguments: Argument[] | Argument
}

type OptionRootConfig = {
  type: "option"
  value: string
  isRoot: true
  arguments: Argument[] | Argument
  ref?: string
}

type OptionUnion = OptionBaseConfig | OptionRootConfig

type OptionConfig = OptionUnion


type Argument = {
  type: "string" | "number"
  name: string
  action: Maybe<Function>
}

type RegisterOptionProps = OptionConfig & {
  node: OptionNode
}

export class OptionNode {
  type: "option" = "option"
  value: string;
  ref: Maybe<string>;
  next: Maybe<OptionNode>;
  isRoot: boolean;
  arguments: Argument[] | Argument;

  constructor(value: string, isRoot: boolean, optionArguments: Argument[] | Argument, ref: Maybe<string>) {
    this.value = value;
    this.isRoot = isRoot
    this.arguments = optionArguments
    this.ref = ref
  }
}

export class Command {
  root: Map<string, OptionNode> = new Map();
  // private currentRoot?: OptionNode;
  // private commands: string[] = []

  option(config: OptionConfig) {
    const node = new OptionNode(config.value, config.isRoot, config.arguments, config.ref)

    if (node.isRoot && !this.root.size) {
      this.root.set(this.commandToCode(node.value), node)
      return this
    }

    if (!node.isRoot && node.ref) {
      const code = this.commandToCode(node.ref)
      const rootNode = this.root.get(code)
      if (!rootNode) throw new Error("Invalid reference")
      this.registerOption({ ...config, node: rootNode })
    }

    return this;
  }

  private registerOption(props: RegisterOptionProps) {
    const node = new OptionNode(props.value, props.isRoot, props.arguments, props.ref)

    if (!props.node.next) {
      props.node.next = node
      return
    }

    this.registerOption({ ...props, node: props.node.next })
  }

  // validate(...commands: string[]) {
  //   if (!this.root.size)
  //     throw new Error("no commands registered", {
  //       cause: "VALIDATION_ERROR",
  //     });

  //   const rootCommand = this.commandToCode(commands[0]);

  //   const rootNode = this.root.get(rootCommand);

  //   for (const command of commands) {
  //     if (!rootNode) throw new Error(`invalid root command ${rootCommand}`);
  //     const isValidCommand = this.recursiveValidation(rootNode, command, false);
  //     if (!isValidCommand) throw new Error(`invalid command ${command}`);
  //   }

  //   this.commands = commands
  //   this.currentRoot = rootNode;

  //   return this;
  // }

  // exec() {
  //   if (!this.currentRoot) throw new Error("No currentRoot found");
  //   this.recursiveExecution(this.currentRoot);
  // }

  // private async recursiveExecution(node: CommandNode) {

  //   if (node.action && isAsyncFunction(node.action)) {
  //     await node.action()
  //   } else {
  //     if (node.action) {
  //       node.action()
  //     }
  //   }

  //   if (this.commands.at(-1) === node.value) {
  //     return
  //   }

  //   node.childrens.forEach(childNode => {
  //     this.recursiveExecution(childNode)
  //   })
  // }

  // inspect(command: string) {
  //   let value: CommandNode | undefined;

  //   this.root.forEach((node) => {
  //     value = this.findNode(node, command);

  //   });
  //   return value;
  // }

  // private findNode(
  //   node: CommandNode,
  //   command: string,
  //   findNode: CommandNode | undefined = undefined,
  // ) {
  //   if (!node.childrens.size) {
  //     findNode = undefined;
  //     return findNode;
  //   }

  //   if (node.value === command) {
  //     findNode = node;
  //     return findNode;
  //   }

  //   node.childrens.forEach((childNode) => {
  //     findNode = this.findNode(childNode, command, findNode);
  //   });

  //   return findNode;
  // }

  // private recursiveValidation(
  //   node: CommandNode,
  //   command: string,
  //   equal: boolean,
  // ) {
  //   if (node.value === command) {
  //     equal = true;
  //     return equal;
  //   }

  //   node.childrens.forEach((childNode) => {
  //     equal = this.recursiveValidation(childNode, command, equal);
  //   });

  //   return equal;
  // }

  private commandToCode(command: string) {
    let hash = 0;

    for (let i = 0; i < command.length; i++) {
      const charCode = command.charCodeAt(i);
      hash = (hash << 5) - hash + charCode;
    }

    return hash.toString();
  }
}