import { describe, expect, it } from "vitest";
import { pickGames, shuffle, ticTacToeWinner, TRIVIA } from "@/app/t/[token]/games/pick";

const b = (s: string) => s.split("").map((c) => (c === "." ? null : (c as "X" | "O")));

describe("pickGames", () => {
  it("maps party size to games", () => {
    expect(pickGames(1)).toEqual(["memory", "trivia"]);
    expect(pickGames(2)).toEqual(["tictactoe", "memory", "trivia"]);
    expect(pickGames(4)).toEqual(["chilli", "trivia", "tictactoe", "memory"]);
  });
  it("treats bad input as solo", () => {
    expect(pickGames(0)).toEqual(["memory", "trivia"]);
    expect(pickGames(NaN)).toEqual(["memory", "trivia"]);
    expect(pickGames(-3)).toEqual(["memory", "trivia"]);
  });
});

describe("ticTacToeWinner", () => {
  it("detects row, column and diagonal", () => {
    expect(ticTacToeWinner(b("XXXOO...."))).toBe("X");
    expect(ticTacToeWinner(b("OX.OX.O.X"))).toBe("O");
    expect(ticTacToeWinner(b("XO.OX...X"))).toBe("X");
  });
  it("detects draw and in-progress", () => {
    expect(ticTacToeWinner(b("XOXXOOOXX"))).toBe("draw");
    expect(ticTacToeWinner(b("XO......."))).toBeNull();
    expect(ticTacToeWinner(b("........."))).toBeNull();
  });
});

describe("TRIVIA", () => {
  it("has enough well-formed, unique questions", () => {
    expect(TRIVIA.length).toBeGreaterThanOrEqual(25);
    expect(new Set(TRIVIA.map((t) => t.q)).size).toBe(TRIVIA.length);
    for (const t of TRIVIA) {
      expect(new Set(t.options).size).toBe(4);
      expect([0, 1, 2, 3]).toContain(t.answer);
    }
  });
});

describe("shuffle", () => {
  it("returns the same members without mutating input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, () => 0);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual(input);
    expect(out).not.toEqual(input);
  });
});
