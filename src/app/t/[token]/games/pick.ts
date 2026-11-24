export type GameId = "memory" | "tictactoe" | "chilli" | "trivia";

export const GAMES: Record<GameId, { title: string; players: string; blurb: string }> = {
  memory: { title: "Memory Match", players: "1 player", blurb: "Flip cards and find all the food pairs." },
  tictactoe: { title: "Tic-Tac-Toe", players: "2 players", blurb: "Pass the phone. Three in a row wins." },
  chilli: { title: "Pass the Chilli", players: "3–6 players", blurb: "Name one, pass it on. Don't hold it when it bursts!" },
  trivia: { title: "Food Trivia", players: "1–6 players", blurb: "Take turns answering quick food questions." },
};

export function pickGames(partySize: number): GameId[] {
  const n = Number.isFinite(partySize) && partySize >= 1 ? Math.floor(partySize) : 1;
  if (n === 1) return ["memory", "trivia"];
  if (n === 2) return ["tictactoe", "memory", "trivia"];
  return ["chilli", "trivia", "tictactoe", "memory"];
}

type Cell = "X" | "O" | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function ticTacToeWinner(board: Cell[]): "X" | "O" | "draw" | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.length === 9 && board.every(Boolean) ? "draw" : null;
}

export const TRIVIA: { q: string; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3 }[] = [
  { q: "Which spice gives dal its bright yellow colour?", options: ["Cardamom", "Turmeric", "Clove", "Black pepper"], answer: 1 },
  { q: "Paneer is made from which ingredient?", options: ["Rice", "Wheat", "Milk", "Lentils"], answer: 2 },
  { q: "Idli batter is made from rice and which lentil?", options: ["Chana dal", "Masoor dal", "Moong dal", "Urad dal"], answer: 3 },
  { q: "Which fruit is called the 'king of fruits' in India?", options: ["Mango", "Banana", "Apple", "Guava"], answer: 0 },
  { q: "Poha is made from which grain?", options: ["Wheat", "Flattened rice", "Corn", "Barley"], answer: 1 },
  { q: "Jalebi is soaked in what after frying?", options: ["Milk", "Honey", "Sugar syrup", "Ghee"], answer: 2 },
  { q: "Dhokla is a famous snack from which state?", options: ["Punjab", "Kerala", "Bihar", "Gujarat"], answer: 3 },
  { q: "Rasgulla is made from which dairy product?", options: ["Chhena", "Butter", "Curd", "Cream"], answer: 0 },
  { q: "Which leaf is often used as a plate for meals in South India?", options: ["Mango leaf", "Banana leaf", "Neem leaf", "Mint leaf"], answer: 1 },
  { q: "Ghee is made by heating what?", options: ["Coconut", "Mustard seeds", "Butter", "Peanuts"], answer: 2 },
  { q: "Besan is flour made from which?", options: ["Rice", "Wheat", "Corn", "Chickpeas"], answer: 3 },
  { q: "Which vegetable is the star of baingan bharta?", options: ["Brinjal", "Potato", "Cauliflower", "Pumpkin"], answer: 0 },
  { q: "'Aloo' is the Hindi word for which vegetable?", options: ["Onion", "Potato", "Tomato", "Pea"], answer: 1 },
  { q: "Kaju katli is made mainly from which nut?", options: ["Almond", "Pistachio", "Cashew", "Walnut"], answer: 2 },
  { q: "Saffron comes from which part of a plant?", options: ["Root", "Leaf", "Seed", "Flower"], answer: 3 },
  { q: "Lassi is a drink made by blending which?", options: ["Curd", "Lemon", "Tamarind", "Coconut water"], answer: 0 },
  { q: "What does 'gulab' in gulab jamun mean?", options: ["Sugar", "Rose", "Milk", "Round"], answer: 1 },
  { q: "'Elaichi' is the Hindi name for which spice?", options: ["Clove", "Cinnamon", "Cardamom", "Cumin"], answer: 2 },
  { q: "'Jeera' is the Hindi name for which spice?", options: ["Coriander", "Fennel", "Mustard", "Cumin"], answer: 3 },
  { q: "Gajar ka halwa is made from which vegetable?", options: ["Carrot", "Beetroot", "Pumpkin", "Bottle gourd"], answer: 0 },
  { q: "Kishmish (raisins) are dried what?", options: ["Dates", "Grapes", "Figs", "Plums"], answer: 1 },
  { q: "What usually gives sambar its tangy taste?", options: ["Vinegar", "Curd", "Tamarind", "Orange"], answer: 2 },
  { q: "Makki di roti is made from which flour?", options: ["Wheat", "Rice", "Millet", "Maize"], answer: 3 },
  { q: "Ragi is also known as which millet?", options: ["Finger millet", "Pearl millet", "Foxtail millet", "Sorghum"], answer: 0 },
  { q: "How many days are there in a leap year?", options: ["365", "366", "364", "367"], answer: 1 },
  { q: "Which is the largest planet in our solar system?", options: ["Saturn", "Earth", "Jupiter", "Mars"], answer: 2 },
  { q: "How many players does a cricket team have on the field?", options: ["9", "10", "12", "11"], answer: 3 },
  { q: "What is the national animal of India?", options: ["Tiger", "Lion", "Elephant", "Peacock"], answer: 0 },
  { q: "What is the national bird of India?", options: ["Parrot", "Peacock", "Sparrow", "Eagle"], answer: 1 },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Mercury"], answer: 2 },
  { q: "At sea level, water boils at what temperature?", options: ["80 °C", "90 °C", "120 °C", "100 °C"], answer: 3 },
  { q: "How many legs does a spider have?", options: ["8", "6", "10", "4"], answer: 0 },
];

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
