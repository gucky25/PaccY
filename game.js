(() => {
  "use strict";

  const TILE = 24;
  const COLS = 21;
  const ROWS = 24;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const PLAYER_RADIUS = 9.5;

  const NONE = { name: "none", x: 0, y: 0, angle: 0 };
  const DIRS = {
    up: { name: "up", x: 0, y: -1, angle: -Math.PI / 2 },
    down: { name: "down", x: 0, y: 1, angle: Math.PI / 2 },
    left: { name: "left", x: -1, y: 0, angle: Math.PI },
    right: { name: "right", x: 1, y: 0, angle: 0 },
  };
  const DIR_LIST = [DIRS.up, DIRS.left, DIRS.down, DIRS.right];
  const OPPOSITE = { up: DIRS.down, down: DIRS.up, left: DIRS.right, right: DIRS.left, none: NONE };
  const KEY_TO_DIR = {
    ArrowUp: DIRS.up,
    ArrowDown: DIRS.down,
    ArrowLeft: DIRS.left,
    ArrowRight: DIRS.right,
  };

  const LEVELS = [
    {
      name: "Neon Docks",
      fruit: "cherry",
      wallFill: "#16213d",
      wallStroke: "#27d7f4",
      pellet: "#fff2b1",
      maps: [
        "#####################",
        "#P........#........o#",
        "#.###.###.#.###.###.#",
        "#o###.###.#.###.###.#",
        "#...................#",
        "#.###.#.#####.#.###.#",
        "#.....#...#...#.....#",
        "#####.###.#.###.#####",
        "----#.#.......#.#----",
        "#####.#.#####.#.#####",
        "----#..1.2.3.4..#----",
        "#####.#.#####.#.#####",
        "----#.#.......#.#----",
        "#####.#.#####.#.#####",
        "#.........#.........#",
        "#.###.###.#.###.###.#",
        "#o..#.....-.....#..o#",
        "###.#.#.#####.#.#.###",
        "#.....#...#...#.....#",
        "#.#######.#.#######.#",
        "#...................#",
        "#.###.#.#####.#.###.#",
        "#.....#.......#.....#",
        "#####################",
      ],
    },
    {
      name: "Mint Circuit",
      fruit: "lime",
      wallFill: "#173425",
      wallStroke: "#7ee787",
      pellet: "#ddffe1",
      maps: [
        "#####################",
        "#P....#.......#....o#",
        "#.###.#.#####.#.###.#",
        "#o#...#...#...#...#o#",
        "#.#.#.###.#.###.#.#.#",
        "#...................#",
        "#.###.#####.#####.###",
        "#...#...#...#...#...#",
        "###.#.#.#.#.#.#.#.###",
        "----#.#.......#.#----",
        "#####.#.#####.#.#####",
        "----#..1.2.3.4..#----",
        "#####.#.#####.#.#####",
        "----#.#.......#.#----",
        "###.#.#.#####.#.#.###",
        "#...#...#...#...#...#",
        "#.#####.#.#.#.#####.#",
        "#o......#.-.#......o#",
        "#######.#.#.#.#######",
        "#.........#.........#",
        "#.###.###.#.###.###.#",
        "#...#...........#...#",
        "#o#...####.####...#o#",
        "#####################",
      ],
    },
    {
      name: "Comet Pantry",
      fruit: "star",
      wallFill: "#321b38",
      wallStroke: "#ff4f9a",
      pellet: "#ffe4f1",
      maps: [
        "#####################",
        "#P..o.............o.#",
        "#.###.#####.#####.###",
        "#...#.....#.....#...#",
        "###.#.###.#.###.#.###",
        "#...................#",
        "#.###.#.#####.#.###.#",
        "#o....#...#...#....o#",
        "#####.###.#.###.#####",
        "----#.....#.....#----",
        "###.#.###.#.###.#.###",
        "----#..1.2.3.4..#----",
        "###.#.###.#.###.#.###",
        "----#.....#.....#----",
        "#####.###.#.###.#####",
        "#.........-.........#",
        "#.###.###.#.###.###.#",
        "#...#.....#.....#...#",
        "###.#.###.#.###.#.###",
        "#o......#...#......o#",
        "#.#####.#.#.#.#####.#",
        "#...................#",
        "#.###.#.#####.#.###.#",
        "#####################",
      ],
    },
  ];

  const GHOST_BLUEPRINTS = [
    { name: "Blinky", color: "#ff4b5f", corner: { row: 1, col: COLS - 2 }, style: "hunter" },
    { name: "Pinky", color: "#ff85d0", corner: { row: 1, col: 1 }, style: "ambush" },
    { name: "Inky", color: "#22d3ee", corner: { row: ROWS - 2, col: COLS - 2 }, style: "mirror" },
    { name: "Clyde", color: "#ff9f43", corner: { row: ROWS - 2, col: 1 }, style: "wander" },
  ];

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const ui = {
    score: document.getElementById("score"),
    highScore: document.getElementById("highScore"),
    level: document.getElementById("level"),
    lives: document.getElementById("lives"),
    levelName: document.getElementById("levelName"),
    statusText: document.getElementById("statusText"),
    pelletText: document.getElementById("pelletText"),
    screen: document.getElementById("screen"),
    screenTitle: document.getElementById("screenTitle"),
    screenCopy: document.getElementById("screenCopy"),
    screenButton: document.getElementById("screenButton"),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    soundButton: document.getElementById("soundButton"),
  };

  const audio = new SoundEngine();

  const state = {
    phase: "menu",
    phaseTimer: 0,
    levelNumber: 1,
    levelIndex: 0,
    score: 0,
    highScore: readHighScore(),
    lives: 3,
    elapsed: 0,
    walls: new Set(),
    pellets: new Set(),
    powers: new Set(),
    dotsTotal: 0,
    dotsLeft: 0,
    fruit: null,
    fruitMarks: new Set(),
    player: null,
    ghosts: [],
    floaters: [],
    sparks: [],
    level: LEVELS[0],
    ghostCombo: 200,
    status: "Klaar voor level 1",
  };

  validateLevels();
  resizeCanvas();
  initLevel(1);
  updateUi();
  requestAnimationFrame(loop);

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", onKeyDown, { passive: false });
  ui.startButton.addEventListener("click", () => {
    audio.ensure();
    primaryAction();
  });
  ui.screenButton.addEventListener("click", () => {
    audio.ensure();
    primaryAction();
  });
  ui.pauseButton.addEventListener("click", () => {
    audio.ensure();
    togglePause();
  });
  ui.soundButton.addEventListener("click", () => {
    audio.ensure();
    audio.toggleMuted();
    updateUi();
  });

  let lastTime = 0;

  function loop(timestamp) {
    const now = timestamp / 1000;
    const dt = Math.min(0.05, lastTime ? now - lastTime : 0);
    lastTime = now;

    update(dt, now);
    render(timestamp);
    requestAnimationFrame(loop);
  }

  function initLevel(levelNumber) {
    state.levelNumber = levelNumber;
    state.levelIndex = (levelNumber - 1) % LEVELS.length;
    state.level = LEVELS[state.levelIndex];
    state.walls = new Set();
    state.pellets = new Set();
    state.powers = new Set();
    state.fruit = null;
    state.fruitMarks = new Set();
    state.floaters = [];
    state.sparks = [];
    state.ghostCombo = 200;
    state.elapsed = 0;

    const ghostStarts = [];
    let playerStart = { row: 1, col: 1 };

    state.level.maps.forEach((rowText, row) => {
      [...rowText].forEach((tile, col) => {
        const key = tileKey(row, col);
        if (tile === "#") {
          state.walls.add(key);
        } else if (tile === ".") {
          state.pellets.add(key);
        } else if (tile === "o") {
          state.powers.add(key);
        } else if (tile === "P") {
          playerStart = { row, col };
        } else if (/[1-4]/.test(tile)) {
          ghostStarts[Number(tile) - 1] = { row, col };
        }
      });
    });

    state.dotsTotal = state.pellets.size + state.powers.size;
    state.dotsLeft = state.dotsTotal;

    const speedBoost = 1 + Math.min(levelNumber - 1, 8) * 0.045;
    state.player = createActor("PaccY", playerStart.row, playerStart.col, 122 * speedBoost);
    state.player.dir = DIRS.right;
    state.player.nextDir = DIRS.right;

    state.ghosts = GHOST_BLUEPRINTS.map((blueprint, index) => {
      const start = ghostStarts[index] || ghostStarts[0] || { row: 11, col: 10 };
      const ghost = createActor(blueprint.name, start.row, start.col, (92 + index * 4) * speedBoost);
      ghost.baseSpeed = ghost.speed;
      ghost.color = blueprint.color;
      ghost.corner = blueprint.corner;
      ghost.style = blueprint.style;
      ghost.mode = "chase";
      ghost.frightenedUntil = 0;
      ghost.releaseDelay = index * 0.45;
      ghost.dir = index % 2 ? DIRS.left : DIRS.right;
      return ghost;
    });

    state.status = `Klaar voor level ${levelNumber}`;
    updateUi();
  }

  function createActor(name, row, col, speed) {
    return {
      name,
      row,
      col,
      startRow: row,
      startCol: col,
      x: tileCenter(col),
      y: tileCenter(row),
      speed,
      dir: NONE,
      nextDir: NONE,
      target: null,
      mouth: 0,
    };
  }

  function resetActors() {
    state.player.row = state.player.startRow;
    state.player.col = state.player.startCol;
    state.player.x = tileCenter(state.player.col);
    state.player.y = tileCenter(state.player.row);
    state.player.dir = DIRS.right;
    state.player.nextDir = DIRS.right;
    state.player.target = null;

    state.ghosts.forEach((ghost, index) => {
      ghost.row = ghost.startRow;
      ghost.col = ghost.startCol;
      ghost.x = tileCenter(ghost.col);
      ghost.y = tileCenter(ghost.row);
      ghost.target = null;
      ghost.mode = "chase";
      ghost.dir = index % 2 ? DIRS.left : DIRS.right;
      ghost.speed = ghost.baseSpeed;
      ghost.frightenedUntil = 0;
    });
  }

  function update(dt, now) {
    updateFloaters(dt);
    updateSparks(dt);

    if (state.phase === "playing") {
      state.elapsed += dt;
      updateFruit(dt, now);
      updatePlayer(dt);
      updateGhosts(dt, now);
      checkCollisions();
      maybeSpawnFruit(now);

      if (state.dotsLeft <= 0) {
        completeLevel();
      }
    } else if (state.phase === "caught" || state.phase === "levelClear") {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) {
        if (state.phase === "caught") {
          afterCaught();
        } else {
          advanceLevel();
        }
      }
    }

    updateUi();
  }

  function updatePlayer(dt) {
    const player = state.player;
    player.mouth += dt * 12;

    if (player.target && isOpposite(player.dir, player.nextDir)) {
      player.dir = player.nextDir;
      player.target = { row: player.row, col: player.col };
    }

    moveActor(
      player,
      dt,
      () => {
        if (player.nextDir !== NONE && canMoveFrom(player.row, player.col, player.nextDir)) {
          player.dir = player.nextDir;
        }
        if (player.dir !== NONE && !canMoveFrom(player.row, player.col, player.dir)) {
          player.dir = NONE;
        }
      },
      () => collectAt(player.row, player.col)
    );
  }

  function updateGhosts(dt, now) {
    state.ghosts.forEach((ghost) => {
      if (state.elapsed < ghost.releaseDelay) {
        return;
      }

      if (ghost.mode === "frightened" && now > ghost.frightenedUntil) {
        ghost.mode = "chase";
        ghost.speed = ghost.baseSpeed;
      }

      if (ghost.mode === "eyes") {
        ghost.speed = ghost.baseSpeed * 1.45;
      }

      moveActor(ghost, dt, () => chooseGhostDirection(ghost));

      if (ghost.mode === "eyes" && ghost.row === ghost.startRow && ghost.col === ghost.startCol && !ghost.target) {
        ghost.mode = "chase";
        ghost.speed = ghost.baseSpeed;
      }
    });
  }

  function moveActor(actor, dt, onCenter, onArrive) {
    let remaining = actor.speed * dt;
    let guard = 0;

    while (remaining > 0.001 && guard < 8) {
      guard += 1;

      if (!actor.target) {
        onCenter?.();

        if (actor.dir === NONE || !canMoveFrom(actor.row, actor.col, actor.dir)) {
          actor.target = null;
          return;
        }

        actor.target = {
          row: actor.row + actor.dir.y,
          col: actor.col + actor.dir.x,
        };
      }

      const targetX = tileCenter(actor.target.col);
      const targetY = tileCenter(actor.target.row);
      const dx = targetX - actor.x;
      const dy = targetY - actor.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= remaining) {
        actor.x = targetX;
        actor.y = targetY;
        actor.row = actor.target.row;
        actor.col = actor.target.col;
        actor.target = null;
        wrapActor(actor);
        onArrive?.();
        remaining -= distance;
      } else {
        actor.x += actor.dir.x * remaining;
        actor.y += actor.dir.y * remaining;
        remaining = 0;
      }
    }
  }

  function chooseGhostDirection(ghost) {
    const choices = DIR_LIST.filter((dir) => canMoveFrom(ghost.row, ghost.col, dir));
    if (!choices.length) {
      ghost.dir = NONE;
      return;
    }

    const reverse = OPPOSITE[ghost.dir.name] || NONE;
    const filtered = choices.length > 1 ? choices.filter((dir) => dir !== reverse) : choices;
    const options = filtered.length ? filtered : choices;

    if (ghost.mode === "frightened") {
      ghost.dir = options[Math.floor(Math.random() * options.length)];
      return;
    }

    const target = getGhostTarget(ghost);
    let best = options[0];
    let bestScore = Number.POSITIVE_INFINITY;

    options.forEach((dir) => {
      const row = ghost.row + dir.y;
      const col = wrapCol(ghost.col + dir.x);
      const score = squaredDistance(row, col, target.row, target.col);
      if (score < bestScore) {
        best = dir;
        bestScore = score;
      }
    });

    ghost.dir = best;
  }

  function getGhostTarget(ghost) {
    if (ghost.mode === "eyes") {
      return { row: ghost.startRow, col: ghost.startCol };
    }

    const scatter = Math.floor((state.elapsed + ghost.releaseDelay) % 23) < 6;
    if (scatter) {
      return ghost.corner;
    }

    const player = state.player;
    const ahead = {
      row: clamp(player.row + player.dir.y * 4, 1, ROWS - 2),
      col: wrapCol(player.col + player.dir.x * 4),
    };

    if (ghost.style === "hunter") {
      return { row: player.row, col: player.col };
    }

    if (ghost.style === "ambush") {
      return ahead;
    }

    if (ghost.style === "mirror") {
      const blinky = state.ghosts[0];
      return {
        row: clamp(ahead.row + (ahead.row - blinky.row), 1, ROWS - 2),
        col: wrapCol(ahead.col + (ahead.col - blinky.col)),
      };
    }

    const far = squaredDistance(ghost.row, ghost.col, player.row, player.col) > 56;
    return far ? { row: player.row, col: player.col } : ghost.corner;
  }

  function collectAt(row, col) {
    const key = tileKey(row, col);

    if (state.pellets.delete(key)) {
      state.dotsLeft -= 1;
      addScore(10);
      audio.pellet();
      if (Math.random() > 0.72) {
        addSpark(tileCenter(col), tileCenter(row), state.level.pellet, 2);
      }
    }

    if (state.powers.delete(key)) {
      state.dotsLeft -= 1;
      addScore(50);
      energizeGhosts();
      audio.power();
      burst(tileCenter(col), tileCenter(row), "#24d6e8", 16);
    }

    if (state.fruit && state.fruit.row === row && state.fruit.col === col) {
      const value = state.fruit.value;
      addScore(value);
      addFloater(tileCenter(col), tileCenter(row), `${value}`, "#ff8a3d");
      burst(tileCenter(col), tileCenter(row), "#ff8a3d", 20);
      state.fruit = null;
      audio.fruit();
    }
  }

  function energizeGhosts() {
    const now = performance.now() / 1000;
    state.ghostCombo = 200;
    state.ghosts.forEach((ghost) => {
      if (ghost.mode === "eyes") {
        return;
      }
      ghost.mode = "frightened";
      ghost.frightenedUntil = now + 7.2;
      ghost.speed = ghost.baseSpeed * 0.68;
      turnAround(ghost);
    });
  }

  function turnAround(actor) {
    const reverse = OPPOSITE[actor.dir.name] || NONE;
    if (reverse === NONE) {
      return;
    }
    actor.dir = reverse;
    if (actor.target) {
      actor.target = { row: actor.row, col: actor.col };
    }
  }

  function maybeSpawnFruit(now) {
    if (state.fruit) {
      return;
    }

    const eaten = state.dotsTotal - state.dotsLeft;
    const progress = eaten / Math.max(1, state.dotsTotal);
    let mark = "";
    if (progress > 0.68) {
      mark = "late";
    } else if (progress > 0.34) {
      mark = "early";
    }

    if (!mark || state.fruitMarks.has(mark)) {
      return;
    }

    const tile = findFruitTile();
    state.fruitMarks.add(mark);
    state.fruit = {
      row: tile.row,
      col: tile.col,
      type: state.level.fruit,
      value: (mark === "late" ? 500 : 200) + state.levelIndex * 100,
      expiresAt: now + 9,
    };
    audio.fruitAppear();
  }

  function updateFruit(dt, now) {
    if (state.fruit && now > state.fruit.expiresAt) {
      state.fruit = null;
    }
  }

  function findFruitTile() {
    const preferred = [
      { row: 15, col: 10 },
      { row: 14, col: 9 },
      { row: 14, col: 11 },
      { row: 13, col: 10 },
      { row: 16, col: 10 },
    ];

    return preferred.find((tile) => !isWall(tile.row, tile.col)) || { row: state.player.startRow, col: state.player.startCol };
  }

  function checkCollisions() {
    state.ghosts.forEach((ghost) => {
      const distance = actorDistance(state.player, ghost);
      if (distance > TILE * 0.62 || ghost.mode === "eyes") {
        return;
      }

      if (ghost.mode === "frightened") {
        ghost.mode = "eyes";
        ghost.speed = ghost.baseSpeed * 1.45;
        ghost.target = null;
        addScore(state.ghostCombo);
        addFloater(ghost.x, ghost.y, `${state.ghostCombo}`, "#24d6e8");
        burst(ghost.x, ghost.y, "#24d6e8", 18);
        state.ghostCombo *= 2;
        audio.eatGhost();
      } else if (state.phase === "playing") {
        catchPlayer();
      }
    });
  }

  function catchPlayer() {
    state.phase = "caught";
    state.phaseTimer = 1.25;
    state.lives -= 1;
    state.status = state.lives > 0 ? "Nog een poging" : "Einde van de run";
    burst(state.player.x, state.player.y, "#ffd84a", 26);
    audio.setMusic(false);
    audio.death();
  }

  function afterCaught() {
    if (state.lives <= 0) {
      state.phase = "gameOver";
      state.status = "Game over";
      audio.gameOver();
      return;
    }

    resetActors();
    state.phase = "ready";
    state.status = `Level ${state.levelNumber} hervat`;
  }

  function completeLevel() {
    state.phase = "levelClear";
    state.phaseTimer = 2.1;
    state.status = "Level gehaald";
    audio.setMusic(false);
    audio.levelClear();
    burst(WORLD_W / 2, WORLD_H / 2, "#ffd84a", 34);
  }

  function advanceLevel() {
    initLevel(state.levelNumber + 1);
    state.phase = "playing";
    state.status = `Level ${state.levelNumber}`;
    audio.startLevel(state.levelIndex);
    audio.setMusic(true, state.levelIndex);
  }

  function primaryAction() {
    if (state.phase === "gameOver") {
      newGame();
      startPlaying();
      return;
    }

    if (state.phase === "menu" || state.phase === "ready") {
      startPlaying();
      return;
    }

    if (state.phase === "paused") {
      state.phase = "playing";
      audio.setMusic(true, state.levelIndex);
      state.status = `Level ${state.levelNumber}`;
      return;
    }

    if (state.phase === "playing") {
      togglePause();
    }
  }

  function startPlaying() {
    state.phase = "playing";
    state.status = `Level ${state.levelNumber}`;
    audio.startLevel(state.levelIndex);
    audio.setMusic(true, state.levelIndex);
  }

  function togglePause() {
    if (state.phase === "playing") {
      state.phase = "paused";
      state.status = "Pauze";
      audio.setMusic(false);
    } else if (state.phase === "paused") {
      state.phase = "playing";
      state.status = `Level ${state.levelNumber}`;
      audio.setMusic(true, state.levelIndex);
    }
  }

  function newGame() {
    state.score = 0;
    state.lives = 3;
    initLevel(1);
    state.phase = "menu";
    state.status = "Nieuwe run";
  }

  function onKeyDown(event) {
    if (KEY_TO_DIR[event.key]) {
      event.preventDefault();
      audio.ensure();
      state.player.nextDir = KEY_TO_DIR[event.key];
      if (state.phase === "menu" || state.phase === "ready") {
        startPlaying();
      }
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      audio.ensure();
      togglePause();
    } else if (event.key.toLowerCase() === "r") {
      audio.ensure();
      newGame();
      startPlaying();
    } else if (event.key.toLowerCase() === "m") {
      audio.ensure();
      audio.toggleMuted();
    }
  }

  function render(timestamp) {
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    drawBoardBackground(timestamp);
    drawWalls(timestamp);
    drawDots(timestamp);
    drawFruit(timestamp);
    drawSparks();
    state.ghosts.forEach((ghost) => drawWrapped(ghost, () => drawGhost(ghost, timestamp)));
    drawWrapped(state.player, () => drawPlayer(state.player, timestamp));
    drawFloaters();
    drawVignette();
  }

  function drawBoardBackground(timestamp) {
    const pulse = 0.06 + Math.sin(timestamp * 0.0015) * 0.025;
    ctx.fillStyle = "#050407";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    ctx.globalAlpha = 0.22 + pulse;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let x = TILE; x < WORLD_W; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, WORLD_H);
      ctx.stroke();
    }
    for (let y = TILE; y < WORLD_H; y += TILE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(WORLD_W, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWalls(timestamp) {
    const glow = 8 + Math.sin(timestamp * 0.002) * 2;
    ctx.save();
    ctx.shadowBlur = glow;
    ctx.shadowColor = state.level.wallStroke;
    ctx.lineWidth = 2;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (!isWall(row, col)) {
          continue;
        }

        const x = col * TILE;
        const y = row * TILE;
        roundedRect(ctx, x + 2, y + 2, TILE - 4, TILE - 4, 6);
        ctx.fillStyle = state.level.wallFill;
        ctx.fill();
        ctx.strokeStyle = state.level.wallStroke;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(x + 6, y + 5, TILE - 12, 2);
        ctx.shadowBlur = glow;
      }
    }
    ctx.restore();
  }

  function drawDots(timestamp) {
    ctx.save();

    state.pellets.forEach((key) => {
      const { row, col } = parseKey(key);
      const x = tileCenter(col);
      const y = tileCenter(row);
      ctx.beginPath();
      ctx.fillStyle = state.level.pellet;
      ctx.shadowColor = state.level.pellet;
      ctx.shadowBlur = 6;
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });

    state.powers.forEach((key) => {
      const { row, col } = parseKey(key);
      const x = tileCenter(col);
      const y = tileCenter(row);
      const pulse = 1 + Math.sin(timestamp * 0.007 + row) * 0.18;
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#24d6e8";
      ctx.shadowBlur = 16;
      ctx.arc(x, y, 6.2 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "#24d6e8";
      ctx.lineWidth = 2;
      ctx.arc(x, y, 9 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawFruit(timestamp) {
    if (!state.fruit) {
      return;
    }

    const x = tileCenter(state.fruit.col);
    const y = tileCenter(state.fruit.row) + Math.sin(timestamp * 0.006) * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ff8a3d";

    if (state.fruit.type === "star") {
      drawStar(0, 0, 5, 10, 4.5, "#ffd84a");
    } else if (state.fruit.type === "lime") {
      ctx.fillStyle = "#7ee787";
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 8, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#dcffe2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ff4b5f";
      ctx.beginPath();
      ctx.arc(-5, 2, 7, 0, Math.PI * 2);
      ctx.arc(5, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7ee787";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -4);
      ctx.quadraticCurveTo(0, -12, 7, -9);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPlayer(player, timestamp) {
    const mouth = 0.2 + Math.abs(Math.sin(player.mouth)) * 0.45;
    const angle = (player.dir === NONE ? player.nextDir : player.dir).angle || 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ffd84a";
    ctx.fillStyle = "#ffd84a";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, PLAYER_RADIUS, angle + mouth, angle - mouth, false);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.arc(-2 + Math.cos(angle - Math.PI / 2) * 3, -5 + Math.sin(angle - Math.PI / 2) * 2, 2, 0, Math.PI * 2);
    ctx.fill();

    if (state.phase === "caught") {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS + 5 + Math.sin(timestamp * 0.018) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhost(ghost, timestamp) {
    const frightened = ghost.mode === "frightened";
    const eyes = ghost.mode === "eyes";
    const blinking = frightened && ghost.frightenedUntil - performance.now() / 1000 < 2 && Math.floor(timestamp / 160) % 2 === 0;
    const bodyColor = blinking ? "#ffffff" : frightened ? "#2f6cff" : ghost.color;

    ctx.save();
    ctx.translate(ghost.x, ghost.y);

    if (!eyes) {
      ctx.shadowBlur = frightened ? 12 : 16;
      ctx.shadowColor = bodyColor;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-10, 9);
      ctx.lineTo(-10, -1);
      ctx.bezierCurveTo(-10, -12, 10, -12, 10, -1);
      ctx.lineTo(10, 9);
      ctx.lineTo(6, 6);
      ctx.lineTo(2, 9);
      ctx.lineTo(-2, 6);
      ctx.lineTo(-6, 9);
      ctx.lineTo(-10, 9);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const eyeOffsetX = clamp(ghost.dir.x * 2, -2, 2);
    const eyeOffsetY = clamp(ghost.dir.y * 2, -2, 2);
    drawEye(-4, -3, eyeOffsetX, eyeOffsetY, eyes);
    drawEye(5, -3, eyeOffsetX, eyeOffsetY, eyes);

    if (frightened && !eyes) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(-2, 3);
      ctx.lineTo(1, 5);
      ctx.lineTo(4, 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEye(x, y, offsetX, offsetY, eyesOnly) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x, y, eyesOnly ? 4 : 3.6, eyesOnly ? 5 : 4.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#11121a";
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSparks() {
    ctx.save();
    state.sparks.forEach((spark) => {
      ctx.globalAlpha = Math.max(0, spark.life / spark.maxLife);
      ctx.fillStyle = spark.color;
      ctx.shadowColor = spark.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.font = "800 15px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    state.floaters.forEach((floater) => {
      ctx.globalAlpha = Math.max(0, floater.life / floater.maxLife);
      ctx.fillStyle = floater.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = floater.color;
      ctx.fillText(floater.text, floater.x, floater.y);
    });
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createLinearGradient(0, 0, WORLD_W, WORLD_H);
    gradient.addColorStop(0, "rgba(255,255,255,0.06)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0)");
    gradient.addColorStop(1, "rgba(255,79,154,0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  function drawWrapped(actor, draw) {
    draw();
    if (actor.x < TILE) {
      ctx.save();
      ctx.translate(WORLD_W, 0);
      draw();
      ctx.restore();
    } else if (actor.x > WORLD_W - TILE) {
      ctx.save();
      ctx.translate(-WORLD_W, 0);
      draw();
      ctx.restore();
    }
  }

  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
  }

  function updateFloaters(dt) {
    state.floaters.forEach((floater) => {
      floater.life -= dt;
      floater.y -= dt * 22;
    });
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
  }

  function addSpark(x, y, color, size) {
    state.sparks.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 26,
      vy: (Math.random() - 0.5) * 26,
      color,
      size,
      life: 0.28,
      maxLife: 0.28,
    });
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 40 + Math.random() * 80;
      state.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1.5 + Math.random() * 2.5,
        life: 0.55 + Math.random() * 0.25,
        maxLife: 0.75,
      });
    }
  }

  function updateSparks(dt) {
    state.sparks.forEach((spark) => {
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= 0.97;
      spark.vy *= 0.97;
    });
    state.sparks = state.sparks.filter((spark) => spark.life > 0);
  }

  function addScore(points) {
    state.score += points;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      writeHighScore(state.highScore);
    }
  }

  function updateUi() {
    ui.score.textContent = formatScore(state.score);
    ui.highScore.textContent = formatScore(state.highScore);
    ui.level.textContent = `${state.levelNumber}`;
    ui.levelName.textContent = state.level.name;
    ui.statusText.textContent = state.status;
    ui.pelletText.textContent = `${state.dotsLeft} snacks over`;
    ui.pauseButton.textContent = state.phase === "paused" ? ">" : "II";
    ui.startButton.textContent = state.phase === "playing" ? "Pauze" : state.phase === "gameOver" ? "Nieuw" : "Start";
    ui.soundButton.textContent = audio.muted ? "Stil" : "Sound";

    ui.lives.innerHTML = "";
    for (let i = 0; i < Math.max(0, state.lives); i += 1) {
      const life = document.createElement("span");
      life.className = "life";
      ui.lives.appendChild(life);
    }

    const screen = getScreenState();
    ui.screen.classList.toggle("is-hidden", !screen.visible);
    ui.screenTitle.textContent = screen.title;
    ui.screenCopy.textContent = screen.copy;
    ui.screenButton.textContent = screen.button;
    ui.screenButton.hidden = !screen.button;
  }

  function getScreenState() {
    if (state.phase === "playing") {
      return { visible: false, title: "", copy: "", button: "" };
    }
    if (state.phase === "paused") {
      return { visible: true, title: "Pauze", copy: `${formatScore(state.score)} punten`, button: "Verder" };
    }
    if (state.phase === "ready") {
      return { visible: true, title: "Klaar", copy: `${state.level.name}, level ${state.levelNumber}`, button: "Verder" };
    }
    if (state.phase === "caught") {
      return { visible: true, title: "Au", copy: state.lives > 0 ? `${state.lives} levens over` : "Laatste snack gevallen", button: "" };
    }
    if (state.phase === "levelClear") {
      return { visible: true, title: "Lekker", copy: "Volgend doolhof komt eraan", button: "" };
    }
    if (state.phase === "gameOver") {
      return { visible: true, title: "Game over", copy: `${formatScore(state.score)} punten`, button: "Nieuw spel" };
    }
    return { visible: true, title: "PaccY", copy: "Neon haptocht klaar.", button: "Start" };
  }

  function resizeCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(WORLD_W * dpr);
    canvas.height = Math.floor(WORLD_H * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tileKey(row, col) {
    return `${row},${col}`;
  }

  function parseKey(key) {
    const [row, col] = key.split(",").map(Number);
    return { row, col };
  }

  function tileCenter(index) {
    return index * TILE + TILE / 2;
  }

  function isWall(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
      return true;
    }
    return state.walls.has(tileKey(row, col));
  }

  function isTunnelRow(row) {
    return row >= 0 && row < ROWS && !isWall(row, 0) && !isWall(row, COLS - 1);
  }

  function canMoveFrom(row, col, dir) {
    if (dir === NONE) {
      return false;
    }

    const nextRow = row + dir.y;
    const nextCol = col + dir.x;

    if (nextCol < 0 || nextCol >= COLS) {
      return dir.y === 0 && isTunnelRow(row);
    }

    if (nextRow < 0 || nextRow >= ROWS) {
      return false;
    }

    return !isWall(nextRow, nextCol);
  }

  function wrapActor(actor) {
    if (actor.col < 0) {
      actor.col = COLS - 1;
      actor.x = tileCenter(actor.col);
    } else if (actor.col >= COLS) {
      actor.col = 0;
      actor.x = tileCenter(actor.col);
    }
  }

  function wrapCol(col) {
    return ((col % COLS) + COLS) % COLS;
  }

  function actorDistance(a, b) {
    const ax = wrapX(a.x);
    const bx = wrapX(b.x);
    const dx = Math.min(Math.abs(ax - bx), WORLD_W - Math.abs(ax - bx));
    const dy = Math.abs(a.y - b.y);
    return Math.hypot(dx, dy);
  }

  function wrapX(x) {
    return ((x % WORLD_W) + WORLD_W) % WORLD_W;
  }

  function squaredDistance(rowA, colA, rowB, colB) {
    const dc = Math.min(Math.abs(colA - colB), COLS - Math.abs(colA - colB));
    const dr = rowA - rowB;
    return dc * dc + dr * dr;
  }

  function isOpposite(a, b) {
    return a !== NONE && b !== NONE && a.x + b.x === 0 && a.y + b.y === 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawStar(x, y, points, outerRadius, innerRadius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  function formatScore(score) {
    return score.toLocaleString("nl-NL");
  }

  function readHighScore() {
    try {
      return Number(localStorage.getItem("paccy-high-score") || 0);
    } catch {
      return 0;
    }
  }

  function writeHighScore(score) {
    try {
      localStorage.setItem("paccy-high-score", `${score}`);
    } catch {
      // High score is optional when local storage is unavailable.
    }
  }

  function validateLevels() {
    LEVELS.forEach((level) => {
      if (level.maps.length !== ROWS) {
        throw new Error(`${level.name} heeft ${level.maps.length} rijen in plaats van ${ROWS}.`);
      }
      level.maps.forEach((row, index) => {
        if (row.length !== COLS) {
          throw new Error(`${level.name} rij ${index} heeft ${row.length} kolommen in plaats van ${COLS}.`);
        }
      });
    });
  }

  function SoundEngine() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = 0;
    this.musicStep = 0;
    this.musicLevel = 0;
    this.muted = readMuted();
  }

  SoundEngine.prototype.ensure = function ensure() {
    if (this.context || !window.AudioContext && !window.webkitAudioContext) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.74;
    this.musicGain.gain.value = 0.12;
    this.sfxGain.gain.value = 0.35;
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.context.destination);
  };

  SoundEngine.prototype.toggleMuted = function toggleMuted() {
    this.muted = !this.muted;
    writeMuted(this.muted);
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.74, this.context.currentTime, 0.02);
    }
  };

  SoundEngine.prototype.setMusic = function setMusic(active, levelIndex = this.musicLevel) {
    this.ensure();
    if (!this.context) {
      return;
    }
    this.musicLevel = levelIndex;

    if (active && !this.musicTimer) {
      this.musicTimer = window.setInterval(() => this.musicTick(), 145);
      this.musicTick();
    } else if (!active && this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
    }
  };

  SoundEngine.prototype.musicTick = function musicTick() {
    if (!this.context || this.muted || state.phase !== "playing") {
      return;
    }

    const melodies = [
      [0, 3, 7, 10, 7, 3, 12, 10, 7, 5, 3, 0, -2, 0, 3, 5],
      [0, 5, 7, 12, 10, 7, 5, 3, 0, 3, 5, 10, 7, 5, 3, -2],
      [0, 7, 3, 10, 5, 12, 7, 15, 12, 10, 7, 5, 3, 5, 0, -5],
    ];
    const roots = [110, 123.47, 98];
    const melody = melodies[this.musicLevel % melodies.length];
    const root = roots[this.musicLevel % roots.length] * (1 + Math.floor((state.levelNumber - 1) / LEVELS.length) * 0.03);
    const step = this.musicStep % melody.length;
    const note = root * Math.pow(2, melody[step] / 12);
    const now = this.context.currentTime + 0.02;

    this.note(note, 0.1, "triangle", this.musicGain, 0.09, now);
    if (step % 4 === 0) {
      this.note(root / 2, 0.22, "sine", this.musicGain, 0.11, now);
    }
    if (step % 8 === 4) {
      this.noise(0.035, 0.03, now);
    }
    this.musicStep += 1;
  };

  SoundEngine.prototype.note = function note(freq, duration, type, gainNode, gainValue, startAt) {
    if (!this.context || this.muted) {
      return;
    }

    const now = startAt ?? this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  };

  SoundEngine.prototype.slide = function slide(from, to, duration, type, gainValue) {
    if (!this.context || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  };

  SoundEngine.prototype.noise = function noise(duration, gainValue, startAt) {
    if (!this.context || this.muted) {
      return;
    }

    const now = startAt ?? this.context.currentTime;
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * duration), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = gainValue;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start(now);
  };

  SoundEngine.prototype.pellet = function pellet() {
    this.ensure();
    this.note(740 + Math.random() * 120, 0.035, "square", this.sfxGain, 0.08);
  };

  SoundEngine.prototype.power = function power() {
    this.ensure();
    if (!this.context) {
      return;
    }
    this.slide(180, 760, 0.28, "sawtooth", 0.14);
    this.note(880, 0.12, "triangle", this.sfxGain, 0.12, this.context.currentTime + 0.1);
  };

  SoundEngine.prototype.eatGhost = function eatGhost() {
    this.ensure();
    this.slide(260, 1040, 0.22, "triangle", 0.16);
    this.noise(0.08, 0.05);
  };

  SoundEngine.prototype.death = function death() {
    this.ensure();
    this.slide(520, 80, 0.65, "sawtooth", 0.16);
  };

  SoundEngine.prototype.fruit = function fruit() {
    this.ensure();
    if (!this.context) {
      return;
    }
    const now = this.context.currentTime;
    [523, 659, 784].forEach((freq, index) => {
      this.note(freq, 0.18, "triangle", this.sfxGain, 0.11, now + index * 0.04);
    });
  };

  SoundEngine.prototype.fruitAppear = function fruitAppear() {
    this.ensure();
    if (!this.context) {
      return;
    }
    this.note(560, 0.08, "sine", this.sfxGain, 0.07);
    this.note(840, 0.08, "sine", this.sfxGain, 0.06, this.context.currentTime + 0.06);
  };

  SoundEngine.prototype.startLevel = function startLevel(levelIndex) {
    this.ensure();
    this.musicLevel = levelIndex;
    const now = this.context?.currentTime || 0;
    [392, 523, 659].forEach((freq, index) => {
      this.note(freq, 0.12, "triangle", this.sfxGain, 0.09, now + index * 0.055);
    });
  };

  SoundEngine.prototype.levelClear = function levelClear() {
    this.ensure();
    if (!this.context) {
      return;
    }
    const now = this.context.currentTime;
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.note(freq, 0.16, "triangle", this.sfxGain, 0.12, now + index * 0.09);
    });
  };

  SoundEngine.prototype.gameOver = function gameOver() {
    this.ensure();
    if (!this.context) {
      return;
    }
    const now = this.context.currentTime;
    [330, 247, 196, 147].forEach((freq, index) => {
      this.note(freq, 0.2, "sawtooth", this.sfxGain, 0.1, now + index * 0.12);
    });
  };

  function readMuted() {
    try {
      return localStorage.getItem("paccy-muted") === "true";
    } catch {
      return false;
    }
  }

  function writeMuted(muted) {
    try {
      localStorage.setItem("paccy-muted", `${muted}`);
    } catch {
      // Muting still works for the current page even without storage.
    }
  }
})();
