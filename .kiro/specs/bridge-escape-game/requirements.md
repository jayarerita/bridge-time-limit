# Requirements Document

## Introduction

This feature involves creating a web-based puzzle game that simulates the classic bridge crossing riddle from TED-Ed. Players must strategically move four characters (player, lab assistant, janitor, and professor) across a rope bridge before zombies arrive, while managing constraints like bridge capacity, lantern requirements, and character movement speeds. The game will be built using HTML, CSS, JavaScript, and the Phaser.js framework with pixel art graphics, optimized for both mobile and desktop platforms.

## Requirements

### Requirement 1

**User Story:** As a player, I want to interact with four distinct characters with different crossing speeds, so that I can strategically plan their movement across the bridge.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL display four characters: player (1 minute), lab assistant (2 minutes), janitor (5 minutes), and professor (10 minutes)
2. WHEN a character is selected THEN the system SHALL highlight the character and show their crossing time
3. WHEN characters are on different sides of the bridge THEN the system SHALL visually distinguish their locations

### Requirement 2

**User Story:** As a player, I want to move characters across the bridge with specific constraints, so that I can solve the puzzle within the rules.

#### Acceptance Criteria

1. WHEN selecting characters to cross THEN the system SHALL only allow a maximum of two characters to cross together
2. WHEN characters cross the bridge THEN the system SHALL require at least one character to carry or stay next to the lantern
3. WHEN two characters cross together THEN the system SHALL use the slower character's crossing time
4. WHEN characters cross the bridge THEN the system SHALL update the timer based on the crossing time used

### Requirement 3

**User Story:** As a player, I want to manage the lantern as a critical resource, so that characters can safely navigate in the dark.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL place the lantern on the starting side with all characters
2. WHEN characters cross the bridge THEN the system SHALL require the lantern to accompany them
3. WHEN characters reach the other side THEN the system SHALL move the lantern with them
4. WHEN sending the lantern back THEN the system SHALL require a character to carry it back across

### Requirement 4

**User Story:** As a player, I want to race against a 17-minute countdown timer, so that I experience the urgency of escaping before zombies arrive.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL display a countdown timer starting at 17 minutes
2. WHEN characters cross the bridge THEN the system SHALL subtract the crossing time from the remaining time
3. WHEN the timer reaches zero THEN the system SHALL trigger a game over state
4. WHEN all characters reach safety before time expires THEN the system SHALL trigger a victory state

### Requirement 5

**User Story:** As a player, I want intuitive touch and mouse controls, so that I can play the game on both mobile and desktop devices.

#### Acceptance Criteria

1. WHEN using a desktop device THEN the system SHALL respond to mouse clicks for character selection and movement
2. WHEN using a mobile device THEN the system SHALL respond to touch gestures for character selection and movement
3. WHEN selecting characters THEN the system SHALL provide visual feedback for selected states
4. WHEN performing invalid moves THEN the system SHALL provide clear error feedback

### Requirement 6

**User Story:** As a player, I want pixel art graphics and atmospheric visuals, so that I can enjoy an immersive gaming experience.

#### Acceptance Criteria

1. WHEN the game loads THEN the system SHALL display pixel art style graphics for all characters and environment
2. WHEN the game is running THEN the system SHALL show a rope bridge spanning a gorge with atmospheric lighting
3. WHEN characters move THEN the system SHALL animate their movement across the bridge
4. WHEN the lantern is present THEN the system SHALL create a lighting effect around its location

### Requirement 7

**User Story:** As a player, I want the game to be hosted on GitHub Pages, so that I can easily access and share it via web browser.

#### Acceptance Criteria

1. WHEN the game is deployed THEN the system SHALL run entirely in a web browser without server dependencies
2. WHEN accessing the game URL THEN the system SHALL load all assets (HTML, CSS, JS, images) from static files
3. WHEN the game loads THEN the system SHALL be compatible with modern web browsers
4. WHEN viewing on different screen sizes THEN the system SHALL maintain playability and visual clarity

### Requirement 8

**User Story:** As a player, I want clear game state feedback, so that I can understand my progress and make informed decisions.

#### Acceptance Criteria

1. WHEN the game is active THEN the system SHALL display current character positions on both sides of the bridge
2. WHEN making moves THEN the system SHALL show remaining time and move history
3. WHEN the game ends THEN the system SHALL display win/lose status with option to restart
4. WHEN hovering over or selecting characters THEN the system SHALL display their crossing times and current status