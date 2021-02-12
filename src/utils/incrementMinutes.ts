export const incrementMinutes = (minutes: number) => {
  return minutes === 59 ? 0 : minutes + 1;
};
