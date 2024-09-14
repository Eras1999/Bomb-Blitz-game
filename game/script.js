document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const diceNumberP1 = document.getElementById('dice-number-p1');
    const diceNumberP2 = document.getElementById('dice-number-p2');
    const undoButton = document.getElementById('undo');
    const redoButton = document.getElementById('redo');
    const refreshButton = document.getElementById('refresh');
    const messageBox = document.getElementById('message-box');

    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const player1NameElement = document.getElementById('player1-name');
    const player2NameElement = document.getElementById('player2-name');

    let currentPositionP1 = 0;
    let currentPositionP2 = 0;
    let turn = 1; // 1 for Player 1, 2 for Player 2
    let history = [];
    let redoStack = [];

    const bombPositions = [12, 36, 75];
    const greenPositions = [8, 41, 83];
    const redPositions = [24, 66, 98];

    // Retrieve player names from localStorage
    const player1Name = localStorage.getItem('player1') || 'Player 1';
    const player2Name = localStorage.getItem('player2') || 'Player 2';

    // Update player name elements
    player1NameElement.textContent = `${player1Name} (Black)`;
    player2NameElement.textContent = `${player2Name} (Blue)`;

    // Generate 100 squares with numbers
    for (let i = 1; i <= 100; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.textContent = i;

        if (i === 100) {
            const crownImage = document.createElement('div');
            crownImage.classList.add('crown');
            square.appendChild(crownImage);
        } else if (bombPositions.includes(i)) {
            const bombImage = document.createElement('div');
            bombImage.classList.add('bomb');
            square.appendChild(bombImage);
        } else if (greenPositions.includes(i)) {
            const greenImage = document.createElement('div');
            greenImage.classList.add('green');
            square.appendChild(greenImage);
        } else if (redPositions.includes(i)) {
            const redImage = document.createElement('div');
            redImage.classList.add('red');
            square.appendChild(redImage);
        }

        board.appendChild(square);
    }

    const squares = document.querySelectorAll('.square');

    // Function to show message with colorful background
    function showMessage(message, bgColor) {
        messageBox.textContent = message;
        messageBox.style.backgroundColor = bgColor;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000);
    }

    // Function to roll the dice for Player 1
    function rollDiceP1() {
        if (turn === 1) {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            diceNumberP1.textContent = `Roll: ${diceRoll}`;
            movePlayer(1, diceRoll);
        }
    }

    // Function to roll the dice for Player 2
    function rollDiceP2() {
        if (turn === 2) {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            diceNumberP2.textContent = `Roll: ${diceRoll}`;
            movePlayer(2, diceRoll);
        }
    }

    // Function to check if a dice roll is valid based on the current position
    function isValidRoll(position, roll) {
        const target = position + roll;

        if (target > 100) return false;

        // Adjust invalid rolls for positions close to 100
        if (position === 95 && roll === 6) return false;
        if (position === 96 && (roll === 6 || roll === 5)) return false;
        if (position === 97 && (roll === 6 || roll === 5 || roll === 4)) return false;
        if (position === 98 && (roll === 6 || roll === 5 || roll === 4 || roll === 3)) return false;
        if (position === 99 && (roll === 6 || roll === 5 || roll === 4 || roll === 3 || roll === 2)) return false;

        return true;
    }

    // Function to move the player
    function movePlayer(player, steps) {
        let previousPosition = player === 1 ? currentPositionP1 : currentPositionP2;
        let newPosition = previousPosition + steps;

        // Check if the dice roll is valid based on the position
        if (!isValidRoll(previousPosition, steps)) {
            showMessage(`Invalid roll for position ${previousPosition}. Try again!`, 'grey');
            switchTurn();  // Switch turn after invalid roll
            return;
        }

        if (newPosition > 100) {
            newPosition = 100; // Ensure player doesn't exceed 100
        }

        // Handle special square actions (Bomb, Green, Red)
        if (bombPositions.includes(newPosition)) {
            newPosition = 1; // Bomb sends player back to square 1
            showMessage(`Sorry Bomb! You go to number 1.`, 'black');
        } else if (greenPositions.includes(newPosition)) {
            newPosition += 5; // Green moves player 5 squares forward
            if (newPosition > 100) newPosition = 100; // Ensure doesn't exceed 100
            showMessage(`Green Arrow! You move forward 5 squares.`, 'green');
        } else if (redPositions.includes(newPosition)) {
            newPosition -= 5; // Red moves player 5 squares backward
            if (newPosition < 1) newPosition = 1; // Ensure doesn't go below 1
            showMessage(`Red Arrow! You move back 5 squares.`, 'red');
        }

        // Update player's position and score
        if (player === 1) {
            currentPositionP1 = newPosition;
            updatePlayerScore(1, newPosition); // Update Player 1's score
        } else {
            currentPositionP2 = newPosition;
            updatePlayerScore(2, newPosition); // Update Player 2's score
        }

        updateBoard();

        // Check for win condition
        if (currentPositionP1 === 100) {
            showMessage(`Congratulations ${player1Name}! You have won the game!`, 'orange');
            disableButtons();
        } else if (currentPositionP2 === 100) {
            showMessage(`Congratulations ${player2Name}! You have won the game!`, 'orange');
            disableButtons();
        }

        history.push({ player, previousPosition, newPosition });
        redoStack = []; // Clear the redo stack after a new move

        switchTurn(); // Switch to the other player's turn after a valid move
    }

    // Function to update the score for each player
    function updatePlayerScore(player, position) {
        if (player === 1) {
            player1ScoreElement.textContent = `${player1Name}: ${position}`;
        } else {
            player2ScoreElement.textContent = `${player2Name}: ${position}`;
        }
    }

    // Function to update the board
    function updateBoard() {
        squares.forEach(square => {
            square.classList.remove('active-p1', 'active-p2');
        });

        if (currentPositionP1 > 0) {
            squares[currentPositionP1 - 1].classList.add('active-p1');
        }

        if (currentPositionP2 > 0) {
            squares[currentPositionP2 - 1].classList.add('active-p2');
        }
    }

    // Function to switch turns
    function switchTurn() {
        if (turn === 1) {
            turn = 2; // Switch to Player 2's turn
        } else {
            turn = 1; // Switch to Player 1's turn
        }
    }

    // Function to disable buttons after a win
    function disableButtons() {
        document.getElementById('roll-dice-p1').disabled = true;
        document.getElementById('roll-dice-p2').disabled = true;
        undoButton.disabled = true;
        redoButton.disabled = true;
    }

    // Function for undo
    function undo() {
        if (history.length > 0) {
            const lastMove = history.pop();
            redoStack.push(lastMove);
            const { player, previousPosition, newPosition } = lastMove;

            if (player === 1) {
                currentPositionP1 = previousPosition;
                updatePlayerScore(1, previousPosition);
            } else {
                currentPositionP2 = previousPosition;
                updatePlayerScore(2, previousPosition);
            }

            updateBoard();
            switchTurn(); // Switch back turn after undo
        }
    }

    // Function for redo
    function redo() {
        if (redoStack.length > 0) {
            const redoMove = redoStack.pop();
            const { player, previousPosition, newPosition } = redoMove;

            if (player === 1) {
                currentPositionP1 = newPosition;
                updatePlayerScore(1, newPosition);
            } else {
                currentPositionP2 = newPosition;
                updatePlayerScore(2, newPosition);
            }

            updateBoard();
            history.push(redoMove); // Restore the move to history after redo
            switchTurn(); // Switch back turn after redo
        }
    }

    // Function to reset the game state on refresh
    function refreshGame() {
        currentPositionP1 = 0;
        currentPositionP2 = 0;
        turn = 1; // Player 1 starts after refresh
        history = [];
        redoStack = [];

        diceNumberP1.textContent = '';
        diceNumberP2.textContent = '';
        player1ScoreElement.textContent = `${player1Name}: 0`;
        player2ScoreElement.textContent = `${player2Name}: 0`;

        document.getElementById('roll-dice-p1').disabled = false;
        document.getElementById('roll-dice-p2').disabled = false;
        undoButton.disabled = false;
        redoButton.disabled = false;

        updateBoard();
    }

    // Event listeners
    document.getElementById('roll-dice-p1').addEventListener('click', rollDiceP1);
    document.getElementById('roll-dice-p2').addEventListener('click', rollDiceP2);
    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);
    refreshButton.addEventListener('click', refreshGame);

    updateBoard();
});
