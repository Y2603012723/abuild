
# 1. abuild介绍

abuild是一个c/c++开发工具。

y2603012723@163.com为联系邮箱。

## 1.1. 特性

abuild插件可以自动识别工作目录下的所有源码，自行编译，目前只支持linux操作系统。

## 1.2. 依赖

linux上需要安装clangd，bear，gcc/g++编译器，vscode需要安装clangd的插件，C/C++插件。

# 3. vscode插件安装
## 3.1. abuild插件的安装
1.打开vscode，点击扩展图标，搜索abuild进行安装
![](images/2023-06-07-19-41-31.png)

2.也可以采用vsix包进行安装
![](images/2023-06-07-19-42-27.png)

## 3.2. 其他插件的安装
![](images/2023-06-08-13-33-52.png)

# 4. abuild的使用
## 4.1. 创建工程
先创建一个文件夹，再用vscode打开此文件夹，在此文件夹使用abuild创建工程

创建文件夹
![](images/2023-06-08-13-34-20.png)

vscode打开文件夹
![](images/2023-06-08-13-35-46.png)

ctrl + shift + p
搜索abuild,执行abuild创建工程命令
![](images/2023-06-08-13-36-48.png)

创建工程后会生成以下文件
![](images/2023-06-08-13-40-14.png)

并在下菜单栏出现以下交互选项
![](images/2023-06-08-13-41-03.png)

工程目录下是这样
![](images/2023-06-08-13-41-45.png)

abuild.json:是工程配置文件
interface.json：是工程交互选项记录文件
.clangd：是clangd配置参数文件
.gitignore：是生成的git忽略配置文件
main.cpp：是生成的程序模板
version.h：也是生成的程序模板

compiler-GCC XXX：是编译器选择交互选项
Debug：是编译类型选择交互选项
Executable file：是输出类型交互选项
Build：是编译动作执行按钮
Run：是运行动作执行按钮
LDebug：是本地调试仿真执行按钮
RDebug：是远程调试仿真执行按钮
clean：是清除编译输出执行按钮

## 4.2. 为老工程添加abuild管理
拿一套工程源码
![](images/2023-06-08-14-48-44.png)
使用vscode打开工程源码文件夹
![](images/2023-06-08-14-49-23.png)

ctrl + shift + p，执行创建工程命令
![](images/2023-06-08-14-50-13.png)
![](images/2023-06-08-14-50-43.png)
## 4.3. 编译器设置与选择
### 4.3.1. 编译器设置
ctrl + shift + p
搜索abuild,执行abuild编译器选项编译命令
![](images/2023-06-08-14-53-27.png)
此命令会打开编译器配置文件，可以在此文件添加编译器
![](images/2023-06-08-14-55-09.png)
把之前安装的编译器添加配置项中，ctrl+s保存
![](images/2023-06-08-14-57-32.png)
### 4.3.2. 编译器选择
点击编译器选择交互选项，即可为当前工程选择编译器
![](images/2023-06-08-15-01-02.png)
![](images/2023-06-08-15-19-06.png)

## 4.4. 编译类型选择
![](images/2023-06-08-15-31-08.png)
可以选择debug版本或release版本
![](images/2023-06-08-15-31-30.png)

## 4.5. 输出类型选择
![](images/2023-06-08-15-33-07.png)
可选择编译为动态库，静态库，执行程序
![](images/2023-06-08-15-52-16.png)

