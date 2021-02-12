import { createMachine, assign } from "xstate";
import {
  MINUTES_IN_HOUR,
  CENTISECONDES_IN_SECOND,
  SECONDS_IN_MINUTES,
} from "../constants";

export const chronoMachine = createMachine(
  {
    initial: "paused",
    context: {
      minutes: 0,
      seconds: 0,
      centiseconds: 0,
    },
    states: {
      paused: {
        on: {
          START_STOP: "running",
          BACKLIGHT_RESET_PUSH: {
            actions: "resetChrono",
          },
        },
      },
      running: {
        invoke: {
          src: "tickChronoCallback",
        },
        on: {
          TICK_CHRONO: {
            actions: "updateChrono",
          },
          START_STOP: "paused",
        },
      },
    },
  },
  {
    services: {
      tickChronoCallback: (context) => (cb) => {
        const interval = setInterval(() => {
          cb("TICK_CHRONO");
        }, 1000 * 0.01);

        return () => {
          clearInterval(interval);
        };
      },
    },
    actions: {
      resetChrono: assign((context, event) => {
        return {
          minutes: 0,
          seconds: 0,
          centiseconds: 0,
        };
      }),
      updateChrono: assign((context, event) => {
        const { minutes, seconds, centiseconds } = context;

        let cs = centiseconds + 1;
        let s = seconds;
        let m = minutes;
        if (cs === CENTISECONDES_IN_SECOND) {
          s = s + 1;
          cs = 0;
        }

        if (s === SECONDS_IN_MINUTES) {
          m = m + 1;
          s = 0;
        }

        if (m === MINUTES_IN_HOUR) {
          m = 0;
        }

        return {
          centiseconds: cs,
          seconds: s,
          minutes: m,
        };
      }),
    },
  }
);
