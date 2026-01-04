# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tetris game implementation with scoreboard functionality. The project consists of:
- Frontend: Vanilla JavaScript game engine with Tailwind CSS styling
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
cd cmd/api
go run main.go
```

The server listens on port 8080 locally or uses the `PORT` environment variable in production.

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
- Implements a two-phase animation cycle:
  1. `run()` - resets timing and checks game state
  2. `checkWait()` - waits for drop interval, then calls `slowDrop()`
- Handles keyboard events for game controls
- Controls game start/pause/end states

**Game Components**:
- `gameArea` (`table.js`) - The game board manager
  - Generates the 10x20 grid with bottom boundary
  - Handles line clearing logic with `removeCompletedLines()`
  - Manages DOM elements for grid pixels using coordinate classes (`.x-${i}.y-${j}`)
  - Adds new empty lines at top after clearing completed rows

- `tetrisBlock` (`tetris-block.js`) - Tetris piece controller
  - Each block consists of 4 `Block` instances with x,y coordinates
  - Six tetromino shapes: rectangle, square, L, T, Z, S, L-inverse
  - Movement methods: `fall()`, `mvRight()`, `mvLeft()`, `rotate()`
  - Collision detection checks against `.occupied` class on DOM elements
  - Rotation uses pivot-based coordinate transformation (90° clockwise)
  - Static factory method `generateTBlock()` creates random pieces

- `timer` (`timer.js`) - Game time tracking
  - Tracks playtime with pause support
  - Maintains arrays of pause durations for accurate time calculation
  - Formats time as MM:SS

- `scoreboard` (`scoreboard.js`) - Score and leaderboard UI
  - Manages score state exported to other modules
  - Implements paginated leaderboard (5 records per page)
  - Live search filtering by player name
  - Calculates player ranking percentile
  - Handles form submission to API

**DOM Structure Pattern**:
The game uses a class-based coordinate system where each grid pixel has classes `.x-${xCoord}.y-${yCoord}`. Blocks are tracked by their coordinates and rendered by querying these DOM elements. The `.occupied` class marks pixels that have landed blocks.

### Backend Architecture

**API Server** (`cmd/api/main.go`):
- Single Go file with three main handlers:
  - `homeHandler` - serves `index.html`
  - `recordHandler` - handles both GET and POST to `/record/`
  - Individual record GET via `/record/{id}`

**Data Storage**:
- Flat-file JSON storage in `record.json` at project root
- Records stored as array of `GameRecord` objects
- No database - simple file I/O with `os.OpenFile()`

**CORS Configuration**:
The API uses `github.com/rs/cors` for cross-origin requests (see `go.mod`).

**Deployment Notes**:
- The server adapts file paths for both local dev and production (Render)
- Local: serves from `../../assets/index.html`
- Production: uses `PORT` environment variable
- Both environments share the same codebase without manual switching

### Frontend-Backend Communication

API calls from frontend (`scoreboard.js`):
- POST `/record/` - submit new score with JSON payload `{id, pname, score, time}`
- GET `/record/` - fetch all records for leaderboard
- Backend validates required fields (id, pname) and returns 400 on errors

### Test Architecture

Tests live in `assets/table.test.js` and focus on the `removeCompletedLines()` function using TDD principles. Jest is configured with jsdom environment to simulate DOM operations.

## Important Implementation Details

### Collision Detection
The game checks collisions by querying DOM elements with `.occupied` class rather than maintaining a separate game state array. This couples game logic to DOM state.

### Animation Loop Timing
- Normal drop speed: 1000ms (set in `run()`)
- Fast drop: 0ms (set by `fastDrop()` when down arrow pressed)
- `checkWait()` compares elapsed time against `wait` variable to determine when to drop

### Game End Detection
Game ends when blocks collide with occupied pixels at y-position 0 or 1. The `endGame` and `endSoon` flags on `tetrisBlock` trigger different behaviors (immediate end vs visual warning).

### Score Calculation
Points awarded based on simultaneous line clears:
- 1 line: 100 points
- 2 lines: 300 points
- 3 lines: 700 points
- 4 lines: 1500 points

### Rotation Algorithm
Most pieces rotate around their second block (`blocks[1]`) as pivot using the transformation:
- `xn = -yo + xp + yp`
- `yn = xo - xp + yp`

Rectangles use center-of-mass rotation with different transformations for horizontal vs vertical orientations.
