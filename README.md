# 🎮 Tic Tac Toe - Real-time Game

A beautiful, modern tic-tac-toe game with real-time event updates, built with HTML, CSS, and JavaScript.

## ✨ Features

- **Beautiful Modern UI**: Gradient backgrounds, smooth animations, and responsive design
- **Real-time Event Updates**: Live event log showing all game actions with timestamps
- **Score Tracking**: Persistent score tracking for X, O, and ties
- **Keyboard Controls**: Play using number keys 1-9, reset with 'R', escape to close modals
- **Smooth Animations**: Cell hover effects, winning cell highlights, and celebration animations
- **Modal System**: Beautiful game-end modals with victory/tie announcements
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Event System**: Custom JavaScript events for extensible real-time functionality

## 🚀 How to Play

1. **Starting**: Player X always goes first
2. **Making Moves**: 
   - Click on any empty cell to make your move
   - Or use keyboard numbers 1-9 (top-left to bottom-right)
3. **Winning**: Get three of your symbols in a row (horizontal, vertical, or diagonal)
4. **Controls**:
   - `Reset Game`: Start a new game (keeps score)
   - `Reset Score`: Reset all scores to 0
   - `R key`: Quick reset game
   - `Esc key`: Close any open modals

## 🔧 Technical Features

### Real-time Event System
The game implements a custom event system that dispatches real-time updates:

- **`playerMove`**: Fired when a player makes a move
- **`gameStateChange`**: Fired when game state changes (player switch, game end, reset)

### Event Types
- 🎯 **Move events**: Track each player move with position and timestamp
- 🏆 **Win events**: Celebrate victories with special highlighting
- 🤝 **Tie events**: Handle draw games gracefully
- 🔄 **Reset events**: Track game and score resets
- 🎮 **State changes**: Monitor all game state transitions

### Extensible Architecture
The game is built with extensibility in mind:

```javascript
// Listen to real-time game events
document.addEventListener('playerMove', (e) => {
    console.log('Player moved:', e.detail);
});

document.addEventListener('gameStateChange', (e) => {
    console.log('Game state changed:', e.detail);
});
```

## 🎨 Visual Features

- **Gradient backgrounds** with modern color schemes
- **Smooth hover effects** on interactive elements
- **Winning cell animations** with pulsing effects
- **Celebration confetti** when games are won
- **Responsive grid layout** that scales to any screen size
- **Color-coded players** (X = red gradient, O = blue gradient)

## 🚀 Getting Started

1. Clone or download the project files
2. Open `index.html` in your web browser
3. Start playing immediately - no setup required!

## 📁 Project Structure

```
tictactoe/
├── index.html      # Main HTML structure
├── styles.css      # Beautiful CSS styling and animations
├── script.js       # Game logic and real-time event system
└── README.md       # This file
```

## 🔮 Future Enhancements

The game architecture supports easy addition of:

- **Multiplayer mode**: Using WebSockets for real online play
- **AI opponent**: Smart computer player (basic AI included but commented out)
- **Sound effects**: Audio feedback for moves and wins
- **Game analytics**: Track playing patterns and statistics
- **Themes**: Multiple visual themes and color schemes
- **Tournament mode**: Best of series gameplay

## 🎯 AI Player (Bonus)

The code includes a commented-out AI player that you can enable for single-player mode. The AI uses strategic gameplay:

1. Try to win if possible
2. Block opponent's winning moves
3. Take center position
4. Take corners
5. Take any remaining position

To enable AI mode, uncomment the AI-related code at the bottom of `script.js`.

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 🎉 Enjoy Playing!

Have fun with this modern take on the classic tic-tac-toe game! The real-time event system makes it perfect for learning about JavaScript events and game state management.
