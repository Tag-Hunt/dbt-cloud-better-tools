# dbt toned down power user

## Notes
This project is now intentionally following the upstream Power User for dbt
lineage implementation strategy and trimming features away from there.

For lineage-related work, the default rule is:

- start by checking how Power User does it
- reuse the same view IDs, provider structure, and renderer plumbing where possible
- only diverge when the original implementation depends on Altimate-hosted/API
  behavior we do not want

## Current demo
There is now a `dbt Cloud Better Tools: Open Lineage Demo` command that runs the
Power User lineage renderer inside this extension using local demo graph data.
The lineage view now lives in the same kind of bottom panel container Power
User uses:

- panel container id: `lineage_view`
- webview view id: `dbtPowerUser.Lineage`
- tab title in VS Code: `Lineage`

There is also a fake dbt project fixture at
`examples/demo_dbt_project/` that matches the current demo lineage graph, so
graph nodes can open real example files instead of placeholder files.

The backend structure now mirrors the upstream pattern:

- `src/webview_provider/index.ts`
- `src/webview_provider/lineagePanel.ts`
- `src/webview_provider/newLineagePanel.ts`

## Test it
1. Run `npm run compile`
2. Press `F5` in VS Code to launch the Extension Development Host
3. Open the Command Palette and run `dbt Cloud Better Tools: Open Lineage Demo`
4. VS Code should switch to the bottom panel container `Lineage`
5. Click the `Lineage` tab inside that panel if it is not already selected
6. Click through the graph and open files from `examples/demo_dbt_project`

This is still the renderer extraction step. The next step is replacing the demo
graph with real dbt manifest/project data while keeping the Power User-style
panel/provider structure intact.