## 4.6. 编译
点击编译动作执行按钮，在输出窗口（ABuild Output）中输出编译过程提示，此处可以查看编译错误
![](images/2023-06-08-15-55-29.png)
编译输出的文件方式为：shadow build，输出目录如下，debug在debug目录，release在release目录
![](images/2023-06-08-15-59-57.png)
## 4.7. 运行
点击运行动作执行按钮，将在终端输出执行结果，编译类型为debug时执行，debug版本的执行文件，release版本的执行release版本的执行文件
![](images/2023-06-08-15-56-46.png)
## 4.8. 本地调试
点击本地调试动作执行按钮，程序将自动调到程序入口处，点击上方调试步骤按钮可按行执行程序，左侧可以观测相关变量值情况
调试按钮有：继续、单步跳过、单步调试、重启、停止
![](images/2023-06-08-16-00-40.png)
## 4.9. 远程调试
远程调试需要在目标机器上执行gdbserver启动执行文件，在abuild工程设置中设置远程调试ip与端口号，再点击远程调试动作执行按钮，启动远程调试
![](images/2023-06-08-16-23-20.png)
![](images/2023-06-08-16-24-02.png)
![](images/2023-06-08-16-24-20.png)
![](images/2023-06-08-16-24-38.png)
![](images/2023-06-08-16-25-03.png)
## 4.10. 清除工程输出文件
点击清除工程输出按钮，将会删除shadow文件夹，比如编译类型为debug，则删除debug输出目录
![](images/2023-06-08-16-07-07.png)
## 4.11. 打包
打包功能是在程序进行发布时使用，ctrl + shift + p，搜索abuild，找到打包命令
![](images/2023-06-08-16-30-42.png)
执行打包命令后，将会根据当前选择的输出类型：execuable file、static library、dnamic library，进行不同的打包
可执行文件打包，会将执行文件和packPath目录打包
![](images/2023-06-08-16-31-26.png)
静态库、动态库打包，这种方式将会将所有.h，生成的静态库或动态库、以及packPath目录进行打包
![](images/2023-06-08-16-32-21.png)
## 4.12. 传送可执行文件
传送可执行文件的作用，用在远程调试上，通常我们调试嵌入式设备，会将主机与嵌入式设备进行网络连接，通过nfs将主机的目录挂载到嵌入式设备上，此时，我们设置传送目录，执行传送命令，即可将可执行文件复制到传送目录中，方便在嵌入式设备对可执行文件的运行
![](images/2023-06-08-16-36-01.png)
![](images/2023-06-08-16-36-40.png)
![](images/2023-06-08-16-36-57.png)

## 4.13. 重启智能提示语言服务器
如果遇到智能提示有问题，可重启语言服务器，刷新智能提示，ctrl+shift+p
![](images/2023-06-08-20-14-57.png)
## 4.14. 设置项说明
abuild.json设置项
```json
{
  "projectName": "template_Bin",//工程的名字，也是生成的可执行文件的名字
  "projectVersion": {
    "major": "0",//程序主版本号
    "minor": "0",//程序小版本号
    "patch": "1"//程序补丁版本号，版本号可在程序中通过version.h使用
  },
  "globalMacro": [//用于指定代码的全局宏
    {
      "MACRO_NAME": "1"
    },
    {
      "ENABLE_XX": "1"
    }，
    {
      "__ARM_PCS_VFP":""//可使用这种方式定义无值的宏
    }
  ],
  "libPath": [//配置动态库静态库路径
    "/home/libraryPath1",
    "/home/libraryPath2"
  ],
  "libName": [//配置连接的静态库动态库名字
    "mylibname1",
    "mylibname2"
  ],
  "debugFlags": "",//debug版本的编译器参数，默认为-g, -O0, -fPIC, -Wall, -Wextra, -pedantic，如果进行设置，将会取代默认参数
  "releaseFlags": "",//release版本的编译器参数，默认为-O3, -fPIC, -DNDEBUG，如果进行设置，将会取代默认参数
  "packPath": [//打包目录，我们可以指定源码目录下的哪些目录需要打包，通常会指定configs文件夹作为打包文件夹，configs一般放置配置文件
    "configs"
  ],
  "sharePath": "/home/yk/nfsdir",//远程调试时，可设置此目录，进行可执行文件的传递
  "executionArgs": [//执行程序时输入的参数
    "args1",
    "args2"
  ],
  "stopAtEntry": true,//调试是否在mian入口停止
  "environmentVariable": [//程序执行时的环境变量设置
    {
      "name": "config",
      "value": "Debug"
    }
  ],
  "debuggerServerAddress": "192.168.88.128:1234"//远程调试的远程地址
}
```

