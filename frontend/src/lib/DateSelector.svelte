<script lang="ts" context="module">
  import dayjs from "dayjs";
  export type DateRange = { from: dayjs.Dayjs; to: dayjs.Dayjs };
</script>

<script lang="ts">
  export let selectedRange: DateRange = {
    from: dayjs(),
    to: dayjs().startOf("month"),
  };

  let fromInput: string;
  $: selectedRange.from = dayjs(fromInput);
  let toInput: string;
  $: selectedRange.to = dayjs(toInput);
</script>

<h3>From</h3>
<input type="datetime-local" bind:value={fromInput} />

<h3>To</h3>
<input type="datetime-local" bind:value={fromInput} />
