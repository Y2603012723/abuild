/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2023-04-11 21:52:50
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2023-04-12 19:17:25
 * @FilePath: /abuild/src/scriptclass.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { spawn } from 'child_process';

export class AbuildscriptAndMakefile {
    name: string;
    age: number;
  
    constructor(name: string, age: number) {
      this.name = name;
      this.age = age;
    }
  
    sayHello() {
      console.log(`Hello, my name is ${this.name}.`);
    }

    //在workspace目录中执行脚本，并将脚本输出到vscode的输出窗口
    static runScriptInWorkspace(script: string, args: string[], outputChannel: vscode.OutputChannel) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        // 切换输出到指定的 outputChannel
        outputChannel.show();
        // const childProcess = spawn(script, args, {
        //     cwd: workspaceFolder,
        //     shell: true
        // });
        const childProcess = spawn(script, args, {
            cwd: workspaceFolder,
            shell: "/bin/bash",
        });

        childProcess.stdout.on('data', (data) => {
            outputChannel.appendLine(data.toString());
        });

        childProcess.stderr.on('data', (data) => {
            outputChannel.appendLine(`Error: ${data.toString()}`);
        });

        childProcess.on('close', (code) => {
            if (code !== 0) {
                outputChannel.appendLine(`Script exited with code ${code}`);
            }
        });

        // childProcess.stdout.on('data', (data) => {
        // 	console.log(`stdout: ${data}`);
        // });

        // childProcess.stderr.on('data', (data) => {
        // 	console.error(`stderr: ${data}`);
        // });

        // childProcess.on('close', (code) => {
        // 	console.log(`child process exited with code ${code}`);
        // });
    }
  }