interface.json本文件自动生成，不需要手动配置
```json
{
  "compilerVersion": {//选择的编译器
    "name": "GCC ARM",
    "compilers": {
      "c": "arm-buildroot-linux-gnueabihf-gcc",
      "cplus": "arm-buildroot-linux-gnueabihf-g++",
      "gdb": "arm-buildroot-linux-gnueabihf-gdb"
    }
  },
  "buildVariant": "Release",//编译类型
  "outputType": "Executable file"//输出类型
}
```
.gitignore,为创建工程是默认的忽略文件
```
.cache
.clangd
compile_commands.json
```

version.h文件里的版本，会自动根据abuild.json里设置的版本进行变化

abuild有三个设置项
Whether to refresh the smart prompt after compilation?
是否在每次编译后重启智能提示（语言服务器）

Do you want to refresh the smart prompt after selecting the compilation type?
是否在选择编译类型后重启智能提示（语言服务器）

Whether to refresh the smart prompt after selecting the compiler?
是否在选择编译器后重启智能提示（语言服务器）

默认都是开启的，但是由于语言服务器经常重启容易崩溃，我们也可以手动关闭一些重启
![](images/2023-06-09-17-48-57.png)

## 4.15. vscode中的clangd配置
![](images/2023-06-08-17-38-12.png)
![](images/2023-06-08-17-38-32.png)
![](images/2023-06-08-17-39-13.png)
这里进行"clangd.arguments"的配置，因为abuild使用clangd，需要关闭与其冲突的"C_Cpp.intelliSenseEngine"
![](images/2023-06-08-17-39-32.png)

clangd的配置问题处理：https://clangd.llvm.org/troubleshooting
如下是clangd配置的一些解释，使用时，默认可不必进行配置
```json
{
  "clangd.arguments": [
    // 让 Clangd 生成更详细的日志
    "--log=verbose",
    // 输出的 JSON 文件更美观
    "--pretty",
    // 全局补全(输入时弹出的建议将会提供 CMakeLists.txt 里配置的所有文件中可能的符号，会自动补充头文件)
    "--all-scopes-completion",
    // 建议风格：打包(重载函数只会给出一个建议）
    // 相反可以设置为detailed
    "--completion-style=bundled",
    // 跨文件重命名变量
    "--cross-file-rename",
    // 允许补充头文件
    "--header-insertion=iwyu",
    // 输入建议中，已包含头文件的项与还未包含头文件的项会以圆点加以区分
    "--header-insertion-decorators",
    // 在后台自动分析文件(基于 complie_commands，我们用CMake生成)
    "--background-index",
    // 启用 Clang-Tidy 以提供「静态检查」
    "--clang-tidy",
    // Clang-Tidy 静态检查的参数，指出按照哪些规则进行静态检查，详情见「与按照官方文档配置好的 VSCode 相比拥有的优势」
    // 参数后部分的*表示通配符
    // 在参数前加入-，如-modernize-use-trailing-return-type，将会禁用某一规则
    "--clang-tidy-checks=cppcoreguidelines-*,performance-*,bugprone-*,portability-*,modernize-*,google-*",
    // 默认格式化风格: 谷歌开源项目代码指南
    // "--fallback-style=file",
    // 同时开启的任务数量
    "-j=2",
    // pch优化的位置(memory 或 disk，选择memory会增加内存开销，但会提升性能) 推荐在板子上使用disk
    "--pch-storage=disk",
    // 启用这项时，补全函数时，将会给参数提供占位符，键入后按 Tab 可以切换到下一占位符，乃至函数末
    // 我选择禁用
    "--function-arg-placeholders=false",
    // compelie_commands.json 文件的目录位置(相对于工作区，由于 CMake 生成的该文件默认在 build 文件夹中，故设置为 build)
    "--compile-commands-dir=build"
  ],
}
```


## 4.16. 疑难解答

## 4.17. Release Notes

### 4.17.1. 0.0.8

初始版本

### 4.17.2. 0.0.9

Fixed issue #.

### 4.17.3. 0.0.10

Added features X, Y, and Z.