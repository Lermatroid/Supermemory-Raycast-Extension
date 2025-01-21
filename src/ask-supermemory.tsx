import { LaunchProps, Detail } from "@raycast/api";
import { useAskSupermemory } from "../lib/hooks";
import { showFailureToast } from "@raycast/utils";
import { useEffect } from "react";
export default function Command(props: LaunchProps<{ arguments: Arguments.AskSupermemory }>) {
  const { answer, isLoading, error } = useAskSupermemory(props.arguments.question);

  useEffect(() => {
    if (answer) {
      console.log("answer updated:", answer);
    }
  }, [answer]);

  // const dummyAnswer = `#Hello World\n\nThis is a test answer.`;

  if (error) {
    console.error(error);
    showFailureToast("Error asking Supermemory. Please try again.");
    return;
  }

  return <Detail markdown={answer.replaceAll("\\n", "\n")} isLoading={isLoading} />;
}
