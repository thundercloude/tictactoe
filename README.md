# 🎮 Tic Tac Toe - Real-time Multiplayer

A modern, real-time multiplayer Tic-Tac-Toe game built with Node.js and WebSockets.

## ✨ Features

- **Real-time Multiplayer**: Play against friends instantly via WebSockets.
- **Secure Room System**: Auto-generated cryptographically secure Room IDs.
- **Modern UI**: 
  - Unified player dashboard with live statistics.
  - Responsive design for desktop and mobile.
  - Visual feedback for game states and connection status.
- **Localization**: German user interface.
- **Event Logging**: Live event log showing game actions.
- **Docker Support**: Ready for containerized deployment.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thundercloude/tictactoe.git
   cd tictactoe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Play**
   Open [http://localhost:3000](http://localhost:3000) in your browser.
   - **Create a Room:** Enter your name and click "Raum beitreten/erstellen".
   - **Join a Room:** Enter the Room ID provided by a friend.
   - **Share:** Copy the Room ID or URL to invite others.

## 🐳 Docker Deployment

You can run the application using Docker Compose:

```bash
docker-compose up --build
```

The game will be available at [http://localhost:3000](http://localhost:3000).

## 🛠️ Project Structure

```
tictactoe/
├── index.html        # Main entry point (UI Structure)
├── styles.css        # Application styling
├── multiplayer.js    # Client-side game & WebSocket logic
├── server.js         # Node.js backend & WebSocket server
├── translations.js   # UI Localization
├── Dockerfile        # Container configuration
└── docker-compose.yml # Docker Compose configuration
```

## 🧪 Technologies

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Real-time**: `ws` (WebSocket) library
- **Containerization**: Docker

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source.