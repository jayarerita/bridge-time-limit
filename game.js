// Game configuration
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
            height: 1080
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Game variables
let game;

// Placeholder scene functions (will be expanded in later tasks)
function preload() {
    // Placeholder for asset loading
    console.log('Preload phase - assets will be loaded here');
}

function create() {
    // Placeholder for scene creation
    console.log('Create phase - game objects will be created here');
    
    // Add a simple text to verify the game is working
    this.add.text(512, 384, 'Bridge Escape Game\nLoading...', {
        fontSize: '32px',
        fill: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);
}

function update() {
    // Placeholder for game loop updates
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    game = new Phaser.Game(GAME_CONFIG);
});

// Handle window resize for responsive scaling
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.refresh();
    }
});