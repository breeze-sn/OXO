import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type Player = 'X' | 'O' | null;
type Board = Player[];

interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw';
  gameOver: boolean;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

export function TicTacToe() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameOver: false
  });

  const [setupComplete, setSetupComplete] = useState(false);
  const [playerXName, setPlayerXName] = useState('');
  const [playerOName, setPlayerOName] = useState('');

  const checkWinner = (board: Board): Player | 'draw' | null => {
    // Check for winning combinations
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    // Check for draw
    if (board.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    const winner = checkWinner(newBoard);
    const gameOver = winner !== null;

    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      gameOver
    });
  };

  const playAgain = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false
    });
  };

  const resetGame = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false
    });
    setSetupComplete(false);
    setPlayerXName('');
    setPlayerOName('');
  };

  const handleSetupComplete = () => {
    if (playerXName.trim() && playerOName.trim()) {
      setSetupComplete(true);
    }
  };

  const getPlayerName = (player: Player) => {
    if (player === 'X') return playerXName;
    if (player === 'O') return playerOName;
    return '';
  };

  const getStatusMessage = () => {
    if (gameState.winner === 'draw') {
      return "It's a draw!";
    }
    if (gameState.winner) {
      return `Player ${gameState.winner} wins!`;
    }
    return `Player ${gameState.currentPlayer}'s turn`;
  };

  return (
    <>
      {/* Setup Dialog */}
      <Dialog open={!setupComplete}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-[#4043FF] font-semibold text-2xl mb-1">
              Let's Play OXO!
            </DialogTitle>
            <DialogDescription className="text-center">
              Get started
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Player X</label>
              <Input
                value={playerXName}
                onChange={(e) => setPlayerXName(e.target.value)}
                placeholder="Name"
                className="w-full text-[rgba(64,67,255,1)] border-none focus:border-none focus:ring-0 focus:outline-none shadow-none focus:shadow-none rounded-[5px]"
                onKeyDown={(e) => e.key === 'Enter' && handleSetupComplete()}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Player O</label>
              <Input
                value={playerOName}
                onChange={(e) => setPlayerOName(e.target.value)}
                placeholder="Name"
                className="w-full text-[rgba(64,67,255,1)] border-none focus:border-none focus:ring-0 focus:outline-none shadow-none focus:shadow-none rounded-[5px]"
                onKeyDown={(e) => e.key === 'Enter' && handleSetupComplete()}
              />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Button 
              onClick={handleSetupComplete}
              disabled={!playerXName.trim() || !playerOName.trim()}
              className="px-8 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border-none font-normal rounded-[5px] shadow-[0_4px_14px_0_rgba(64,67,255,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game */}
      <div className="flex flex-col items-center gap-8 p-8">
      <div className="text-center font-semibold text-[#4043FF]">
        <h1 className="mb-4 text-[32px]">OXO</h1>
        {setupComplete && (
          <div className="mb-6">
            <p className={`transition-colors duration-300 ${
              gameState.gameOver 
                ? gameState.winner === 'draw' 
                  ? 'text-muted-foreground' 
                  : 'text-foreground'
                : 'text-foreground'
            }`}>
              {gameState.winner === 'draw' ? (
                "It's a draw!"
              ) : gameState.winner ? (
                <><span className="text-[#4043FF]">{getPlayerName(gameState.winner)}</span> wins!</>
              ) : (
                <><span className="text-[#4043FF]">{getPlayerName(gameState.currentPlayer)}</span>'s turn</>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 w-80 h-80">
        {gameState.board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className={`
              w-24 h-24 border-none rounded-[5px] bg-white text-foreground shadow-[0_0_2px_0_rgba(64,67,255,0.39)]
              flex items-center justify-center
              transition-all duration-200 ease-in-out
              hover:bg-[#4043FF] hover:text-white
              active:scale-95
              disabled:cursor-not-allowed
              ${cell ? 'cursor-default' : 'cursor-pointer'}
              ${gameState.gameOver ? 'opacity-75' : ''}
            `}
            disabled={!!cell || gameState.gameOver}
          >
            <span className={`
              select-none transition-all duration-300 ease-out transform font-semibold text-3xl
              ${cell === 'X' 
                ? 'animate-in zoom-in-50 duration-300' 
                : cell === 'O' 
                  ? 'animate-in zoom-in-50 duration-300' 
                  : ''
              }
            `}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={resetGame}
          variant="outline"
          className="px-8 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border-none font-normal rounded-[5px] shadow-[0_4px_14px_0_rgba(64,67,255,0.39)]"
        >
          Restart
        </Button>
      </div>

      <Dialog open={gameState.gameOver}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-[#4043FF] font-semibold text-2xl">
              {gameState.winner === 'draw' ? 'It\'s a Draw!' : `${getPlayerName(gameState.winner)} Wins!`}
            </DialogTitle>
            <DialogDescription className="text-center mt-4">
              {gameState.winner === 'draw' 
                ? 'Good game! Want to try again?' 
                : `${getPlayerName(gameState.winner)} played brilliantly.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-center mt-6">
            <Button 
              onClick={resetGame}
              className="px-8 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border-none font-normal rounded-[5px] shadow-[0_4px_14px_0_rgba(64,67,255,0.39)]"
            >
              New Game
            </Button>
            <Button 
              onClick={playAgain}
              className="px-8 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border-none font-normal rounded-[5px] shadow-[0_4px_14px_0_rgba(64,67,255,0.39)]"
            >
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}