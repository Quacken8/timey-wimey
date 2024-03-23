<script lang="ts">
  import Summary from "./lib/Summary.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import type { DateRange } from "./lib/DateSelector.svelte";
  import { getSummary, getTopFiles } from "./lib/backendAsker";
  import type { SummaryData } from "@extension/src/ui/parseToString";

  let selectedWorkspaces: Set<string>;
  let selectedRange: DateRange;

  let summaryData: Promise<SummaryData>;
  let topFilesData: Promise<Record<string, number>>;
  $: if (selectedRange && selectedWorkspaces) {
    topFilesData = getTopFiles(
      selectedRange.from.toDate(),
      selectedRange.to.toDate(),
      Array.from(selectedWorkspaces),
      5
    );
    summaryData = getSummary(
      selectedRange.from.toDate(),
      selectedRange.to.toDate(),
      Array.from(selectedWorkspaces)
    );
  }
</script>

<main>
  <div style:grid-area="summary">
    <Summary {summaryData} {topFilesData} />
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
