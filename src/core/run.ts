export interface IRunnable {
  onPreload(): Promise<void>;
  onInit(): void;
  onUpdate(timestamp: number): void;
  onRender(blending: number, timestamp: number): void;
  onIdle(deadline: IdleDeadline): void;
  onTick(step: number, runtime: number, tid: number): void;
}

export default function run(runnable: IRunnable, tps: number) {
  const step = 1 / tps;
  const interval = 1000 / tps;

  let tid = 0;
  let runtime = 0;
  let unsimulated = 0;

  let now = performance.now();
  let last = now;

  function tick() {
    runnable.onTick(step, runtime, tid);
    unsimulated -= step;
  }

  function render() {
    runnable.onRender(unsimulated / step, now);
  }

  function update() {
    runnable.onUpdate(now);
  }

  function idle(deadline: IdleDeadline) {
    runnable.onIdle(deadline);

    requestAnimationFrame(frame);
  }

  function frame(time: number) {
    now = time;
    unsimulated += (now - last) / 1000;
    last = now;

    while (unsimulated >= step) {
      tick();
      runtime += step;
      tid++;
    }

    update();
    render();

    requestIdleCallback(idle);
  }

  runnable.onPreload().then(() => {
    runnable.onInit();
    requestAnimationFrame(frame);
  });
}
