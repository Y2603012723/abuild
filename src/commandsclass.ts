/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2023-04-11 20:11:58
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2023-04-12 18:40:36
 * @FilePath: /abuild/src/commandsclass.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%Aex
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { spawn } from 'child_process';
import * as scriptclass from './scriptclass';

const { workspace } = require('vscode');

//命令注册类
export class CommadsRegister {
  name: string;
  //代表了当前正在运行的扩展程序的上下文环境,它提供了一些 API，可以让扩展程序与 VS Code 进行交互，例如注册命令、注册事件监听器、创建 webview 等。
  //在 VS Code 中，每个扩展程序都有自己的 ExtensionContext。通过调用 vscode.extensions.getExtension(context.extensionId) 可以获取当前扩展程序的 Extension 对象，从而可以访问该扩展程序的信息，例如扩展程序的名称、版本号等。
  //vscode.ExtensionContext 通常作为参数传递给扩展程序中的主函数，以便在扩展程序运行期间可以使用它提供的 API。例如，可以使用 context.subscriptions 注册一些资源，当扩展程序被禁用或卸载时，这些资源会自动被释放。
  private context: vscode.ExtensionContext;

  //提供了一种在 VS Code 内创建输出窗口并将文本输出到该窗口的机制。它可用于在扩展程序中记录调试信息、错误日志、进度信息等。
  //使用 vscode.window.createOutputChannel 方法可以创建一个新的 OutputChannel 对象。可以通过调用 append 或 appendLine 方法将文本附加到输出窗口中。
  private outputChannel: vscode.OutputChannel;

  constructor(name: string, context: vscode.ExtensionContext,outputChannel: vscode.OutputChannel) {
    this.name = name;
    this.context = context;
    this.outputChannel = outputChannel;
  }

  sayHello() {
    console.log(`Hello, my name is ${this.name}.`);
  }
  
  public registerAllScriptsCommand() {
    let scriptPath: string = "";
    let args: string[] = [];
    let tmpArgstring = "";

    scriptPath = path.join(this.context.extensionPath, 'scripts', 'test.sh');
    this.registerCommandWithArgs('abuild.runtest', this.scriptCallback.bind(this), scriptPath, args);
    scriptPath = path.join(this.context.extensionPath, 'scripts', 'abuild.sh');
    tmpArgstring = "debug";
    args.splice(0, args.length);
    args.push(tmpArgstring);
    this.registerCommandWithArgs('abuild.runabuilddebug', this.scriptCallback.bind(this), scriptPath, args);
    tmpArgstring = "release";
    args = [];
    args.push(tmpArgstring);
    this.registerCommandWithArgs('abuild.runabuildrelease', this.scriptCallback.bind(this), scriptPath, args);
  }

  scriptCallback(scriptPath: string, args: string[]) {
    console.log(scriptPath, args);
    scriptclass.AbuildscriptAndMakefile.runScriptInWorkspace(scriptPath, args, this.outputChannel);
  }
  
  registerCommandWithArgs(commandId: string, callback: (...args: any[]) => void, ...args: any[]) {
    this.context.subscriptions.push(vscode.commands.registerCommand(commandId, () => {
      callback(...args);
    }));
  }
}


// function runScript() {
//   const workspaceFolder = workspace.workspaceFolders[0].uri.fsPath;
//   const command = 'bash';
//   const args = ['./myScript.sh'];
//   const options = { cwd: workspaceFolder };

//   const child = spawn(command, args, options);

//   child.stdout.on('data', (data) => {
//     console.log(`stdout: ${data}`);
//   });

//   child.stderr.on('data', (data) => {
//     console.error(`stderr: ${data}`);
//   });

//   child.on('close', (code) => {
//     console.log(`child process exited with code ${code}`);
//   });
// }



// function myCallback(arg1: string, arg2: string) {
//   console.log(arg1, arg2);
// }

// // registerCommandWithArgs('myExtension.myCommand', myCallback, 'Hello', 'world!');

// module.exports = {
//   activateAllCommand(context: vscode.ExtensionContext) {
//     context.subscriptions.push(
//       vscode.commands.registerCommand('extension.runScript', runScript)
//     );
//   }
// };