// German translations for the multiplayer Tic Tac Toe game
const TRANSLATIONS = {
    // UI Messages
    'Please enter your name': 'Bitte geben Sie Ihren Namen ein',
    'Your turn!': 'Sie sind am Zug!',
    'Waiting for opponent...': 'Warte auf Gegner...',
    'Player X\'s turn': 'Spieler X ist am Zug',
    'Player O\'s turn': 'Spieler O ist am Zug',
    'You won!': 'Sie haben gewonnen!',
    'You lost!': 'Sie haben verloren!',
    'It\'s a tie!': 'Unentschieden!',
    'Good game!': 'Gut gespielt!',
    
    // Connection Status
    'Connected': 'Verbunden',
    'Offline': 'Offline',
    'Room': 'Raum',
    
    // Player Status
    'Player X': 'Spieler X',
    'Player O': 'Spieler O',
    'Waiting...': 'Warten...',
    
    // Events
    'joined as Player': 'ist als Spieler beigetreten',
    'moved to position': 'zog auf Position',
    'wins the game!': 'gewinnt das Spiel!',
    'Game ended in a tie!': 'Spiel endete unentschieden!',
    'New game started!': 'Neues Spiel gestartet!',
    'Score reset': 'Punkte zurückgesetzt',
    'Both players connected! Game is ready to start.': 'Beide Spieler verbunden! Spiel kann beginnen.',
    'Joined as spectator - watching the game': 'Als Zuschauer beigetreten - beobachtet das Spiel',
    'Game reset by a player': 'Spiel von einem Spieler zurückgesetzt',
    'Score reset by a player': 'Punkte von einem Spieler zurückgesetzt',
    'Room link copied to clipboard!': 'Raum-Link in Zwischenablage kopiert!',
    'Waiting for another player to join...': 'Warte auf einen weiteren Spieler...',
    
    // Modal Messages
    'Game Over!': 'Spiel beendet!',
    'Victory!': 'Sieg!',
    'Tie Game!': 'Unentschieden!',
    'wins!': 'gewinnt!',
    
    // Error Messages
    'Connection error': 'Verbindungsfehler',
    'Disconnected from server': 'Verbindung zum Server getrennt',
    'Attempting to reconnect...': 'Versuche Verbindung wiederherzustellen...',
    'Error:': 'Fehler:',
    
    // Console Messages
    'Multiplayer Tic Tac Toe initialized!': 'Mehrspieler Tic Tac Toe initialisiert!',
    'Tips:': 'Tipps:',
    'Click "Join/Create Room" to start playing with a friend': 'Klicken Sie auf "Raum beitreten/erstellen" um mit einem Freund zu spielen',
    'Share the room link with your friend': 'Teilen Sie den Raum-Link mit Ihrem Freund',
    'Use number keys 1-9 to make moves on your turn': 'Verwenden Sie die Zahlentasten 1-9 für Ihre Züge',
    'Press R to reset the game': 'Drücken Sie R um das Spiel zurückzusetzen',
    'Press Escape to close modals': 'Drücken Sie Escape um Dialoge zu schließen',
    'Watch the event log for real-time updates!': 'Beobachten Sie das Ereignisprotokoll für Echtzeit-Updates!'
};

// Helper function to translate text
function t(key) {
    return TRANSLATIONS[key] || key;
}
