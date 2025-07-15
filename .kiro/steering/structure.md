# Project Structure

## Root Files
- `index.html`: Main entry point with game container and script includes
- `game.js`: Core game logic, Phaser configuration, and scene management
- `styles.css`: Global styles, responsive design, and mobile optimizations
- `phaser.min.js`: Phaser.js game engine (local copy)
- `README.md`: Project documentation and TED-Ed puzzle reference

## Configuration Structure
- `.kiro/`: Kiro IDE configuration and specifications
  - `specs/bridge-escape-game/`: Feature specifications and design docs
  - `steering/`: AI assistant guidance files
- `.vscode/`: VS Code workspace settings
- `.git/`: Version control

## Code Organization Patterns

### JavaScript Structure
- **GAME_CONFIG**: Centralized Phaser configuration object
- **Scene functions**: `preload()`, `create()`, `update()` pattern
- **Event handlers**: Window load and resize listeners
- **Global variables**: Minimal scope, prefixed with purpose

### CSS Architecture
- **Reset styles**: Universal box-sizing and margin/padding reset
- **Component-based**: Logical grouping by UI element
- **Mobile-first**: Progressive enhancement with media queries
- **CSS custom properties**: Use for consistent theming

### Asset Management
- Local files preferred over CDN for offline capability
- Static assets served directly without bundling
- Responsive images and scalable graphics recommended

## Naming Conventions
- **Files**: kebab-case for HTML/CSS, camelCase for JS
- **CSS classes**: kebab-case with BEM methodology where applicable
- **JS variables**: camelCase, UPPER_CASE for constants
- **Functions**: Descriptive verbs in camelCase