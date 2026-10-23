import { Plugin } from "@opencode/plugin/tui";
import { badgeDetails, parseOptions } from "./badge.mjs";

export default Plugin.define({
  id: "local.model-badge",
  setup(context) {
    const styles = parseOptions(context.options);
    const details = () => badgeDetails(
      context.ui.model.current(),
      context.data.location.model.list(context.location),
      styles,
    );

    const render = () => (
      <box flexDirection="row" paddingLeft={1} paddingRight={1} flexShrink={0}>
        <text fg={details()?.color ?? "#94A3B8"}>
          {details() ? `▌ ${details().icon ? `${details().icon} ` : ""}${details().name}` : ""}
        </text>
        <text fg={context.theme.text.muted}>
          {details()?.variant ? ` · ${details().variant}` : ""}
        </text>
      </box>
    );

    const removeSession = context.ui.slot({ append: "session.composer.top", render });
    const removeHome = context.ui.slot({ append: "home.footer.status", render });
    return () => {
      removeSession();
      removeHome();
    };
  },
});
