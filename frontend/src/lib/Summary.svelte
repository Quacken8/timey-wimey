<script lang="ts">
  import type { SummaryData } from "@extension/src/ui/parseForUI";

  export let summaryData: Promise<SummaryData> = new Promise(() => {});
  export let topFilesData: Promise<Record<string, number>> = new Promise(
    () => {}
  );

  let summary: SummaryData;
  let topFiles: Record<string, number>;
  let error: Error | undefined;

  $: if (summaryData && topFilesData)
    Promise.all([summaryData, topFilesData])
      .then(([summaryRes, topFilesRes]) => {
        summary = summaryRes;
        topFiles = topFilesRes;
        error = undefined;
      })
      .catch((err) => {
        error = err;
      });

  function toHoursMinutes(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
</script>

<div class="container">
  <h1>Timey-wimey data!</h1>
  {#if error}
    <p>Error: {error}</p>
  {:else}
    {#if summary}
      <h2>Summary</h2>
      <div>Time worked: {toHoursMinutes(summary.workingMinutes)}</div>
      <div>Time focused: {toHoursMinutes(summary.focusedMinutes)}</div>
    {/if}

    {#if topFiles}
      <h2>Top files</h2>
      <ul>
        {#each Object.entries(topFiles) as [file, minutes]}
          <li>
            {toHoursMinutes(minutes)} — {file}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
