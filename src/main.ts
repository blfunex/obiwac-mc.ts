import run from "./core/run";
import GameWindow from "./game/GameWindow";

const window = new GameWindow({
  width: 320,
  height: 240,
  fullscreen: false,
  title: "MineCraft",
});

run(window, 60);
