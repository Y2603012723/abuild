/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2023-04-24 11:53:32
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2023-04-24 14:54:42
 * @FilePath: /abuild/src/compilersKit.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as vscode from 'vscode';

interface CompilerConfig {
	c: string;
	cplus: string;
}

interface KitConfig {
	name: string;
	compilers: CompilerConfig;
}

interface KitConfigList {
	[index: number]: KitConfig;
}

export class CompilersKit {
    private name: string;
    private age: number;
  
    constructor(name: string, age: number) {
      this.name = name;
      this.age = age;
    }

    public createCompilersKitJson(){

    }
  
    public getName(): string {
      return this.name;
    }
  
    public getAge(): number {
      return this.age;
    }
  
    public setName(name: string): void {
      this.name = name;
    }
  
    public setAge(age: number): void {
      this.age = age;
    }
}