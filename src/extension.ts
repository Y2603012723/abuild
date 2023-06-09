/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2023-04-07 23:52:16
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2023-06-05 18:01:48
 * @FilePath: /abuild/src/extension.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below



import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { spawn } from 'child_process';
import * as scriptclass from './scriptclass';
import * as commandsclass from './commandsclass';
import { chmod, constants } from 'fs';
import { workspace, Uri, WorkspaceFolder } from 'vscode';
import { writeFile } from 'fs';
import * as os from 'os';
import { ChildProcess } from 'child_process';
import { execSync } from 'child_process';
// import nls = require('vscode-nls');
// import pathnls = require('path');
import * as nls from 'vscode-nls';
import localize from "./localize";
import { removeSync } from "fs-extra";
import { copyFile } from 'fs';

function filecheck(context: vscode.ExtensionContext, subpath: string, file: string) {
	let filePathabuild = path.join(context.extensionPath, subpath, file);
	if (fs.existsSync(filePathabuild)) {
		console.log(`插件文件夹 ${filePathabuild}。`);
		//使得脚本具有可执行权限
		//修改文件权限为可执行
		fs.access(filePathabuild, fs.constants.X_OK, (err) => {
			if (err) {
				// 文件没有可执行权限
				// vscode.window.showErrorMessage('文件没有可执行权限');
				console.log("文件没有可执行权限");
				// chmod(filePathabuild, constants.S_IXUSR, (err) => {
				chmod(filePathabuild, "777", (err) => {
					if (err) {
						console.error(err);
						return;
					}
					console.log(`文件 ${filePathabuild} 的权限已更改为可执行。`);
				});
			} else {
				// 文件有可执行权限
				// vscode.window.showInformationMessage('文件有可执行权限');
				console.log("文件有可执行权限");
			}
		});

	}
}

export function deleteFile(filePath: string) {
	// 使用 fs.unlink 方法删除指定路径的文件
	fs.unlink(filePath, (err) => {
		if (err) {
			// vscode.window.showErrorMessage(`Failed to delete file ${filePath}: ${err.message}`);
		} else {
			// vscode.window.showInformationMessage(`File ${filePath} has been deleted.`);
		}
	});
}

function folderExists(path: string): boolean {
	try {
		fs.accessSync(path, fs.constants.F_OK);
		return true;
	} catch (err) {
		return false;
	}
}

//在工作区目录创建.abuild
function createAbuildConfigsFolder(workfolder: vscode.WorkspaceFolder) {
	// 获取当前打开的文件夹
	return new Promise<void>((resolve, reject) => {
		let folderPath = path.join(workfolder.uri.fsPath, '/.abuild');
		vscode.workspace.fs.createDirectory(vscode.Uri.parse(folderPath)).then(
			() => resolve(),
			(err) => reject(err)
		);
	});

}

interface AbuildMacro {
	[key: string]: string;
}

interface ProjectVersion {
	major: string;
	minor: string;
	patch: string;
}

//vscode交互产生的设置
interface ButtonInterfaceSet {
	compilerVersion: CompilerVersion;
	buildVariant: string;
	outputType: string;
}

function createInterfaceJson(workfolder: vscode.WorkspaceFolder) {
	let filepath: string = ".local/share/abuild/compilersitem.json";
	const datajsonbin = fs.readFileSync(filepath, "utf-8");
	const datajson = JSON.parse(datajsonbin);

	const config: ButtonInterfaceSet = {
		"compilerVersion": datajson[0],
		"buildVariant": "Debug",
		"outputType": "Executable file",
	};

	//更新全局变量
	allSetInPlug.buttonInterfaceSet = config;
	const jsonConfig = JSON.stringify(config, null, 2); // 将对象转换为格式化的 JSON 字符串
	let setfilePath = workfolder.uri.fsPath + "/.abuild/interface.json";
	console.log(`setFilePath: ${setfilePath}`);

	return new Promise<void>((resolve, reject) => {
		fs.writeFile(setfilePath, jsonConfig, { flag: 'w' }, (err) => {
			if (err) {
				console.error("interface.json create err " + err);
				reject(err);
			} else {
				console.log('interface.json配置文件已创建。');
				resolve();
			}
		});
	});
}

interface EnvironmentVariable {
	[key: string]: string;
}

interface AbuildConfig {
	projectName: string;
	projectVersion: ProjectVersion;
	globalMacro: AbuildMacro[];
	libPath: string[];
	libName: string[];
	debugFlags: string;
	releaseFlags: string;
	packPath: string[];
	// isRemoteDebug: boolean;

	sharePath: string;
	// compiler: string;
	executionArgs: string[];
	stopAtEntry: boolean;
	environmentVariable: EnvironmentVariable[];
	debuggerServerAddress: string;
}

interface AllSetInPlug {
	abuildconfig: AbuildConfig,
	buttonInterfaceSet: ButtonInterfaceSet,
}

var allSetInPlug: AllSetInPlug = {
	abuildconfig: {
		projectName: "",
		projectVersion: {
			"major": "",
			"minor": "",
			"patch": "",
		},
		globalMacro: [],
		libPath: ["", ""],
		libName: ["", ""],
		packPath: ["", ""],
		debugFlags: "",
		releaseFlags: "",
		sharePath: "",
		executionArgs: ["", ""],
		stopAtEntry: false,
		environmentVariable: [],
		debuggerServerAddress: "localhost:12345",
	},
	buttonInterfaceSet: {
		compilerVersion: {
			name: "",
			compilers: {
				c: "",
				cplus: "",
				gdb: ""
			}
		},
		buildVariant: "",
		outputType: "",
	},
};

function createAbuild(workfolder: vscode.WorkspaceFolder) {
	// 写入配置文件
	const config: AbuildConfig = {
		"projectName": "template_Bin",
		"projectVersion": {
			"major": "0",
			"minor": "0",
			"patch": "1",
		},
		"globalMacro": [
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ "MACRO_NAME": "1" },
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ "ENABLE_XX": "1" },
		],
		"libPath": [
			"/home/libraryPath1",
			"/home/libraryPath2",
		],
		"libName": [
			"mylibname1",
			"mylibname2",
		],
		"debugFlags": "",
		"releaseFlags": "",
		"packPath": [
			"configs",
		],
		"sharePath": "",
		"executionArgs": ["args1", "args2"],
		"stopAtEntry": true,
		"environmentVariable": [{ "name": "config", "value": "Debug" }],
		"debuggerServerAddress": "192.168.7.6:1234",
	};

	//更新全局变量
	allSetInPlug.abuildconfig = config;

	const jsonConfig = JSON.stringify(config, null, 2); // 将对象转换为格式化的 JSON 字符串
	let setfilePath = workfolder.uri.fsPath + "/.abuild/abuild.json";
	console.log(`setFilePath: ${setfilePath}`);

	return new Promise<void>((resolve, reject) => {
		fs.writeFile(setfilePath, jsonConfig, { flag: 'w' }, (err) => {
			if (err) {
				console.error("abuild.json create err " + err);
				reject(err);
			} else {
				console.log('abuild.json配置文件已创建。');
				resolve();
			}
		});
	});
}


interface CompilerVersion {
	name: string;
	compilers: {
		c: string;
		cplus: string;
		gdb: string;
	};
}

function createCompilersSet(workfolder: vscode.WorkspaceFolder) {
	const data: CompilerVersion[] = [
		{
			name: "GCC STD",
			compilers: {
				c: "gcc",
				cplus: "g++",
				gdb: "gdb"
			}
		}
	];
	const jsonConfig = JSON.stringify(data, null, 2); // 将对象转换为格式化的 JSON 字符串
	let setfilePath = workfolder.uri.fsPath + "/.abuild/compilersitem.json";
	console.log(`setFilePath: ${setfilePath}`);

	return new Promise<void>((resolve, reject) => {
		fs.writeFile(setfilePath, jsonConfig, { flag: 'w' }, (err) => {
			if (err) {
				console.error("compileritem.json create err " + err);
				reject(err);
			} else {
				console.log('compileritem.json配置文件已创建。');
				resolve();
			}
		});
	});
}

