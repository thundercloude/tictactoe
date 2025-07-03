class TicTacToeGame {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.score = { X: 0, O: 0, ties: 0 };
        this.eventHistory = [];
        
        this.initializeGame();
        this.bindEvents();
        this.addEvent('Game started! Player X goes first.', 'game-start');
    }

    initializeGame() {
        this.cells = document.querySelectorAll('.cell');
        this.currentPlayerDisplay = document.getElementById('current-player');
        this.gameStatus = document.getElementById('game-status');
        this.modal = document.getElementById('game-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.eventList = document.getElementById('event-list');
        
        this.updateScoreDisplay();
        this.updateCurrentPlayerDisplay();
    }

    bindEvents() {
        // Cell click events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Button events
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('reset-score').addEventListener('click', () => this.resetScore());
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                this.handleCellClick(index);
            }
            if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            }
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Custom events for real-time updates
        document.addEventListener('playerMove', (e) => {
            this.handlePlayerMoveEvent(e.detail);
        });

        document.addEventListener('gameStateChange', (e) => {
            this.handleGameStateChangeEvent(e.detail);
        });
    }

    handleCellClick(index) {
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }

        // Dispatch real-time move event
        const moveEvent = new CustomEvent('playerMove', {
            detail: {
                player: this.currentPlayer,
                position: index,
                timestamp: new Date().toLocaleTimeString()
            }
        });
        document.dispatchEvent(moveEvent);

        this.makeMove(index);
    }

    makeMove(index) {
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        this.addEvent(`Player ${this.currentPlayer} moved to position ${index + 1}`, 'move');

        if (this.checkWinner()) {
            this.handleGameEnd('win');
        } else if (this.checkDraw()) {
            this.handleGameEnd('draw');
        } else {
            this.switchPlayer();
        }
    }

    updateCell(index) {
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        
        // Add animation effect
        cell.style.transform = 'scale(0.8)';
        setTimeout(() => {
            cell.style.transform = 'scale(1)';
        }, 150);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateCurrentPlayerDisplay();
        this.updateGameStatus(`Player ${this.currentPlayer}'s turn`);

        // Dispatch game state change event
        const stateEvent = new CustomEvent('gameStateChange', {
            detail: {
                type: 'playerSwitch',
                currentPlayer: this.currentPlayer,
                board: [...this.board]
            }
        });
        document.dispatchEvent(stateEvent);
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
                this.highlightWinningCells(combination);
                return true;
            }
        }
        return false;
    }

    highlightWinningCells(combination) {
        combination.forEach(index => {
            this.cells[index].classList.add('winning');
        });
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    handleGameEnd(result) {
        this.gameActive = false;
        
        if (result === 'win') {
            this.score[this.currentPlayer]++;
            this.updateGameStatus(`🎉 Player ${this.currentPlayer} wins!`);
            this.addEvent(`🏆 Player ${this.currentPlayer} wins the game!`, 'winner');
            this.showModal('🎉 Victory!', `Player ${this.currentPlayer} wins!`);
        } else {
            this.score.ties++;
            this.updateGameStatus("🤝 It's a tie!");
            this.addEvent("🤝 Game ended in a tie!", 'winner');
            this.showModal('🤝 Tie Game!', "It's a tie! Good game!");
        }
        
        this.updateScoreDisplay();

        // Dispatch game end event
        const endEvent = new CustomEvent('gameStateChange', {
            detail: {
                type: 'gameEnd',
                result: result,
                winner: result === 'win' ? this.currentPlayer : null,
                finalBoard: [...this.board]
            }
        });
        document.dispatchEvent(endEvent);
    }

    resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        
        this.updateCurrentPlayerDisplay();
        this.updateGameStatus("Player X's turn");
        this.closeModal();
        
        this.addEvent('🔄 New game started! Player X goes first.', 'game-start');

        // Dispatch reset event
        const resetEvent = new CustomEvent('gameStateChange', {
            detail: {
                type: 'gameReset',
                currentPlayer: this.currentPlayer
            }
        });
        document.dispatchEvent(resetEvent);
    }

    resetScore() {
        this.score = { X: 0, O: 0, ties: 0 };
        this.updateScoreDisplay();
        this.addEvent('📊 Score reset to 0-0-0', 'game-start');
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

    showModal(title, message) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    addEvent(message, type = 'move') {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${type}`;
        eventItem.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        
        this.eventList.insertBefore(eventItem, this.eventList.firstChild);
        
        // Keep only last 10 events
        while (this.eventList.children.length > 10) {
            this.eventList.removeChild(this.eventList.lastChild);
        }

        // Auto-scroll to top
        this.eventList.scrollTop = 0;
    }

    // Real-time event handlers
    handlePlayerMoveEvent(detail) {
        console.log('Real-time move event:', detail);
        // You can add additional real-time functionality here
        // For example, sending data to a server or updating other connected clients
    }

    handleGameStateChangeEvent(detail) {
        console.log('Game state change event:', detail);
        // Handle real-time game state changes
        // This could be used for multiplayer functionality or game analytics
        
        if (detail.type === 'gameEnd') {
            // Could trigger confetti animation or sound effects
            this.triggerGameEndEffects(detail);
        }
    }

    triggerGameEndEffects(detail) {
        // Add some celebratory effects
        if (detail.result === 'win') {
            // Create a simple celebration effect
            this.createCelebrationEffect();
        }
    }

    createCelebrationEffect() {
        // Simple celebration animation
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * window.innerWidth + 'px';
                confetti.style.top = '-10px';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '9999';
                confetti.style.transition = 'all 3s ease-out';
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.style.top = window.innerHeight + 'px';
                    confetti.style.transform = 'rotate(720deg)';
                    confetti.style.opacity = '0';
                }, 100);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3100);
            }, i * 100);
        }
    }
}

// AI Player for single player mode (bonus feature)
class AIPlayer {
    constructor(game) {
        this.game = game;
    }

    makeMove() {
        if (!this.game.gameActive || this.game.currentPlayer !== 'O') return;

        // Simple AI strategy: try to win, block opponent, or take center/corners
        const move = this.getBestMove();
        if (move !== -1) {
            setTimeout(() => {
                this.game.makeMove(move);
            }, 500); // Add slight delay for better UX
        }
    }

    getBestMove() {
        // Try to win
        let move = this.findWinningMove('O');
        if (move !== -1) return move;

        // Block opponent from winning
        move = this.findWinningMove('X');
        if (move !== -1) return move;

        // Take center if available
        if (this.game.board[4] === '') return 4;

        // Take corners
        const corners = [0, 2, 6, 8];
        for (let corner of corners) {
            if (this.game.board[corner] === '') return corner;
        }

        // Take any available side
        const sides = [1, 3, 5, 7];
        for (let side of sides) {
            if (this.game.board[side] === '') return side;
        }

        return -1;
    }

    findWinningMove(player) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let combination of winningCombinations) {
            const [a, b, c] = combination;
            const cells = [this.game.board[a], this.game.board[b], this.game.board[c]];
            
            if (cells.filter(cell => cell === player).length === 2 && cells.filter(cell => cell === '').length === 1) {
                return combination[cells.indexOf('')];
            }
        }
        return -1;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TicTacToeGame();
    
    // Optional: Enable AI player (uncomment the lines below for single player mode)
    // const ai = new AIPlayer(game);
    // document.addEventListener('gameStateChange', (e) => {
    //     if (e.detail.type === 'playerSwitch' && e.detail.currentPlayer === 'O') {
    //         ai.makeMove();
    //     }
    // });
    
    console.log('🎮 Tic Tac Toe game initialized with real-time events!');
    console.log('💡 Tips:');
    console.log('  - Use number keys 1-9 to make moves');
    console.log('  - Press R to reset the game');
    console.log('  - Press Escape to close modals');
    console.log('  - Watch the event log for real-time updates!');
});
