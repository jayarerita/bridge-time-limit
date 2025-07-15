// Validation script for responsive features
console.log('Validating responsive implementation...');

// Check if responsive methods exist in the game code
const fs = require('fs');
const gameCode = fs.readFileSync('game.js', 'utf8');

const requiredFeatures = [
    'initResponsiveScaling',
    'getResponsiveFontSize',
    'getResponsiveSpacing', 
    'getTouchFriendlySize',
    'handleResize',
    'updateUIElementsForResize',
    'isMobile',
    'scaleFactor'
];

const missingFeatures = [];
const foundFeatures = [];

requiredFeatures.forEach(feature => {
    if (gameCode.includes(feature)) {
        foundFeatures.push(feature);
        console.log(`✓ ${feature} - Found`);
    } else {
        missingFeatures.push(feature);
        console.log(`✗ ${feature} - Missing`);
    }
});

// Check CSS responsive features
const cssCode = fs.readFileSync('styles.css', 'utf8');
const cssFeatures = [
    '@media (max-width: 768px)',
    '@media (min-width: 769px) and (max-width: 1024px)',
    '@media (min-width: 1025px)',
    'touch-action: manipulation',
    'overscroll-behavior: none',
    'dvh'
];

cssFeatures.forEach(feature => {
    if (cssCode.includes(feature)) {
        console.log(`✓ CSS: ${feature} - Found`);
    } else {
        console.log(`✗ CSS: ${feature} - Missing`);
    }
});

// Check HTML viewport meta tag
const htmlCode = fs.readFileSync('index.html', 'utf8');
if (htmlCode.includes('user-scalable=no')) {
    console.log('✓ HTML: Viewport meta tag with user-scalable=no - Found');
} else {
    console.log('✗ HTML: Viewport meta tag with user-scalable=no - Missing');
}

// Check Phaser config enhancements
const configFeatures = [
    'activePointers: 3',
    'smoothFactor',
    'max: {',
    'zoom: 1'
];

configFeatures.forEach(feature => {
    if (gameCode.includes(feature)) {
        console.log(`✓ Config: ${feature} - Found`);
    } else {
        console.log(`✗ Config: ${feature} - Missing`);
    }
});

console.log('\n=== SUMMARY ===');
console.log(`Found features: ${foundFeatures.length}/${requiredFeatures.length}`);
console.log(`Missing features: ${missingFeatures.length}`);

if (missingFeatures.length === 0) {
    console.log('✅ All responsive features implemented successfully!');
} else {
    console.log('❌ Some responsive features are missing.');
}