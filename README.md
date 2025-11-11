# Angular CSS Navigator

A VSCode extension that enables "Go to Definition" functionality for CSS classes in Angular projects.

## Features

- **Ctrl+Click Navigation**: Ctrl+click (or Cmd+click on Mac) any CSS class in your Angular HTML templates to jump to its definition
- **Component-Scoped Search**: First searches in the component's own SCSS file
- **Global Fallback**: If not found locally, searches in global `styles.scss` or `styles.css`
- **Angular Project Aware**: Understands Angular's component structure automatically

## How It Works

1. When you Ctrl+click a CSS class in an HTML file, the extension:
2. Extracts the class name at your cursor position
3. Looks for the corresponding `.component.scss` file in the same directory
4. Searches for the class definition (e.g., `.my-class`)
5. If not found, falls back to global styles in `src/styles.scss` or `src/styles.css`
6. Navigates to the definition if found

## Example Usage

Given this Angular component structure:
```
src/
├── app/
│   └── my-component/
│       ├── my-component.component.ts
│       ├── my-component.component.html
│       └── my-component.component.scss
└── styles.scss
```

In `my-component.component.html`:
```html
<div class="header-title">Welcome</div>
<div class="global-button">Click me</div>
```

In `my-component.component.scss`:
```scss
.header-title {
  font-size: 2rem;
  color: blue;
}
```

In `styles.scss`:
```scss
.global-button {
  padding: 10px;
  background: green;
}
```

- Ctrl+clicking `header-title` → jumps to `my-component.component.scss`
- Ctrl+clicking `global-button` → jumps to `styles.scss`

## Development Setup

1. Clone this repository
2. Run `npm install`
3. Open in VSCode
4. Press `F5` to launch Extension Development Host
5. Test with an Angular project

## Building and Installing

1. Install vsce: `npm install -g vsce`
2. Build the extension: `vsce package`
3. Install the generated `.vsix` file: `code --install-extension angular-css-navigator-1.0.0.vsix`

## Requirements

- VSCode 1.60.0 or higher
- Angular projects with standard component structure

## Known Limitations

- Currently supports basic CSS class selectors (`.class-name`)
- Doesn't support complex selectors or CSS modules yet
- Requires standard Angular component naming conventions

## Contributing

Feel free to submit issues and pull requests to improve the extension!

## License

MIT