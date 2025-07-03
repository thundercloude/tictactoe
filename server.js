const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS and security headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Parse JSON bodies
app.use(express.json());

// Serve specific static files first
app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/multiplayer.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(__dirname, 'multiplayer.js'));
});

app.get('/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(__dirname, 'script.js'));
});

// HTTP routes - BEFORE static middleware to prevent conflicts
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle room URLs - but only for actual room paths, not static files
app.get('/room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    
    // Don't treat file extensions as room IDs
    if (roomId.includes('.')) {
        return res.status(404).send('Not Found');
    }
    
    console.log(`Serving room page for room: ${roomId}`);
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API routes
app.get('/api/rooms', (req, res) => {
    const rooms = Array.from(gameRooms.values()).map(room => ({
        id: room.id,
        playersCount: room.players.length,
        spectatorsCount: room.spectators.length,
        gameActive: room.gameActive
    }));
    res.json(rooms);
});

// Serve static files with proper MIME types - AFTER routes
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game rooms storage
const gameRooms = new Map();
const playerConnections = new Map();

class GameRoom {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.score = { X: 0, O: 0, ties: 0 };
        this.spectators = [];
    }

    addPlayer(ws, playerName) {
        if (this.players.length < 2) {
            const player = {
                ws: ws,
                name: playerName,
                symbol: this.players.length === 0 ? 'X' : 'O',
                id: uuidv4()
            };
            this.players.push(player);
            playerConnections.set(ws, { room: this, player });
            
            this.broadcastToRoom({
                type: 'playerJoined',
                player: { name: player.name, symbol: player.symbol },
                playersCount: this.players.length,
                gameState: this.getGameState()
            });

            if (this.players.length === 2) {
                this.broadcastToRoom({
                    type: 'gameReady',
                    message: 'Both players connected! Game can start.',
                    gameState: this.getGameState()
                });
            }

            return player;
        } else {
            // Add as spectator
            const spectator = { ws: ws, name: playerName, id: uuidv4() };
            this.spectators.push(spectator);
            playerConnections.set(ws, { room: this, spectator });
            
            ws.send(JSON.stringify({
                type: 'spectator',
                message: 'Joined as spectator',
                gameState: this.getGameState()
            }));
            
            return spectator;
        }
    }

    removePlayer(ws) {
        const connection = playerConnections.get(ws);
        if (!connection) return;

        if (connection.player) {
            this.players = this.players.filter(p => p.ws !== ws);
            this.broadcastToRoom({
                type: 'playerLeft',
                message: `${connection.player.name} left the game`,
                playersCount: this.players.length
            });
        } else if (connection.spectator) {
            this.spectators = this.spectators.filter(s => s.ws !== ws);
        }

        playerConnections.delete(ws);

        // If no players left, we could clean up the room
        if (this.players.length === 0 && this.spectators.length === 0) {
            gameRooms.delete(this.id);
        }
    }

    makeMove(ws, position) {
        const connection = playerConnections.get(ws);
        if (!connection || !connection.player) return false;

        const player = connection.player;
        
        // Check if it's the player's turn and the game is active
        if (!this.gameActive || player.symbol !== this.currentPlayer) {
            return false;
        }

        // Check if the position is valid and empty
        if (position < 0 || position > 8 || this.board[position] !== '') {
            return false;
        }

        // Make the move
        this.board[position] = this.currentPlayer;
        
        // Check for winner or tie
        const winner = this.checkWinner();
        const isDraw = this.checkDraw();
        
        let gameStatus = 'continue';
        if (winner) {
            gameStatus = 'win';
            this.gameActive = false;
            this.score[this.currentPlayer]++;
        } else if (isDraw) {
            gameStatus = 'tie';
            this.gameActive = false;
            this.score.ties++;
        } else {
            // Switch player
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        }

        // Broadcast the move to all players and spectators
        this.broadcastToRoom({
            type: 'move',
            player: player.symbol,
            position: position,
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameStatus: gameStatus,
            winner: winner ? this.currentPlayer : null,
            score: this.score,
            gameState: this.getGameState()
        });

        return true;
    }

    resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;

        this.broadcastToRoom({
            type: 'gameReset',
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameState: this.getGameState()
        });
    }

    resetScore() {
        this.score = { X: 0, O: 0, ties: 0 };
        
        this.broadcastToRoom({
            type: 'scoreReset',
            score: this.score
        });
    }

    checkWinner() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let combination of winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return { winner: this.board[a], combination };
            }
        }
        return null;
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameActive: this.gameActive,
            score: this.score,
            players: this.players.map(p => ({ name: p.name, symbol: p.symbol }))
        };
    }

    broadcastToRoom(message) {
        const messageStr = JSON.stringify(message);
        
        // Send to all players
        this.players.forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(messageStr);
            }
        });

        // Send to all spectators
        this.spectators.forEach(spectator => {
            if (spectator.ws.readyState === WebSocket.OPEN) {
                spectator.ws.send(messageStr);
            }
        });
    }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'joinRoom':
                    handleJoinRoom(ws, data);
                    break;
                    
                case 'move':
                    handleMove(ws, data);
                    break;
                    
                case 'resetGame':
                    handleResetGame(ws);
                    break;
                    
                case 'resetScore':
                    handleResetScore(ws);
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        const connection = playerConnections.get(ws);
        if (connection && connection.room) {
            connection.room.removePlayer(ws);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleJoinRoom(ws, data) {
    const { roomId, playerName } = data;
    
    if (!roomId || !playerName) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room ID and player name are required'
        }));
        return;
    }

    // Get or create room
    let room = gameRooms.get(roomId);
    if (!room) {
        room = new GameRoom(roomId);
        gameRooms.set(roomId, room);
        console.log(`Created new room: ${roomId}`);
    }

    // Add player to room
    const player = room.addPlayer(ws, playerName);
    
    ws.send(JSON.stringify({
        type: 'joinedRoom',
        roomId: roomId,
        player: player,
        gameState: room.getGameState(),
        message: `Joined room ${roomId} as ${player.symbol || 'spectator'}`
    }));

    console.log(`${playerName} joined room ${roomId}`);
}

function handleMove(ws, data) {
    const connection = playerConnections.get(ws);
    if (connection && connection.room) {
        connection.room.makeMove(ws, data.position);
    }
}

function handleResetGame(ws) {
    const connection = playerConnections.get(ws);
    if (connection && connection.room) {
        connection.room.resetGame();
    }
}

function handleResetScore(ws) {
    const connection = playerConnections.get(ws);
    if (connection && connection.room) {
        connection.room.resetScore();
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Tic Tac Toe Mehrspieler-Server läuft auf Port ${PORT}`);
    console.log(`🌐 Öffnen Sie http://localhost:${PORT} zum Spielen`);
    console.log(`🎮 Erstellen Sie Räume unter http://localhost:${PORT}/room/RAUM_NAME`);
});
