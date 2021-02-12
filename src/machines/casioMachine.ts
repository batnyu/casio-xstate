import { alarmMachine } from "./alarmMachine";
import { blinkingStates } from "./blinkingMachine";
import { incrementHours } from "../utils/incrementHours";
import { incrementMinutes } from "../utils/incrementMinutes";
import { chronoMachine } from "./chronoMachine";
import { beep } from "../utils/beep";
import { MINUTES_IN_HOUR, SECONDS_IN_MINUTES } from "../constants";
import { createMachine, assign, spawn, send } from "xstate";

export type CasioEvent =
  | { type: "TICK" }
  | { type: "CHANGE_MODE" }
  | { type: "BACKLIGHT_RESET_PUSH" }
  | { type: "BACKLIGHT_RESET_RELEASE" }
  | { type: "START_STOP" }
  | { type: "TICK_CHRONO" }
  | { type: "STOP_RINGING" }
  | { type: "UPDATE_TIMESYSTEM"; value: TimeSystem };

export type TimeSystem = 24 | 12;

enum TimePeriod {
  AM = "AM",
  PM = "PM",
}

export interface CasioContext {
  hours: number;
  minutes: number;
  seconds: number;
  chronoMachine: any;
  alarmMachine: any;
  timeSystem: TimeSystem;
  timePeriod: TimePeriod | null;
}

export type CasioState =
  | {
      value: "main.time";
      context: CasioContext;
    }
  | {
      value: "main.chrono";
      context: CasioContext;
    }
  | {
      value: "main.alarm";
      context: CasioContext;
    };

