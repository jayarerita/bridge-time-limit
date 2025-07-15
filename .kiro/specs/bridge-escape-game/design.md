# Design Document

## Overview

The Bridge Escape Game is a web-based puzzle game built with Phaser.js that recreates the classic bridge crossing riddle. The game features a single-scene interface where players strategically move four characters across a rope bridge within a 17-minute time limit. The design emphasizes intuitive drag-and-drop mechanics, pixel art aesthetics, and responsive gameplay that works seamlessly on both desktop and mobile devices.

## Architecture

### Game Structure
```
Bridge Escape Game
├── HTML Entry Point (index.html)
├── Game Engine (Phaser.js)
├── Game Scene (MainGameScene)
├── Game State Manager
├── Character System
├── Timer System
├── Input Handler
└── UI Components
```

### Core Systems
- **Scene Management**: Single main game scene with overlay states for win/lose conditions
- **State Management**: Centralized game state tracking character positions, timer, and lantern location
- **Input System**: Unified input handling for mouse and touch events
- **Animation System**: Character movement animations and visual feedback
- **Audio System**: Sound effects for actions and ambient atmosphere

## Components and Interfaces

### Character Component
```javascript
class Character {
  constructor(name, crossingTime, sprite) {
    this.name = name;
    this.crossingTime = crossingTime; // in minutes
    this.side = 'left'; // 'left' or 'right'
    this.sprite = sprite;
    this.selected = false;
  }
}
```

### Game State Manager
```javascript
class GameState {
  constructor() {
    this.timeRemaining = 17; // minutes
    this.lanternSide = 'left';
    this.characters = [];
    this.gameStatus = 'playing'; // 'playing', 'won', 'lost'
    this.moveHistory = [];
  }
}
```

### Bridge Controller
```javascript
class BridgeController {
  validateMove(characters) {
    // Check if move is valid (max 2 characters, lantern rules)
  }
  
  executeCrossing(characters) {
    // Handle character movement and time calculation
  }
}
```

### Input Handler
```javascript
class InputHandler {
  constructor(scene) {
    this.scene = scene;
    this.selectedCharacters = [];
  }
  
  handleCharacterSelection(character) {
    // Toggle character selection
  }
  
  handleCrossingAction() {
    // Initiate bridge crossing
  }
}
```

## Data Models

### Character Data
- **Player**: { name: "You", time: 1, sprite: "player_sprite" }
- **Lab Assistant**: { name: "Lab Assistant", time: 2, sprite: "assistant_sprite" }
- **Janitor**: { name: "Janitor", time: 5, sprite: "janitor_sprite" }
- **Professor**: { name: "Professor", time: 10, sprite: "professor_sprite" }

### Game Configuration
```javascript
const GAME_CONFIG = {
  width: 1024,
  height: 768,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
```

### Visual Layout
- **Left Side**: Starting area with character positions
- **Bridge**: Central crossing area with rope bridge graphic
- **Right Side**: Safety area destination
- **UI Panel**: Timer, selected characters, action buttons
- **Lantern**: Visual indicator following current position

## Error Handling

### Input Validation
- **Invalid Character Selection**: Prevent selection of more than 2 characters
- **Lantern Rule Violations**: Block moves that don't include lantern carrier
- **Same-Side Moves**: Prevent characters from crossing to their current side

### Game State Errors
- **Timer Expiration**: Graceful transition to game over state
- **Asset Loading Failures**: Fallback to colored rectangles for missing sprites
- **Touch/Mouse Event Conflicts**: Unified event handling to prevent double-triggers

### User Feedback
- **Visual Indicators**: Red highlighting for invalid selections
- **Status Messages**: Clear text feedback for rule violations
- **Animation Feedback**: Smooth transitions for valid moves

## Testing Strategy

### Unit Testing
- **Character Logic**: Test crossing time calculations and position updates
- **Game State**: Verify state transitions and rule enforcement
- **Input Handling**: Test selection and movement validation
- **Timer System**: Validate countdown and time subtraction logic

### Integration Testing
- **Scene Transitions**: Test game flow from start to win/lose states
- **Cross-Platform Input**: Verify mouse and touch input compatibility
- **Asset Loading**: Test game initialization with all required assets
- **Responsive Design**: Validate layout on different screen sizes

### User Experience Testing
- **Puzzle Solvability**: Verify the puzzle can be solved within time limit
- **Control Intuitiveness**: Test ease of character selection and movement
- **Visual Clarity**: Ensure all game elements are clearly distinguishable
- **Performance**: Validate smooth gameplay on target devices

### Browser Compatibility Testing
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Android Chrome
- **GitHub Pages**: Test deployment and asset loading from static hosting

## Visual Design Specifications

### Pixel Art Style
- **Resolution**: 32x32 pixels for character sprites
- **Color Palette**: Limited palette with dark, atmospheric tones
- **Animation**: Simple 2-frame walking animations for bridge crossing

### Scene Layout
- **Bridge**: Rope bridge spanning center of screen with wooden planks
- **Gorge**: Dark chasm below bridge with atmospheric fog effects
- **Sides**: Stone platforms on left (start) and right (safety) sides
- **Lantern**: Glowing yellow circle with light radius effect

### UI Elements
- **Timer**: Large, prominent countdown display
- **Character Info**: Name and crossing time when selected
- **Action Buttons**: "Cross Bridge" and "Reset Game" buttons
- **Status Text**: Current game state and instruction messages