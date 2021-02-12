export const blinkingStates = {
  initial: "visible",
  states: {
    visible: {
      after: {
        300: "not_visible",
      },
    },
    not_visible: {
      after: {
        300: "visible",
      },
    },
  },
};
