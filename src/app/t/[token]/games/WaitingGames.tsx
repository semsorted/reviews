"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES, TRIVIA, pickGames, shuffle, ticTacToeWinner, type GameId } from "./pick";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-review-blue focus-visible:ring-offset-2";
const primaryBtn = cn(
  "min-h-11 rounded-full bg-review-blue px-5 font-semibold text-white hover:opacity-90 disabled:opacity-50",
  focusRing,
);
const secondaryBtn = cn(
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-review-line bg-white px-4 font-medium text-review-ink hover:bg-review-tint",
  focusRing,
);

export function WaitingGames({ partySize }: { partySize: number }) {
  const games = pickGames(partySize);
  const [game, setGame] = useState<GameId | null>(null);

  return (
    <section aria-labelledby="waiting-games-title" className="space-y-4 text-review-ink">
      <h2 id="waiting-games-title" className="text-lg font-semibold">
        Play while your food is cooking
      </h2>

      {game === null ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {games.map((id, i) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setGame(id)}
                className={cn(
                  "flex min-h-11 w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left hover:bg-review-tint",
                  i === 0 ? "border-review-blue bg-review-tint" : "border-review-line bg-white",
                  focusRing,
                )}
              >
                {i === 0 && (
                  <span className="rounded-full bg-review-blue px-2 py-0.5 text-xs font-semibold text-white">
                    Best for your table
                  </span>
                )}
                <span className="font-semibold">{GAMES[id].title}</span>
                <span className="text-sm text-review-muted">{GAMES[id].players}</span>
                <span className="text-sm text-review-muted">{GAMES[id].blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setGame(null)} className={secondaryBtn}>
              <ArrowLeft aria-hidden className="size-4" />
              Back to games
            </button>
            <h3 className="font-semibold">{GAMES[game].title}</h3>
          </div>
          {game === "memory" && <MemoryMatch />}
          {game === "tictactoe" && <TicTacToe />}
          {game === "chilli" && <PassTheChilli />}
          {game === "trivia" && <FoodTrivia key={partySize} partySize={partySize} />}
        </div>
      )}
    </section>
  );
}

const FOODS = ["🍕", "🍔", "🌮", "🍩", "🍉", "🍟", "🥟", "🍦"];
const newDeck = () => shuffle([...FOODS, ...FOODS]);

function MemoryMatch() {
  const [deck, setDeck] = useState(newDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const done = matched.length === FOODS.length;

  // Flip a non-matching pair back after a short look.
  useEffect(() => {
    if (open.length !== 2) return;
    const t = setTimeout(() => setOpen([]), 800);
    return () => clearTimeout(t);
  }, [open]);

  function flip(i: number) {
    if (open.length === 2 || open.includes(i) || matched.includes(deck[i])) return;
    const next = [...open, i];
    if (next.length === 2) {
      setMoves((m) => m + 1);
      if (deck[next[0]] === deck[next[1]]) {
        setMatched((m) => [...m, deck[i]]);
        setOpen([]);
        return;
      }
    }
    setOpen(next);
  }

  function reset() {
    setDeck(newDeck());
    setOpen([]);
    setMatched([]);
    setMoves(0);
  }

  return (
    <div className="space-y-3">
      <p aria-live="polite" className="text-sm text-review-muted">
        {done ? `All pairs found in ${moves} moves!` : `Moves: ${moves} · Pairs: ${matched.length}/${FOODS.length}`}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {deck.map((food, i) => {
          const shown = open.includes(i) || matched.includes(food);
          return (
            <button
              key={i}
              type="button"
              onClick={() => flip(i)}
              aria-label={shown ? `Card ${i + 1}: ${food}` : `Card ${i + 1}, hidden`}
              className={cn(
                "aspect-square min-h-11 rounded-xl border text-3xl",
                shown ? "border-review-line bg-white" : "border-review-blue bg-review-tint",
                matched.includes(food) && "opacity-60",
                focusRing,
              )}
            >
              {shown ? food : <span aria-hidden className="text-review-blue">?</span>}
            </button>
          );
        })}
      </div>
      {done && (
        <button type="button" onClick={reset} className={primaryBtn}>
          Play again
        </button>
      )}
    </div>
  );
}

type Cell = "X" | "O" | null;

function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [starter, setStarter] = useState<"X" | "O">("X");
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const result = ticTacToeWinner(board);
  const filled = board.filter(Boolean).length;
  const turn = filled % 2 === 0 ? starter : starter === "X" ? "O" : "X";

  function play(i: number) {
    if (board[i] || result) return;
    const next = board.slice();
    next[i] = turn;
    setBoard(next);
    const r = ticTacToeWinner(next);
    if (r) setScores((s) => ({ ...s, [r]: s[r] + 1 }));
  }

  function newRound() {
    setBoard(Array(9).fill(null));
    setStarter((s) => (s === "X" ? "O" : "X"));
  }

  return (
    <div className="space-y-3">
      <p aria-live="polite" className="text-center text-lg font-semibold">
        {result === "draw" ? "It's a draw!" : result ? `${result} wins!` : `${turn}'s turn — pass the phone`}
      </p>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            disabled={!!cell || !!result}
            aria-label={`Square ${i + 1}: ${cell ?? "empty"}`}
            className={cn(
              "aspect-square min-h-11 rounded-xl border border-review-line bg-white text-4xl font-bold",
              cell === "X" ? "text-review-blue" : "text-red-600",
              focusRing,
            )}
          >
            {cell}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-review-muted">
        X: {scores.X} · O: {scores.O} · Draws: {scores.draw}
      </p>
      {result && (
        <div className="text-center">
          <button type="button" onClick={newRound} className={primaryBtn}>
            New round
          </button>
        </div>
      )}
    </div>
  );
}

