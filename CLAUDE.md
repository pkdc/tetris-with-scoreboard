# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tetris game implementation with scoreboard functionality. The project consists of:
- Frontend: Vanilla JavaScript game engine with Tailwind CSS v4 styling
- Backend: Go HTTP server with RESTful API for score persistence
- Testing: Jest for TDD-based game logic validation

## Development Commands

### Running the Game Locally

Start a local development server:
```bash
python3 -m http.server
```
Then navigate to `localhost:8000/assets/` in your browser.

### Running the Backend API

Start the Go API server:
```bash
go run cmd/api/main.go
```

The server listens on port 8080 locally or uses the `PORT` environment variable in production. Access at `http://localhost:8080`.

### Testing

Install dependencies (first time only):
```bash
cd assets
npm install
```

Run tests:
```bash
cd assets
npm test
```

### Building for Production

Build optimized assets:
```bash
cd assets
npm run build
```

This creates minified files in `assets/dist/` using esbuild.

## Architecture

### Frontend Architecture

The game uses a modular, class-based JavaScript architecture with ES6 modules:

**Core Game Loop** (`index.js`):
- Entry point that coordinates all game components
- Manages the main game loop using `requestAnimationFrame`
- Implements a two-phase animation cycle: `run()` resets timing, `checkWait()` waits for drop interval then calls `slowDrop()`
- Controls game start/pause/end states via `started` flag

**Game Components**:
- `gameArea` (`table.js`) - The 10x20 game board manager with line clearing logic
- `tetrisBlock` (`tetris-block.js`) - Tetris piece controller with 6 shapes, movement, rotation, collision detection
- `timer` (`timer.js`) - Game time tracking with pause support
- `scoreboard` (`scoreboard.js`) - Score state, paginated leaderboard UI, API communication

**DOM Structure Pattern**:
The game uses a class-based coordinate system where each grid pixel has classes `.x-${xCoord}.y-${yCoord}`. The `.occupied` class marks pixels that have landed blocks.

### Backend Architecture

**API Server** (`cmd/api/main.go`):
- Single Go file with handlers for home, POST/GET `/record/`
- Flat-file JSON storage in `record.json` at project root
- Adapts file paths for both local dev and production (Render)

### Styling

- **Tailwind CSS v4**: Theme defined inline in `index.html` via `<style type="text/tailwindcss">` with `@theme` directive
- **Custom CSS** (`app.css`): Game-specific styles (grid layout, 3D brick effects, animations)
- Custom colors: `--game-yellow`, `--game-orange`, `--game-teal`, etc.
- Custom fonts: Press Start 2P (pixel/titles), VT323 (arcade/body)

## Important Implementation Details

### Collision Detection
The game checks collisions by querying DOM elements with `.occupied` class rather than maintaining a separate game state array.

### Animation Loop Timing
- Normal drop speed: 1000ms
- Fast drop: 0ms (when down arrow pressed)

### Game End Detection
Game ends when blocks collide with occupied pixels at y-position 0 or 1.

### Score Calculation
Points based on simultaneous line clears: 1 line = 100, 2 = 300, 3 = 700, 4 = 1500.

### Rotation Algorithm
Most pieces rotate around `blocks[1]` as pivot using: `xn = -yo + xp + yp`, `yn = xo - xp + yp`. Rectangles use center-of-mass rotation.
