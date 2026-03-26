import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./NotFoundPage.css";

const BOARD_MIN_X = 8;
const BOARD_MAX_X = 92;
const SHIP_Y = 86;
const SHIP_SPEED = 2.4;
const SHOT_SPEED = 4.6;
const SHOT_COOLDOWN_TICKS = 8;
const MAX_WAVES = 3;

const STAR_POINTS = [
  { id: 1, left: "10%", top: "12%", size: "4px" },
  { id: 2, left: "24%", top: "20%", size: "5px" },
  { id: 3, left: "82%", top: "17%", size: "4px" },
  { id: 4, left: "18%", top: "39%", size: "5px" },
  { id: 5, left: "76%", top: "50%", size: "5px" },
  { id: 6, left: "60%", top: "24%", size: "3px" },
  { id: 7, left: "68%", top: "13%", size: "3px" },
  { id: 8, left: "86%", top: "33%", size: "3px" },
  { id: 9, left: "34%", top: "56%", size: "4px" },
  { id: 10, left: "56%", top: "63%", size: "3px" },
  { id: 11, left: "44%", top: "10%", size: "4px" },
  { id: 12, left: "8%", top: "54%", size: "3px" },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createWave(waveNumber) {
  const rows = Math.min(4, 2 + Math.floor((waveNumber - 1) / 2));
  const columns = Math.min(7, 5 + Math.floor((waveNumber - 1) / 3));
  const horizontalGap = columns > 1 ? 62 / (columns - 1) : 0;
  const verticalGap = 12;
  const startX = 19;
  const startY = 16;

  const enemies = [];
  let idCounter = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      enemies.push({
        id: `wave-${waveNumber}-${idCounter}`,
        x: startX + col * horizontalGap,
        y: startY + row * verticalGap,
      });
      idCounter += 1;
    }
  }

  return enemies;
}

function createInitialGame() {
  return {
    shipX: 50,
    shots: [],
    enemies: createWave(1),
    score: 0,
    wave: 1,
    enemyDirection: 1,
    isGameOver: false,
    result: null,
    status: "Defeat the dreaded 404s by holding your ground and vanquishing the enemy!",
  };
}

