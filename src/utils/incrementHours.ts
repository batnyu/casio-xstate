import { TimeSystem } from "../machines/casioMachine";

export const incrementHours = (hours: number, timeSystem: TimeSystem) => {
  return hours === timeSystem - 1 ? 0 : hours + 1;
};