export const casioMachine = createMachine<CasioContext, CasioEvent, CasioState>(
  {
    id: "casio",
    type: "parallel",
    states: {
      main: {
        initial: "time",
        context: {
          hours: 0,
          minutes: 0,
          seconds: 0,
          chronoMachine: null,
          alarmMachine: null,
          timeSystem: 24,
          timePeriod: null,
        },
        states: {
          time: {
            on: {
              CHANGE_MODE: "alarm",
              START_STOP: {
                actions: [
                  // Not sure it's fine because send depends on changeTimeSystem action
                  "changeTimeSystem",
                  send(
                    (context) => ({
                      type: "UPDATE_TIMESYSTEM",
                      value: context.timeSystem,
                    }),
                    {
                      to: (context) => context.alarmMachine,
                    }
                  ),
                ],
              },
            },
          },
          alarm: {
            entry: assign({
              alarmMachine: (context, event) =>
                context.alarmMachine
                  ? context.alarmMachine
                  : spawn(alarmMachine, { sync: true }),
            }),
            on: {
              CHANGE_MODE: "chrono",
            },
          },
          chrono: {
            entry: assign({
              chronoMachine: (context, event) =>
                context.chronoMachine
                  ? context.chronoMachine
                  : spawn(chronoMachine, { sync: true }),
            }),
            on: {
              CHANGE_MODE: "editSeconds",
            },
          },
          editSeconds: {
            ...blinkingStates,
            on: {
              CHANGE_MODE: "time",
              BACKLIGHT_RESET_PUSH: "editHours",
              START_STOP: {
                actions: "resetSeconds",
              },
            },
          },
          editHours: {
            ...blinkingStates,
            on: {
              CHANGE_MODE: "time",
              BACKLIGHT_RESET_PUSH: "editMinutes",
              START_STOP: {
                actions: "incrementHours",
              },
            },
          },
          editMinutes: {
            ...blinkingStates,
            on: {
              CHANGE_MODE: "time",
              BACKLIGHT_RESET_PUSH: "editSeconds",
              START_STOP: {
                actions: "incrementMinutes",
              },
            },
          },
        },
        invoke: {
          src: (context) => (cb) => {
            const interval = setInterval(() => {
              cb("TICK");
            }, 1000);

            return () => {
              clearInterval(interval);
            };
          },
        },
        on: {
          TICK: {
            actions: "updateTime",
          },
        },
      },
      light: {
        initial: "off",
        states: {
          off: {
            on: {
              BACKLIGHT_RESET_PUSH: "on",
            },
          },
          on: {
            on: {
              BACKLIGHT_RESET_RELEASE: "off",
            },
          },
        },
      },
      alarm_daily: {
        initial: "not_ringing",
        states: {
          not_ringing: {
            on: {
              TICK: {
                target: "ringing",
                cond: "dailyAlarmMatchTime",
              },
            },
          },
          ringing: {
            activities: ["beeping"],
            after: {
              20000: "not_ringing",
            },
            on: {
              BACKLIGHT_RESET_PUSH: "not_ringing",
            },
          },
        },
      },
      alarm_hourly: {
        initial: "not_ringing",
        states: {
          not_ringing: {
            on: {
              TICK: {
                target: "ringing",
                cond: "hourlyAlarmMatchTime",
              },
            },
          },
          ringing: {
            invoke: {
              src: (context, event) => (callback, onReceive) => {
                beep();
                callback("STOP_RINGING");
              },
            },
            on: {
              STOP_RINGING: "not_ringing",
            },
          },
        },
      },
    },
  },
  {
    activities: {
      beeping: () => {
        // Start the beeping activity
        const interval = setInterval(() => beep(), 1000);

        // Return a function that stops the beeping activity
        return () => clearInterval(interval);
      },
    },
    guards: {
      dailyAlarmMatchTime: (context, event) => {
        if (!context.alarmMachine) {
          return false;
        }

        const {
          hours,
          minutes,
          dailyAlarm,
        } = context.alarmMachine.state.context;

        if (!dailyAlarm) {
          return false;
        }

        const minutesBefore = minutes === 0 ? 59 : minutes - 1;
        const hoursBefore =
          hours === 0
            ? context.timeSystem === 24
              ? 23
              : 11
            : minutesBefore === 59
            ? hours - 1
            : hours;
        console.log("hours", hours);
        console.log("context.timeSystem", context.timeSystem);
        console.log(`${hoursBefore}:${minutesBefore}:59`);

        return (
          context.hours === hoursBefore &&
          context.minutes === minutesBefore &&
          context.seconds === 59
        );
      },
      hourlyAlarmMatchTime: (context, event) => {
        if (!context.alarmMachine) {
          return false;
        }

        const { hourlyAlarm } = context.alarmMachine.state.context;

        if (!hourlyAlarm) {
          return false;
        }

        return context.minutes === 59 && context.seconds === 59;
      },
    },
    actions: {
      incrementHours: assign((context, event) => {
        const { hours, timeSystem } = context;
        return {
          hours: incrementHours(hours, timeSystem),
        };
      }),
      incrementMinutes: assign((context, event) => {
        const { minutes } = context;
        return {
          minutes: incrementMinutes(minutes),
        };
      }),
      resetSeconds: assign((context, event) => {
        return {
          seconds: 0,
        };
      }),
      updateTime: assign((context, event) => {
        const { hours, minutes, seconds, timeSystem, timePeriod } = context;
        const HOURS_IN_DAY = timeSystem;

        let s = seconds + 1;
        let m = minutes;
        let h = hours;
        let tP: TimePeriod = timePeriod;
        if (s === SECONDS_IN_MINUTES) {
          m = m + 1;
          s = 0;
        }

        if (m === MINUTES_IN_HOUR) {
          h = h + 1;
          m = 0;
        }

        if (h === HOURS_IN_DAY) {
          tP =
            timeSystem === 12 && timePeriod === TimePeriod.AM
              ? TimePeriod.PM
              : TimePeriod.AM;
          h = 0;
        }

        return {
          seconds: s,
          minutes: m,
          hours: h,
          timePeriod: tP,
        };
      }),
      changeTimeSystem: assign((context, _) => {
        const timeSystem = context.timeSystem === 12 ? 24 : 12;
        const timePeriod =
          timeSystem === 12
            ? context.hours > 11
              ? TimePeriod.PM
              : TimePeriod.AM
            : null;
        return {
          timeSystem,
          timePeriod,
          hours:
            context.timeSystem === 12
              ? context.hours + 12
              : context.hours > 11
              ? context.hours - 12
              : context.hours,
        };
      }),
    },
  }
);