export default function NotFoundPage() {
  const [game, setGame] = useState(createInitialGame);
  const controlsRef = useRef({ left: false, right: false });
  const shotIdRef = useRef(0);
  const shotCooldownRef = useRef(0);

  const stars = useMemo(() => STAR_POINTS, []);

  const resetControl = useCallback((key) => {
    controlsRef.current[key] = false;
  }, []);

  const setControl = useCallback((key, value) => {
    controlsRef.current[key] = value;
  }, []);

  const handleRestart = useCallback(() => {
    controlsRef.current = { left: false, right: false };
    shotCooldownRef.current = 0;
    shotIdRef.current = 0;
    setGame(createInitialGame());
  }, []);

  const triggerShot = useCallback(() => {
    if (shotCooldownRef.current > 0) {
      return;
    }

    shotIdRef.current += 1;
    shotCooldownRef.current = SHOT_COOLDOWN_TICKS;

    setGame((previousGame) => {
      if (previousGame.isGameOver) {
        return previousGame;
      }

      return {
        ...previousGame,
        shots: [
          ...previousGame.shots,
          {
            id: `shot-${shotIdRef.current}`,
            x: previousGame.shipX,
            y: SHIP_Y - 8,
          },
        ],
      };
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toLowerCase();

      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        controlsRef.current.left = true;
      }

      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        controlsRef.current.right = true;
      }

      if (key === " " || key === "spacebar") {
        event.preventDefault();
        triggerShot();
      }
    }

    function handleKeyUp(event) {
      const key = event.key.toLowerCase();

      if (key === "arrowleft" || key === "a") {
        controlsRef.current.left = false;
      }

      if (key === "arrowright" || key === "d") {
        controlsRef.current.right = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [triggerShot]);

  useEffect(() => {
    if (game.isGameOver) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setGame((previousGame) => {
        if (previousGame.isGameOver) {
          return previousGame;
        }

        const controls = controlsRef.current;
        let shipX = previousGame.shipX;

        if (controls.left) {
          shipX -= SHIP_SPEED;
        }

        if (controls.right) {
          shipX += SHIP_SPEED;
        }

        shipX = clamp(shipX, BOARD_MIN_X, BOARD_MAX_X);

        let shots = previousGame.shots
          .map((shot) => ({
            ...shot,
            y: shot.y - SHOT_SPEED,
          }))
          .filter((shot) => shot.y > 0);

        if (shotCooldownRef.current > 0) {
          shotCooldownRef.current -= 1;
        }

        let enemyDirection = previousGame.enemyDirection;
        const enemySpeed = Math.min(1.35, 0.45 + previousGame.wave * 0.08);
        const enemyDrop = 4.8;

        let enemies = previousGame.enemies.map((enemy) => ({
          ...enemy,
          x: enemy.x + enemyDirection * enemySpeed,
        }));

        const touchedEdge = enemies.some(
          (enemy) => enemy.x <= 10 || enemy.x >= 90
        );

        if (touchedEdge) {
          enemyDirection *= -1;
          enemies = previousGame.enemies.map((enemy) => ({
            ...enemy,
            x: enemy.x + enemyDirection * enemySpeed,
            y: enemy.y + enemyDrop,
          }));
        }

        const removedEnemyIds = new Set();
        const survivingShots = [];
        let scoreGain = 0;

        shots.forEach((shot) => {
          const hitEnemy = enemies.find(
            (enemy) =>
              !removedEnemyIds.has(enemy.id) &&
              Math.abs(shot.x - enemy.x) < 5.2 &&
              Math.abs(shot.y - enemy.y) < 5.6
          );

          if (hitEnemy) {
            removedEnemyIds.add(hitEnemy.id);
            scoreGain += 10;
          } else {
            survivingShots.push(shot);
          }
        });

        enemies = enemies.filter((enemy) => !removedEnemyIds.has(enemy.id));

        let score = previousGame.score + scoreGain;
        let wave = previousGame.wave;
        let status = previousGame.status;
        let isGameOver = false;
        let result = previousGame.result;

        const enemyReachedBottom = enemies.some((enemy) => enemy.y >= 84);
        const enemyHitShip = enemies.some(
          (enemy) => enemy.y >= 78 && Math.abs(enemy.x - shipX) < 8
        );

        if (enemyReachedBottom || enemyHitShip) {
          isGameOver = true;
          result = "lost";
          status = "The lost pages slipped past your pod.";
        }

        if (!isGameOver && enemies.length === 0) {
          score += 50;

          if (previousGame.wave >= MAX_WAVES) {
            isGameOver = true;
            result = "won";
            status = "Route restored. Your pod cleared the 404 storm.";
          } else {
            wave = previousGame.wave + 1;
            enemies = createWave(wave);
            enemyDirection = wave % 2 === 0 ? -1 : 1;
            status = `Wave ${wave} incoming. Hold your ground!`;
          }
        }

        return {
          shipX,
          shots: survivingShots,
          enemies,
          score,
          wave,
          enemyDirection,
          isGameOver,
          result,
          status,
        };
      });
    }, 40);

    return () => window.clearInterval(intervalId);
  }, [game.isGameOver]);

  return (
    <section className="page-shell not-found-page">
      <div className="not-found-card">
        <div className="not-found-layout">
          <div className="not-found-copy">
            <p className="not-found-eyebrow">404</p>
            <h1>Looks like this page wandered off...</h1>
            <p className="not-found-text">
              The path broke, not your progress.
              <br />
              Head back to your pod using the links below!
            </p>
          </div>

          <div className="not-found-game" aria-label="Pod Invaders mini game">
            <div className="not-found-game__hud">
              <div className="not-found-game__meta">
                <span className="not-found-game__pill">
                  Score <strong>{game.score}</strong>
                </span>
                <span className="not-found-game__pill">
                  Wave <strong>{game.wave}</strong>
                </span>
              </div>

              <p className="not-found-game__hint">
                Desktop: ← → + spacebar &nbsp;·&nbsp; Mobile: use the controls
              </p>
            </div>

            <div className="not-found-game__board">
              <div className="not-found-game__backdropGlow not-found-game__backdropGlow--one" />
              <div className="not-found-game__backdropGlow not-found-game__backdropGlow--two" />

              {stars.map((star) => (
                <span
                  key={star.id}
                  className="not-found-game__star"
                  style={{
                    left: star.left,
                    top: star.top,
                    width: star.size,
                    height: star.size,
                  }}
                />
              ))}

              {game.enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="not-found-game__enemy"
                  style={{
                    left: `${enemy.x}%`,
                    top: `${enemy.y}%`,
                  }}
                >
                  404
                </div>
              ))}

              {game.shots.map((shot) => (
                <span
                  key={shot.id}
                  className="not-found-game__shot"
                  style={{
                    left: `${shot.x}%`,
                    top: `${shot.y}%`,
                  }}
                />
              ))}

              <div
                className="not-found-game__ship"
                style={{
                  left: `${game.shipX}%`,
                  top: `${SHIP_Y}%`,
                }}
              >
                <span className="not-found-game__shipCore" />
              </div>

              {game.isGameOver ? (
                <div className="not-found-game__overlay">
                  <p className="not-found-game__overlayTitle">
                    {game.result === "won" ? "Pod saved" : "Pod lost"}
                  </p>

                  <p className="not-found-game__overlayText">
                    {game.result === "won"
                      ? "You cleared the 404s and reopened the route. Nice work."
                      : "Your pod got overrun, but never fear, you can still find a way to safety!"}
                  </p>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleRestart}
                  >
                    Play Again
                  </button>
                </div>
              ) : null}
            </div>

            <div className="not-found-game__status">{game.status}</div>

            <div className="not-found-game__controls">
              <button
                type="button"
                className="not-found-game__control"
                onPointerDown={() => setControl("left", true)}
                onPointerUp={() => resetControl("left")}
                onPointerLeave={() => resetControl("left")}
                onPointerCancel={() => resetControl("left")}
              >
                ◀ Left
              </button>

              <button
                type="button"
                className="not-found-game__control not-found-game__control--shoot"
                onPointerDown={triggerShot}
                onClick={triggerShot}
              >
                ● Shoot
              </button>

              <button
                type="button"
                className="not-found-game__control"
                onPointerDown={() => setControl("right", true)}
                onPointerUp={() => resetControl("right")}
                onPointerLeave={() => resetControl("right")}
                onPointerCancel={() => resetControl("right")}
              >
                Right ▶
              </button>
            </div>
          </div>

          <div className="not-found-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={handleRestart}
            >
              Restart Game
            </button>

            <Link to="/" className="btn primary">
              Back Home
            </Link>

            <Link to="/pods" className="btn secondary">
              View My Pods
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}