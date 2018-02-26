'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

let w = vscode.window;
let wp = vscode.workspace;
let env = vscode.env;
let dm = w.activeTextEditor.document

const JsType = /.*\.js/;
let config=JSON.parse(fs.readFileSync(__dirname+'/config.json','utf-8').toString());
/**
 * 创建 config name
 */
const wname = config.userName||'wjiban';

let wlog = [
    '/***',
    ' * @creater:${this.user_name}',
    ' * @create_time:${this.create_time}',
    ' * @last_modify:${this.user_name}',
    ' * @modify_time:${this.modify_time}',
    ' * @line_count:${this.line_count<9?0:this.line_count-8}',
    ' **/',
    '',
    ''
]
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('extension.sayHello', async() => {
        // The code you place here will be executed every time your command is executed
        config=JSON.parse(fs.readFileSync(__dirname+'/config.json','utf-8').toString());
        let pName = config.userName||'';
        let user_name =await vscode.window.showInputBox({value:pName});
        if(pName == user_name||user_name==null||user_name==undefined){
        
        }else{
            config.userName = user_name;
            fs.writeFileSync(__dirname+'/config.json',JSON.stringify(config),'utf8');
            vscode.window.showInformationMessage('用户名更改成功')
            setTimeout(()=>{
                // 关闭弹出框
                vscode.commands.executeCommand("workbench.action.closeMessages")
            },800)
        }
    });
 
    // 统计字数
    let count = vscode.commands.registerCommand('count', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return
        };

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        // Display a message box to the user
        vscode.window.showInformationMessage('Selected characters: ' + text.length);
    })
    // 记录文件保存信息
    let saveInfo = vscode.commands.registerCommand('writeLog', () => {
        // 执行文件保存命令
        vscode.commands.executeCommand("workbench.action.files.save")

        /**
         * 判断文件类型，判断是否是js 文件
         * 1. 得到文件名字，判断后缀,
         * 2. 如果是js 文件，判断 首行是否有注释，没有则插入，有则修改
         */
        let fN = dm.fileName;
        if (JsType.exec(fN)) {
            // 判断是否有注释
            let _exit = 0;
            let f_info = {
                user_name:config.userName,
                create_time:format(new Date()),
                last_modify:config.userName,
                modify_time:format(new Date()),
                line_count:dm.lineCount
            }
            for (let i = 0; i < dm.lineCount; i++) {
                let lineText = dm.lineAt(i)
               
                if (lineText.text == '/***') {
                    let wse = new vscode.WorkspaceEdit();
                    wse.replace(dm.uri, new vscode.Range(i+3, 0,i+8,0),getFileInfo(wlog.slice(3,wlog.length),f_info))
                    wp.applyEdit(wse)
                    _exit = 1;
                    break;        
                };
            }
            if (_exit === 0) {
                let wse = new vscode.WorkspaceEdit();
                wse.insert(dm.uri, new vscode.Position(0, 0),getFileInfo(wlog,f_info));
                wp.applyEdit(wse)
            }
        } else {

        }

    })
    context.subscriptions.push(disposable);
    context.subscriptions.push(saveInfo);
    context.subscriptions.push(count)
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function getFileInfo(m:string[],u:{}) {
    let a = [];
    a[0] = 'let j=[]'
    for (let i = 0; i < m.length; i++) {
        const element = m[i];
        a.push(`j.push(\`${element}\`)`);
    };
    
    a.push(`return j.join('\\r\\n')`)
    let s= a.join(';')
    return  new Function(s).apply(u)
}
function format(d:Date){
    return `${d.getFullYear().toString().substring(2,4)}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
}