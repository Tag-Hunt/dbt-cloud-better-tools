# dbt toned down power user

## Notes
I will be gutting all of the features locked behind the Altimate API from Power User for dbt.

## Current demo
There is now a `dbt Cloud Better Tools: Open Lineage Demo` command that runs the
Power User lineage renderer inside this extension using local demo graph data.

There is also a fake dbt project fixture at
`examples/demo_dbt_project/` that matches the current demo lineage graph, so
graph nodes can open real example files instead of placeholder files.

## Test it
1. Run `npm run compile`
2. Press `F5` in VS Code to launch the Extension Development Host
3. Open the Command Palette and run `dbt Cloud Better Tools: Open Lineage Demo`
4. Click through the graph and open files from `examples/demo_dbt_project`

This is only the renderer extraction step. The next step is replacing the demo
graph with real dbt manifest/project data.