export async function activate(context: vscode.ExtensionContext) {

	function createGitIgnore() {
		const content = `.cache
.clangd
compile_commands.json`;

		//得到工作目录
		let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			return;
		}
		const gitignoreFile = path.join(workdir,".gitignore");
		if(!fs.existsSync(gitignoreFile)){
			fs.writeFile(gitignoreFile, content, (err) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log('.gitignore file created successfully!');
			});
		}
	}

	function createAbuildAndTemplateMain(workfolder: vscode.WorkspaceFolder): Promise<string[]> {
		const promises: Promise<string>[] = [];
		// 写入配置文件
		const config: AbuildConfig = {
			"projectName": "template_Bin",
			"projectVersion": {
				"major": "0",
				"minor": "0",
				"patch": "1",
			},
			"globalMacro": [
				// eslint-disable-next-line @typescript-eslint/naming-convention
				{ "MACRO_NAME": "1" },
				// eslint-disable-next-line @typescript-eslint/naming-convention
				{ "ENABLE_XX": "1" },
			],
			"libPath": [
				"/home/libraryPath1",
				"/home/libraryPath2",
			],
			"libName": [
				"mylibname1",
				"mylibname2",
			],
			"debugFlags": "",
			"releaseFlags": "",
			"packPath": [
				"configs",
			],
			"sharePath": "",
			"executionArgs": ["args1", "args2"],
			"stopAtEntry": true,
			"environmentVariable": [{ "name": "config", "value": "Debug" }],
			"debuggerServerAddress": "192.168.7.6:1234",
		};
	
		//更新全局变量
		allSetInPlug.abuildconfig = config;
	
		const jsonConfig = JSON.stringify(config, null, 2); // 将对象转换为格式化的 JSON 字符串
		let setfilePath = workfolder.uri.fsPath + "/.abuild/abuild.json";
		console.log(`setFilePath: ${setfilePath}`);
	
	
		promises.push(new Promise<string>((resolve, reject) => {
			fs.writeFile(setfilePath, jsonConfig, { flag: 'w' }, (err) => {
				if (err) {
					console.error("abuild.json create err " + err);
					reject(err);
				} else {
					console.log('abuild.json配置文件已创建。');
					resolve("");
				}
			});
		}));

		//得到main.cpp模板的路径
		const sourceFilePath = path.join(context.extensionPath, "abuildset", "main.cpp");
		//得到工作目录
		let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			
		}else{
			const destinationFilePath = path.join(workdir, "main.cpp");
			const destinationFilePathm = path.join(workdir, "main.c");
			if(fs.existsSync(destinationFilePath) || fs.existsSync(destinationFilePathm)){

			}else{
				promises.push(copyFilePromise(sourceFilePath, destinationFilePath));
			}			
		}
		
		return Promise.all(promises);
		
	}

	let filePathcompilersitemDir = ".local/share/abuild";
	let filePathcompilersitem = ".local/share/abuild/compilersitem.json";
	if (fs.existsSync(filePathcompilersitem)) {

	} else {
		if (!fs.existsSync(filePathcompilersitemDir)) {
			fs.mkdirSync(filePathcompilersitemDir, { recursive: true });

		}
		//得到compilersitem.json模板的路径
		let compilersfilePath = path.join(context.extensionPath, "abuildset", "compilersitem.json");
		fs.copyFileSync(compilersfilePath, filePathcompilersitem);

	}

	//red,"lightred","darkred","#E16A50"
	let iconcolor: string = "#93D586";

	//编译器选择	tools
	let barItemCompiler = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemCompiler.tooltip = 'Click to select compiler';
	barItemCompiler.command = 'abuild.compilerSelect';
	barItemCompiler.text = "$(tools)" + "compilerTool";
	barItemCompiler.color = iconcolor;
	context.subscriptions.push(barItemCompiler);

	//编译类型图标
	let barItemBuildVariant = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	// barItemBuildVariant.text = '<your_status_bar_text>';
	barItemBuildVariant.tooltip = 'Click to select build variant';
	barItemBuildVariant.command = 'abuild.buildtype';
	// barItemBuildVariant..icon = debugIcon;
	// 设置 StatusBar 对象的图标
	// barItemBuildVariant.text = "$(debug-alt)"+" release";
	barItemBuildVariant.text = "$(gear)" + " DEBUG";
	barItemBuildVariant.color = iconcolor;
	console.log('Congratulations, your extension "abuild" is now active!');
	context.subscriptions.push(barItemBuildVariant);

	//输出类型图标lightbulb
	let barItemOutType = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemOutType.tooltip = 'Click to select output type';
	barItemOutType.command = 'abuild.outputType';
	barItemOutType.text = "$(lightbulb)" + "Executable file";
	barItemOutType.color = iconcolor;
	context.subscriptions.push(barItemOutType);

	//编译issue-reopened，停止编译chrome-close
	let barItemBuild = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemBuild.tooltip = 'Click to Build';
	barItemBuild.command = 'abuild.build';
	barItemBuild.text = "$(issue-reopened)" + "Build";
	barItemBuild.color = iconcolor;
	context.subscriptions.push(barItemBuild);

	//运行debug-start
	let barItemRun = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemRun.tooltip = 'Click to Run';
	barItemRun.command = 'abuild.runBin';
	barItemRun.text = "$(debug-start)" + "Run";
	barItemRun.color = iconcolor;
	context.subscriptions.push(barItemRun);

	//azure-devops远程debug
	let barItemRemoteDebug = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemRemoteDebug.tooltip = 'Click to Remote Debug';
	barItemRemoteDebug.command = 'abuild.debugR';
	barItemRemoteDebug.text = "$(azure-devops)" + "RDebug";
	barItemRemoteDebug.color = iconcolor;
	context.subscriptions.push(barItemRemoteDebug);

	//debug-alt调试debug
	let barItemDebug = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemDebug.tooltip = 'Click to Local Debug';
	barItemDebug.command = 'abuild.debug';
	barItemDebug.text = "$(debug-alt)" + "LDebug";
	barItemDebug.color = iconcolor;
	context.subscriptions.push(barItemDebug);

	//清空按钮trashcan
	let barItemClean = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItemClean.tooltip = 'Click to Clean';
	barItemClean.command = 'abuild.clean';
	barItemClean.text = "$(trashcan)" + "clean";
	barItemClean.color = iconcolor;
	context.subscriptions.push(barItemClean);

	vscode.workspace.onDidCreateFiles(event => {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			// return;
		} else {
			let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/abuild.json');
			if (fs.existsSync(filePath)) {
				generateClangdConfig();
			}
		}
		console.log('onDidCreateFiles');
	});

	// 监听workspace文件夹的变化
	vscode.workspace.onDidChangeNotebookDocument(event => {
		console.log('NotebookDocument changed');
	});
	vscode.workspace.onDidOpenNotebookDocument(event => {
		console.log('OpenNotebookDocument changed');
	});
	vscode.workspace.onDidChangeConfiguration(event => {
		console.log('ChangeConfiguration changed');
	});
	vscode.workspace.onDidOpenTextDocument(event => {
		console.log('OpenTextDocument changed');
	});
	vscode.workspace.onDidChangeWorkspaceFolders(event => {
		console.log('Workspace folders changed');
		console.log('New workspace folders:', event.added);
		console.log('Removed workspace folders:', event.removed);
	});

	// 监听workspace内文件的变化
	vscode.workspace.onDidChangeTextDocument(event => {
		console.log('File changed:', event.document.fileName);
	});


	function renewPreabuildOuttype(buttonInterfaceSet: ButtonInterfaceSet) {
		let filePathPreAbuild = path.join(context.extensionPath, "scripts", "preAbuild.sh");
		const searchPattern = /^OUTPUTTYPE=.*/; // 以CC=开头的正则表达式
		let replacement = 'OUTPUTTYPE=';
		if (buttonInterfaceSet.outputType === "Executable file") {
			replacement = 'OUTPUTTYPE=' + "ExecutableFile"; // 替换
		} else if (buttonInterfaceSet.outputType === "Static library") {
			replacement = 'OUTPUTTYPE=' + "StaticLibrary"; // 替换
		} else if (buttonInterfaceSet.outputType === "Dynamic library") {
			replacement = 'OUTPUTTYPE=' + "DynamicLibrary"; // 替换
		} else {
			replacement = 'OUTPUTTYPE=' + "ExecutableFile"; // 替换
		}
		fs.readFile(filePathPreAbuild, 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return;
			}

			const lines = data.split('\n');
			const newLines = lines.map((line) => {
				if (searchPattern.test(line)) {
					return line.replace(searchPattern, replacement);
				}
				return line;
			});

			const newData = newLines.join('\n');

			fs.writeFile(filePathPreAbuild, newData, (err) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log('File updated.');
			});
		});
	}

	function renewPreabuild(abuildConfigJson: AbuildConfig, buttonInterfaceSet: ButtonInterfaceSet) {
		let filePathPreAbuild = path.join(context.extensionPath, "scripts", "preAbuild.sh");

		const searchPattern = /^CC=.*/; // 以CC=开头的正则表达式
		const replacement = 'CC=' + buttonInterfaceSet.compilerVersion.compilers.c; // 替换

		const searchPatternCPlus = /^CXX=.*/; // 以CXX=开头的正则表达式
		const replacementCPlus = 'CXX=' + buttonInterfaceSet.compilerVersion.compilers.cplus; // 替换

		const oldprojectName = /^projectName=.*/;
		const newprojectName = 'projectName=' + abuildConfigJson.projectName;

		const oldMajor = /^MY_PROJECT_VERSION_MAJOR=.*/;
		const newMajor = 'MY_PROJECT_VERSION_MAJOR=' + abuildConfigJson.projectVersion.major;

		const oldMinor = /^MY_PROJECT_VERSION_MINOR=.*/;
		const newMinor = 'MY_PROJECT_VERSION_MINOR=' + abuildConfigJson.projectVersion.minor;

		const oldPatch = /^MY_PROJECT_VERSION_PATCH=.*/;
		const newPatch = 'MY_PROJECT_VERSION_PATCH=' + abuildConfigJson.projectVersion.patch;

		const oldSharePath = /^sharePath=.*/;
		const newSharePath = 'sharePath=' + "\"" + abuildConfigJson.sharePath + "\"";

		const oldMacro = /^MACRO=.*/;
		const macroString = abuildConfigJson.globalMacro
			.map((macro) => `-D${Object.entries(macro)[0].join("=")}`)
			.join(" ");
		const newMacro = 'MACRO=' + "\"" + macroString + "\"";

		const oldLIB = /^LIB=.*/;

		// 将 libPath 数组转换为字符串
		const libPathString = abuildConfigJson.libPath.map((path) => `-L${path}`).join(" ");
		console.log("libPathString : " + libPathString);

		const libString = abuildConfigJson.libName.map((path) => `-l${path}`).join(" ");
		console.log("libString : " + libString);
		const newLIB = 'LIB=' + "\"" + libPathString + " " + libString + "\"";
		console.log("newLIB : " + newLIB);


		fs.readFile(filePathPreAbuild, 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return;
			}

			const lines = data.split('\n');
			const newLines = lines.map((line) => {
				if (searchPattern.test(line)) {
					return line.replace(searchPattern, replacement);
				}
				if (searchPatternCPlus.test(line)) {
					return line.replace(searchPatternCPlus, replacementCPlus);
				}
				if (oldprojectName.test(line)) {
					return line.replace(oldprojectName, newprojectName);
				}
				if (oldMajor.test(line)) {
					return line.replace(oldMajor, newMajor);
				}
				if (oldMinor.test(line)) {
					return line.replace(oldMinor, newMinor);
				}
				if (oldPatch.test(line)) {
					return line.replace(oldPatch, newPatch);
				}
				if (oldSharePath.test(line)) {
					return line.replace(oldSharePath, newSharePath);
				}
				if (oldMacro.test(line)) {
					return line.replace(oldMacro, newMacro);
				}

				if (oldLIB.test(line)) {
					return line.replace(oldLIB, newLIB);
				}
				return line;
			});

			const newData = newLines.join('\n');

			fs.writeFile(filePathPreAbuild, newData, (err) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log('File updated.');
			});
		});
	}

	const disposablesvefile = vscode.workspace.onDidSaveTextDocument((document) => {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			// return;
		} else {
			let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/abuild.json');
			if (document.uri.fsPath === filePath) {
				console.log(`${filePath} has been saved!`);
				let abuildConfigJson = abuildconfig();
				if (abuildConfigJson !== undefined) {
					allSetInPlug.abuildconfig = abuildConfigJson;
					// renewPreabuild(abuildConfigJson, allSetInPlug.buttonInterfaceSet);
					generateVersionHeaderFile();
				}
			}
		}
	});
	context.subscriptions.push(disposablesvefile);

	vscode.workspace.onDidDeleteFiles(event => {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return;
		} else {
			let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/abuild.json');
			let abuildConfigsPath = path.join(workspaceFolder.uri.fsPath, '/.abuild');
			for (const file of event.files) {
				if (file.path === filePath || file.path === abuildConfigsPath) {
					barItemAllHide();
				}
			}
		}
	});

	//得到abuild.json内容
	function abuildconfig(): AbuildConfig | undefined {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return undefined;
		} else {
			let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/abuild.json');
			if (fs.existsSync(filePath)) {
				let data = fs.readFileSync(filePath, 'utf8');
				const configJson = JSON.parse(data.toString());
				const abuildConfigJson: AbuildConfig = {
					projectName: configJson.projectName,
					projectVersion: configJson.projectVersion,
					globalMacro: configJson.globalMacro,
					libPath: configJson.libPath,
					libName: configJson.libName,
					debugFlags: configJson.debugFlags,
					releaseFlags: configJson.releaseFlags,
					packPath: configJson.packPath,
					sharePath: configJson.sharePath,
					executionArgs: configJson.executionArgs,
					stopAtEntry: configJson.stopAtEntry,
					environmentVariable: configJson.environmentVariable,
					debuggerServerAddress: configJson.debuggerServerAddress
					// compiler: configJson.compiler,
				};
				return abuildConfigJson;
				// for (const key in json) {
				// 	console.log(`${key}: ${json[key]}`);
				// }
				// console.log(`projectName: ${json.projectName}`);
				// console.log(`macro.length: ${json.macro.length}`);
				// console.log(`macro.MACRO_NAME: ${json.macro[0][0]}`);
			} else {
				return undefined;
			}
		}
	}


	//工程交互选择设置项interface.json
	function projectInterfaceConfig(): ButtonInterfaceSet | undefined {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return undefined;
		} else {
			let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/interface.json');
			if (fs.existsSync(filePath)) {
				let data = fs.readFileSync(filePath, 'utf8');
				const configJson = JSON.parse(data.toString());
				const interfaceConfigJson: ButtonInterfaceSet = {
					compilerVersion: configJson.compilerVersion,
					buildVariant: configJson.buildVariant,
					outputType: configJson.outputType
				};
				return interfaceConfigJson;
			} else {
				return undefined;
			}
		}
	}

	function barItemAllShow() {
		let interfaceConfigJson = projectInterfaceConfig();
		if (interfaceConfigJson !== undefined) {
			barItemCompiler.text = "$(tools)" + "compiler-" + interfaceConfigJson.compilerVersion.name;
			barItemBuildVariant.text = "$(gear)" + " " + interfaceConfigJson.buildVariant;
			barItemOutType.text = "$(lightbulb)" + interfaceConfigJson.outputType;
		}
		barItemCompiler.show();
		barItemBuildVariant.show();
		barItemOutType.show();
		barItemBuild.show();
		barItemRun.show();
		barItemDebug.show();
		barItemRemoteDebug.show();
		barItemClean.show();
	}

	function barItemAllHide() {
		barItemCompiler.hide();
		barItemBuildVariant.hide();
		barItemOutType.hide();
		barItemBuild.hide();
		barItemRun.hide();
		barItemDebug.hide();
		barItemRemoteDebug.hide();
		barItemClean.hide();
	}
	// 检查是否存在指定文件
	// 获取当前打开的文件夹
	let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		// return;
	} else {
		let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/abuild.json');
		if (fs.existsSync(filePath)) {
			barItemAllShow();
			fs.readFile(filePath, (err, data) => {
				if (err) { throw err; }
				let rawdata = data;
				const configJson = JSON.parse(data.toString());
				const abuildConfigJson: AbuildConfig = {
					projectName: configJson.projectName,
					projectVersion: configJson.projectVersion,
					globalMacro: configJson.globalMacro,
					libPath: configJson.libPath,
					libName: configJson.libName,
					debugFlags: configJson.debugFlags,
					releaseFlags: configJson.releaseFlags,
					packPath: configJson.packPath,
					sharePath: configJson.sharePath,
					executionArgs: configJson.executionArgs,
					stopAtEntry: configJson.stopAtEntry,
					environmentVariable: configJson.environmentVariable,
					debuggerServerAddress: configJson.debuggerServerAddress
					// compiler: configJson.compiler,
				};
				console.log("projectName:", abuildConfigJson.projectName);
				console.log("projectVersion:", abuildConfigJson.projectVersion);
				console.log("macro:", abuildConfigJson.globalMacro.length);
				console.log("macro1:", Object.keys(abuildConfigJson.globalMacro[0]));
				console.log("macro1:", Object.values(abuildConfigJson.globalMacro[0]));

				//在加载插件且工程
				allSetInPlug.abuildconfig = abuildConfigJson;

				let interfaceSet = projectInterfaceConfig();
				if (interfaceSet) {
					allSetInPlug.buttonInterfaceSet = interfaceSet;
				}

			});
			// 将状态栏项添加到插件订阅列表中，以便在插件被停用时注销
			context.subscriptions.push(barItemBuildVariant);
		} else {

		}

		console.log(`文件夹： ${filePath}`);
	}


	function generateVersionHeaderFile() {
		//得到工作目录
		let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			return;
		}
		const hfilepath = path.join(workdir,"version.h");
		// if(fs.existsSync(hfilepath)){
		// 	return;
		// }
		const { major, minor, patch } = allSetInPlug.abuildconfig.projectVersion;
		const projectName = allSetInPlug.abuildconfig.projectName;
		const headerContent = `#define ${projectName.toUpperCase()}_VERSION_MAJOR ${major}\n#define ${projectName.toUpperCase()}_VERSION_MINOR ${minor}\n#define ${projectName.toUpperCase()}_VERSION_PATCH ${patch}\n`;
		fs.writeFileSync(workdir + "/" + "version.h", headerContent);
	}

	//得到系统头文件目录集合
	function getIncludePaths(): string[] {
		// 使用 C++ 编译器的预处理器功能获取包含文件搜索路径信息
		let cmd = `${allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.cplus} -xc++ /dev/null -E -Wp,-v 2>&1`;
		let output = execSync(cmd, { encoding: 'utf-8' });
		// 解析输出行，提取包含文件搜索路径信息
		let lines = output.trim().split('\n');
		const paths = [];
		let isIncludePath = false;
		for (const line of lines) {
			if (line.startsWith('#include')) {
				isIncludePath = true;
			} else if (isIncludePath) {
				if (line.startsWith('End of search') || line.startsWith("搜索列表结束")) {
					break;
				}
				paths.push(line.trim());
			}
		}

		cmd = `${allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.c} -xc++ /dev/null -E -Wp,-v 2>&1`;
		output = execSync(cmd, { encoding: 'utf-8' });
		// 解析输出行，提取包含文件搜索路径信息
		lines = output.trim().split('\n');
		isIncludePath = false;
		for (const line of lines) {
			if (line.startsWith('#include')) {
				isIncludePath = true;
			} else if (isIncludePath) {
				if (line.startsWith('End of search') || line.startsWith("搜索列表结束")) {
					break;
				}
				paths.push(line.trim());
			}
		}

		// 去重并返回包含文件搜索路径信息数组
		return Array.from(new Set(paths));
	}


	//生成json版本的.clangd
	function generateClangdConfigJson(): void {
		const workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			return;
		}
		// 获取系统头文件目录，并加上 -isystem 前缀
		const includePaths = getIncludePaths();
		const includeFlags = includePaths.map((path) => `-isystem, ${path}`);

		// 拼接 driver-mode 参数和系统头文件目录
		const driverMode = '--driver-mode=cpp';

		const directoriesP: string[] = getDirectoriesExclude(workdir);
		const directories = directoriesP.map((path) => `-I${path}`);

		let buildparam: string = "";
		if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
			if (allSetInPlug.abuildconfig.debugFlags === "") {
				buildparam = defaultdebugflags;
			} else {
				buildparam = allSetInPlug.abuildconfig.debugFlags;
			}
		} else {
			if (allSetInPlug.abuildconfig.releaseFlags === "") {
				buildparam = defaultreleaseflags;
			} else {
				buildparam = allSetInPlug.abuildconfig.releaseFlags;
			}
		}

		let macroarrayUserSet: string[] = parseMacroGetMacroArray(allSetInPlug.abuildconfig.globalMacro);

		exec(allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.cplus + " -E -dM - < /dev/null", (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}

			const macros = stdout
				.trim()
				.split(/[\r\n]+/);

			const targetArray = macros.map((item) => {
				const matchResult = item.match(/^#define\s+(\S+)\s*(.*)$/);
				const key = matchResult?.[1];
				const value = matchResult?.[2];
				if (value) {
					return `-D${key}=${value}`;
				} else {
					return `-D${key}`;
				}
			});
			console.log(targetArray);
			// const compileFlags = `Add: [${driverMode}, ${includeFlags.join(', ')}, ${directories.join(', ')}, ${targetArray.join(", ")}, ${macroarrayUserSet.join(', ')}, ${buildparam.split(" ").join(', ')}]`;
			// const compileFlags = `Add: [${driverMode}, ${includeFlags.join(', ')}, ${directories.join(', ')}, ${macroarrayUserSet.join(', ')}, ${buildparam.split(" ").join(', ')}]`;
			let clangdparamsp: string[] = [];
			let clangdparams = clangdparamsp.concat(driverMode).concat(includeFlags).concat(directories).concat(macroarrayUserSet).concat(buildparam);
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const compileFlags: string[] = clangdparams;
			// const compileFlags = "CompileFlags:\n\t" + "Add: [" + "\"",
			// eslint-disable-next-line @typescript-eslint/naming-convention
			// const jsonStr: string = JSON.stringify({ Add });

			const configObj = {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"CompileFlags": {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					".": clangdparams
				}
			};
			// 将配置文件写入 .clangd 文件
			const configFilePath = path.join(workdir, '.clangd');

			// fs.writeFileSync(configFilePath, `CompileFlags:\n\t${compileFlags}`);
			fs.writeFileSync(configFilePath, JSON.stringify(configObj, null, 2));
			// console.log("configFilePath", configFilePath);
			// console.log("compileFlags", compileFlags);
		});


	}

	//生成clangd配置
	function generateClangdConfigWithCompileMacros(): void {
		let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			return;
		}
		// 获取系统头文件目录，并加上 -isystem 前缀
		const includePaths = getIncludePaths();
		const includeFlags = includePaths.map((path) => `-isystem, ${path}`);

		// 拼接 driver-mode 参数和系统头文件目录
		const driverMode = '--driver-mode=cpp';

		const directoriesP: string[] = getDirectoriesExclude(workdir);
		const directories = directoriesP.map((path) => `-I${path}`);

		let buildparam: string = "";
		if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
			if (allSetInPlug.abuildconfig.debugFlags === "") {
				buildparam = defaultdebugflags;
			} else {
				buildparam = allSetInPlug.abuildconfig.debugFlags;
			}
		} else {
			if (allSetInPlug.abuildconfig.releaseFlags === "") {
				buildparam = defaultreleaseflags;
			} else {
				buildparam = allSetInPlug.abuildconfig.releaseFlags;
			}
		}

		let macroarrayUserSet: string[] = parseMacroGetMacroArray(allSetInPlug.abuildconfig.globalMacro);

		exec(allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.cplus + " -E -dM - < /dev/null", (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}

			const macros = stdout
				.trim()
				.split(/[\r\n]+/);

			// const targetArray = macros.map((item) => {
			// 	const [key, value] = item.split(/\s+/);
			// 	if (value) {
			// 		return `-D${key}=${value}`;
			// 	} else {
			// 		return `-D${key}`;
			// 	}
			// });
			const targetArray = macros.map((item) => {
				const matchResult = item.match(/^#define\s+(\S+)\s*(.*)$/);
				const key = matchResult?.[1];
				const value = matchResult?.[2];
				if (value) {
					return `-D${key}=${value}`;
				} else {
					return `-D${key}`;
				}
			});
			console.log(targetArray);
			const filteredArr = targetArray.filter(str => !str.includes("#"));
			// const compileFlags = `Add: [${driverMode}, ${includeFlags.join(', ')}, ${directories.join(', ')}, ${filteredArr.join(", ")}, ${macroarrayUserSet.join(', ')}, ${buildparam.split(" ").join(', ')}]`;
			const compileFlags = `Add: [${driverMode}, ${includeFlags.join(', ')}, ${directories.join(', ')}, ${macroarrayUserSet.join(', ')}, ${buildparam.split(" ").join(', ')}]`;

			// 将配置文件写入 .clangd 文件
			let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			if (workdir === undefined) {
				return;
			}
			const configFilePath = path.join(workdir, '.clangd');
			fs.writeFileSync(configFilePath, `CompileFlags:\n\t${compileFlags}`);
			console.log("configFilePath", configFilePath);
			console.log("compileFlags", compileFlags);
		});


	}
	//生成clangd配置
	function generateClangdConfig(): void {
		const workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			return;
		}
		// 获取系统头文件目录，并加上 -isystem 前缀
		const includePaths = getIncludePaths();
		const includeFlags = includePaths.map((path) => `-isystem, ${path}`);

		// 拼接 driver-mode 参数和系统头文件目录
		const driverMode = '--driver-mode=cpp';

		const directoriesP: string[] = getDirectoriesExclude(workdir);
		const directories = directoriesP.map((path) => `-I${path}`);

		let buildparam: string = "";
		if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
			if (allSetInPlug.abuildconfig.debugFlags === "") {
				buildparam = defaultdebugflags;
			} else {
				buildparam = allSetInPlug.abuildconfig.debugFlags;
			}
		} else {
			if (allSetInPlug.abuildconfig.releaseFlags === "") {
				buildparam = defaultreleaseflags;
			} else {
				buildparam = allSetInPlug.abuildconfig.releaseFlags;
			}
		}

		let macroarrayUserSet: string[] = parseMacroGetMacroArray(allSetInPlug.abuildconfig.globalMacro);


		const compileFlags = `Add: [${driverMode}, ${includeFlags.join(', ')}, ${directories.join(', ')}, ${macroarrayUserSet.join(', ')}, ${buildparam.split(" ").join(', ')}]`;

		// 将配置文件写入 .clangd 文件
		const configFilePath = path.join(workdir, '.clangd');
		fs.writeFileSync(configFilePath, `CompileFlags:\n\t${compileFlags}`);
		console.log("configFilePath", configFilePath);
		console.log("compileFlags", compileFlags);
	}

	const copyDirectory = (source: string, destination: string) => {
		const files = fs.readdirSync(source);
		const items = files.map((file) => {
			const fullPath = path.join(source, file);
			const stats = fs.statSync(fullPath);
			return {
				name: file,
				isFile: stats.isFile(),
				isDirectory: stats.isDirectory(),
			};
		});

		const createDirectoryStructure = (items: any[], basePath: string) => {
			items.forEach((item) => {
				const fullPath = path.join(basePath, item.name);
				if (item.isDirectory) {
					fs.mkdirSync(fullPath);
					createDirectoryStructure(fs.readdirSync(fullPath), fullPath);
				} else {
					//   fs.copyFileSync(fullPath, path.join(destination, item.name));
				}
			});
		};

		createDirectoryStructure(items, destination);
	};

	// // Usage example:
	// copyDirectory('/path/to/source/directory', '/path/to/destination/directory');

	const copyDirectorySync = async (source: string, destination: string) => {
		const files = fs.readdirSync(source);
		const items = files.map((file) => {
			const fullPath = path.join(source, file);
			const stats = fs.statSync(fullPath);
			return {
				name: file,
				isFile: stats.isFile(),
				isDirectory: stats.isDirectory(),
			};
		});

		const createDirectoryStructure = async (items: any[], basePath: string) => {
			for (const item of items) {
				const fullPath = path.join(basePath, item.name);
				if (item.isDirectory) {
					fs.mkdirSync(fullPath);
					await createDirectoryStructure(fs.readdirSync(fullPath), fullPath);
				} else {
					// fs.copyFileSync(fullPath, path.join(destination, item.name));
				}
			}
		};

		await createDirectoryStructure(items, destination);
	};
	// Usage example:
	// (async () => {
	// 	await copyDirectory('/path/to/source/directory', '/path/to/destination/directory');
	// 	console.log('Copy completed.');
	// })();

	function parseMacroGetMacroArray(abuildmacros: AbuildMacro[]): string[] {
		const macroArgs = [];

		for (const macro of abuildmacros) {
			for (const [key, value] of Object.entries(macro)) {
				if (value !== '') {
					macroArgs.push(`-D${key}=${value}`);
				} else {
					macroArgs.push(`-D${key}`);
				}
			}
		}

		return macroArgs;
	}

	function parseMacro(abuildmacros: AbuildMacro[]): string {
		const macroArgs = [];

		for (const macro of abuildmacros) {
			for (const [key, value] of Object.entries(macro)) {
				if (value !== '') {
					macroArgs.push(`-D${key}=${value}`);
				} else {
					macroArgs.push(`-D${key}`);
				}
			}
		}

		return macroArgs.join(' ');
	}


	//编译器默认参数
	const defaultdebugflags: string = "-g -O0 -fPIC -Wall -Wextra -pedantic";
	const defaultreleaseflags: string = "-O3 -fPIC -DNDEBUG";

	function makeRun() {
		//得到工作目录
		let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (workdir === undefined) {
			return;
		}
		//得到输出目录
		let outdir = getBuildOutputDir();
		if (outdir === "") {
			return;
		}
		// fs.mkdirSync(outdir);
		let makecommand: string = "";
		copyDirectoryStructure(workdir, outdir);
		//得到makefilepath
		//得到脚本目录，根据输出类型得到不同的makefile文件路径
		let makefilepath = "";
		if (allSetInPlug.buttonInterfaceSet.outputType === "Executable file") {
			makefilepath = path.join(context.extensionPath, "scripts", "Makefile");
		} else if (allSetInPlug.buttonInterfaceSet.outputType === "Static library") {
			makefilepath = path.join(context.extensionPath, "scripts", "MakefileStatic");
		} else if (allSetInPlug.buttonInterfaceSet.outputType === "Dynamic library") {
			makefilepath = path.join(context.extensionPath, "scripts", "MakefileDynamic");
		} else {
			makefilepath = path.join(context.extensionPath, "scripts", "Makefile");
		}
		console.log("makefilepath:", makefilepath);

		//得到输出outdir
		let outDir: string = "../" + getBuildOutputDirNotPre();
		if (outDir === "") {
			return;
		}
		console.log("outdir:", outDir);

		//编译类型
		let compileType: string = allSetInPlug.buttonInterfaceSet.buildVariant;

		//工程名
		let projectName: string = allSetInPlug.abuildconfig.projectName;

		let cxx: string = allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.cplus;

		let cbuild: string = allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.c;

		// const macroString = allSetInPlug.abuildconfig.globalMacro
		// 	.map((macro) => `-D${Object.entries(macro)[0].join("=")}`)
		// 	.join(" ");
		// let macros: string = "\"" + macroString + "\"";

		let stringmacro: string = parseMacro(allSetInPlug.abuildconfig.globalMacro);
		console.log("stringmacro", stringmacro);
		let macros: string = "\"" + stringmacro + "\"";

		const libPathString = allSetInPlug.abuildconfig.libPath.map((path) => `-L${path}`).join(" ");
		const libString = allSetInPlug.abuildconfig.libName.map((path) => `-l${path}`).join(" ");
		let libs: string = "\"" + libPathString + " " + libString + "\"";

		let premake: string = "";
		let buildVariantFlags = "";
		if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
			premake = "bear --append -- make -f ";
			if (allSetInPlug.abuildconfig.debugFlags === "") {
				buildVariantFlags = defaultdebugflags;
			} else {
				buildVariantFlags = allSetInPlug.abuildconfig.debugFlags;
			}
		} else {
			premake = "make -f ";
			if (allSetInPlug.abuildconfig.releaseFlags === "") {
				buildVariantFlags = defaultreleaseflags;
			} else {
				buildVariantFlags = allSetInPlug.abuildconfig.releaseFlags;
			}
		}
		let buildVariantFlagsPT: string = "\"" + buildVariantFlags + "\"";
		makecommand = premake + makefilepath + " outDir=" + outDir + " BUILDVARIANTFLAGS=" + buildVariantFlagsPT
			+ " projectName=" + projectName + " CXX=" + cxx + " CC=" + cbuild + " MACRO=" + macros + " LIB=" + libs;

		console.log("makecommand:", makecommand);
		childProcess = spawn(makecommand, {
			cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
			shell: "/bin/bash",
		});
		if (childProcess.stdout !== null) {
			childProcess.stdout.on('data', (data) => {
				outputChannel.appendLine(data.toString());
			});
		}
		if (childProcess.stderr !== null) {
			childProcess.stderr.on('data', (data) => {
				outputChannel.appendLine(`Error: ${data.toString()}`);
			});
		}
		childProcess.on('close', (code) => {
			if (code !== 0) {
				outputChannel.appendLine(`Script exited with code ${code}`);
			}
		});
		childProcess.on('exit', (code, signal) => {
			console.log(`Child process exited with code ${code} and signal ${signal}`);
			barItemBuild.text = "$(issue-reopened)" + "Build";
			// 获取当前扩展的配置信息
			const config = vscode.workspace.getConfiguration('abuild');

			// 读取 abuild.mySetting 设置的值
			const mySetting = config.get('RefreshSmartPromptsAfterCompile');

			// 根据 mySetting 的值执行相应的操作
			if (mySetting) {
				// 如果 mySetting = true，执行这里的代码
				vscode.commands.executeCommand('clangd.restart');
				// console.log('My Extension is enabled');
			} else {
				// 如果 mySetting = false，执行这里的代码
				// console.log('My Extension is disabled');
			}

		});

	}

	//得到所有目录，排除".vscode", ".abuild", ".cache"
	const getDirectoriesExclude = (directoryPath: string) => {
		const directories: string[] = [];
		const queue: string[] = [directoryPath];

		while (queue.length > 0) {
			const currentPath = queue.shift()!;
			const files = fs.readdirSync(currentPath);

			for (const file of files) {
				const fullPath = path.join(currentPath, file);
				const stats = fs.statSync(fullPath);

				if (stats.isDirectory() && ![".vscode", ".abuild", ".cache"].includes(file)) {
					directories.push(fullPath);
					queue.push(fullPath);
				}
			}
		}

		return directories;
	};

	//得到所有目录
	const getDirectories = (directoryPath: string) => {
		const directories: string[] = [];
		const queue: string[] = [directoryPath];

		while (queue.length > 0) {
			const currentPath = queue.shift()!;
			const files = fs.readdirSync(currentPath);

			for (const file of files) {
				const fullPath = path.join(currentPath, file);
				const stats = fs.statSync(fullPath);

				if (stats.isDirectory()) {
					directories.push(fullPath);
					queue.push(fullPath);
				}
			}
		}

		return directories;
	};

	const copyDirectoryStructure = (source: string, destination: string) => {
		const queue = getDirectoriesExclude(source);
		console.log("queue:", queue);
		if(queue.length === 0){
			fs.mkdirSync(destination, { recursive: true });
		}
		let dstQueueDir: string[] = [];
		for (const dir of queue) {
			dstQueueDir.push(dir.replace(source, destination));
		}
		for (const dir of dstQueueDir) {
			fs.mkdirSync(dir, { recursive: true });
		}
	};
	// copyDirectory('/path/to/source/directory', '/path/to/destination/directory');

	//测试命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.Test', () => {
			// generateVersionHeaderFile();
			// const inludePaths = getIncludePaths();
			// console.log("inludePaths:",inludePaths);
			// generateClangdConfig();
			makeRun();
			// copyDirectoryStructure("/home/yk/tmpwork/makefileVersion","/home/yk/tmpwork/makefileVersionddd");
		})
	);


	//编译类型选择命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.buildtype', () => {
			vscode.window.showQuickPick(['Debug', 'Release']).then((selection) => {
				if("$(gear)" + " " + selection === barItemBuildVariant.text){
					return;
				}
				let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
				if (workspaceFolder) {
					let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/interface.json');
					if (fs.existsSync(filePath)) {
						let data = fs.readFileSync(filePath, 'utf8');
						const configJson = JSON.parse(data.toString());
						const interfaceConfigJson: ButtonInterfaceSet = {
							compilerVersion: configJson.compilerVersion,
							buildVariant: configJson.buildVariant,
							outputType: configJson.outputType
						};
						if (selection !== undefined) {
							interfaceConfigJson.buildVariant = selection;
						}
						fs.writeFileSync(filePath, JSON.stringify(interfaceConfigJson, null, 2));
						barItemBuildVariant.text = "$(gear)" + " " + interfaceConfigJson.buildVariant;
						allSetInPlug.buttonInterfaceSet = interfaceConfigJson;
					}
					generateClangdConfig();
					// 获取当前扩展的配置信息
					const config = vscode.workspace.getConfiguration('abuild');

					// 读取 abuild.mySetting 设置的值
					const mySetting = config.get('RefreshSmartPromptsAfterBuildtypeSelect');

					// 根据 mySetting 的值执行相应的操作
					if (mySetting) {
						// 如果 mySetting = true，执行这里的代码
						vscode.commands.executeCommand('clangd.restart');
						// console.log('My Extension is enabled');
					} else {
						// 如果 mySetting = false，执行这里的代码
						// console.log('My Extension is disabled');
					}
				}

				if (selection === 'Debug') {
					// do something
				} else if (selection === 'Release') {
					// do something else
				}
			});
		})
	);

	//输出类型选择命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.outputType', () => {
			vscode.window.showQuickPick(['Executable file', 'Static library', 'Dynamic library']).then((selection) => {
				let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
				if (workspaceFolder) {
					let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/interface.json');
					if (fs.existsSync(filePath)) {
						let data = fs.readFileSync(filePath, 'utf8');
						const configJson = JSON.parse(data.toString());
						const interfaceConfigJson: ButtonInterfaceSet = {
							compilerVersion: configJson.compilerVersion,
							buildVariant: configJson.buildVariant,
							outputType: configJson.outputType
						};
						if (selection !== undefined) {
							interfaceConfigJson.outputType = selection;
						}
						fs.writeFileSync(filePath, JSON.stringify(interfaceConfigJson, null, 2));
						barItemOutType.text = "$(lightbulb)" + interfaceConfigJson.outputType;
						allSetInPlug.buttonInterfaceSet = interfaceConfigJson;
						// renewPreabuildOuttype(allSetInPlug.buttonInterfaceSet);
					}
				}

				if (selection === 'Debug') {
					// do something
				} else if (selection === 'Release') {
					// do something else
				}
			});
		})
	);

	//编译器选择命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.compilerSelect', () => {
			//解释compilersitem.json，得到编译器选择项
			// 读取JSON文件
			// 获取当前打开的文件夹
			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				return;
			} else {
				// let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/compilersitem.json');
				let filePath = ".local/share/abuild/compilersitem.json";
				const data = fs.readFileSync(filePath, 'utf8');
				const jsonData = JSON.parse(data);
				//根据选项设置当前编译器，设置进prebuild.sh中
				const listCommand = [];
				// 遍历数据

				for (const item of jsonData) {
					console.log(item.name);

					console.log('C compiler:', item.compilers.c);

					console.log('C++ compiler:', item.compilers.cplus);

					console.log('GDB : ', item.compilers.gdb);

					listCommand.push({ "label": item.name, "description": "using compiler : " + item.compilers.cplus });
				}

				vscode.window.showQuickPick(listCommand).then((selection) => {
					// if (selection?.label === 'Command 1') {
					// 	// do something
					// } else if (selection?.label === 'Command 2') {
					// 	// do something else
					// }
					if (barItemCompiler.text === "$(tools)" + "compiler-" + selection?.label) {
						return;
					}
					for (const item of jsonData) {
						if (selection?.label === item.name) {
							const datacompiler: CompilerVersion =
							{
								name: "",
								compilers: {
									c: "",
									cplus: "",
									gdb: ""
								}
							};
							datacompiler.name = item.name;
							datacompiler.compilers.c = item.compilers.c;
							datacompiler.compilers.cplus = item.compilers.cplus;
							datacompiler.compilers.gdb = item.compilers.gdb;

							let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
							if (workspaceFolder) {
								let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/interface.json');
								if (fs.existsSync(filePath)) {
									let data = fs.readFileSync(filePath, 'utf8');
									const configJson = JSON.parse(data.toString());
									const interfaceConfigJson: ButtonInterfaceSet = {
										compilerVersion: configJson.compilerVersion,
										buildVariant: configJson.buildVariant,
										outputType: configJson.outputType
									};
									interfaceConfigJson.compilerVersion = datacompiler;
									fs.writeFileSync(filePath, JSON.stringify(interfaceConfigJson, null, 2));
									allSetInPlug.buttonInterfaceSet = interfaceConfigJson;
									barItemCompiler.text = "$(tools)" + "compiler-" + item.name;
									//得到工作目录
									let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
									if (workdir === undefined) {
										return;
									}
									deleteFile(workdir + "/" + "compile_commands.json");
									generateClangdConfig();
									// generateClangdConfigJson();
									// 获取当前扩展的配置信息
									const config = vscode.workspace.getConfiguration('abuild');

									// 读取 abuild.mySetting 设置的值
									const mySetting = config.get('RefreshSmartPromptsAfterCompilerSelect');

									// 根据 mySetting 的值执行相应的操作
									if (mySetting) {
										// 如果 mySetting = true，执行这里的代码
										vscode.commands.executeCommand('clangd.restart');
										// console.log('My Extension is enabled');
									} else {
										// 如果 mySetting = false，执行这里的代码
										// console.log('My Extension is disabled');
									}
								}
							}
							
							break;
						}
					}



				});

			}
		})
	);

	//编译器选项编辑
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.compilersEdit', () => {
			let filepath = os.homedir() + "/.local/share/abuild/compilersitem.json";
			// const homeDir = os.homedir();
			// console.log(homeDir);
			if (fs.existsSync(filepath)) {
				vscode.workspace.openTextDocument(filepath).then((doc) => {
					vscode.window.showTextDocument(doc);
				});
			}
		})
	);

	//运行命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.runBin', () => {

			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
				const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
				console.log("projectsigDir : " + projectsigDir);
				let outputdir = "";
				if (barItemBuildVariant.text === "$(gear)" + " Debug") {
					outputdir = directoryPath + "/" + projectsigDir + "Debug";
				} else if (barItemBuildVariant.text === "$(gear)" + " Release") {
					outputdir = directoryPath + "/" + projectsigDir + "Release";
				}
				const exePath = 'cd';
				const args = [outputdir, ''];
				const terminalName = 'Abuild Run Bin';

				const terminal = vscode.window.createTerminal(terminalName);

				terminal.show();

				terminal.sendText(`${exePath} ${args.join(' ')}`);

				let abuildConfigJson = abuildconfig();
				const exePath1 = outputdir + "/" + abuildConfigJson?.projectName;
				const args1 = ['', ''];
				terminal.sendText(`${exePath1} ${args1.join(' ')}`);
			}
		})
	);

	//debug仿真命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.debug', () => {

			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
				const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
				console.log("projectsigDir : " + projectsigDir);
				let outputdir = "";
				outputdir = directoryPath + "/" + projectsigDir + "Debug";

				// let abuildConfigJson = abuildconfig();
				const exePath1 = outputdir + "/" + allSetInPlug.abuildconfig.projectName;
				// 创建调试配置
				const config: vscode.DebugConfiguration = {
					name: 'localDebug',
					type: 'cppdbg',
					request: 'launch',
					program: exePath1,
					args: allSetInPlug.abuildconfig.executionArgs,
					stopAtEntry: allSetInPlug.abuildconfig.stopAtEntry,
					cwd: '${workspaceFolder}',
					environment: allSetInPlug.abuildconfig.environmentVariable,
					externalConsole: false,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					MIMode: 'gdb',
					miDebuggerPath: allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.gdb,
					setupCommands: [
						{
							description: "Enable pretty-printing for gdb",
							text: "-enable-pretty-printing",
							ignoreFailures: true
						},
					],
				};
				// 启动调试器
				vscode.debug.startDebugging(undefined, config);
			}
		})
	);

	function copyFilePromise(sourceFilePath: string, destinationFilePath: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			// const readStream = fs.createReadStream(sourceFilePath);
			// const writeStream = fs.createWriteStream(destinationFilePath);

			// readStream.on('error', (err) => {
			// 	reject(`读取源文件时发生错误：${err}`);
			// });

			// writeStream.on('error', (err) => {
			// 	reject(`写入目标文件时发生错误：${err}`);
			// });

			// writeStream.on('finish', () => {
			// 	resolve("");
			// });

			// readStream.pipe(writeStream);

			try {
				fs.promises.readFile(sourceFilePath).then((results)=>{
					var fileContent = results;
					fs.promises.writeFile(destinationFilePath, fileContent).then((reslut)=>{
						resolve("");
					}).catch((err)=>{
						reject(`写源文件时发生错误：${err}`);
					});
				})
				.catch((err)=>{
					reject(`读取源文件时发生错误：${err}`);
				});
				
				console.log('文件复制成功！');
			  } catch (err) {
				console.error('文件复制失败：', err);
			  }
		});
	}

	function copyFile(sourceFile: string, destinationFile: string): boolean {
		// 读取源文件内容
		try {
			var sourceContent = fs.readFileSync(sourceFile);
		} catch (err) {
			return false;
		}


		// 将源文件内容写入目标文件
		fs.writeFileSync(destinationFile, sourceContent);
		return true;
	}
	//debug远程仿真命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.debugR', () => {

			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
				const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
				console.log("projectsigDir : " + projectsigDir);
				let outputdir = "";
				outputdir = directoryPath + "/" + projectsigDir + "Debug";
				const exePath1 = outputdir + "/" + allSetInPlug.abuildconfig.projectName;
				// 创建调试配置
				const config: vscode.DebugConfiguration = {
					name: 'remoteDebug',
					type: 'cppdbg',
					request: 'launch',
					program: exePath1,
					args: allSetInPlug.abuildconfig.executionArgs,
					stopAtEntry: allSetInPlug.abuildconfig.stopAtEntry,
					cwd: '${workspaceFolder}',
					environment: allSetInPlug.abuildconfig.environmentVariable,
					externalConsole: false,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					MIMode: 'gdb',
					miDebuggerPath: allSetInPlug.buttonInterfaceSet.compilerVersion.compilers.gdb,
					miDebuggerServerAddress: allSetInPlug.abuildconfig.debuggerServerAddress,
					setupCommands: [
						{
							description: "Enable pretty-printing for gdb",
							text: "-enable-pretty-printing",
							ignoreFailures: true
						},
					],
				};
				// 启动调试器
				vscode.debug.startDebugging(undefined, config);
			}
		})
	);

	//传送文件命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.TransferExecutionFiles', () => {
			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
				const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
				console.log("projectsigDir : " + projectsigDir);
				let outputdir = "";
				outputdir = directoryPath + "/" + projectsigDir + "Debug";

				// let abuildConfigJson = abuildconfig();
				const exePath1 = outputdir + "/" + allSetInPlug.abuildconfig.projectName;
				if (!fs.existsSync(exePath1)) {
					vscode.window.showInformationMessage(localize('file not exist', "default"));
					return;
				}
				if (allSetInPlug.abuildconfig.sharePath !== "") {
					if (copyFile(exePath1, allSetInPlug.abuildconfig.sharePath + "/" + allSetInPlug.abuildconfig.projectName)) {
						vscode.window.showInformationMessage(localize('transfer success', "default"));
					} else {
						vscode.window.showInformationMessage(localize('transfer fail', "default"));
					}
				} else {
					vscode.window.showInformationMessage(localize('Shared directory not set', "default"));
				}
			}
		})
	);

	//得到不带前缀的输出目录
	function getBuildOutputDirNotPre(): string {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
			const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
			// console.log("projectsigDir : " + projectsigDir);
			let outputdir = "";

			//判断当前编译选项
			if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
				outputdir = projectsigDir + "Debug";
				// console.log("debug");
			} else if (allSetInPlug.buttonInterfaceSet.buildVariant === "Release") {
				// console.log("release");
				outputdir = projectsigDir + "Release";
			}
			return outputdir;
		} else {
			return "";
		}
	}

	function getBuildOutputDir(): string {
		let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
			const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
			console.log("projectsigDir : " + projectsigDir);
			let outputdir = "";

			//判断当前编译选项
			if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
				outputdir = directoryPath + "/" + projectsigDir + "Debug";
				console.log("debug");
			} else if (allSetInPlug.buttonInterfaceSet.buildVariant === "Release") {
				console.log("release");
				outputdir = directoryPath + "/" + projectsigDir + "Release";
			}
			return outputdir;
		} else {
			return "";
		}
	}
	//清除编译命令
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.clean', () => {
			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				let projectsigDir = workspaceFolder.uri.fsPath.substring(workspaceFolder.uri.fsPath.lastIndexOf("/") + 1);
				const directoryPath = workspaceFolder.uri.fsPath.substring(0, workspaceFolder.uri.fsPath.lastIndexOf("/"));
				console.log("projectsigDir : " + projectsigDir);
				let outputdir = "";

				//判断当前编译选项
				if (allSetInPlug.buttonInterfaceSet.buildVariant === "Debug") {
					outputdir = directoryPath + "/" + projectsigDir + "Debug";
					console.log("debug");
				} else if (allSetInPlug.buttonInterfaceSet.buildVariant === "Release") {
					console.log("release");
					outputdir = directoryPath + "/" + projectsigDir + "Release";
				}
				if (fs.existsSync(outputdir)) {
					removeSync(outputdir);
					vscode.window.showInformationMessage(localize('cleanSuccess', "default"));
				} else {
					vscode.window.showInformationMessage(localize('fileDirNotExists', "default"));
				}
				outputChannel.clear();
			}

		})
	);

	//重启语言服务器
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.restartIntelligencePrompt', () => {
			let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				let filePath = path.join(workspaceFolder.uri.fsPath, '/.abuild/abuild.json');
				if(fs.existsSync(filePath)){
					vscode.commands.executeCommand('clangd.restart');
				}
			}
		})
	);

	// "workspaceContains:abuild.json"
	const outputChannel = vscode.window.createOutputChannel('Abuild Output');
	//编译命令
	let childProcess: ChildProcess;
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.build', () => {
			if (barItemBuild.text === "$(issue-reopened)" + "Build") {
				barItemBuild.text = "$(chrome-close)" + "Stop";
				outputChannel.clear();
				outputChannel.show();
				let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
				if (workspaceFolder) {
					makeRun();
				}

			} else if (barItemBuild.text === "$(chrome-close)" + "Stop") {
				barItemBuild.text = "$(issue-reopened)" + "Build";
				childProcess.kill();
			}

		})
	);

	/**
	* 复制目录
	* @param srcDir 要复制的目录路径
	* @param destDir 目标目录路径
	*/
	function copyDir(srcDir: string, destDir: string): void {
		// 创建目标目录
		fs.mkdirSync(destDir, { recursive: true });

		// 获取源目录中的所有子文件和子目录
		const files = fs.readdirSync(srcDir);

		// 遍历子文件和子目录
		for (const file of files) {
			const srcFilePath = path.join(srcDir, file);
			const destFilePath = path.join(destDir, file);

			// 判断是否是目录
			if (fs.statSync(srcFilePath).isDirectory()) {
				// 如果是目录，则递归复制子目录
				copyDir(srcFilePath, destFilePath);
			} else {
				// 如果是文件，则直接复制
				fs.copyFileSync(srcFilePath, destFilePath);
			}
		}
	}

	/**
 * 同时执行多个 shell 命令，并等待它们全部执行完成后返回结果
 * @param commands 要执行的命令列表
 */
	function execShellCommands(commands: string[], shellRunDir: string): Promise<string[]> {
		const promises: Promise<string>[] = [];

		// 遍历命令列表，依次执行每个命令
		for (const command of commands) {
			const promise = new Promise<string>((resolve, reject) => {
				// 创建新的进程，执行指定的命令
				const child = spawn(command, {
					cwd: shellRunDir,
					shell: "/bin/bash",
				});

				// 监听子进程的 stdout 和 stderr
				let stdout = '';
				let stderr = '';
				child.stdout.on('data', (data) => {
					stdout += data;
				});

				child.stderr.on('data', (data) => {
					stderr += data;
				});

				// 监听子进程的退出事件
				child.on('exit', (code) => {
					if (code === 0) {
						resolve(stdout);
					} else {
						reject(new Error(`命令执行失败，错误码为 ${code}，错误信息为：${stderr}`));
					}
				});
			});

			promises.push(promise);
		}

		// 等待所有 Promise 对象都完成后，返回所有输出结果
		return Promise.all(promises);
	}

	//把所有.h文件按照原目录结构，复制进目标目录
	function copyHeaderFilesDir(sourceDir: string, destDir: string) {
		// 递归遍历所有子目录
		function traverseDir(dir: string) {
			const files = fs.readdirSync(dir); // 读取目录中的所有文件和子目录
			for (const file of files) {
				const filePath = path.join(dir, file);
				const stat = fs.statSync(filePath); // 获取文件/目录信息
				if (stat.isDirectory()) {
					traverseDir(filePath); // 递归遍历子目录
				} else if (path.extname(filePath) === '.h' && file !== "version.h") {
					const destPath = path.join(destDir, dir.replace(sourceDir, ''), file);
					console.log("destPath", destPath);
					// 构建目标文件路径
					fs.mkdirSync(path.dirname(destPath), { recursive: true }); // 确保目标目录存在
					fs.copyFileSync(filePath, destPath);
				}
			}
		}
		traverseDir(sourceDir);
	}


	//打包你的程序
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.Pack', () => {
			var flagIsPacking: Boolean = false;
			if (flagIsPacking === false) {
				flagIsPacking = true;

				//得到输出目录
				let outdir = getBuildOutputDir();
				if (outdir === "") {
					return;
				}

				//得到工作目录
				let workdir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
				if (workdir === undefined) {
					return;
				}
				console.log("workdir", workdir);

				//'Executable file', 'Static library', 'Dynamic library'
				//针对可执行程序
				if (allSetInPlug.buttonInterfaceSet.outputType === "Executable file") {
					if (!fs.existsSync(outdir + "/" + allSetInPlug.abuildconfig.projectName)) {
						vscode.window.showInformationMessage(localize('Program Packed file not exist', "default"));
						return;
					}
					//将工作目录的pack配置目录复制到输出目录
					let commandsCopyDir: string[] = [];
					for (const itemdir of allSetInPlug.abuildconfig.packPath) {
						if(fs.existsSync(outdir + "/" + itemdir)){
							removeSync(outdir + "/" + itemdir);
						}
						if(fs.existsSync(workdir + "/" + itemdir)){
							commandsCopyDir.push("cp -R " + workdir + "/" + itemdir + " " + outdir + "/");
						}
					}
					//拼接tar.gz名字
					let tarname: string = outdir + "/" + allSetInPlug.abuildconfig.projectName + "-" +
						allSetInPlug.abuildconfig.projectVersion.major + "-" +
						allSetInPlug.abuildconfig.projectVersion.minor + "-" +
						allSetInPlug.abuildconfig.projectVersion.patch + ".tar.gz";
					if(fs.existsSync(tarname)){
						deleteFile(tarname);
					}					
					// commandsCopyDir.push("rm " + tarname);

					//将可执行程序与配置目录打包到tar.gz
					let args: string[] = [];
					args.splice(0, args.length);
					args.push(tarname);
					for (const itemdir of allSetInPlug.abuildconfig.packPath) {
						if(fs.existsSync(workdir + "/" + itemdir)){
							args.push(itemdir);
						}						
					}
					args.push(allSetInPlug.abuildconfig.projectName);
					commandsCopyDir.push("tar -zcvf " + args.join(" "));
					execShellCommands(commandsCopyDir, outdir)
						.then((results) => {
							vscode.window.showInformationMessage(localize('Program Packed Success', "default"));
							console.log('所有命令执行完成，输出结果为：', results);
						})
						.catch((error) => {
							console.error('执行命令时出现错误：', error);
							vscode.window.showInformationMessage(localize("Program Packed Fail", "default")+error);							
						});;

					//针对动态库、静态库
				} else {

					//在输出目录创建打包目录
					let packdir: string = outdir + "/" + "packdir";
					if (!fs.existsSync(packdir)) {
						fs.mkdirSync(packdir, { recursive: true });
					}else{
						removeSync(packdir);
					}
					//把所有.h文件按照原目录结构，复制进打包目录
					copyHeaderFilesDir(workdir, packdir);
					//将工作目录的pack配置目录复制到打包目录
					let commandsLists: string[] = [];
					for (const itemdir of allSetInPlug.abuildconfig.packPath) {
						if(fs.existsSync(workdir + "/" + itemdir)){
							commandsLists.push("cp -R " + workdir + "/" + itemdir + " " + packdir + "/");
						}
					}
					//将生成的动态库或静态库复制进打包目录
					let programOut: string = "";
					if (allSetInPlug.buttonInterfaceSet.outputType === "Static library") {
						programOut = allSetInPlug.abuildconfig.projectName + ".a";
					} else if (allSetInPlug.buttonInterfaceSet.outputType === "Dynamic library") {
						programOut = allSetInPlug.abuildconfig.projectName + ".so";
					}
					if (!fs.existsSync(outdir + "/" + programOut)) {
						vscode.window.showInformationMessage(localize('Program Packed file not exist', "default"));
						return;
					}else{
						commandsLists.push("cp " + "../" + programOut + " " + packdir + "/");
					}
					//拼接tar.gz名字
					let tarname: string = packdir + "/" + allSetInPlug.abuildconfig.projectName + "-" +
						allSetInPlug.abuildconfig.projectVersion.major + "-" +
						allSetInPlug.abuildconfig.projectVersion.minor + "-" +
						allSetInPlug.abuildconfig.projectVersion.patch + ".tar.gz";
					if (fs.existsSync(tarname)) {
						deleteFile(tarname);
					}
					//将打包目录整体打包到tar.gz
					let args: string[] = [];
					args.splice(0, args.length);
					args.push(tarname);
					// for(const itemdir of allSetInPlug.abuildconfig.packPath){
					// 	args.push(itemdir);
					// }
					// args.push(programOut);
					args.push("*");
					commandsLists.push("tar -zcvf " + args.join(" "));
					execShellCommands(commandsLists, packdir)
						.then((results) => {
							vscode.window.showInformationMessage(localize('Program Packed Success', "default"));
							console.log('所有命令执行完成，输出结果为：', results);
						})
						.catch((error) => {
							console.error('执行命令时出现错误：', error);
							vscode.window.showInformationMessage(localize("Program Packed Fail", "default")+error);	
						});

				}
			} else {
				vscode.window.showInformationMessage(localize('Program Packing', "default"));
			}
		})
	);

	//生成abuild.json相关处理任务，不带模板
	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('abuild.CreateProjectNoTemplate', () => {

	// 		//获取当前打开的文件夹
	// 		// vscode.window.showInformationMessage("message");
	// 		let workspaceFolderNow = vscode.workspace.workspaceFolders?.[0];
	// 		if (!workspaceFolderNow) {
	// 			return;
	// 		}
	// 		let folderPath = path.join(workspaceFolderNow.uri.fsPath, '/.abuild');
	// 		if (!folderExists(folderPath)) {
	// 			createAbuildConfigsFolder(workspaceFolderNow).then(() => {
	// 				if (workspaceFolderNow) {
	// 					createAbuild(workspaceFolderNow).then(() => {
	// 						barItemAllShow();
	// 						vscode.window.showInformationMessage("工程创建成功");
	// 						generateVersionHeaderFile();
	// 						generateClangdConfig();
	// 					}, (err) => {
	// 						//
	// 					});
	// 					createInterfaceJson(workspaceFolderNow);
	// 					createGitIgnore();
	// 					// createCompilersSet(workspaceFolderNow);
	// 				}
	// 			}, (err) => {
	// 				console.log("abuild configsfilefolder cretae error: " + err);
	// 			});

	// 		} else {
	// 			let filePath = path.join(workspaceFolderNow.uri.fsPath, '/.abuild/abuild.json');
	// 			if (fs.existsSync(filePath)) {
	// 				vscode.window.showInformationMessage("工程已存在，您确定要重建工程吗?", "确定", "取消").then((selectedItem) => {
	// 					if (selectedItem === "确定") {
	// 						deleteFile(filePath);
	// 						if (workspaceFolderNow) {
	// 							createAbuild(workspaceFolderNow as WorkspaceFolder).then(() => {
	// 								barItemAllShow();
	// 								vscode.window.showInformationMessage("工程重建成功");
	// 								generateVersionHeaderFile();
	// 								generateClangdConfig();
	// 							}, (err) => {

	// 							});
	// 							// createCompilersSet(workspaceFolderNow);
	// 							createGitIgnore();
	// 						}

	// 					} else if (selectedItem === "取消") {
	// 						vscode.window.showInformationMessage("已取消");
	// 					}
	// 				});
	// 			} else {
	// 				if (workspaceFolderNow) {
	// 					createAbuild(workspaceFolderNow as WorkspaceFolder).then(() => {
	// 						barItemAllShow();
	// 						vscode.window.showInformationMessage("工程创建成功");
	// 						generateVersionHeaderFile();
	// 						generateClangdConfig();
	// 					}, (err) => {

	// 					});
	// 					createInterfaceJson(workspaceFolderNow);
	// 					createGitIgnore();
	// 				}
	// 			}
	// 		}
	// 	})
	// );

	//生成abuild.json相关处理任务
	context.subscriptions.push(
		vscode.commands.registerCommand('abuild.CreateProject', () => {


			//获取当前打开的文件夹
			// vscode.window.showInformationMessage("message");
			let workspaceFolderNow = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolderNow) {
				return;
			}
			let folderPath = path.join(workspaceFolderNow.uri.fsPath, '/.abuild');
			if (!folderExists(folderPath)) {
				createAbuildConfigsFolder(workspaceFolderNow).then(() => {
					if (workspaceFolderNow) {
						createAbuildAndTemplateMain(workspaceFolderNow).then(() => {
							barItemAllShow();
							vscode.window.showInformationMessage("工程创建成功");
							generateVersionHeaderFile();
							generateClangdConfig();
						}, (err) => {
							//
						});
						createInterfaceJson(workspaceFolderNow);
						// createCompilersSet(workspaceFolderNow);
					}
				}, (err) => {
					console.log("abuild configsfilefolder cretae error: " + err);
				});
				createGitIgnore();

			} else {
				let filePath = path.join(workspaceFolderNow.uri.fsPath, '/.abuild/abuild.json');
				if (fs.existsSync(filePath)) {
					vscode.window.showInformationMessage("工程已存在，您确定要重建工程吗?", "确定", "取消").then((selectedItem) => {
						if (selectedItem === "确定") {
							deleteFile(filePath);
							if (workspaceFolderNow) {
								createAbuildAndTemplateMain(workspaceFolderNow as WorkspaceFolder).then(() => {
									barItemAllShow();
									vscode.window.showInformationMessage("工程重建成功");
									generateVersionHeaderFile();
									generateClangdConfig();
								}, (err) => {

								});
								// createCompilersSet(workspaceFolderNow);
								createGitIgnore();
							}

						} else if (selectedItem === "取消") {
							vscode.window.showInformationMessage("已取消");
						}
					});
				} else {
					if (workspaceFolderNow) {
						createAbuildAndTemplateMain(workspaceFolderNow as WorkspaceFolder).then(() => {
							barItemAllShow();
							vscode.window.showInformationMessage("工程创建成功");
							generateVersionHeaderFile();
							generateClangdConfig();
						}, (err) => {

						});
						createInterfaceJson(workspaceFolderNow);
						createGitIgnore();
					}
				}
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
