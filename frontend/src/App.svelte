<script lang="ts">
  import Summary, { type SummaryData } from "./lib/Summary.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import { getSummary } from "./lib/dataParser";
  import { getData } from "./lib/backendAsker";
  import type { DateRange } from "./lib/DateSelector.svelte";

  let selectedWorkspaces: Set<string>;
  let selectedRange: DateRange;

  let summaryData: Promise<SummaryData>;
  $: if (selectedRange && selectedWorkspaces) {
    summaryData = getSummary(
      getData(
        selectedRange.from.toDate(),
        selectedRange.to.toDate(),
        Array.from(selectedWorkspaces)
      )
    );
  }
</script>

<main>
  <div style:grid-area="summary">
    <Summary {summaryData} />
  </div>

  <div style:grid-area="graph">
    <h2>Graph</h2>
    <p>Coming soon!</p>
  </div>

  <div style:grid-area="sidebar">
    <Sidebar bind:selectedWorkspaces bind:selectedRange />
  </div>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 3fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      "summary sidebar"
      "graph sidebar";
  }
</style>
