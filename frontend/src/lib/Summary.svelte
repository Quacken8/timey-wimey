<script lang="ts" context="module">
  export type SummaryData = {
    workingMinutes: number;
    focusedMinutes: number;
  };
</script>

<script lang="ts">
  export let summaryData: Promise<SummaryData>;

  function toHoursMinutes(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
</script>

<div class="container">
  <h1>Timey-wimey data!</h1>
  {#await summaryData}
    <p>Loading...</p>
  {:then data}
    <div>Today worked: {toHoursMinutes(data.workingMinutes)}</div>
    <div>Today focused: {toHoursMinutes(data.focusedMinutes)}</div>
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
