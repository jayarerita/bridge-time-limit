// Core game classes

/**
 * Character class representing each game character with their properties
 */
class Character {
    constructor(name, crossingTime, spriteKey = null) {
        this.name = name;
        this.crossingTime = crossingTime; // in minutes
        this.side = 'left'; // 'left' or 'right' side of bridge
        this.spriteKey = spriteKey; // Phaser sprite key
        this.sprite = null; // Will hold the actual Phaser sprite object
        this.selected = false; // Selection state for UI
        this.position = { x: 0, y: 0 }; // Screen position
    }

    /**
     * Toggle selection state of this character
     */
    toggleSelection() {
        this.selected = !this.selected;
    }

    /**
     * Move character to specified side of bridge
     */
    moveTo(side) {
        if (side === 'left' || side === 'right') {
            this.side = side;
        }
    }

    /**
     * Check if character is on specified side
     */
    isOnSide(side) {
        return this.side === side;
    }
}

/**
 * GameState class to manage overall game state
 */
class GameState {
    constructor() {
        this.timeRemaining = 17; // minutes remaining
        this.lanternSide = 'left'; // which side the lantern is on
        this.gameStatus = 'playing'; // 'playing', 'won', 'lost'
        this.moveHistory = []; // array of move records
        this.characters = this.initializeCharacters();
    }

    /**
     * Initialize the four game characters
     */
    initializeCharacters() {
        return [
            new Character('You', 1, 'player'),
            new Character('Lab Assistant', 2, 'assistant'),
            new Character('Janitor', 5, 'janitor'),
            new Character('Professor', 10, 'professor')
        ];
    }

    /**
     * Get characters currently on specified side
     */
    getCharactersOnSide(side) {
        return this.characters.filter(char => char.isOnSide(side));
    }

    /**
     * Get currently selected characters
     */
    getSelectedCharacters() {
        return this.characters.filter(char => char.selected);
    }

    /**
     * Update game timer by subtracting crossing time
     */
    updateTimer(timeUsed) {
        this.timeRemaining -= timeUsed;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.gameStatus = 'lost';
        }
        
