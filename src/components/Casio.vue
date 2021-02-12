<template>
  <div id="app">
    <div class="flex items-center justify-center">
      <div class="flex flex-col">
        <button
          class="btn-blue mb-4"
          @mousedown="backlightResetPush"
          @mouseup="send('BACKLIGHT_RESET_RELEASE')"
        >
          Backlight/Reset
        </button>
        <button class="btn-blue" @mousedown="changeMode">Change Mode</button>
      </div>
      <div
        class="font-bold mx-4 p-4 rounded-lg text-2xl w-48"
        :class="{ 'bg-blue-300': state.matches('light.on') }"
      >
        <div
          v-if="
            state.matches('main.time') ||
            state.matches('main.editSeconds') ||
            state.matches('main.editHours') ||
            state.matches('main.editMinutes')
          "
        >
          <Time :state="state" />
        </div>
        <div v-if="state.matches('main.alarm')">
          <div class="flex flex-row items-baseline justify-between">
            <span class="text-xs font-semibold uppercase">Alarm</span>
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
          <span
            :class="{
              'text-white':
                state.context.alarmMachine &&
                state.context.alarmMachine.state.matches(
                  'editHours.not_visible'
                ),
            }"
          >
            {{
              prependWithZero(state.context.alarmMachine.state.context.hours)
            }} </span
          ><span>:</span>
          <span
            :class="{
              'text-white':
                state.context.alarmMachine &&
                state.context.alarmMachine.state.matches(
                  'editMinutes.not_visible'
                ),
            }"
          >
            {{
              prependWithZero(state.context.alarmMachine.state.context.minutes)
            }}
          </span>
        </div>
        <div v-if="state.matches('main.chrono')">
          <div class="flex flex-row items-baseline justify-between">
            <span class="text-xs font-semibold uppercase">Chrono</span>
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
          {{ prependWithZero(state.context.chronoMachine.state.context.minutes)
          }}<span>:</span
          >{{
            prependWithZero(state.context.chronoMachine.state.context.seconds)
          }}<span>:</span
          >{{
            prependWithZero(
              state.context.chronoMachine.state.context.centiseconds
            )
          }}
        </div>
      </div>
      <div class="flex self-end">
        <button class="btn-blue" @mousedown="startStop">Start/Stop</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useMachine } from "@xstate/vue";
import { casioMachine } from "../machines/casioMachine";
import Time from "./Time.vue";

export default defineComponent({
  name: "Casio",
  props: {},
  components: {
    Time,
  },
  setup: () => {
    const date = new Date();

    const { state, send, service } = useMachine(casioMachine, {
      devTools: true,
      context: {
        seconds: date.getSeconds(),
        minutes: date.getMinutes(),
        hours: date.getHours(),
        timeSystem: 24,
      },
    });

    // service.onTransition((state) => {
    //   const { alarmMachine } = state.context;

    //   console.log(
    //     alarmMachine &&
    //       alarmMachine.state.children.blinkingMachine &&
    //       alarmMachine.state.children.blinkingMachine.state.changed
    //   );
    // });

    return {
      state,
      send,
    };
  },
  methods: {
    prependWithZero(value: number): string {
      return value < 10 ? "0" + value : "" + value;
    },
    backlightResetPush(): void {
      if (this.state.matches("main.chrono")) {
        this.state.context.chronoMachine.send("BACKLIGHT_RESET_PUSH");
      } else if (this.state.matches("main.alarm")) {
        this.state.context.alarmMachine.send("BACKLIGHT_RESET_PUSH");
      }
      this.send("BACKLIGHT_RESET_PUSH");
    },
    startStop(): void {
      if (this.state.matches("main.chrono")) {
        this.state.context.chronoMachine.send("START_STOP");
      } else if (this.state.matches("main.alarm")) {
        this.state.context.alarmMachine.send("START_STOP");
      } else {
        this.send("START_STOP");
      }
    },
    changeMode(): void {
      if (this.state.matches("main.alarm")) {
        this.state.context.alarmMachine.send("CHANGE_MODE");
      }
      this.send("CHANGE_MODE");
    },
  },
});
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
