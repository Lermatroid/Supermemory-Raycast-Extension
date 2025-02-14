import { LaunchProps, Detail } from "@raycast/api";
import { useAskSupermemory } from "../lib/hooks";
import { showFailureToast } from "@raycast/utils";
import { popToRoot } from "@raycast/api";
export default function Command(props: LaunchProps<{ arguments: Arguments.AskSupermemory }>) {
  const { answer, isLoading, error } = useAskSupermemory(props.arguments.question);

  if (error) {
    if (error.message.includes("401")) {
      showFailureToast("Invalid API key. Please update it in the extension preferences.");
    } else {
      showFailureToast("Unknown error asking Supermemory. Please try again.");
    }

    popToRoot({ clearSearchBar: true });
    return;
  }

  return <Detail markdown={answer.replaceAll("\\n", "\n")} isLoading={isLoading} />;
}
