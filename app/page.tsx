'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Move {
  index: number;
  symbol: string;
}

const socket: Socket = io(
  'https://websocket-server-production-15ba.up.railway.app/'
);

const Home: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [board, setBoard] = useState<string[]>(Array(9).fill(null));
  const [symbol, setSymbol] = useState<'X' | 'O'>('X');
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [draw, setDraw] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    socket.on('game-found', (id: string) => {
      setRoomId(id);
    });

    socket.on(
      'start-game',
      ({
        roomId,
        firstPlayer,
        firstPlayerSymbol,
        secondPlayerSymbol,
      }: {
        roomId: string;
        firstPlayer: string;
        firstPlayerSymbol: 'X' | 'O';
        secondPlayerSymbol: 'X' | 'O';
      }) => {
        setRoomId(roomId);
        setIsMyTurn(socket.id === firstPlayer);
        setLoading(false);
        //check if the first player is the current player
        console.log(firstPlayer, roomId, firstPlayerSymbol);

        if (socket.id === firstPlayer) {
          setSymbol(firstPlayerSymbol);
        } else {
          setSymbol(secondPlayerSymbol);
        }
      }
    );

    socket.on('move-made', ({ index, symbol }: Move) => {
      const newBoard = [...board];
      newBoard[index] = symbol;
      setBoard(newBoard);
      setIsMyTurn(true);

      if (checkWin(newBoard, symbol)) {
        setWinner(symbol);
        socket.emit('game-ended', { roomId, winner: symbol });
      } else if (newBoard.every((cell) => cell !== null)) {
        setDraw(true);
        socket.emit('game-ended', { roomId, winner: null });
      }
    });

    socket.on('game-ended', ({ winner }: { winner: string | null }) => {
      setWinner(winner);
      if (winner === null) {
        setDraw(true);
      }
    });

    return () => {
      socket.off('game-found');
      socket.off('start-game');
      socket.off('move-made');
      socket.off('game-ended');
    };
  }, [board]);

  const searchGame = () => {
    setLoading(true);
    socket.emit('search-game');
  };

  const makeMove = (index: number) => {
    if (!isMyTurn || board[index] || winner || draw) return;
    const newBoard = [...board];
    newBoard[index] = symbol;
    setBoard(newBoard);
    setIsMyTurn(false);
    socket.emit('make-move', { roomId, index, symbol });

    if (checkWin(newBoard, symbol)) {
      setWinner(symbol);
      socket.emit('game-ended', { roomId, winner: symbol });
    } else if (newBoard.every((cell) => cell !== null)) {
      setDraw(true);
      socket.emit('game-ended', { roomId, winner: null });
    }
  };

  const checkWin = (board: string[], symbol: string): boolean => {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    return winningCombinations.some((combination) =>
      combination.every((index) => board[index] === symbol)
    );
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setDraw(false);
    setIsMyTurn(false);
    setRoomId(null);
    setSymbol('X');
    searchGame();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-pink-200 via-indigo-200 to-teal-200">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Tic-Tac-Toe</h1>
      {roomId ? (
        <>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            You Are {symbol}
          </h2>
          <div className="grid grid-cols-3 gap-2 bg-white bg-opacity-40 backdrop-blur-lg p-4 rounded-lg border border-gray-300 shadow-lg">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => makeMove(index)}
                className="text-gray-800 w-20 h-20 text-3xl flex items-center justify-center bg-gradient-to-r from-blue-100 to-pink-100 rounded-lg border border-gray-200 shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {cell}
              </button>
            ))}
          </div>
          {winner ? (
            <>
              <p className="text-2xl font-semibold text-green-600 mt-4">
                {winner} wins!
              </p>
              <button
                onClick={resetGame}
                className="px-8 py-4 mt-4 bg-gradient-to-r from-lime-200 to-pink-200 rounded-lg border border-gray-300 shadow-lg text-2xl text-gray-800 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Play Again
              </button>
            </>
          ) : draw ? (
            <>
              <p className="text-2xl font-semibold text-yellow-600 mt-4">
                It's a draw!
              </p>
              <button
                onClick={resetGame}
                className="px-8 py-4 mt-4 bg-gradient-to-r from-lime-200 to-pink-200 rounded-lg border border-gray-300 shadow-lg text-2xl text-gray-800 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Play Again
              </button>
            </>
          ) : (
            <p className="text-xl text-gray-700 mt-4">
              {isMyTurn ? 'Your turn!' : 'Waiting for opponent...'}
            </p>
          )}
        </>
      ) : loading ? (
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-800"></div>
        </div>
      ) : (
        <button
          onClick={searchGame}
          className="px-8 py-4 bg-gradient-to-r from-lime-200 to-pink-200 rounded-lg border border-gray-300 shadow-lg text-2xl text-gray-800 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Search for Game
        </button>
      )}
    </div>
  );
};

export default Home;
