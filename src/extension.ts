import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

    const provider = new CssClassDefinitionProvider();
    
    // Register definition provider for HTML files with multiple selectors
    const disposable1 = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', language: 'html' },
        provider
    );
    
    const disposable2 = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', pattern: '**/*.html' },
        provider
    );
    
    const disposable3 = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', pattern: '**/*.component.html' },
        provider
    );
    
    context.subscriptions.push(disposable1, disposable2, disposable3);
}

class CssClassDefinitionProvider implements vscode.DefinitionProvider {
    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {
        
        const className = this.getClassNameAtPosition(document, position);
        
        if (!className) {
            return undefined;
        }

        // Search in component SCSS file first
        const componentScssPath = this.getComponentScssPath(document.fileName);
        
        if (componentScssPath && fs.existsSync(componentScssPath)) {
            const definition = await this.findClassInFile(componentScssPath, className);
            if (definition) {
                return definition;
            } else {
                // Not found in component scss, will try global styles next
            }
        } else {
            // Component SCSS file does not exist, will try global styles next
        }

        // Fallback to global styles
        const globalStylesPath = this.getGlobalStylesPath(document.fileName);
        
        if (globalStylesPath && fs.existsSync(globalStylesPath)) {
            const definition = await this.findClassInFile(globalStylesPath, className);
            if (definition) {
                return definition;
            } else {
                // Not found in global styles
            }
        } else {
            // Global styles file does not exist
        }
        // No definition found anywhere
        return undefined;
    }

    private getClassNameAtPosition(document: vscode.TextDocument, position: vscode.Position): string | undefined {

        const wordRange = document.getWordRangeAtPosition(position);

        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);

        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        // Check if we're inside a class attribute
        const classRegex = /class\s*=\s*["']([^"']*)/g;
        let match;
        
        while ((match = classRegex.exec(lineText)) !== null) {
            const classContent = match[1];
            const startIndex = match.index + match[0].length - classContent.length;
            const endIndex = startIndex + classContent.length;
            
            if (position.character >= startIndex && position.character <= endIndex) {
                return word;
            }
        }

        // Cursor is not inside any class attribute
        return undefined;
    }

    private getComponentScssPath(htmlFilePath: string): string | undefined {
        const dir = path.dirname(htmlFilePath);
        const fileName = path.basename(htmlFilePath);
        
        // Check if it's a component HTML file
        if (!fileName.endsWith('.component.html')) {
            return undefined;
        }
        
        // Replace .component.html with .component.scss
        const scssFileName = fileName.replace('.component.html', '.component.scss');
        
        const scssPath = path.join(dir, scssFileName);
        return scssPath;
    }

    private getGlobalStylesPath(htmlFilePath: string): string | undefined {
        // Walk up the directory tree to find src folder
        let currentDir = path.dirname(htmlFilePath);
        let attempts = 0;
        while (currentDir !== path.dirname(currentDir) && attempts < 10) {
            attempts++;
            const srcPath = path.join(currentDir, 'src');
            
            if (fs.existsSync(srcPath)) {
                // Found src folder, now look for styles.scss or styles.css
                const scssPath = path.join(srcPath, 'styles.scss');
                
                if (fs.existsSync(scssPath)) {
                    return scssPath;
                }
                
                const cssPath = path.join(srcPath, 'styles.css');
                
                if (fs.existsSync(cssPath)) {
                    return cssPath;
                }

                // No styles file found in src folder
                break;
            }
            
            const parentDir = path.dirname(currentDir);
            // Move up to the parent directory
            currentDir = parentDir;
        }

        // No src folder found after checking all parent directories
        return undefined;
    }

    private async findClassInFile(filePath: string, className: string): Promise<vscode.Location | undefined> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            const lines = content.split('\n');
            
            // Look for .className or .className { patterns
            const classRegex = new RegExp(`\\.${this.escapeRegex(className)}\\s*[{,\\s]`, 'g');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                classRegex.lastIndex = 0; // Reset regex for each line
                const match = classRegex.exec(line);
                
                if (match) {
                    const position = new vscode.Position(i, match.index);
                    const uri = vscode.Uri.file(filePath);
                    return new vscode.Location(uri, position);
                } else {
                    // Log a few lines to see what we're searching through
                    // if (i < 10) {
                    //     console.log(`Line ${i + 1}: "${line.trim()}"`);
                    // }
                }
            }

            // No match found for class
        } catch (error) {
            console.error('Error reading file:', error);
        }
        
        return undefined;
    }

    private escapeRegex(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export function deactivate() {}