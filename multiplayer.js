class MultiplayerTicTacToe {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.score = { X: 0, O: 0, ties: 0 };
        this.eventHistory = [];
        
        // Multiplayer properties
        this.ws = null;
        this.isConnected = false;
        this.playerInfo = null;
        this.roomId = null;
        this.isMyTurn = false;
        this.isSpectator = false;
        this.opponentInfo = null;
        this.pingInterval = null;
        this.players = [];
        
        this.initializeGame();
        this.bindEvents();
        this.checkForRoomInUrl();
        this.addEvent(t('Click "Join/Create Room" to start playing with a friend'), 'game-start');
    }

    getPlayerName(symbol) {
        if (!this.players || this.players.length === 0) return `Player ${symbol}`;
        const player = this.players.find(p => p.symbol === symbol);
        return player ? player.name : `Player ${symbol}`;
    }

    initializeGame() {
        this.cells = document.querySelectorAll('.cell');
        this.currentPlayerDisplay = document.getElementById('current-player');
        this.gameStatus = document.getElementById('game-status');
        this.gameModal = document.getElementById('game-modal');
        this.roomModal = document.getElementById('room-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.eventList = document.getElementById('event-list');
        this.connectionStatus = document.getElementById('connection-status');
        this.roomInfo = document.getElementById('room-info');
        this.playersInfo = document.getElementById('players-info');
        
        this.updateScoreDisplay();
        this.updateCurrentPlayerDisplay();
        this.updateConnectionStatus(false);
    }

    bindEvents() {
        // Cell click events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Button events
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('reset-score').addEventListener('click', () => this.resetScore());
        document.getElementById('modal-close').addEventListener('click', () => this.resetGame());
        document.getElementById('join-room').addEventListener('click', () => this.showRoomModal());
        document.getElementById('share-room').addEventListener('click', () => this.shareRoom());
        document.getElementById('room-modal-close').addEventListener('click', () => this.closeRoomModal());

        // Room form
        document.getElementById('room-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinRoom();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.isMyTurn && e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                this.handleCellClick(index);
            }
            if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            }
            if (e.key === 'Escape') {
                this.closeGameModal();
                this.closeRoomModal();
            }
        });
    }

    checkForRoomInUrl() {
        const path = window.location.pathname;
        console.log('Current path:', path);
        const roomMatch = path.match(/\/room\/(.+)/);
        if (roomMatch) {
            const roomId = decodeURIComponent(roomMatch[1]);
            console.log('Found room ID in URL:', roomId);
            document.getElementById('room-id').value = roomId;
            // Auto-show room modal if we have a room in URL
            setTimeout(() => {
                this.showRoomModal();
            }, 500);
        }
    }

    // WebSocket Connection Methods
    connectToServer() {
        if (this.pingInterval) clearInterval(this.pingInterval);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.addEvent('✅ ' + t('Connected'), 'success');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            if (this.pingInterval) clearInterval(this.pingInterval);
            this.addEvent('❌ ' + t('Disconnected from server'), 'error');
            
            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                if (!this.isConnected && this.roomId) {
                    this.addEvent('🔄 ' + t('Attempting to reconnect...'), 'info');
                    this.connectToServer();
                }
            }, 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.addEvent('❌ ' + t('Connection error'), 'error');
        };

        // Send ping every 30 seconds to keep connection alive
        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }

    handleServerMessage(data) {
        console.log('Received message:', data);

        switch (data.type) {
            case 'joinedRoom':
                this.handleJoinedRoom(data);
                break;
            case 'playerJoined':
                this.handlePlayerJoined(data);
                break;
            case 'playerLeft':
                this.handlePlayerLeft(data);
                break;
            case 'gameReady':
                this.handleGameReady(data);
                break;
            case 'move':
                this.handleOpponentMove(data);
                break;
            case 'gameReset':
                this.handleGameReset(data);
                break;
            case 'scoreReset':
                this.handleScoreReset(data);
                break;
            case 'spectator':
                this.handleSpectatorMode(data);
                break;
            case 'error':
                this.addEvent(`❌ Error: ${data.message}`, 'error');
                break;
            case 'pong':
                // Keep-alive response
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // Room Management
    showRoomModal() {
        this.roomModal.style.display = 'block';
        document.getElementById('player-name').focus();
    }

    closeRoomModal() {
        this.roomModal.style.display = 'none';
    }

    joinRoom() {
        const playerName = document.getElementById('player-name').value.trim();
        let roomId = document.getElementById('room-id').value.trim();
        
        if (!playerName) {
            alert(t('Please enter your name'));
            return;
        }

        if (!roomId) {
            roomId = this.generateRoomId();
            document.getElementById('room-id').value = roomId;
        }

        this.roomId = roomId;
        this.closeRoomModal();
        
        if (!this.isConnected) {
            this.connectToServer();
        }

        // Wait for connection before joining
        const joinWhenConnected = () => {
            if (this.isConnected) {
                this.ws.send(JSON.stringify({
                    type: 'joinRoom',
                    roomId: roomId,
                    playerName: playerName
                }));
                
                // Update URL
                window.history.pushState({}, '', `/room/${roomId}`);
            } else {
                setTimeout(joinWhenConnected, 100);
            }
        };
        
        joinWhenConnected();
    }

    generateRoomId() {
        const array = new Uint8Array(4);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    shareRoom() {
        const url = `${window.location.origin}/room/${encodeURIComponent(this.roomId)}`;
        console.log('Sharing room URL:', url);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                this.addEvent('🔗 ' + t('Room link copied to clipboard!'), 'info');
                alert(t('Room link copied to clipboard!') + '\n\n' + url);
            }).catch(() => {
                this.fallbackCopyTextToClipboard(url);
            });
        } else {
            this.fallbackCopyTextToClipboard(url);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.addEvent('🔗 ' + t('Room link copied to clipboard!'), 'info');
                alert(t('Room link copied to clipboard!') + '\n\n' + text);
            } else {
                this.showUrlDialog(text);
            }
        } catch (err) {
            console.error('Copy failed:', err);
            this.showUrlDialog(text);
        }
        
        document.body.removeChild(textArea);
    }

    showUrlDialog(url) {
        alert(t('Share the room link with your friend') + ':\n\n' + url);
        this.addEvent('🔗 ' + t('Share the room link with your friend'), 'info');
    }

    // Game Event Handlers
    handleJoinedRoom(data) {
        this.playerInfo = data.player;
        this.roomId = data.roomId;
        this.updateRoomInfo();
        this.updateGameState(data.gameState);
        this.addEvent(`✅ ${data.message}`, 'success');
        
        document.getElementById('share-room').style.display = 'inline-block';
    }

    handlePlayerJoined(data) {
        this.addEvent(`👋 ${data.player.name} ${t('joined as Player')} ${data.player.symbol}`, 'info');
        this.updateGameState(data.gameState);
    }

    handlePlayerLeft(data) {
        this.addEvent(`👋 ${data.message}`, 'info');
    }

    handleGameReady(data) {
        this.addEvent('🎮 ' + t('Both players connected! Game is ready to start.'), 'success');
        this.updateGameState(data.gameState);
        this.gameActive = true;
        this.checkMyTurn();
    }

    handleOpponentMove(data) {
        this.board = data.board;
        this.currentPlayer = data.currentPlayer;
        this.score = data.score;
        
        this.updateBoardDisplay();
        this.updateCurrentPlayerDisplay();
        this.updateScoreDisplay();
        this.checkMyTurn();
        
        const playerSymbol = data.player;
        const playerName = this.getPlayerName(playerSymbol);
        const position = data.position + 1;
        this.addEvent(`🎯 ${playerName} ${t('moved to position')} ${position}`, 'move');
        
        if (data.gameStatus === 'win') {
            this.handleGameEnd('win', data.winner);
        } else if (data.gameStatus === 'tie') {
            this.handleGameEnd('tie');
        }
    }

    handleGameReset(data) {
        this.board = data.board;
        this.currentPlayer = data.currentPlayer;
        this.gameActive = true;
        
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        
        this.updateCurrentPlayerDisplay();
        this.updateGameStatus(t('Player X\'s turn'));
        this.closeGameModal();
        this.checkMyTurn();
        
        this.addEvent('🔄 ' + t('Game reset by a player'), 'info');
    }

    handleScoreReset(data) {
        this.score = data.score;
        this.updateScoreDisplay();
        this.addEvent('📊 ' + t('Score reset by a player'), 'info');
    }

    handleSpectatorMode(data) {
        this.isSpectator = true;
        this.updateGameState(data.gameState);
        this.addEvent('👁️ ' + t('Joined as spectator - watching the game'), 'info');
        
        // Add spectator indicator
        const spectatorIndicator = document.createElement('div');
        spectatorIndicator.className = 'spectator-mode';
        spectatorIndicator.textContent = '👁️ ' + t('Joined as spectator - watching the game'); 
        document.querySelector('.container').insertBefore(spectatorIndicator, document.querySelector('main'));
    }

    // Game Logic
    handleCellClick(index) {
        if (!this.gameActive || !this.isMyTurn || this.board[index] !== '' || this.isSpectator) {
            return;
        }

        // Send move to server
        this.ws.send(JSON.stringify({
            type: 'move',
            position: index
        }));
    }

    resetGame() {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({ type: 'resetGame' }));
        }
    }

    resetScore() {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({ type: 'resetScore' }));
        }
    }

    handleGameEnd(result, winner = null) {
        this.gameActive = false;
        
        if (result === 'win') {
            const isMyWin = winner === this.playerInfo?.symbol;
            const winnerName = this.getPlayerName(winner);
            
            const message = isMyWin ? '🎉 ' + t('You won!') : `😔 ${winnerName} ${t('wins!')}`;
            this.updateGameStatus(`🎉 ${winnerName} ${t('wins!')}`);
            this.addEvent(`🏆 ${winnerName} ${t('wins the game!')}`, 'winner');
            this.showGameModal('🎉 ' + t('Game Over!'), message);
        } else {
            this.updateGameStatus("🤝 " + t('It\'s a tie!'));
            this.addEvent("🤝 " + t('Game ended in a tie!'), 'winner');
            this.showGameModal('🤝 ' + t('Tie Game!'), t('It\'s a tie!') + ' ' + t('Good game!'));
        }
    }

    // UI Update Methods
    updateConnectionStatus(connected) {
        const statusContainer = this.connectionStatus;
        const dot = statusContainer.querySelector('.status-dot');
        const text = statusContainer.querySelector('.status-text');
        
        if (connected) {
            if (text) text.textContent = 'Verbunden';
            if (dot) {
                dot.className = 'status-dot online';
            }
            statusContainer.classList.remove('disconnected');
            statusContainer.classList.add('connected');
        } else {
            if (text) text.textContent = 'Offline';
            if (dot) {
                dot.className = 'status-dot offline';
            }
            statusContainer.classList.remove('connected');
            statusContainer.classList.add('disconnected');
        }
    }

    updateRoomInfo() {
        if (this.roomId) {
            this.roomInfo.textContent = `Raum: ${this.roomId}`;
        }
    }

    updateGameState(gameState) {
        if (!gameState) return;
        
        this.board = gameState.board;
        this.currentPlayer = gameState.currentPlayer;
        this.gameActive = gameState.gameActive;
        this.score = gameState.score;
        this.players = gameState.players || [];
        
        this.updateBoardDisplay();
        this.updateCurrentPlayerDisplay();
        this.updateScoreDisplay();
        this.updatePlayersDisplay(gameState.players);
        this.checkMyTurn();
    }

    updateBoardDisplay() {
        this.cells.forEach((cell, index) => {
            const value = this.board[index];
            cell.textContent = value;
            cell.className = 'cell';
            if (value) {
                cell.classList.add(value.toLowerCase());
            }
        });
    }

    updatePlayersDisplay(players) {
        const playerX = document.getElementById('player-x');
        const playerO = document.getElementById('player-o');
        
        if (players && players.length > 0) {
            const xPlayer = players.find(p => p.symbol === 'X');
            const oPlayer = players.find(p => p.symbol === 'O');
            
            playerX.innerHTML = `Player X: <span>${xPlayer ? xPlayer.name : 'Waiting...'}</span>`;
            playerO.innerHTML = `Player O: <span>${oPlayer ? oPlayer.name : 'Waiting...'}</span>`;
            
            // Highlight current player
            playerX.classList.toggle('active', this.currentPlayer === 'X');
            playerO.classList.toggle('active', this.currentPlayer === 'O');
            
            // Highlight your player
            if (this.playerInfo) {
                playerX.classList.toggle('you', this.playerInfo.symbol === 'X');
                playerO.classList.toggle('you', this.playerInfo.symbol === 'O');
            }
        }
        
        // Show waiting message if not enough players
        if (!players || players.length < 2) {
            this.showWaitingForPlayers();
        } else {
            this.hideWaitingForPlayers();
        }
    }

    showWaitingForPlayers() {
        let waitingDiv = document.querySelector('.waiting-players');
        if (!waitingDiv) {
            waitingDiv = document.createElement('div');
            waitingDiv.className = 'waiting-players';
            document.querySelector('main').insertBefore(waitingDiv, document.querySelector('.game-board'));
        }
        waitingDiv.textContent = '⏳ Waiting for another player to join...';
        
        // Disable game board
        this.cells.forEach(cell => {
            cell.classList.add('disabled');
        });
    }

    hideWaitingForPlayers() {
        const waitingDiv = document.querySelector('.waiting-players');
        if (waitingDiv) {
            waitingDiv.remove();
        }
        
        // Enable game board based on turn
        this.checkMyTurn();
    }

    checkMyTurn() {
        if (!this.playerInfo || this.isSpectator) {
            this.isMyTurn = false;
            this.cells.forEach(cell => cell.classList.add('disabled'));
            return;
        }
        
        this.isMyTurn = this.currentPlayer === this.playerInfo.symbol && this.gameActive;
        
        this.cells.forEach(cell => {
            if (this.isMyTurn) {
                cell.classList.remove('disabled');
            } else {
                cell.classList.add('disabled');
            }
        });
        
        if (this.isMyTurn) {
            this.updateGameStatus("🎯 Sie sind am Zug!");
        } else if (this.gameActive) {
            this.updateGameStatus("⏳ Warte auf Gegner...");
        }
    }

    updateCurrentPlayerDisplay() {
        this.currentPlayerDisplay.textContent = this.currentPlayer;
        this.currentPlayerDisplay.style.color = this.currentPlayer === 'X' ? '#e74c3c' : '#3498db';
    }

    updateGameStatus(message) {
        this.gameStatus.textContent = message;
    }

    updateScoreDisplay() {
        document.getElementById('score-x').textContent = this.score.X;
        document.getElementById('score-o').textContent = this.score.O;
        document.getElementById('score-ties').textContent = this.score.ties;
    }

    showGameModal(title, message) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.gameModal.style.display = 'block';
    }

    closeGameModal() {
        this.gameModal.style.display = 'none';
    }

    addEvent(message, type = 'move') {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${type}`;
        eventItem.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        
        this.eventList.insertBefore(eventItem, this.eventList.firstChild);
        
        // Keep only last 15 events for multiplayer
        while (this.eventList.children.length > 15) {
            this.eventList.removeChild(this.eventList.lastChild);
        }

        // Auto-scroll to top
        this.eventList.scrollTop = 0;
    }
}

// Initialize the multiplayer game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MultiplayerTicTacToe();
    
    console.log('🎮 Multiplayer Tic Tac Toe initialized!');
    console.log('💡 Tips:');
    console.log('  - Click "Join/Create Room" to start playing with a friend');
    console.log('  - Share the room link with your friend');
    console.log('  - Use number keys 1-9 to make moves on your turn');
    console.log('  - Press R to reset the game');
    console.log('  - Press Escape to close modals');
    console.log('  - Watch the event log for real-time updates!');
});
