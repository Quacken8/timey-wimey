<script lang="ts" context="module">
  import dayjs from "dayjs";
  export type DateRange = { from: dayjs.Dayjs; to: dayjs.Dayjs };
</script>

<script lang="ts">
  export let selectedRange: DateRange = {
    from: dayjs().startOf("month"),
    to: dayjs(),
  };

  let fromInput: string = selectedRange.from.format("YYYY-MM-DDTHH:mm");
  $: selectedRange.from = dayjs(fromInput);
  let toInput: string = selectedRange.to.format("YYYY-MM-DDTHH:mm");
  $: selectedRange.to = dayjs(toInput);
</script>

<div class="container">
  <div class="inputs">
    <h3>From</h3>
    <input type="datetime-local" bind:value={fromInput} />

    <h3>To</h3>
    <input type="datetime-local" bind:value={toInput} />
  </div>
  <div class="buttons">
    <button
      on:click={() => {
        toInput = dayjs().format("YYYY-MM-DDTHH:mm");
        fromInput = dayjs().startOf("day").format("YYYY-MM-DDTHH:mm");
      }}
    >
      Today
    </button>
    <button
      on:click={() => {
        toInput = dayjs().format("YYYY-MM-DDTHH:mm");
        fromInput = dayjs().startOf("week").format("YYYY-MM-DDTHH:mm");
      }}
    >
      This Week
    </button>
    <button
      on:click={() => {
        toInput = dayjs().startOf("week").format("YYYY-MM-DDTHH:mm");
        fromInput = dayjs()
          .startOf("week")
          .subtract(1, "week")
          .format("YYYY-MM-DDTHH:mm");
      }}
    >
      Last Week
    </button>
    <button
      on:click={() => {
        toInput = dayjs().format("YYYY-MM-DDTHH:mm");
        fromInput = dayjs().startOf("month").format("YYYY-MM-DDTHH:mm");
      }}
    >
      This Month
    </button>
    <button
      on:click={() => {
        toInput = dayjs().startOf("month").format("YYYY-MM-DDTHH:mm");
        fromInput = dayjs()
          .startOf("month")
          .subtract(1, "month")
          .format("YYYY-MM-DDTHH:mm");
      }}
    >
      Last Month
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .inputs {
    display: flex;
    flex-direction: column;
  }
  .buttons {
    display: flex;
    flex-direction: column;
    align-self: flex-end;
    width: fit-content;
  }
</style>
