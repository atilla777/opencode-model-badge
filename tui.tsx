import { Plugin } from "@opencode/plugin/tui";
import { badgeDetails, parseOptions, projectDetails } from "./badge.mjs";

export default Plugin.define({
  id: "local.model-badge",
  setup(context) {
    const styles = parseOptions(context.options);
    const location = () => context.location ?? context.data.location.default();
    const details = () => badgeDetails(
      context.ui.model.current(),
      context.data.location.model.list(context.location),
      styles,
    );
    const project = () => projectDetails(location(), context.data.project.list());

    const render = () => {
      const model = details();
      const currentProject = project();
      return (
        <box flexDirection="row" paddingLeft={1} paddingRight={1} flexShrink={0}>
          {currentProject ? (
            <text fg={currentProject.color}>{`▌ ${currentProject.label}`}</text>
          ) : null}
          {currentProject && model ? (
            <text fg={context.theme.text.muted}> │ </text>
          ) : null}
          <text fg={model?.color ?? "#94A3B8"}>
            {model ? `▌ ${model.icon ? `${model.icon} ` : ""}${model.name}` : ""}
          </text>
          <text fg={context.theme.text.muted}>
            {model?.variant ? ` · ${model.variant}` : ""}
          </text>
        </box>
      );
    };

    const removeSession = context.ui.slot({ append: "session.composer.top", render });
    const removeHome = context.ui.slot({ append: "home.footer.status", render });
    return () => {
      removeSession();
      removeHome();
    };
  },
});
