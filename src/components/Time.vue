<template>
  <div class="flex flex-row items-baseline justify-between">
    <span class="text-xs font-semibold uppercase">Time</span>
    <div>
      <span class="text-xs">
        {{
          state.context.alarmMachine &&
          state.context.alarmMachine.state.context.dailyAlarm
            ? "daily"
            : ""
        }}
      </span>
      <span class="text-xs">
        {{
          state.context.alarmMachine &&
          state.context.alarmMachine.state.context.hourlyAlarm
            ? "hourly"
            : ""
        }}
      </span>
    </div>
  </div>
  <div>{{ state.context.timeSystem }}</div>
  <div>{{ state.context.timePeriod }}</div>
  <span
    :class="{
      'text-white': state.matches('main.editHours.not_visible'),
    }"
    >{{ prependWithZero(state.context.hours) }}</span
  ><span>:</span>
  <span
    :class="{
      'text-white': state.matches('main.editMinutes.not_visible'),
    }"
    >{{ prependWithZero(state.context.minutes) }}</span
  ><span>:</span>
  <span
    :class="{
      'text-white': state.matches('main.editSeconds.not_visible'),
    }"
    >{{ prependWithZero(state.context.seconds) }}</span
  >
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { State } from "xstate";
import { CasioContext, CasioEvent, CasioState } from "../machines/casioMachine";

export default defineComponent({
  name: "Time",
  props: {
    state: {
      type: Object as PropType<
        State<CasioContext, CasioEvent, any, CasioState>
      >,
      required: true,
    },
  },
  methods: {
    prependWithZero(value: number): string {
      return value < 10 ? "0" + value : "" + value;
    },
  },
});
</script>

<style scoped></style>