        // Check victory condition after timer update
        this.checkVictoryCondition();
    }

    /**
     * Get formatted time string for display
     */
    getFormattedTime() {
        const minutes = Math.floor(this.timeRemaining);
        const seconds = Math.floor((this.timeRemaining - minutes) * 60);
        
        if (seconds > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:00`;
        }
    }

    /**
     * Check if game is in critical time (less than 3 minutes)
     */
    isCriticalTime() {
        return this.timeRemaining <= 3;
    }

    /**
     * Check if game is in warning time (less than 7 minutes)
     */
    isWarningTime() {
        return this.timeRemaining <= 7;
    }

    /**
     * Move lantern to specified side
     */
    moveLantern(side) {
        if (side === 'left' || side === 'right') {
            this.lanternSide = side;
        }
    }

    /**
     * Check if all characters have reached safety (right side)
     */
    checkVictoryCondition() {
        const charactersOnRight = this.getCharactersOnSide('right');
        if (charactersOnRight.length === this.characters.length) {
            this.gameStatus = 'won';
            return true;
        }
        return false;
    }

    /**
     * Add move to history
     */
    recordMove(characters, timeUsed, fromSide, toSide) {
        this.moveHistory.push({
            characters: characters.map(char => char.name),
            timeUsed: timeUsed,
            fromSide: fromSide,
            toSide: toSide,
            timestamp: Date.now()
        });
    }

    /**
     * Reset game to initial state
     */
    reset() {
        this.timeRemaining = 17;
        this.lanternSide = 'left';
        this.gameStatus = 'playing';
        this.moveHistory = [];
        this.characters.forEach(char => {
            char.side = 'left';
            char.selected = false;
        });
    }
}

/**
 * BridgeController class for move validation and execution
 */
class BridgeController {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Validate if a move is legal according to game rules
     */
    validateMove(characters) {
        const errors = [];

        // Rule 1: Maximum 2 characters can cross together
        if (characters.length === 0) {
            errors.push('No characters selected for crossing');
            return { valid: false, errors };
        }

        if (characters.length > 2) {
            errors.push('Maximum 2 characters can cross together');
        }

        // Rule 2: All selected characters must be on the same side
        const sides = [...new Set(characters.map(char => char.side))];
        if (sides.length > 1) {
            errors.push('All selected characters must be on the same side');
        }

        // Rule 3: Enhanced lantern validation
        const lanternValidation = this.validateLanternMovement(characters);
        if (!lanternValidation.valid) {
            errors.push(...lanternValidation.errors);
        }

        // Rule 4: Game must be in playing state
        if (this.gameState.gameStatus !== 'playing') {
            errors.push('Game is not in playing state');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Enhanced lantern movement validation with detailed feedback
     */
    validateLanternMovement(characters) {
        const errors = [];
        
        if (characters.length === 0) {
            errors.push('No characters selected to carry the lantern');
            return { valid: false, errors };
        }
        
        // Check if lantern is on the same side as selected characters
        const characterSide = characters[0].side;
        if (this.gameState.lanternSide !== characterSide) {
            errors.push(`Lantern is on the ${this.gameState.lanternSide} side, but selected characters are on the ${characterSide} side`);
        }
        
        // Validate lantern accompaniment rule
        const charactersOnLanternSide = this.gameState.getCharactersOnSide(this.gameState.lanternSide);
        if (charactersOnLanternSide.length > 0 && characters.length === 0) {
            errors.push('At least one character must accompany the lantern when crossing');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Execute a bridge crossing move with animation
     */
    executeCrossing(characters, scene = null) {
        const validation = this.validateMove(characters);
        
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        // Calculate crossing time (use the slowest character's time)
        const crossingTime = Math.max(...characters.map(char => char.crossingTime));
        
        // Determine destination side
        const fromSide = characters[0].side;
        const toSide = fromSide === 'left' ? 'right' : 'left';

        // If scene is provided, animate the crossing
        if (scene) {
            this.animateCrossing(characters, fromSide, toSide, crossingTime, scene);
        } else {
            // Immediate move without animation
            this.completeCrossing(characters, fromSide, toSide, crossingTime);
        }

        return {
            success: true,
            timeUsed: crossingTime,
            fromSide: fromSide,
            toSide: toSide,
            gameStatus: this.gameState.gameStatus
        };
    }

    /**
     * Animate character crossing with visual effects
     */
    animateCrossing(characters, fromSide, toSide, crossingTime, scene) {
        const bridgeCenterX = 512;
        const destinationX = toSide === 'right' ? 824 : 200;
        const animationDuration = 2000; // 2 seconds animation

        // Disable input during animation
        scene.inputHandler.setInputEnabled(false);

        // Create animation timeline
        const timeline = scene.tweens.createTimeline();

        characters.forEach((character, index) => {
            // Move to bridge center first
            timeline.add({
                targets: character.sprite,
                x: bridgeCenterX,
                duration: animationDuration / 2,
                ease: 'Power2.easeInOut',
                delay: index * 200 // Stagger character animations
            });

            // Then move to destination
            timeline.add({
                targets: character.sprite,
                x: destinationX,
                duration: animationDuration / 2,
                ease: 'Power2.easeInOut'
            });
        });

        // Animate lantern container movement with enhanced following logic
        const lanternDestX = toSide === 'right' ? 774 : 150;
        const lanternDestY = 320;
        
        // First, make lantern follow characters to bridge center
        timeline.add({
            targets: scene.lanternContainer,
            x: bridgeCenterX,
            y: lanternDestY,
            duration: animationDuration / 2,
            ease: 'Power2.easeInOut'
        });
        
        // Then move lantern to destination side
        timeline.add({
            targets: scene.lanternContainer,
            x: lanternDestX,
            y: lanternDestY,
            duration: animationDuration / 2,
            ease: 'Power2.easeInOut'
        });
        
        // Update lantern label position during animation
        timeline.add({
            targets: scene.lanternLabel,
            x: lanternDestX,
            y: lanternDestY + 35,
            duration: animationDuration,
            ease: 'Power2.easeInOut'
        });

        // Complete the crossing when animation finishes
        timeline.setCallback('onComplete', () => {
            this.completeCrossing(characters, fromSide, toSide, crossingTime);
            scene.inputHandler.setInputEnabled(true);
            scene.updateTimerDisplay();
            scene.checkGameEndConditions();
        });

        timeline.play();
    }

    /**
     * Complete the crossing by updating game state
     */
    completeCrossing(characters, fromSide, toSide, crossingTime) {
        // Move characters to destination side
        characters.forEach(char => {
            char.moveTo(toSide);
            char.selected = false; // Deselect after move
        });

        // Move lantern with characters
        this.gameState.moveLantern(toSide);

        // Update timer
        this.gameState.updateTimer(crossingTime);

        // Record the move
        this.gameState.recordMove(characters, crossingTime, fromSide, toSide);

        // Check victory condition
        this.gameState.checkVictoryCondition();
    }

    /**
     * Get available moves for current game state
     */
    getAvailableMoves() {
        const moves = [];
        const leftCharacters = this.gameState.getCharactersOnSide('left');
        const rightCharacters = this.gameState.getCharactersOnSide('right');

        // Generate possible moves from left side
        if (this.gameState.lanternSide === 'left' && leftCharacters.length > 0) {
            // Single character moves
            leftCharacters.forEach(char => {
                moves.push([char]);
            });
            
            // Two character combinations
            for (let i = 0; i < leftCharacters.length; i++) {
                for (let j = i + 1; j < leftCharacters.length; j++) {
                    moves.push([leftCharacters[i], leftCharacters[j]]);
                }
            }
        }

        // Generate possible moves from right side
        if (this.gameState.lanternSide === 'right' && rightCharacters.length > 0) {
            // Single character moves
            rightCharacters.forEach(char => {
                moves.push([char]);
            });
            
            // Two character combinations
            for (let i = 0; i < rightCharacters.length; i++) {
                for (let j = i + 1; j < rightCharacters.length; j++) {
                    moves.push([rightCharacters[i], rightCharacters[j]]);
                }
            }
        }

        return moves;
    }
}

/**
 * InputHandler class for unified mouse and touch event management
 */
class InputHandler {
    constructor(scene) {
        this.scene = scene;
        this.selectedCharacters = [];
        this.characterInfoText = null;
        this.selectionHighlights = new Map();
        this.inputEnabled = true;
    }

    /**
     * Initialize input handlers for character sprites
     */
    setupCharacterInput(characters) {
        characters.forEach(character => {
            if (character.sprite) {
                // Make sprite interactive with touch-friendly hit area
                character.sprite.setInteractive();
                const hitAreaSize = this.scene.getTouchFriendlySize(40);
                character.sprite.input.hitArea.setSize(hitAreaSize, hitAreaSize);
                
                // Add pointer events for both mouse and touch
                character.sprite.on('pointerdown', (pointer, localX, localY, event) => {
                    // Prevent event bubbling
                    event.stopPropagation();
                    this.handleCharacterSelection(character);
                });
                
                // Enhanced mobile touch handling
                if (this.scene.isMobile) {
                    // Use longer press for info display on mobile
                    let pressTimer;
                    character.sprite.on('pointerdown', () => {
                        pressTimer = setTimeout(() => {
                            this.showCharacterInfo(character);
                        }, 500); // Show info after 500ms press
                    });
                    
                    character.sprite.on('pointerup', () => {
                        if (pressTimer) {
                            clearTimeout(pressTimer);
                        }
                    });
                    
                    character.sprite.on('pointerout', () => {
                        if (pressTimer) {
                            clearTimeout(pressTimer);
                        }
                    });
                } else {
                    // Desktop hover effects
                    character.sprite.on('pointerover', () => {
                        this.showCharacterInfo(character);
                        if (!character.selected) {
                            character.sprite.setTint(0xcccccc); // Light gray hover
                        }
                    });
                    
                    character.sprite.on('pointerout', () => {
                        this.hideCharacterInfo();
                        if (!character.selected) {
                            character.sprite.clearTint(); // Remove hover tint
                        }
                    });
                }
            }
        });
    }

    /**
     * Handle character selection with toggle functionality
     */
    handleCharacterSelection(character) {
        if (!this.inputEnabled) {
            return; // Ignore input during animations
        }

        // Toggle character selection
        character.toggleSelection();
        
        // Update visual highlighting
        this.updateCharacterHighlight(character);
        
        // Update selected characters list
        this.updateSelectedCharactersList();
        
        // Show character information
        this.showCharacterInfo(character);
        
        console.log(`Character ${character.name} selection toggled. Selected: ${character.selected}`);
    }

    /**
     * Update visual highlighting for character selection
     */
    updateCharacterHighlight(character) {
        if (character.selected) {
            // Add selection highlight
            character.sprite.setTint(0x00ff00); // Green tint for selected
            
            // Create selection ring if it doesn't exist
            if (!this.selectionHighlights.has(character)) {
                const highlightRadius = this.scene.getTouchFriendlySize(20);
                const strokeWidth = this.scene.isMobile ? 3 : 2;
                const highlight = this.scene.add.circle(
                    character.sprite.x, 
                    character.sprite.y, 
                    highlightRadius, 
                    0x00ff00, 
                    0.3
                );
                highlight.setStrokeStyle(strokeWidth, 0x00ff00);
                this.selectionHighlights.set(character, highlight);
            }
            this.selectionHighlights.get(character).setVisible(true);
        } else {
            // Remove selection highlight
            character.sprite.clearTint();
            
            // Hide selection ring
            if (this.selectionHighlights.has(character)) {
                this.selectionHighlights.get(character).setVisible(false);
            }
        }
    }

    /**
     * Update the list of selected characters
     */
    updateSelectedCharactersList() {
        this.selectedCharacters = this.scene.gameState.getSelectedCharacters();
        
        // Update selection status display
        if (this.scene.selectionStatusText) {
            this.scene.selectionStatusText.setText(`Selected: ${this.selectedCharacters.length}/2 characters`);
        }
        
        console.log(`Selected characters: ${this.selectedCharacters.map(c => c.name).join(', ')}`);
    }

    /**
     * Display character information when selected or hovered
     */
    showCharacterInfo(character) {
        // Remove existing info text
        if (this.characterInfoText) {
            this.characterInfoText.destroy();
        }
        
        // Create new info text with responsive sizing
        const infoText = `${character.name}\nCrossing Time: ${character.crossingTime} minute${character.crossingTime > 1 ? 's' : ''}\nSide: ${character.side}\n${character.selected ? 'SELECTED' : (this.scene.isMobile ? 'Tap to select' : 'Click to select')}`;
        
        const fontSize = this.scene.getResponsiveFontSize(12);
        const padding = this.scene.getResponsiveSpacing(8);
        
        this.characterInfoText = this.scene.add.text(
            character.sprite.x + 40, 
            character.sprite.y - 30, 
            infoText,
            {
                fontSize: `${fontSize}px`,
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: padding, y: padding / 2 },
                fontFamily: 'Arial'
            }
        );
        
        // Auto-hide after longer time on mobile for better UX
        if (!character.selected) {
            const hideDelay = this.scene.isMobile ? 5000 : 3000;
            this.scene.time.delayedCall(hideDelay, () => {
                this.hideCharacterInfo();
            });
        }
    }

    /**
     * Hide character information display
     */
    hideCharacterInfo() {
        if (this.characterInfoText) {
            this.characterInfoText.destroy();
            this.characterInfoText = null;
        }
    }

    /**
     * Clear all character selections
     */
    clearAllSelections() {
        this.scene.gameState.characters.forEach(character => {
            if (character.selected) {
                character.selected = false;
                this.updateCharacterHighlight(character);
            }
        });
        this.updateSelectedCharactersList();
        this.hideCharacterInfo();
    }

    /**
     * Get currently selected characters
     */
    getSelectedCharacters() {
        return this.selectedCharacters;
    }

    /**
     * Update highlight positions when characters move
     */
    updateHighlightPositions() {
        this.selectionHighlights.forEach((highlight, character) => {
            highlight.setPosition(character.sprite.x, character.sprite.y);
        });
    }

    /**
     * Enable or disable input handling
     */
    setInputEnabled(enabled) {
        this.inputEnabled = enabled;
    }

    /**
     * Handle bridge crossing action
     */
    handleCrossingAction() {
        if (!this.inputEnabled) {
            return;
        }

        const selectedCharacters = this.getSelectedCharacters();
        const result = this.scene.bridgeController.executeCrossing(selectedCharacters, this.scene);
        
        if (!result.success) {
            this.scene.showErrorMessage(result.errors);
        } else {
            // Clear selections after successful crossing
            this.clearAllSelections();
        }
    }
}

/**
 * MainGameScene class extending Phaser.Scene for the main game interface
 */
class MainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGameScene' });
        this.gameState = null;
        this.bridgeController = null;
        this.characterSprites = [];
        this.lanternSprite = null;
        this.inputHandler = null;
        this.scaleFactor = 1;
        this.isMobile = false;
        this.uiElements = [];
    }

    /**
     * Initialize responsive scaling based on screen size
     */
    initResponsiveScaling() {
        const gameWidth = this.scale.gameSize.width;
        const gameHeight = this.scale.gameSize.height;
        
        // Detect mobile devices
        this.isMobile = gameWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Calculate scale factor based on screen size
        this.scaleFactor = Math.min(gameWidth / 1024, gameHeight / 768);
        
        // Ensure minimum scale for readability
        if (this.scaleFactor < 0.5) {
            this.scaleFactor = 0.5;
        }
        
        console.log(`Responsive scaling initialized: scaleFactor=${this.scaleFactor}, isMobile=${this.isMobile}, size=${gameWidth}x${gameHeight}`);
    }

    /**
     * Get responsive font size based on scale factor
     */
    getResponsiveFontSize(baseSize) {
        const scaledSize = baseSize * this.scaleFactor;
        return Math.max(scaledSize, this.isMobile ? 12 : 10); // Minimum font size
    }

    /**
     * Get responsive spacing based on scale factor
     */
    getResponsiveSpacing(baseSpacing) {
        return baseSpacing * this.scaleFactor;
    }

    /**
     * Get touch-friendly size for interactive elements
     */
    getTouchFriendlySize(baseSize) {
        if (this.isMobile) {
            return Math.max(baseSize * 1.5, 44); // iOS minimum touch target: 44px
        }
        return baseSize;
    }

    /**
     * Preload method to load placeholder graphics and sprites
     */
    preload() {
        console.log('Loading game assets...');
        
        // Create placeholder colored rectangles for sprites since we don't have actual images yet
        // Character sprites (32x32 pixels as per design spec)
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('assistant', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('janitor', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('professor', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        
        // Environment sprites
        this.load.image('bridge', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('platform', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('lantern', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        
        // Create colored rectangles as placeholders after loading
        this.load.on('complete', () => {
            this.createPlaceholderGraphics();
        });
    }

    /**
     * Create colored placeholder graphics for sprites
     */
    createPlaceholderGraphics() {
        const graphics = this.add.graphics();
        
        // Character colors
        const characterColors = {
            player: 0x4CAF50,      // Green for player
            assistant: 0x2196F3,   // Blue for lab assistant
            janitor: 0xFF9800,     // Orange for janitor
            professor: 0x9C27B0    // Purple for professor
        };
        
        // Create character placeholder textures
        Object.keys(characterColors).forEach(key => {
            graphics.clear();
            graphics.fillStyle(characterColors[key]);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture(key, 32, 32);
        });
        
        // Create bridge placeholder (brown wooden planks)
        graphics.clear();
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(0, 0, 300, 20);
        graphics.generateTexture('bridge', 300, 20);
        
        // Create platform placeholder (gray stone)
        graphics.clear();
        graphics.fillStyle(0x696969);
        graphics.fillRect(0, 0, 150, 80);
        graphics.generateTexture('platform', 150, 80);
        
        // Create lantern placeholder (yellow glow with enhanced visual)
        graphics.clear();
        graphics.fillStyle(0xFFD700);
        graphics.fillCircle(16, 16, 12);
        // Add inner bright core
        graphics.fillStyle(0xFFFFAA);
        graphics.fillCircle(16, 16, 8);
        // Add outer glow ring
        graphics.lineStyle(2, 0xFFD700, 0.5);
        graphics.strokeCircle(16, 16, 15);
        graphics.generateTexture('lantern', 32, 32);
        
        graphics.destroy();
    }

    /**
     * Create method to set up the game scene with graphics and sprites
     */
    create() {
        console.log('Creating main game scene...');
        
        // Initialize responsive scaling first
        this.initResponsiveScaling();
        
        // Initialize core game classes
        this.gameState = new GameState();
        this.bridgeController = new BridgeController(this.gameState);
        this.inputHandler = new InputHandler(this);
        
        // Set up the scene background and environment
        this.createEnvironment();
        
        // Position character sprites
        this.createCharacterSprites();
        
        // Create lantern sprite
        this.createLanternSprite();
        
        // Set up character input handling after sprites are created
        this.inputHandler.setupCharacterInput(this.gameState.characters);
        
        // Create UI components
        this.createUIComponents();
        
        // Initialize timer system
        this.initializeTimerSystem();
        
        // Set up resize handler for dynamic scaling
        this.scale.on('resize', this.handleResize, this);
        
        console.log('Main game scene created successfully');
    }

    /**
     * Handle window resize events for dynamic responsive scaling
     */
    handleResize(gameSize) {
        console.log('Handling resize event:', gameSize);
        
        // Reinitialize responsive scaling
        this.initResponsiveScaling();
        
        // Update UI element positions and sizes
        this.updateUIElementsForResize();
    }

    /**
     * Update UI elements when screen size changes
     */
    updateUIElementsForResize() {
        // Update character sprite sizes
        this.gameState.characters.forEach(character => {
            if (character.sprite) {
                const spriteSize = this.getTouchFriendlySize(32);
                character.sprite.setDisplaySize(spriteSize, spriteSize);
            }
        });

        // Update selection highlights
        if (this.inputHandler) {
            this.inputHandler.selectionHighlights.forEach((highlight, character) => {
                const highlightRadius = this.getTouchFriendlySize(20);
                highlight.setRadius(highlightRadius);
            });
        }

        // Update lantern size
        if (this.lanternContainer) {
            const lanternSize = this.getTouchFriendlySize(32);
            this.lanternContainer.setScale(this.scaleFactor);
        }
    }

    /**
     * Create the environment graphics (bridge, gorge, platforms)
     */
    createEnvironment() {
        // Create gorge background (dark chasm)
        const gorge = this.add.rectangle(512, 400, 1024, 300, 0x0a0a0a);
        gorge.setAlpha(0.8);
        
        // Create left platform (starting area)
        const leftPlatform = this.add.image(200, 350, 'platform');
        leftPlatform.setTint(0x8B7355); // Brown stone color
        
        // Create right platform (safety area)
        const rightPlatform = this.add.image(824, 350, 'platform');
        rightPlatform.setTint(0x8B7355); // Brown stone color
        
        // Create rope bridge spanning the gorge
        const bridge = this.add.image(512, 350, 'bridge');
        bridge.setTint(0x8B4513); // Brown wood color
        
        // Add some atmospheric elements
        this.add.text(200, 280, 'START', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(824, 280, 'SAFETY', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    /**
     * Create and position the four character sprites on the left side
     */
    createCharacterSprites() {
        const leftSideX = 200;
        const startY = 300;
        const spacing = this.getResponsiveSpacing(40);
        
        this.gameState.characters.forEach((character, index) => {
            // Create sprite for character with responsive sizing
            const sprite = this.add.image(leftSideX, startY + (index * spacing), character.spriteKey);
            const spriteSize = this.getTouchFriendlySize(32);
            sprite.setDisplaySize(spriteSize, spriteSize);
            
            // Make sprite interactive with touch-friendly hit area
            sprite.setInteractive();
            const hitAreaSize = this.getTouchFriendlySize(40);
            sprite.input.hitArea.setSize(hitAreaSize, hitAreaSize);
            
            // Store reference to sprite in character object
            character.sprite = sprite;
            character.position.x = leftSideX;
            character.position.y = startY + (index * spacing);
            
            // Add character name and time labels with responsive font sizes
            const nameText = this.add.text(leftSideX + 50, startY + (index * spacing) - 5, character.name, {
                fontSize: `${this.getResponsiveFontSize(14)}px`,
                fill: '#ffffff',
                fontFamily: 'Arial'
            });
            
            const timeText = this.add.text(leftSideX + 50, startY + (index * spacing) + 10, `${character.crossingTime} min`, {
                fontSize: `${this.getResponsiveFontSize(12)}px`,
                fill: '#cccccc',
                fontFamily: 'Arial'
            });
            
            // Store UI elements for resize updates
            this.uiElements.push(nameText, timeText);
            
            // Store sprite reference for later use
            this.characterSprites.push(sprite);
            
            console.log(`Positioned ${character.name} at (${leftSideX}, ${startY + (index * spacing)}) with size ${spriteSize}px`);
        });
    }

    /**
     * Create all UI components for game state feedback
     */
    createUIComponents() {
        // Game title
        this.add.text(512, 50, 'Bridge Escape Game', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Timer display with prominent styling
        this.createTimerDisplay();

        // Character position indicators
        this.createCharacterPositionIndicators();

        // Action buttons
        this.createActionButtons();

        // Status messages area
        this.createStatusMessagesArea();

        // Instructions
        this.add.text(512, 150, 'Click on characters to select them for crossing', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    /**
     * Create prominent timer display with visual styling
     */
    createTimerDisplay() {
        // Responsive sizing for timer components
        const timerWidth = this.getResponsiveSpacing(300);
        const timerHeight = this.getResponsiveSpacing(50);
        const strokeWidth = this.isMobile ? 3 : 2;
        
        // Timer background
        this.timerBackground = this.add.rectangle(512, 100, timerWidth, timerHeight, 0x000000, 0.7);
        this.timerBackground.setStrokeStyle(strokeWidth, 0xFFD700);

        // Main timer text with responsive font size
        const timerFontSize = this.getResponsiveFontSize(24);
        this.timerText = this.add.text(512, 100, this.getTimerDisplayText(), {
            fontSize: `${timerFontSize}px`,
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Timer status indicator with responsive font size
        const statusFontSize = this.getResponsiveFontSize(12);
        this.timerStatusText = this.add.text(512, 125, 'Time Remaining', {
            fontSize: `${statusFontSize}px`,
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Store UI elements for resize updates
        this.uiElements.push(this.timerBackground, this.timerText, this.timerStatusText);
    }

    /**
     * Create character position indicators showing current side locations
     */
    createCharacterPositionIndicators() {
        // Left side indicator
        this.leftSideIndicator = this.add.text(200, 250, 'LEFT SIDE', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.leftSideCount = this.add.text(200, 270, this.getLeftSideCountText(), {
            fontSize: '12px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Right side indicator
        this.rightSideIndicator = this.add.text(824, 250, 'RIGHT SIDE (SAFETY)', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.rightSideCount = this.add.text(824, 270, this.getRightSideCountText(), {
            fontSize: '12px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Selection status
        this.selectionStatusText = this.add.text(512, 180, 'Selected: 0/2 characters', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Lantern status
        this.lanternStatusText = this.add.text(512, 200, `Lantern: ${this.gameState.lanternSide} side`, {
            fontSize: '14px',
            fill: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    /**
     * Create action buttons for Cross Bridge and Reset Game
     */
    createActionButtons() {
        // Responsive button sizing
        const buttonWidth = this.getTouchFriendlySize(150);
        const buttonHeight = this.getTouchFriendlySize(40);
        const buttonFontSize = this.getResponsiveFontSize(16);
        const strokeWidth = this.isMobile ? 3 : 2;
        const buttonSpacing = this.getResponsiveSpacing(50);
        
        // Calculate button positions for mobile layout
        const centerX = 512;
        const buttonY = this.isMobile ? 680 : 650;
        const leftButtonX = centerX - (buttonWidth / 2) - (buttonSpacing / 2);
        const rightButtonX = centerX + (buttonWidth / 2) + (buttonSpacing / 2);

        // Cross Bridge button
        this.crossBridgeButton = this.add.rectangle(leftButtonX, buttonY, buttonWidth, buttonHeight, 0x4CAF50);
        this.crossBridgeButton.setStrokeStyle(strokeWidth, 0x45a049);
        this.crossBridgeButton.setInteractive();

        this.crossBridgeButtonText = this.add.text(leftButtonX, buttonY, 'Cross Bridge', {
            fontSize: `${buttonFontSize}px`,
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Reset Game button
        this.resetGameButton = this.add.rectangle(rightButtonX, buttonY, buttonWidth, buttonHeight, 0xf44336);
        this.resetGameButton.setStrokeStyle(strokeWidth, 0xd32f2f);
        this.resetGameButton.setInteractive();

        this.resetGameButtonText = this.add.text(rightButtonX, buttonY, 'Reset Game', {
            fontSize: `${buttonFontSize}px`,
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Store UI elements for resize updates
        this.uiElements.push(
            this.crossBridgeButton, this.crossBridgeButtonText,
            this.resetGameButton, this.resetGameButtonText
        );

        // Button event handlers
        this.crossBridgeButton.on('pointerdown', () => {
            this.handleCrossBridgeClick();
        });

        this.crossBridgeButton.on('pointerover', () => {
            this.crossBridgeButton.setTint(0x66BB6A);
        });

        this.crossBridgeButton.on('pointerout', () => {
            this.crossBridgeButton.clearTint();
        });

        this.resetGameButton.on('pointerdown', () => {
            this.handleResetGameClick();
        });

        this.resetGameButton.on('pointerover', () => {
            this.resetGameButton.setTint(0xef5350);
        });

        this.resetGameButton.on('pointerout', () => {
            this.resetGameButton.clearTint();
        });
    }

    /**
     * Create status messages area for game progress and rule violations
     */
    createStatusMessagesArea() {
        // Status message background
        this.statusMessageBackground = this.add.rectangle(512, 580, 600, 80, 0x000000, 0.8);
        this.statusMessageBackground.setStrokeStyle(1, 0x666666);

        // Main status message
        this.statusMessageText = this.add.text(512, 570, 'Select characters and click Cross Bridge to move them', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Error message area (initially hidden)
        this.errorMessageText = this.add.text(512, 590, '', {
            fontSize: '12px',
            fill: '#ff6b6b',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Game progress message
        this.progressMessageText = this.add.text(512, 610, this.getProgressMessage(), {
            fontSize: '12px',
            fill: '#4CAF50',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    /**
     * Create the lantern sprite with enhanced lighting effects
     */
    createLanternSprite() {
        // Position lantern on the left side with characters
        const lanternX = 150;
        const lanternY = 320;
        
        // Create lantern container for grouping effects
        this.lanternContainer = this.add.container(lanternX, lanternY);
        
        // Create main lantern sprite
        this.lanternSprite = this.add.image(0, 0, 'lantern');
        this.lanternSprite.setDisplaySize(24, 24);
        this.lanternSprite.setTint(0xFFD700);
        
        // Create glowing light effect with multiple layers
        this.createLanternGlowEffect();
        
        // Add all elements to container
        this.lanternContainer.add([this.lanternGlow1, this.lanternGlow2, this.lanternGlow3, this.lanternSprite]);
        
        // Add lantern label
        this.lanternLabel = this.add.text(lanternX, lanternY + 35, 'Lantern', {
            fontSize: '12px',
            fill: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Start lantern animation
        this.animateLanternGlow();
        
        console.log(`Enhanced lantern created at (${lanternX}, ${lanternY})`);
    }

    /**
     * Create multi-layered glow effect for the lantern
     */
    createLanternGlowEffect() {
        // Create multiple glow layers for realistic lighting
        this.lanternGlow1 = this.add.circle(0, 0, 40, 0xFFD700, 0.1);
        this.lanternGlow2 = this.add.circle(0, 0, 25, 0xFFD700, 0.2);
        this.lanternGlow3 = this.add.circle(0, 0, 15, 0xFFD700, 0.3);
        
        // Add subtle stroke for better visibility
        this.lanternGlow1.setStrokeStyle(1, 0xFFD700, 0.1);
        this.lanternGlow2.setStrokeStyle(1, 0xFFD700, 0.2);
    }

    /**
     * Animate the lantern glow with pulsing effect
     */
    animateLanternGlow() {
        // Create pulsing animation for the glow layers
        this.tweens.add({
            targets: [this.lanternGlow1, this.lanternGlow2, this.lanternGlow3],
            alpha: { from: 0.1, to: 0.4 },
            scaleX: { from: 0.8, to: 1.2 },
            scaleY: { from: 0.8, to: 1.2 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: (target, key, value, targetIndex) => targetIndex * 200
        });
        
        // Add subtle bobbing animation to the lantern sprite
        this.tweens.add({
            targets: this.lanternSprite,
            y: { from: 0, to: -3 },
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Update character sprite positions based on their current side
     */
    updateCharacterPositions() {
        const leftSideX = 200;
        const rightSideX = 824;
        const startY = 300;
        const spacing = 40;
        
        // Group characters by side
        const leftCharacters = this.gameState.getCharactersOnSide('left');
        const rightCharacters = this.gameState.getCharactersOnSide('right');
        
        // Position left side characters
        leftCharacters.forEach((character, index) => {
            const newX = leftSideX;
            const newY = startY + (index * spacing);
            character.sprite.setPosition(newX, newY);
            character.position.x = newX;
            character.position.y = newY;
        });
        
        // Position right side characters
        rightCharacters.forEach((character, index) => {
            const newX = rightSideX;
            const newY = startY + (index * spacing);
            character.sprite.setPosition(newX, newY);
            character.position.x = newX;
            character.position.y = newY;
        });

        // Update lantern position based on its side
        this.updateLanternPosition();
        
        // Update highlight positions
        if (this.inputHandler) {
            this.inputHandler.updateHighlightPositions();
        }
    }

    /**
     * Update lantern container position based on current side with smooth animation
     */
    updateLanternPosition() {
        if (this.lanternContainer) {
            const lanternX = this.gameState.lanternSide === 'left' ? 150 : 774;
            const lanternY = 320;
            
            // Animate lantern container to new position
            this.tweens.add({
                targets: this.lanternContainer,
                x: lanternX,
                y: lanternY,
                duration: 500,
                ease: 'Power2.easeInOut'
            });
            
            // Update lantern label position
            if (this.lanternLabel) {
                this.tweens.add({
                    targets: this.lanternLabel,
                    x: lanternX,
                    y: lanternY + 35,
                    duration: 500,
                    ease: 'Power2.easeInOut'
                });
            }
        }
    }

    /**
     * Enhanced lantern positioning logic that follows characters during crossing
     */
    updateLanternFollowLogic() {
        // Check if any characters are currently crossing (between sides)
        const crossingCharacters = this.gameState.characters.filter(char => 
            char.sprite && (char.sprite.x > 300 && char.sprite.x < 700)
        );
        
        if (crossingCharacters.length > 0) {
            // Position lantern to follow crossing characters
            const avgX = crossingCharacters.reduce((sum, char) => sum + char.sprite.x, 0) / crossingCharacters.length;
            const bridgeY = 320;
            
            // Smoothly move lantern container to follow characters
            this.tweens.add({
                targets: this.lanternContainer,
                x: avgX,
                y: bridgeY,
                duration: 200,
                ease: 'Power1.easeOut'
            });
        }
    }

    /**
     * Lantern return mechanism - validates and handles lantern being sent back
     */
    handleLanternReturn(character) {
        // Validate that character can carry lantern back
        if (!this.validateLanternReturn(character)) {
            return false;
        }

        // Execute lantern return crossing
        const result = this.bridgeController.executeCrossing([character], this);
        
        if (result.success) {
            console.log(`${character.name} carried the lantern back across the bridge`);
            return true;
        }
        
        return false;
    }

    /**
     * Validate if a character can carry the lantern back
     */
    validateLanternReturn(character) {
        // Character must be on the same side as the lantern
        if (character.side !== this.gameState.lanternSide) {
            return false;
        }
        
        // There must be characters on the other side who need the lantern
        const otherSide = this.gameState.lanternSide === 'left' ? 'right' : 'left';
        const charactersOnOtherSide = this.gameState.getCharactersOnSide(otherSide);
        
        return charactersOnOtherSide.length > 0;
    }

    /**
     * Enhanced lantern movement validation with detailed feedback
     */
    validateLanternMovement(characters) {
        const errors = [];
        
        if (characters.length === 0) {
            errors.push('No characters selected to carry the lantern');
            return { valid: false, errors };
        }
        
        // Check if lantern is on the same side as selected characters
        const characterSide = characters[0].side;
        if (this.gameState.lanternSide !== characterSide) {
            errors.push(`Lantern is on the ${this.gameState.lanternSide} side, but selected characters are on the ${characterSide} side`);
        }
        
        // Ensure at least one character stays with the lantern
        const charactersOnLanternSide = this.gameState.getCharactersOnSide(this.gameState.lanternSide);
        if (charactersOnLanternSide.length === characters.length && charactersOnLanternSide.length > 1) {
            errors.push('At least one character must stay with the lantern on each side');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Create the Cross Bridge button with interactive functionality
     */
    createCrossBridgeButton() {
        // Create button background
        const buttonBg = this.add.rectangle(512, 220, 150, 40, 0x4CAF50);
        buttonBg.setStrokeStyle(2, 0x45a049);
        buttonBg.setInteractive();
        
        // Create button text
        const buttonText = this.add.text(512, 220, 'Cross Bridge', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x45a049);
            buttonText.setScale(1.05);
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4CAF50);
            buttonText.setScale(1.0);
        });
        
        // Add click handler
        buttonBg.on('pointerdown', () => {
            this.inputHandler.handleCrossingAction();
        });
        
        // Store references
        this.crossBridgeButton = buttonBg;
        this.crossBridgeButtonText = buttonText;
    }

    /**
     * Display error messages for invalid moves
     */
    showErrorMessage(errors) {
        // Remove existing error message
        if (this.errorMessageText) {
            this.errorMessageText.destroy();
        }
        
        // Create error message text
        const errorText = errors.join('\n');
        this.errorMessageText = this.add.text(512, 260, errorText, {
            fontSize: '14px',
            fill: '#ff4444',
            fontFamily: 'Arial',
            backgroundColor: '#330000',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Auto-hide error message after 3 seconds
        this.time.delayedCall(3000, () => {
            if (this.errorMessageText) {
                this.errorMessageText.destroy();
                this.errorMessageText = null;
            }
        });
        
        // Add visual feedback - flash the button red briefly
        if (this.crossBridgeButton) {
            this.crossBridgeButton.setFillStyle(0xff4444);
            this.time.delayedCall(200, () => {
                this.crossBridgeButton.setFillStyle(0x4CAF50);
            });
        }
    }

    /**
     * Initialize the timer system with continuous updates
     */
    initializeTimerSystem() {
        // Initialize timer variables
        this.timerPulseAnimation = null;
        this.gameStartTime = Date.now();
        this.lastUpdateTime = this.gameStartTime;
        
        // Create a timer event that updates every second for real-time display
        this.timerEvent = this.time.addEvent({
            delay: 1000, // Update every second
            callback: this.updateGameTimer,
            callbackScope: this,
            loop: true
        });
        
        // Initial timer display update
        this.updateTimerDisplay();
        
        console.log('Timer system initialized - 17 minutes countdown started');
    }

    /**
     * Update game timer (called every second)
     */
    updateGameTimer() {
        // Only update if game is still playing
        if (this.gameState.gameStatus === 'playing') {
            // Update timer display
            this.updateTimerDisplay();
            
            // Check for game end conditions
            this.checkGameEndConditions();
        }
    }

    /**
     * Update the timer display with enhanced formatting and visual effects
     */
    updateTimerDisplay() {
        if (this.timerText) {
            const formattedTime = this.gameState.getFormattedTime();
            this.timerText.setText(`Time Remaining: ${formattedTime}`);
            
            // Enhanced color coding and visual effects based on remaining time
            if (this.gameState.isCriticalTime()) {
                this.timerText.setFill('#ff4444'); // Red for critical time
                this.timerText.setFontSize('22px'); // Larger font for urgency
                
                // Add pulsing effect for critical time
                if (!this.timerPulseAnimation) {
                    this.timerPulseAnimation = this.tweens.add({
                        targets: this.timerText,
                        scaleX: { from: 1.0, to: 1.1 },
                        scaleY: { from: 1.0, to: 1.1 },
                        duration: 500,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });
                }
            } else if (this.gameState.isWarningTime()) {
                this.timerText.setFill('#ffaa00'); // Orange for warning
                this.timerText.setFontSize('21px'); // Slightly larger font
                
                // Stop pulsing animation if it exists
                if (this.timerPulseAnimation) {
                    this.timerPulseAnimation.destroy();
                    this.timerPulseAnimation = null;
                    this.timerText.setScale(1.0);
                }
            } else {
                this.timerText.setFill('#FFD700'); // Gold for normal
                this.timerText.setFontSize('20px'); // Normal font size
                
                // Stop pulsing animation if it exists
                if (this.timerPulseAnimation) {
                    this.timerPulseAnimation.destroy();
                    this.timerPulseAnimation = null;
                    this.timerText.setScale(1.0);
                }
            }
        }

        // Update lantern status display
        this.updateLanternStatusDisplay();
    }

    /**
     * Update the lantern status display
     */
    updateLanternStatusDisplay() {
        if (this.lanternStatusText) {
            const charactersOnLanternSide = this.gameState.getCharactersOnSide(this.gameState.lanternSide);
            this.lanternStatusText.setText(`Lantern: ${this.gameState.lanternSide} side (${charactersOnLanternSide.length} characters)`);
        }
    }

    /**
     * Check for game end conditions and handle transitions
     */
    checkGameEndConditions() {
        // Only check conditions if game is still playing
        if (this.gameState.gameStatus !== 'playing') {
            return;
        }
        
        // Check for victory condition first
        if (this.gameState.checkVictoryCondition()) {
            this.gameState.gameStatus = 'won';
            this.showVictoryScreen();
            return;
        }
        
        // Check for game over condition (timer reached zero)
        if (this.gameState.timeRemaining <= 0) {
            this.gameState.gameStatus = 'lost';
            this.showGameOverScreen();
            return;
        }
    }

    /**
     * Display victory screen with success message and time remaining
     */
    showVictoryScreen() {
        // Disable input to prevent further actions
        this.inputHandler.setInputEnabled(false);
        
        // Stop timer updates
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        
        // Create victory overlay with fade-in animation
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0);
        overlay.setDepth(1000);
        
        // Animate overlay fade-in
        this.tweens.add({
            targets: overlay,
            alpha: 0.85,
            duration: 500,
            ease: 'Power2.easeOut'
        });
        
        // Victory container for grouping elements
        const victoryContainer = this.add.container(512, 384);
        victoryContainer.setDepth(1001);
        victoryContainer.setAlpha(0);
        
        // Victory title with glow effect
        const victoryTitle = this.add.text(0, -100, 'VICTORY!', {
            fontSize: '56px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#004400',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Success message
        const successMessage = this.add.text(0, -40, 'All characters escaped safely!', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Time remaining display
        const timeRemaining = this.add.text(0, 10, `Time remaining: ${this.gameState.getFormattedTime()}`, {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Performance rating based on time remaining
        const performanceText = this.getPerformanceRating();
        const performanceMessage = this.add.text(0, 40, performanceText, {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Add elements to container
        victoryContainer.add([victoryTitle, successMessage, timeRemaining, performanceMessage]);
        
        // Animate victory screen entrance
        this.tweens.add({
            targets: victoryContainer,
            alpha: 1,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 800,
            ease: 'Back.easeOut',
            delay: 300
        });
        
        // Add pulsing glow to victory title
        this.tweens.add({
            targets: victoryTitle,
            scaleX: { from: 1, to: 1.1 },
            scaleY: { from: 1, to: 1.1 },
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: 1000
        });
        
        // Create restart button with delay
        this.time.delayedCall(1200, () => {
            this.createRestartButton(470, overlay);
        });
        
        // Store references for cleanup
        this.victoryOverlay = overlay;
        this.victoryContainer = victoryContainer;
        
        console.log('Victory screen displayed');
    }

    /**
     * Display game over screen with loss message and restart option
     */
    showGameOverScreen() {
        // Disable input to prevent further actions
        this.inputHandler.setInputEnabled(false);
        
        // Stop timer updates
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        
        // Create game over overlay with fade-in animation
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0);
        overlay.setDepth(1000);
        
        // Animate overlay fade-in
        this.tweens.add({
            targets: overlay,
            alpha: 0.85,
            duration: 500,
            ease: 'Power2.easeOut'
        });
        
        // Game over container for grouping elements
        const gameOverContainer = this.add.container(512, 384);
        gameOverContainer.setDepth(1001);
        gameOverContainer.setAlpha(0);
        
        // Game over title with dramatic effect
        const gameOverTitle = this.add.text(0, -100, 'GAME OVER', {
            fontSize: '56px',
            fill: '#ff4444',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#440000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Failure message
        const failureMessage = this.add.text(0, -40, 'Time ran out! The zombies caught up!', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Characters escaped count
        const charactersEscaped = this.gameState.getCharactersOnSide('right').length;
        const escapeMessage = this.add.text(0, 10, `Characters escaped: ${charactersEscaped}/4`, {
            fontSize: '20px',
            fill: charactersEscaped > 0 ? '#FFD700' : '#ff6666',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Encouragement message
        const encouragementText = this.getEncouragementMessage(charactersEscaped);
        const encouragementMessage = this.add.text(0, 40, encouragementText, {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Add elements to container
        gameOverContainer.add([gameOverTitle, failureMessage, escapeMessage, encouragementMessage]);
        
        // Animate game over screen entrance
        this.tweens.add({
            targets: gameOverContainer,
            alpha: 1,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 800,
            ease: 'Back.easeOut',
            delay: 300
        });
        
        // Add shaking effect to game over title
        this.tweens.add({
            targets: gameOverTitle,
            x: { from: 0, to: 5 },
            duration: 100,
            ease: 'Power2.easeInOut',
            yoyo: true,
            repeat: 5,
            delay: 1000
        });
        
        // Create restart button with delay
        this.time.delayedCall(1200, () => {
            this.createRestartButton(470, overlay);
        });
        
        // Store references for cleanup
        this.gameOverOverlay = overlay;
        this.gameOverContainer = gameOverContainer;
        
        console.log('Game over screen displayed');
    }

    /**
     * Get performance rating based on time remaining
     */
    getPerformanceRating() {
        const timeRemaining = this.gameState.timeRemaining;
        
        if (timeRemaining >= 10) {
            return 'Outstanding! You solved it with time to spare!';
        } else if (timeRemaining >= 5) {
            return 'Great job! Well planned execution!';
        } else if (timeRemaining >= 2) {
            return 'Good work! That was close!';
        } else {
            return 'Phew! Just made it in time!';
        }
    }

    /**
     * Get encouragement message based on characters escaped
     */
    getEncouragementMessage(charactersEscaped) {
        if (charactersEscaped === 0) {
            return 'Try a different strategy next time!';
        } else if (charactersEscaped === 1) {
            return 'You saved one! Can you save them all?';
        } else if (charactersEscaped === 2) {
            return 'Half way there! You\'re getting closer!';
        } else if (charactersEscaped === 3) {
            return 'So close! Just one more to save!';
        } else {
            return 'This shouldn\'t happen - all escaped but time ran out?';
        }
    }

    /**
     * Create restart button with enhanced styling and animations
     */
    createRestartButton(y, parentOverlay) {
        // Button container for animations
        const buttonContainer = this.add.container(512, y);
        buttonContainer.setDepth(1002);
        buttonContainer.setAlpha(0);
        
        // Button background with gradient effect
        const restartBg = this.add.rectangle(0, 0, 160, 50, 0x4CAF50);
        restartBg.setStrokeStyle(3, 0x45a049);
        restartBg.setInteractive();
        
        // Button text
        const restartText = this.add.text(0, 0, 'Play Again', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add elements to button container
        buttonContainer.add([restartBg, restartText]);
        
        // Animate button entrance
        this.tweens.add({
            targets: buttonContainer,
            alpha: 1,
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        // Enhanced hover effects
        restartBg.on('pointerover', () => {
            restartBg.setFillStyle(0x66BB6A);
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Power2.easeOut'
            });
        });
        
        restartBg.on('pointerout', () => {
            restartBg.setFillStyle(0x4CAF50);
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Power2.easeOut'
            });
        });
        
        // Click handler with animation
        restartBg.on('pointerdown', () => {
            // Button press animation
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Power2.easeOut',
                yoyo: true,
                onComplete: () => {
                    this.restartGameWithTransition();
                }
            });
        });
        
        // Store reference
        this.restartButtonContainer = buttonContainer;
    }

    /**
     * Restart game with smooth transition animations
     */
    restartGameWithTransition() {
        // Fade out all end game elements
        const elementsToFade = [];
        
        if (this.victoryOverlay) elementsToFade.push(this.victoryOverlay);
        if (this.victoryContainer) elementsToFade.push(this.victoryContainer);
        if (this.gameOverOverlay) elementsToFade.push(this.gameOverOverlay);
        if (this.gameOverContainer) elementsToFade.push(this.gameOverContainer);
        if (this.restartButtonContainer) elementsToFade.push(this.restartButtonContainer);
        
        // Animate fade out
        this.tweens.add({
            targets: elementsToFade,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.performGameRestart();
            }
        });
    }

    /**
     * Perform the actual game restart and reset all game state
     */
    performGameRestart() {
        // Stop all existing timers and animations
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
        }
        
        if (this.timerPulseAnimation) {
            this.timerPulseAnimation.destroy();
            this.timerPulseAnimation = null;
        }
        
        // Clear all tweens
        this.tweens.killAll();
        
        // Reset game state to initial values
        this.gameState.reset();
        
        // Clear all character selections and highlights
        this.inputHandler.clearAllSelections();
        
        // Re-enable input handling
        this.inputHandler.setInputEnabled(true);
        
        // Clean up end game UI elements
        this.cleanupEndGameElements();
        
        // Restart the entire scene for a fresh start
        this.scene.restart();
        
        console.log('Game restarted successfully');
    }

    /**
     * Clean up end game UI elements
     */
    cleanupEndGameElements() {
        // Destroy victory screen elements
        if (this.victoryOverlay) {
            this.victoryOverlay.destroy();
            this.victoryOverlay = null;
        }
        if (this.victoryContainer) {
            this.victoryContainer.destroy();
            this.victoryContainer = null;
        }
        
        // Destroy game over screen elements
        if (this.gameOverOverlay) {
            this.gameOverOverlay.destroy();
            this.gameOverOverlay = null;
        }
        if (this.gameOverContainer) {
            this.gameOverContainer.destroy();
            this.gameOverContainer = null;
        }
        
        // Destroy restart button
        if (this.restartButtonContainer) {
            this.restartButtonContainer.destroy();
            this.restartButtonContainer = null;
        }
    }

    /**
     * Update method for game loop
     */
    update() {
        // Update character positions if they've moved
        this.updateCharacterPositions();
        
        // Update lantern following logic during crossings
        this.updateLanternFollowLogic();
    }

    /**
     * Lantern return mechanism - validates and handles lantern being sent back
     */
    handleLanternReturn(character) {
        // Validate that character can carry lantern back
        if (!this.validateLanternReturn(character)) {
            return false;
        }

        // Execute lantern return crossing
        const result = this.bridgeController.executeCrossing([character], this);
        
        if (result.success) {
            console.log(`${character.name} carried the lantern back across the bridge`);
            return true;
        }
        
        return false;
    }

    /**
     * Validate if a character can carry the lantern back
     */
    validateLanternReturn(character) {
        // Character must be on the same side as the lantern
        if (character.side !== this.gameState.lanternSide) {
            return false;
        }
        
        // There must be characters on the other side who need the lantern
        const otherSide = this.gameState.lanternSide === 'left' ? 'right' : 'left';
        const charactersOnOtherSide = this.gameState.getCharactersOnSide(otherSide);
        
        return charactersOnOtherSide.length > 0;
    }

    /**
     * Get formatted timer display text with enhanced styling
     */
    getTimerDisplayText() {
        const formattedTime = this.gameState.getFormattedTime();
        return `${formattedTime}`;
    }

    /**
     * Get left side character count text
     */
    getLeftSideCountText() {
        const leftCharacters = this.gameState.getCharactersOnSide('left');
        const names = leftCharacters.map(char => char.name).join(', ');
        return `${leftCharacters.length} characters: ${names || 'None'}`;
    }

    /**
     * Get right side character count text
     */
    getRightSideCountText() {
        const rightCharacters = this.gameState.getCharactersOnSide('right');
        const names = rightCharacters.map(char => char.name).join(', ');
        return `${rightCharacters.length} characters: ${names || 'None'}`;
    }

    /**
     * Get current game progress message
     */
    getProgressMessage() {
        const rightCharacters = this.gameState.getCharactersOnSide('right');
        const totalCharacters = this.gameState.characters.length;
        
        if (this.gameState.gameStatus === 'won') {
            return `Victory! All ${totalCharacters} characters reached safety!`;
        } else if (this.gameState.gameStatus === 'lost') {
            return 'Game Over! Time ran out before everyone could escape.';
        } else {
            return `Progress: ${rightCharacters.length}/${totalCharacters} characters safe`;
        }
    }

    /**
     * Handle Cross Bridge button click
     */
    handleCrossBridgeClick() {
        if (this.inputHandler) {
            this.inputHandler.handleCrossingAction();
        }
    }

    /**
     * Handle Reset Game button click
     */
    handleResetGameClick() {
        this.restartGameWithTransition();
    }e entire game to initial state
     */
    resetGame() {
        // Reset game state
        this.gameState.reset();
        
        // Clear all selections
        this.inputHandler.clearAllSelections();
        
        // Update character positions
        this.updateCharacterPositions();
        
        // Reset lantern position
        this.resetLanternPosition();
        
        // Update all UI displays
        this.updateAllUIDisplays();
        
        // Show reset message
        this.showStatusMessage('Game reset! Select characters to begin crossing.');
        
        console.log('Game reset to initial state');
    }

    /**
     * Reset lantern to initial position
     */
    resetLanternPosition() {
        const lanternX = 150;
        const lanternY = 320;
        
        if (this.lanternContainer) {
            this.lanternContainer.setPosition(lanternX, lanternY);
        }
        
        if (this.lanternLabel) {
            this.lanternLabel.setPosition(lanternX, lanternY + 35);
        }
    }

    /**
     * Update all UI displays with current game state
     */
    updateAllUIDisplays() {
        this.updateTimerDisplay();
        this.updateCharacterPositionIndicators();
        this.updateProgressDisplay();
        this.updateLanternStatusDisplay();
    }

    /**
     * Update character position indicators
     */
    updateCharacterPositionIndicators() {
        if (this.leftSideCount) {
            this.leftSideCount.setText(this.getLeftSideCountText());
        }
        
        if (this.rightSideCount) {
            this.rightSideCount.setText(this.getRightSideCountText());
        }
    }

    /**
     * Update progress display
     */
    updateProgressDisplay() {
        if (this.progressMessageText) {
            this.progressMessageText.setText(this.getProgressMessage());
            
            // Update color based on game status
            if (this.gameState.gameStatus === 'won') {
                this.progressMessageText.setFill('#4CAF50'); // Green for victory
            } else if (this.gameState.gameStatus === 'lost') {
                this.progressMessageText.setFill('#f44336'); // Red for game over
            } else {
                this.progressMessageText.setFill('#2196F3'); // Blue for progress
            }
        }
    }

    /**
     * Update lantern status display
     */
    updateLanternStatusDisplay() {
        if (this.lanternStatusText) {
            this.lanternStatusText.setText(`Lantern: ${this.gameState.lanternSide} side`);
        }
    }

    /**
     * Show status message to the player
     */
    showStatusMessage(message) {
        if (this.statusMessageText) {
            this.statusMessageText.setText(message);
        }
    }

    /**
     * Show error message for rule violations
     */
    showErrorMessage(errors) {
        if (this.errorMessageText && Array.isArray(errors)) {
            const errorText = errors.join('. ');
            this.errorMessageText.setText(errorText);
            
            // Clear error message after 5 seconds
            this.time.delayedCall(5000, () => {
                if (this.errorMessageText) {
                    this.errorMessageText.setText('');
                }
            });
        }
    }

    /**
     * Check for game end conditions and handle transitions
     */
    checkGameEndConditions() {
        if (this.gameState.gameStatus === 'won') {
            this.handleVictory();
        } else if (this.gameState.gameStatus === 'lost') {
            this.handleGameOver();
        }
    }

    /**
     * Handle victory state
     */
    handleVictory() {
        this.showStatusMessage(`Victory! All characters escaped with ${this.gameState.getFormattedTime()} remaining!`);
        this.updateProgressDisplay();
        
        // Disable crossing button
        if (this.crossBridgeButton) {
            this.crossBridgeButton.setTint(0x666666);
            this.crossBridgeButton.disableInteractive();
        }
        
        console.log('Victory achieved!');
    }

    /**
     * Handle game over state
     */
    handleGameOver() {
        this.showStatusMessage('Game Over! The zombies arrived before everyone could escape.');
        this.updateProgressDisplay();
        
        // Disable crossing button
        if (this.crossBridgeButton) {
            this.crossBridgeButton.setTint(0x666666);
            this.crossBridgeButton.disableInteractive();
        }
        
        console.log('Game over - time expired');
    }
}

// Global game instances
let gameState;
let bridgeController;

// Game configuration with enhanced responsive scaling
const GAME_CONFIG = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-canvas',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1920,
            height: 1440
        },
        zoom: 1
    },
    input: {
        activePointers: 3, // Support multi-touch
        smoothFactor: 0.2
    },
    scene: MainGameScene
};

// Game variables
let game;

// Initialize the game when the page loads
window.addEventListener('load', () => {
    game = new Phaser.Game(GAME_CONFIG);
});

// Enhanced window resize handler for responsive scaling
window.addEventListener('resize', () => {
    if (game && game.scale) {
        // Debounce resize events to improve performance
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            try {
                game.scale.refresh();
                
                // Trigger scene resize handler if available
                if (game.scene && game.scene.scenes[0] && game.scene.scenes[0].handleResize) {
                    const gameSize = game.scale.gameSize;
                    game.scene.scenes[0].handleResize(gameSize);
                }
            } catch (error) {
                console.warn('Error during resize handling:', error);
            }
        }, 100);
    }
});

// Handle orientation change on mobile devices
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        try {
            if (game && game.scale) {
                game.scale.refresh();
                
                // Force a second refresh after orientation change settles
                setTimeout(() => {
                    if (game && game.scale) {
                        game.scale.refresh();
                    }
                }, 200);
            }
        } catch (error) {
            console.warn('Error during orientation change handling:', error);
        }
    }, 500); // Delay to allow orientation change to complete
});

// Handle visibility change to pause/resume game appropriately
document.addEventListener('visibilitychange', () => {
    if (game && game.scene && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        if (document.hidden) {
            // Pause animations and timers when tab is hidden
            scene.scene.pause();
        } else {
            // Resume when tab becomes visible
            scene.scene.resume();
        }
    }
});