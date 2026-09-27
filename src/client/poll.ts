export const LIVE_POLL_MS = 10 * 60 * 1000;

export interface PollState {
  visible: boolean;
  fridayCloseDate: string | null;
  lastFetchAt: number | null;
  timerArmed: boolean;
  awaiting: "none" | "live" | "friday";
}

export type PollCommand =
  | { type: "schedule"; ms: number }
  | { type: "clear" }
  | { type: "fetch"; url: "/data/live.json" | "/data/friday.json"; cache?: "no-store" };

export type PollEvent =
  | { type: "visibility"; visible: boolean; now: number }
  | { type: "loaded"; fridayCloseDate: string; now: number; visible: boolean }
  | { type: "timer"; now: number }
  | { type: "live"; officialCloseDate: string; now: number }
  | { type: "friday"; closeDate: string; now: number }
  | { type: "failed"; now: number };

export function initialPollState(): PollState {
  return {
    visible: false,
    fridayCloseDate: null,
    lastFetchAt: null,
    timerArmed: false,
    awaiting: "none",
  };
}

export function reducePoll(state: PollState, event: PollEvent): { state: PollState; commands: PollCommand[] } {
  if (event.type === "visibility") {
    if (!event.visible) {
      return {
        state: { ...state, visible: false, timerArmed: false },
        commands: state.timerArmed ? [{ type: "clear" }] : [],
      };
    }
    if (state.timerArmed || state.awaiting !== "none") {
      return { state: { ...state, visible: true }, commands: [] };
    }
    return {
      state: { ...state, visible: true, timerArmed: true },
      commands: [{ type: "schedule", ms: LIVE_POLL_MS }],
    };
  }

  if (event.type === "loaded") {
    return {
      state: {
        ...state,
        visible: event.visible,
        fridayCloseDate: event.fridayCloseDate,
        lastFetchAt: event.now,
        timerArmed: event.visible,
        awaiting: "none",
      },
      commands: event.visible
        ? [{ type: "schedule", ms: LIVE_POLL_MS }]
        : state.timerArmed
          ? [{ type: "clear" }]
          : [],
    };
  }

  if (event.type === "timer") {
    if (!state.visible || state.awaiting !== "none") {
      return { state: { ...state, timerArmed: false }, commands: [] };
    }
    const last = state.lastFetchAt;
    if (last != null && event.now - last < LIVE_POLL_MS) {
      return {
        state: { ...state, timerArmed: true },
        commands: [{ type: "schedule", ms: LIVE_POLL_MS }],
      };
    }
    return {
      state: { ...state, timerArmed: false, awaiting: "live", lastFetchAt: event.now },
      commands: [{ type: "fetch", url: "/data/live.json" }],
    };
  }

  if (event.type === "live") {
    if (state.fridayCloseDate != null && event.officialCloseDate !== state.fridayCloseDate) {
      return {
        state: { ...state, awaiting: "friday" },
        commands: [{ type: "fetch", url: "/data/friday.json", cache: "no-store" }],
      };
    }
    return {
      state: { ...state, awaiting: "none", timerArmed: state.visible },
      commands: state.visible ? [{ type: "schedule", ms: LIVE_POLL_MS }] : [],
    };
  }

  if (event.type === "friday") {
    return {
      state: {
        ...state,
        fridayCloseDate: event.closeDate,
        awaiting: "none",
        timerArmed: state.visible,
      },
      commands: state.visible ? [{ type: "schedule", ms: LIVE_POLL_MS }] : [],
    };
  }

  return {
    state: { ...state, awaiting: "none", timerArmed: state.visible },
    commands: state.visible ? [{ type: "schedule", ms: LIVE_POLL_MS }] : [],
  };
}

export interface PollHost {
  now(): number;
  visibility(): "visible" | "hidden";
  setTimer(ms: number, run: () => void | Promise<void>): unknown;
  clearTimer(handle: unknown): void;
  fetchJson(url: string, init?: { cache?: "no-store" }): Promise<unknown>;
}

export interface PollHooks {
  onLive(live: unknown): void;
  onFriday(friday: unknown, live: unknown): void;
  onError?(error: unknown): void;
}

export interface PollHandle {
  loaded(fridayCloseDate: string): void;
  visibilityChanged(): void;
  stop(): void;
}

export function connectPoll(host: PollHost, hooks: PollHooks): PollHandle {
  let state = initialPollState();
  let timer: unknown = null;
  let stopped = false;
  let lastLive: unknown = null;

  function apply(commands: readonly PollCommand[]): Promise<void> {
    let chain = Promise.resolve();
    for (const command of commands) {
      if (command.type === "clear") {
        if (timer != null) host.clearTimer(timer);
        timer = null;
        continue;
      }
      if (command.type === "schedule") {
        if (timer != null) host.clearTimer(timer);
        timer = host.setTimer(command.ms, () => onTimer());
        continue;
      }
      const fetchCommand = command;
      chain = chain.then(() => runFetch(fetchCommand));
    }
    return chain;
  }

  function dispatch(event: PollEvent): Promise<void> {
    if (stopped) return Promise.resolve();
    const next = reducePoll(state, event);
    state = next.state;
    return apply(next.commands);
  }

  function onTimer(): Promise<void> {
    return dispatch({ type: "timer", now: host.now() });
  }

  async function runFetch(command: Extract<PollCommand, { type: "fetch" }>): Promise<void> {
    try {
      const init = command.cache == null ? undefined : { cache: command.cache };
      const body = await host.fetchJson(command.url, init);
      if (stopped) return;
      if (command.url === "/data/live.json") {
        const officialCloseDate = readLiveClose(body);
        lastLive = body;
        hooks.onLive(body);
        await dispatch({ type: "live", officialCloseDate, now: host.now() });
        return;
      }
      const closeDate = readFridayClose(body);
      hooks.onFriday(body, lastLive);
      await dispatch({ type: "friday", closeDate, now: host.now() });
    } catch (error) {
      if (stopped) return;
      hooks.onError?.(error);
      await dispatch({ type: "failed", now: host.now() });
    }
  }

  return {
    loaded(fridayCloseDate: string): void {
      void dispatch({
        type: "loaded",
        fridayCloseDate,
        now: host.now(),
        visible: host.visibility() === "visible",
      });
    },
    visibilityChanged(): void {
      void dispatch({
        type: "visibility",
        visible: host.visibility() === "visible",
        now: host.now(),
      });
    },
    stop(): void {
      stopped = true;
      if (timer != null) host.clearTimer(timer);
      timer = null;
    },
  };
}

function readLiveClose(value: unknown): string {
  if (typeof value !== "object" || value == null) throw new Error("live");
  const date = (value as { officialCloseDate?: unknown }).officialCloseDate;
  if (typeof date !== "string") throw new Error("live");
  return date;
}

function readFridayClose(value: unknown): string {
  if (typeof value !== "object" || value == null) throw new Error("friday");
  const date = (value as { official?: { closeDate?: unknown } }).official?.closeDate;
  if (typeof date !== "string") throw new Error("friday");
  return date;
}
