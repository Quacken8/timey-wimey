<script lang="ts">
  import { histogram, type Data } from "thistogram";
  import type { DateRange } from "./DateSelector.svelte";
  import { getHistogramData } from "./backendAsker";
  export let selectedRange: DateRange;
  export let selectedWorkspaces: Set<string> = new Set();
  export let width = 0;
  $: graphData =
    selectedRange === undefined
      ? undefined
      : getHistogramData(
          selectedRange.from.toDate(),
          selectedRange.to.toDate(),
          [...selectedWorkspaces]
        );
</script>

<h2>Graph</h2>
<div class="graph-container">
  {#await graphData ?? Promise.resolve([]) then data}
    {#if data.length > 0}
      {@const unicodeHistogram = histogram(
        data.map((d) => [d.label, d.workingHours]),
        {
          width: width / 10,
          type: "bar",
          showValues: true,
          drawOptions: {
            histoChars: ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"], //["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"],
          },
          significantDigits: 2,
          headers: ["time", "hours"],
        }
      )}
      {unicodeHistogram}
    {:else}
      <p>No data</p>
    {/if}
  {/await}
</div>

<style>
  .graph-container {
    font-family: "DejaVu Sans Mono Book", "FiraCode Nerd Font Mono", monospace;
    white-space: pre;
  }
</style>
