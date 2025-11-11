"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    console.log('🚀 Angular CSS Navigator Extension Activated!');
    const provider = new CssClassDefinitionProvider();
    // Register definition provider for HTML files with multiple selectors
    const disposable1 = vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'html' }, provider);
    const disposable2 = vscode.languages.registerDefinitionProvider({ scheme: 'file', pattern: '**/*.html' }, provider);
    const disposable3 = vscode.languages.registerDefinitionProvider({ scheme: 'file', pattern: '**/*.component.html' }, provider);
    // Add a test command
    const testCommand = vscode.commands.registerCommand('angular-css-navigator.test', () => {
        console.log('🧪 Test command executed!');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            console.log('📄 Current file:', editor.document.fileName);
            console.log('📍 Current position:', editor.selection.active.line, editor.selection.active.character);
            // Test the provider manually
            provider.provideDefinition(editor.document, editor.selection.active, new vscode.CancellationTokenSource().token)
                .then(result => {
                if (result) {
                    console.log('🎉 Manual test found definition!', result);
                }
                else {
                    console.log('❌ Manual test found no definition');
                }
            });
        }
    });
    context.subscriptions.push(disposable1, disposable2, disposable3, testCommand);
    console.log('✅ Definition provider registered for HTML files');
}
exports.activate = activate;
class CssClassDefinitionProvider {
    async provideDefinition(document, position, token) {
        console.log('🔍 provideDefinition called!');
        console.log('📄 File:', document.fileName);
        console.log('📍 Position:', position.line, position.character);
        const className = this.getClassNameAtPosition(document, position);
        console.log('🎯 Class name detected:', className);
        if (!className) {
            console.log('❌ No class name found at position');
            return undefined;
        }
        // Search in component SCSS file first
        const componentScssPath = this.getComponentScssPath(document.fileName);
        console.log('📁 Looking for component SCSS at:', componentScssPath);
        if (componentScssPath && fs.existsSync(componentScssPath)) {
            console.log('✅ Component SCSS file exists, searching...');
            const definition = await this.findClassInFile(componentScssPath, className);
            if (definition) {
                console.log('🎉 Found definition in component SCSS!');
                return definition;
            }
            else {
                console.log('❌ Not found in component SCSS');
            }
        }
        else {
            console.log('❌ Component SCSS file does not exist');
        }
        // Fallback to global styles
        const globalStylesPath = this.getGlobalStylesPath(document.fileName);
        console.log('🌍 Looking for global styles at:', globalStylesPath);
        if (globalStylesPath && fs.existsSync(globalStylesPath)) {
            console.log('✅ Global styles file exists, searching...');
            const definition = await this.findClassInFile(globalStylesPath, className);
            if (definition) {
                console.log('🎉 Found definition in global styles!');
                return definition;
            }
            else {
                console.log('❌ Not found in global styles');
            }
        }
        else {
            console.log('❌ Global styles file does not exist');
        }
        console.log('💥 No definition found anywhere');
        return undefined;
    }
    getClassNameAtPosition(document, position) {
        console.log('🔍 getClassNameAtPosition called');
        const wordRange = document.getWordRangeAtPosition(position);
        console.log('📍 Word range:', wordRange);
        if (!wordRange) {
            console.log('❌ No word range found');
            return undefined;
        }
        const word = document.getText(wordRange);
        console.log('📝 Word at position:', word);
        const line = document.lineAt(position.line);
        const lineText = line.text;
        console.log('📄 Line text:', lineText);
        console.log('📍 Character position:', position.character);
        // Check if we're inside a class attribute
        const classRegex = /class\s*=\s*["']([^"']*)/g;
        let match;
        while ((match = classRegex.exec(lineText)) !== null) {
            const classContent = match[1];
            const startIndex = match.index + match[0].length - classContent.length;
            const endIndex = startIndex + classContent.length;
            console.log(`🎯 Found class attribute: "${classContent}" at positions ${startIndex}-${endIndex}`);
            if (position.character >= startIndex && position.character <= endIndex) {
                console.log(`✅ Cursor is inside class attribute! Returning: "${word}"`);
                return word;
            }
        }
        console.log('❌ Cursor is not inside any class attribute');
        return undefined;
    }
    getComponentScssPath(htmlFilePath) {
        console.log('📁 getComponentScssPath called with:', htmlFilePath);
        const dir = path.dirname(htmlFilePath);
        console.log('📂 Directory:', dir);
        const fileName = path.basename(htmlFilePath);
        console.log('📄 Full filename:', fileName);
        // Check if it's a component HTML file
        if (!fileName.endsWith('.component.html')) {
            console.log('❌ File does not end with .component.html');
            return undefined;
        }
        // Replace .component.html with .component.scss
        const scssFileName = fileName.replace('.component.html', '.component.scss');
        console.log('🔄 SCSS filename:', scssFileName);
        const scssPath = path.join(dir, scssFileName);
        console.log('📁 Expected SCSS path:', scssPath);
        // Check if file exists
        const exists = fs.existsSync(scssPath);
        console.log('✅ SCSS file exists?', exists);
        return scssPath;
    }
    getGlobalStylesPath(htmlFilePath) {
        console.log('🌍 getGlobalStylesPath called with:', htmlFilePath);
        // Walk up the directory tree to find src folder
        let currentDir = path.dirname(htmlFilePath);
        console.log('📂 Starting directory:', currentDir);
        let attempts = 0;
        while (currentDir !== path.dirname(currentDir) && attempts < 10) {
            attempts++;
            console.log(`🔍 Attempt ${attempts}: Checking directory:`, currentDir);
            const srcPath = path.join(currentDir, 'src');
            console.log('📁 Checking for src folder at:', srcPath);
            if (fs.existsSync(srcPath)) {
                console.log('✅ Found src folder!');
                // Check for styles.scss first, then styles.css
                const scssPath = path.join(srcPath, 'styles.scss');
                console.log('📁 Checking for styles.scss at:', scssPath);
                if (fs.existsSync(scssPath)) {
                    console.log('✅ Found styles.scss!');
                    return scssPath;
                }
                const cssPath = path.join(srcPath, 'styles.css');
                console.log('📁 Checking for styles.css at:', cssPath);
                if (fs.existsSync(cssPath)) {
                    console.log('✅ Found styles.css!');
                    return cssPath;
                }
                console.log('❌ No styles file found in src folder');
                break;
            }
            const parentDir = path.dirname(currentDir);
            console.log('⬆️ Moving up to parent:', parentDir);
            currentDir = parentDir;
        }
        console.log('❌ No src folder found after checking all parent directories');
        return undefined;
    }
    async findClassInFile(filePath, className) {
        console.log(`🔍 findClassInFile called with file: ${filePath}, class: ${className}`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            console.log('📄 File content length:', content.length);
            console.log('📄 First 200 chars:', content.substring(0, 200));
            const lines = content.split('\n');
            console.log('📄 Total lines:', lines.length);
            // Look for .className or .className { patterns
            const classRegex = new RegExp(`\\.${this.escapeRegex(className)}\\s*[{,\\s]`, 'g');
            console.log('🔍 Searching with regex:', classRegex.toString());
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                classRegex.lastIndex = 0; // Reset regex for each line
                const match = classRegex.exec(line);
                if (match) {
                    console.log(`🎉 Found match on line ${i + 1}: "${line.trim()}"`);
                    console.log('🎯 Match details:', match);
                    const position = new vscode.Position(i, match.index);
                    const uri = vscode.Uri.file(filePath);
                    return new vscode.Location(uri, position);
                }
                else {
                    // Log a few lines to see what we're searching through
                    if (i < 10) {
                        console.log(`Line ${i + 1}: "${line.trim()}"`);
                    }
                }
            }
            console.log(`❌ No match found for class "${className}" in file`);
        }
        catch (error) {
            console.error('💥 Error reading file:', error);
        }
        return undefined;
    }
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map