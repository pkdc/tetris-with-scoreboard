# Tetris with Scoreboard

A classic Tetris game built with vanilla JavaScript, featuring a persistent leaderboard powered by a Go backend. Developed with Test-Driven Development (TDD) practices.

**[Play the Live Demo](https://tetris-with-scoreboard.onrender.com)**

---

## Features

- **Classic Tetris Gameplay** - All 6 tetromino shapes with rotation, collision detection, and line clearing
- **Persistent Leaderboard** - Submit your scores and compete with other players
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS v4
- **Real-time Scoring** - Points based on simultaneous line clears (up to 1500 for a Tetris!)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JavaScript (ES6 modules) |
| Styling | Tailwind CSS v4, Custom CSS |
| Backend | Go HTTP Server |
| Storage | JSON file-based persistence |
| Testing | Jest with jsdom |
| Build | esbuild |

---

## Game Controls

| Key | Action |
|-----|--------|
| `Enter` | Start game |
| `Backspace` | End game and submit score |
| `Left Arrow` | Move block left |
| `Right Arrow` | Move block right |
| `Down Arrow` | Fast drop |
| `Up Arrow` | Rotate block |

---

## Getting Started

### Prerequisites

- Python 3 (for local development server)
- Go 1.17+ (for backend API)
- Node.js (for running tests)

### Quick Start (Frontend Only)

```bash
# Clone the repository
git clone https://github.com/pkdc/tetris-with-scoreboard.git
cd tetris-with-scoreboard

# Start a local server
python3 -m http.server

# Open in browser
# Navigate to http://localhost:8000/assets/
```

### Full Setup (with Backend)

```bash
# Clone the repository
git clone https://github.com/pkdc/tetris-with-scoreboard.git
cd tetris-with-scoreboard

# Start the Go API server
go run cmd/api/main.go

# Open in browser
# Navigate to http://localhost:8080
```

The backend enables score persistence and leaderboard functionality.

---

## API Reference

### Submit a Score

```http
POST /record/
Content-Type: application/json

{
  "id": "unique-id",
  "pname": "PlayerName",
  "score": 1500,
  "time": "05:30"
}
```

### Get Leaderboard

```http
GET /record/
```

Returns an array of all game records sorted for the leaderboard.

---

## Development

### Running Tests

```bash
cd assets
npm install    # First time only
npm test
```

Tests are written using Jest with TDD principles, focusing on core game mechanics like line clearing.

### Building for Production

```bash
cd assets
npm run build
```

Creates optimized, minified assets in `assets/dist/` using esbuild.

---

## Scoring System

| Lines Cleared | Points |
|---------------|--------|
| 1 line | 100 |
| 2 lines | 300 |
| 3 lines | 700 |
| 4 lines (Tetris!) | 1500 |

---

## Project Structure

```
tetris-with-scoreboard/
├── assets/
│   ├── index.html          # Game entry point
│   ├── index.js            # Main game loop
│   ├── table.js            # Game board (10x20 grid)
│   ├── tetris-block.js     # Tetromino logic
│   ├── scoreboard.js       # Leaderboard UI & API calls
│   ├── timer.js            # Game timer
│   ├── app.css             # Custom styles
│   └── table.test.js       # Jest tests
├── cmd/
│   └── api/
│       └── main.go         # Go HTTP server
├── record.json             # Score storage
└── README.md
```

---

## Future Enhancements

- [ ] Next block preview
- [ ] Sound effects
- [ ] Ghost piece (drop preview)
- [ ] Level progression with increasing speed
- [ ] Expanded test coverage

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with vanilla JavaScript and Go
</p>
