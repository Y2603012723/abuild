/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2023-04-20 08:58:20
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2023-04-20 10:15:37
 * @FilePath: /abuild/src/localize.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { existsSync, readFileSync } from "fs-extra";
import { resolve } from "path";
import { extensions } from "vscode";
import { ILanguagePack } from "./models/language-pack.model";
import * as vscode from 'vscode';

export class Localize {
  private bundle = this.resolveLanguagePack();
  private options!: { 
    locale: string; 
    vscodelanguage:string;
  };

  public localize(key: string, ...args: string[]): string {
    const message = this.bundle[key] || key;
    return this.format(message, args);
  }

  private init() {
    try {
      console.log("process.env.VSCODE_NLS_CONFIG",process.env.VSCODE_NLS_CONFIG);
      console.log("vscode.env.language",vscode.env.language);
      this.options = {
        ...this.options,
       ...JSON.parse(process.env.VSCODE_NLS_CONFIG || "{}")
      };
      this.options = {
        locale: this.options.locale,
        vscodelanguage: vscode.env.language
      };
    } catch (err) {
      throw err;
    }
  }

  private format(message: string, args: string[] = []): string {
    return args.length
      ? message.replace(
          /\{(\d+)\}/g,
          (match, rest: any[]) => args[rest[0]] || match
        )
      : message;
  }

  private resolveLanguagePack(): ILanguagePack {
    this.init();

    const languageFormat = "package.nls{0}.json";
    const defaultLanguage = languageFormat.replace("{0}", "");
    console.log("defaultLanguage",defaultLanguage);

    const rootPath = extensions.getExtension("yangkang.abuild")!.extensionPath;

    const resolvedLanguage = this.recurseCandidates(
      rootPath,
      languageFormat,
      // this.options.locale
      this.options.vscodelanguage
    );

    console.log("resolvedLanguage",resolvedLanguage);

    const languageFilePath = resolve(rootPath, resolvedLanguage);

    try {
      const defaultLanguageBundle = JSON.parse(
        resolvedLanguage !== defaultLanguage
          ? readFileSync(resolve(rootPath, defaultLanguage), "utf-8")
          : "{}"
      );

      const resolvedLanguageBundle = JSON.parse(
        readFileSync(languageFilePath, "utf-8")
      );

      return { ...defaultLanguageBundle, ...resolvedLanguageBundle };
    } catch (err) {
      throw err;
    }
  }

  private recurseCandidates(
    rootPath: string,
    format: string,
    candidate: string
  ): string {
    const filename = format.replace("{0}", `.${candidate}`);
    const filepath = resolve(rootPath, filename);
    if (existsSync(filepath)) {
      return filename;
    }
    if (candidate.split("-")[0] !== candidate) {
      return this.recurseCandidates(rootPath, format, candidate.split("-")[0]);
    }
    return format.replace("{0}", "");
  }
}

export default Localize.prototype.localize.bind(new Localize());