const PROMPTS = [
  "Name a sweet",
  "Name a vegetable",
  "Name a fruit",
  "Name a spice",
  "Name a street food",
  "Name a kind of bread",
  "Name a breakfast dish",
  "Name something made with rice",
  "Name a drink",
  "Name a chutney",
  "Name something made with potato",
  "Name an ice cream flavour",
  "Name a snack you eat with tea",
  "Name a dal",
  "Name something green you can eat",
];

function PassTheChilli() {
  const [prompt, setPrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [phase, setPhase] = useState<"ready" | "running" | "burst">("ready");
  const [fuse, setFuse] = useState(0);

  useEffect(() => {
    if (phase !== "running") return;
    const t = setTimeout(() => {
      setPhase("burst");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(400);
    }, fuse);
    return () => clearTimeout(t);
  }, [phase, fuse]);

  function start() {
    setFuse(10_000 + Math.random() * 15_000);
    setPhase("running");
  }

  function nextRound() {
    setPrompt((p) => shuffle(PROMPTS.filter((x) => x !== p))[0]);
    setPhase("ready");
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-review-muted">For 3–6 players. Say an answer, then pass the phone.</p>
      <p className="text-2xl font-bold">{prompt}</p>
      <div aria-live="assertive" className="space-y-3">
        {phase === "ready" && (
          <button type="button" onClick={start} className={primaryBtn}>
            Start
          </button>
        )}
        {phase === "running" && (
          <>
            <p aria-hidden className="text-6xl motion-safe:animate-pulse">🌶️</p>
            <p className="font-semibold">Answer and pass the phone — quick!</p>
          </>
        )}
        {phase === "burst" && (
          <>
            <p aria-hidden className="text-8xl motion-safe:animate-bounce">🌶️</p>
            <p className="text-xl font-bold text-red-600">Chilli burst!</p>
            <p>The person holding the phone loses this round.</p>
            <button type="button" onClick={nextRound} className={primaryBtn}>
              Next round
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const QUESTIONS_PER_GAME = 10;
const newQuiz = () => shuffle(TRIVIA).slice(0, QUESTIONS_PER_GAME);

function FoodTrivia({ partySize }: { partySize: number }) {
  const players = Number.isFinite(partySize) ? Math.min(6, Math.max(1, Math.floor(partySize))) : 1;
  const [quiz, setQuiz] = useState(newQuiz);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>(() => Array(players).fill(0));

  // ponytail: 10 questions round-robin, so with 3/4/6 players some get one fewer turn.
  if (index >= quiz.length) {
    const best = Math.max(...scores);
    const winners = scores.flatMap((s, i) => (s === best ? [`Player ${i + 1}`] : []));
    return (
      <div aria-live="polite" className="space-y-3 text-center">
        <p className="text-xl font-bold">
          {players === 1
            ? `You scored ${scores[0]}/${quiz.length}!`
            : winners.length === 1
              ? `${winners[0]} wins!`
              : `It's a tie: ${winners.join(", ")}`}
        </p>
        {players > 1 && <ScoreList scores={scores} />}
        <button
          type="button"
          onClick={() => {
            setQuiz(newQuiz());
            setIndex(0);
            setPicked(null);
            setScores(Array(players).fill(0));
          }}
          className={primaryBtn}
        >
          Play again
        </button>
      </div>
    );
  }

  const q = quiz[index];
  const player = index % players;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScores((s) => s.map((v, p) => (p === player ? v + 1 : v)));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-review-muted">
        Question {index + 1} of {quiz.length}
        {players > 1 && ` · Player ${player + 1}'s turn`}
      </p>
      <p className="text-lg font-semibold">{q.q}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isAnswer = picked !== null && i === q.answer;
          const isWrong = picked === i && i !== q.answer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={cn(
                "min-h-11 rounded-xl border px-4 py-2 text-left font-medium",
                isAnswer
                  ? "border-green-600 bg-green-50 text-green-800"
                  : isWrong
                    ? "border-red-600 bg-red-50 text-red-800"
                    : "border-review-line bg-white enabled:hover:bg-review-tint",
                focusRing,
              )}
            >
              {opt}
              {isAnswer && " ✓"}
              {isWrong && " ✗"}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div aria-live="polite" className="space-y-3">
          <p className="font-semibold">
            {picked === q.answer ? "Correct!" : `Not quite — it's ${q.options[q.answer]}.`}
          </p>
          <button
            type="button"
            onClick={() => {
              setIndex((n) => n + 1);
              setPicked(null);
            }}
            className={primaryBtn}
          >
            {index + 1 === quiz.length ? "See results" : "Next question"}
          </button>
        </div>
      )}
      {players > 1 && <ScoreList scores={scores} />}
    </div>
  );
}

function ScoreList({ scores }: { scores: number[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2 text-sm">
      {scores.map((s, i) => (
        <li key={i} className="rounded-full bg-review-tint px-3 py-1">
          Player {i + 1}: <span className="font-semibold text-review-blue">{s}</span>
        </li>
      ))}
    </ul>
  );
}
