import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Button } from './ui/button';
import { Input } from './ui/input';

type Player = 'X' | 'O' | null;
type Board = Player[];

interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw';
  gameOver: boolean;
  winningCells: number[];
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// Centers of each cell inside a 304×304 board (3×96px cells, gap 8px)
const CELL_CENTERS: [number, number][] = [
  [48, 48],  [152, 48],  [256, 48],
  [48, 152], [152, 152], [256, 152],
  [48, 256], [152, 256], [256, 256],
];

export function TicTacToe() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameOver: false,
    winningCells: [],
  });
  const [setupComplete, setSetupComplete] = useState(false);
  const [playerXName, setPlayerXName] = useState('');
  const [playerOName, setPlayerOName] = useState('');
  const [boardKey, setBoardKey] = useState(0);

  // Refs
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const setupModalRef = useRef<HTMLDivElement>(null);
  const resultModalRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const restartBtnRef = useRef<HTMLButtonElement>(null);
  const winLineRef = useRef<SVGLineElement>(null);
  const prevBoardRef = useRef<Board>(Array(9).fill(null));
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // ── Set initial invisible states before first paint ──────────────────────
  useLayoutEffect(() => {
    if (titleRef.current) gsap.set(titleRef.current, { opacity: 0, y: -30 });
    cellRefs.current.forEach(c => c && gsap.set(c, { opacity: 0, scale: 0, rotation: -15 }));
  }, []);

  // When setupComplete toggles ON, initialise status + btn to invisible
  useLayoutEffect(() => {
    if (setupComplete) {
      if (statusRef.current) gsap.set(statusRef.current, { opacity: 0, y: -10 });
      if (restartBtnRef.current) gsap.set(restartBtnRef.current, { opacity: 0, y: 20 });
    }
  }, [setupComplete]);

  // ── Title entrance ────────────────────────────────────────────────────────
  useEffect(() => {
    gsap.to(titleRef.current, {
      opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)', delay: 0.15,
    });
  }, []);

  // ── Setup modal entrance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!setupComplete && setupModalRef.current) {
      gsap.fromTo(
        setupModalRef.current,
        { scale: 0.85, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.7)' },
      );
    }
  }, [setupComplete]);

  // ── Board entrance (on setup + on replay) ────────────────────────────────
  useEffect(() => {
    if (!setupComplete) return;

    // Cells stagger in from centre
    gsap.fromTo(
      cellRefs.current.filter(Boolean),
      { scale: 0, opacity: 0, rotation: -15 },
      {
        scale: 1, opacity: 1, rotation: 0,
        duration: 0.5,
        stagger: { amount: 0.35, from: 'center' },
        ease: 'back.out(1.7)',
        delay: 0.05,
      },
    );
    // Status text slides in
    gsap.fromTo(
      statusRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.45 },
    );
    // Restart button fades up
    gsap.fromTo(
      restartBtnRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.55 },
    );
  }, [setupComplete, boardKey]);

  // ── Animate marker when a cell is filled ─────────────────────────────────
  useEffect(() => {
    const prev = prevBoardRef.current;
    gameState.board.forEach((cell, i) => {
      if (cell && !prev[i]) {
        // Cell "press" pulse
        const btn = cellRefs.current[i];
        if (btn) gsap.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });

        // Marker pop-in
        const span = markerRefs.current[i];
        if (span) {
          gsap.fromTo(
            span,
            { scale: 0, rotation: -25, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.42, ease: 'back.out(2.8)' },
          );
        }
      }
    });
    prevBoardRef.current = [...gameState.board];
  }, [gameState.board]);

  // ── Winning cells highlight + dim losers + draw line ─────────────────────
  useEffect(() => {
    if (gameState.winningCells.length === 0) return;

    const allIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const winCells = gameState.winningCells.map(i => cellRefs.current[i]).filter(Boolean);
    const loseCells = allIdx
      .filter(i => !gameState.winningCells.includes(i))
      .map(i => cellRefs.current[i])
      .filter(Boolean);

    // Pulse-in winning cells
    gsap.fromTo(
      winCells,
      { scale: 1 },
      {
        scale: 1.1, duration: 0.22, ease: 'power2.out',
        yoyo: true, repeat: 1,
        onComplete: () => gsap.to(winCells, { scale: 1.03, duration: 0.15 }),
      },
    );

    // Dim losers
    gsap.to(loseCells, { opacity: 0.3, duration: 0.4, ease: 'power2.out', delay: 0.1 });

    // Animate SVG win-line
    if (winLineRef.current) {
      gsap.fromTo(
        winLineRef.current,
        { opacity: 0, attr: { 'stroke-dashoffset': 420 } },
        {
          opacity: 1,
          attr: { 'stroke-dashoffset': 0 },
          duration: 0.45,
          ease: 'power2.out',
          delay: 0.18,
        },
      );
    }
  }, [gameState.winningCells]);

  // ── Result modal entrance ─────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.gameOver && resultModalRef.current) {
      gsap.fromTo(
        resultModalRef.current,
        { scale: 0.82, opacity: 0, y: 28 },
        { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.7)', delay: 0.5 },
      );
    }
  }, [gameState.gameOver]);

  // ── Blur game layer when any modal is open ────────────────────────────────
  useEffect(() => {
    const modalOpen = !setupComplete || gameState.gameOver;
    gsap.to(gameAreaRef.current, {
      filter: modalOpen ? 'blur(6px)' : 'blur(0px)',
      scale: modalOpen ? 0.97 : 1,
      opacity: modalOpen ? 0.7 : 1,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [setupComplete, gameState.gameOver]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const checkWinner = (board: Board): { winner: Player | 'draw' | null; winningCells: number[] } => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], winningCells: combo };
      }
    }
    if (board.every(c => c !== null)) return { winner: 'draw', winningCells: [] };
    return { winner: null, winningCells: [] };
  };

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver) return;
    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;
    const { winner, winningCells } = checkWinner(newBoard);
    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      gameOver: winner !== null,
      winningCells,
    });
  };

  const animateCellsOut = (onComplete: () => void) => {
    const cells = cellRefs.current.filter(Boolean);
    if (cells.length === 0) { onComplete(); return; }
    gsap.to(cells, {
      scale: 0, opacity: 0,
      duration: 0.22,
      stagger: { amount: 0.18, from: 'random' },
      ease: 'power2.in',
      onComplete,
    });
  };

  const playAgain = () => {
    animateCellsOut(() => {
      prevBoardRef.current = Array(9).fill(null);
      setGameState({ board: Array(9).fill(null), currentPlayer: 'X', winner: null, gameOver: false, winningCells: [] });
      setBoardKey(k => k + 1);
    });
  };

  const resetGame = () => {
    animateCellsOut(() => {
      prevBoardRef.current = Array(9).fill(null);
      setGameState({ board: Array(9).fill(null), currentPlayer: 'X', winner: null, gameOver: false, winningCells: [] });
      setSetupComplete(false);
      setPlayerXName('');
      setPlayerOName('');
    });
  };

  const handleSetupComplete = () => {
    if (!playerXName.trim() || !playerOName.trim()) return;
    if (setupModalRef.current) {
      gsap.to(setupModalRef.current, {
        scale: 0.88, opacity: 0, y: -18,
        duration: 0.28, ease: 'power2.in',
        onComplete: () => setSetupComplete(true),
      });
    } else {
      setSetupComplete(true);
    }
  };

  const getPlayerName = (player: Player) =>
    player === 'X' ? playerXName : player === 'O' ? playerOName : '';

  // Compute winning line geometry
  const getWinLine = () => {
    if (gameState.winningCells.length < 3) return null;
    const [s, , e] = gameState.winningCells.map(i => CELL_CENTERS[i]);
    const dx = e[0] - s[0], dy = e[1] - s[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const extend = 22;
    const ux = dx / len, uy = dy / len;
    return {
      x1: s[0] - ux * extend, y1: s[1] - uy * extend,
      x2: e[0] + ux * extend, y2: e[1] + uy * extend,
    };
  };

  const winLine = getWinLine();

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* ── Setup Modal ───────────────────────────────────────────────── */}
      {!setupComplete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div
            ref={setupModalRef}
            className="bg-white rounded-xl p-8 w-full max-w-md mx-4"
            style={{ opacity: 0 }}
          >
            <h2
              className="text-center text-[#4043FF] font-semibold mb-1"
              style={{ fontSize: '24px' }}
            >
              Let's Play OXO!
            </h2>
            <p className="text-center text-muted-foreground mb-8" style={{ fontSize: '14px' }}>
              Get started
            </p>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>Player X</label>
                <Input
                  value={playerXName}
                  onChange={e => setPlayerXName(e.target.value)}
                  placeholder="Name"
                  className="w-full text-[#4043FF] border-none focus:border-none focus:ring-0 focus:outline-none shadow-none focus:shadow-none rounded-[5px]"
                  onKeyDown={e => e.key === 'Enter' && handleSetupComplete()}
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>Player O</label>
                <Input
                  value={playerOName}
                  onChange={e => setPlayerOName(e.target.value)}
                  placeholder="Name"
                  className="w-full text-[#4043FF] border-none focus:border-none focus:ring-0 focus:outline-none shadow-none focus:shadow-none rounded-[5px]"
                  onKeyDown={e => e.key === 'Enter' && handleSetupComplete()}
                />
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleSetupComplete}
                disabled={!playerXName.trim() || !playerOName.trim()}
                className="px-8 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border-none font-normal rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Game Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-8 p-8" ref={gameAreaRef}>

        {/* Title */}
        <div className="text-center">
          <h1
            ref={titleRef}
            className="text-[#4043FF] font-semibold"
            style={{ fontSize: '32px' }}
          >
            OXO
          </h1>

          {/* Status */}
          {setupComplete && (
            <div className="mt-4 mb-2 h-7 flex items-center justify-center">
              <p
                ref={statusRef}
                className="text-[#4043FF] font-semibold"
                style={{ fontSize: '16px' }}
              >
                {gameState.winner === 'draw' ? (
                  "It's a draw!"
                ) : gameState.winner ? (
                  <><span>{getPlayerName(gameState.winner)}</span> wins!</>
                ) : (
                  <><span>{getPlayerName(gameState.currentPlayer)}</span>'s turn</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Board + SVG win-line overlay */}
        <div className="relative" style={{ width: 304, height: 304 }}>
          <div className="grid grid-cols-3 gap-2">
            {gameState.board.map((cell, index) => (
              <button
                key={index}
                ref={el => { cellRefs.current[index] = el; }}
                onClick={() => handleCellClick(index)}
                className={[
                  'w-24 h-24 rounded-[5px] bg-white text-foreground',
                  'border border-[rgba(64,67,255,0.2)]',
                  'flex items-center justify-center',
                  'transition-colors duration-200 ease-in-out',
                  'hover:bg-[#4043FF] hover:text-white group',
                  cell ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
                disabled={!!cell || gameState.gameOver}
              >
                <span
                  ref={el => { markerRefs.current[index] = el; }}
                  className="select-none font-semibold"
                  style={{ fontSize: '30px', display: 'inline-block' }}
                >
                  {cell}
                </span>
              </button>
            ))}
          </div>

          {/* SVG winning line */}
          {winLine && (
            <svg
              width="304"
              height="304"
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <line
                ref={winLineRef}
                x1={winLine.x1}
                y1={winLine.y1}
                x2={winLine.x2}
                y2={winLine.y2}
                stroke="#4043FF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="420"
                strokeDashoffset="420"
                opacity="0"
              />
            </svg>
          )}
        </div>

        {/* Restart button */}
        {setupComplete && (
          <div className="flex justify-center">
            <button
              ref={restartBtnRef}
              onClick={resetGame}
              className="px-8 py-2 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border border-transparent hover:border-[#4043FF] font-normal rounded-[5px] transition-colors duration-200 cursor-pointer"
              style={{ fontSize: '16px' }}
            >
              Restart
            </button>
          </div>
        )}
      </div>

      {/* ── Result Modal ──────────────────────────────────────────────── */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div
            ref={resultModalRef}
            className="bg-white rounded-xl p-8 w-full max-w-md mx-4 text-center"
            style={{ opacity: 0 }}
          >
            <h2
              className="text-[#4043FF] font-semibold mb-2"
              style={{ fontSize: '24px' }}
            >
              {gameState.winner === 'draw'
                ? "It's a Draw!"
                : `${getPlayerName(gameState.winner)} Wins!`}
            </h2>
            <p className="text-muted-foreground mb-8" style={{ fontSize: '14px' }}>
              {gameState.winner === 'draw'
                ? 'Good game! Want to try again?'
                : `${getPlayerName(gameState.winner)} played brilliantly.`}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="px-8 py-2 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border border-transparent hover:border-[#4043FF] font-normal rounded-[5px] transition-colors duration-200 cursor-pointer"
                style={{ fontSize: '16px' }}
              >
                New Game
              </button>
              <button
                onClick={playAgain}
                className="px-8 py-2 bg-[#4043FF] text-white hover:bg-white hover:text-[#4043FF] border border-transparent hover:border-[#4043FF] font-normal rounded-[5px] transition-colors duration-200 cursor-pointer"
                style={{ fontSize: '16px' }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}