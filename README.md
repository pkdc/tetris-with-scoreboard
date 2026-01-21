# Tetris Game

This project is a simplified implementation of the classic Tetris game using Vanilla JavaScript. It features core Tetris gameplay mechanics, score handling through a RESTful API, and tests developed using Test-Driven Development (TDD) principles.

** [Play the live game here!](https://tetris-with-scoreboard.onrender.com)**

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Game Controls](#game-controls)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Features

- **Core Tetris Gameplay**: Implemented using pure JavaScript and HTML/CSS. Includes block movement, rotation, collision detection, and row clearing.
- **Score Handling**: A RESTful API service built with Go to manage high scores. Players can submit their scores and retrieve the leaderboard.
- **Test-Driven Development**: Tests have been written using Jest to support the logic for removing completed rows, ensuring reliability and correctness of the game mechanics.

## Technologies Used

- **JavaScript (Vanilla)**: For implementing the game logic and UI.
- **Go**: For creating the RESTful API service to handle score data.
- **HTML/CSS**: For structuring and styling the game interface.
- **Jest**: For testing the game logic.

## Game Controls

- **Enter**: Start the game. The Tetris blocks will begin to fall.
- **Backspace**: End the game and display an input form for the leaderboard. Submit your score to see the current standings.
- **Arrow Keys**:
  - **Left/Right**: Move the Tetris block sideways.
  - **Down**: Accelerate the fall of the Tetris block.
  - **Up**: Rotate the Tetris block.

## Installation

To run this project locally, follow these steps:

1. **Clone the repository**:

   ```
   git clone https://github.com/pkdc/simplified-tetris.git
   cd simplified-tetris
   ```

2. **Run the Game**:

   Start a server by running:

   ```
   python3 -m http.server
   ```

   Enter `localhost:8000` in your web browser.

   Click on `assets/`, it should open `index.html` automatically (if not, open it manually).

   Start playing the game.

3. **API Setup (Optional)**:

   If you want to enable score saving and retrieval, ensure that the Go API service is running:

   ```
   go run cmd/api/main.go
   ```

   Then access the game at `http://localhost:8080`.

## API Endpoints

- **POST /record**: Submit a new score.

  Request Body:

  ```json
  {
    "pname": "Player1",
    "score": 1500,
    "time": "2024-08-24T12:00:00Z"
  }
  ```

- **GET /record**: Retrieve the current leaderboard.

## Testing

This project follows Test-Driven Development (TDD) practices for the logic behind clearing completed rows. The tests are written using Jest.

To run the tests:

1. Install the necessary dependencies:

   ```
   npm install
   ```

2. Run the tests:

   ```
   npm test
   ```

## Future Enhancements

Some planned improvements include:

- Block Previews: Display the next block to be dropped.
- Sound Effects: Add sound effects for block placement and row clearing.
- Enhanced UI: Introduce animations and a more polished game interface.
- Additional Testing: Expand test coverage to include other game features.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
