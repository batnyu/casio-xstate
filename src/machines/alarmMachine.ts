import { createMachine, assign } from "xstate";
import { CasioEvent, TimeSystem } from "./casioMachine";
import { blinkingStates } from "./blinkingMachine";
import { incrementHours } from "../utils/incrementHours";
import { incrementMinutes } from "../utils/incrementMinutes";

interface AlarmContext {
  hours: number;
  minutes: number;
  dailyAlarm: boolean;
  hourlyAlarm: boolean;
  timeSystem: TimeSystem;
}

type AlarmState =
  | {
      value: "display";
      context: AlarmContext;
    }
  | {
      value: "editHours";
      context: AlarmContext;
    }
  | {
      value: "editMinutes";
      context: AlarmContext;
    };

export const alarmMachine = createMachine<AlarmContext, CasioEvent, AlarmState>(
  {
    initial: "display",
    context: {
      hours: 0,
      minutes: 0,
      dailyAlarm: false,
      hourlyAlarm: false,
      timeSystem: 24,
    },
    states: {
      display: {
        on: {
          START_STOP: {
            actions: "switchMode",
          },
          BACKLIGHT_RESET_PUSH: "editHours",
        },
      },
      editHours: {
        ...blinkingStates,
        on: {
          CHANGE_MODE: "display",
          BACKLIGHT_RESET_PUSH: "editMinutes",
          START_STOP: {
            actions: "incrementHours",
          },
        },
      },
      editMinutes: {
        ...blinkingStates,
        on: {
          CHANGE_MODE: "display",
          BACKLIGHT_RESET_PUSH: "display",
          START_STOP: {
            actions: "incrementMinutes",
          },
        },
      },
    },
    on: {
      UPDATE_TIMESYSTEM: {
        actions: "updateTimeSystem",
      },
    },
  },
  {
    actions: {
      switchMode: assign((context, _) => {
        const { dailyAlarm, hourlyAlarm } = context;
        if (dailyAlarm && hourlyAlarm) {
          return {
            dailyAlarm: false,
            hourlyAlarm: false,
          };
        } else if (!dailyAlarm && !hourlyAlarm) {
          return {
            dailyAlarm: true,
          };
        } else if (dailyAlarm && !hourlyAlarm) {
          return {
            dailyAlarm: false,
            hourlyAlarm: true,
          };
        } else {
          return {
            dailyAlarm: true,
          };
        }
      }),
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
      updateTimeSystem: assign((context, event) => {
        return {
          timeSystem: event.value,
        };
      }),
    },
  }
);
