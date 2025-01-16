import { showToast } from "@raycast/api";
import { getActiveTab } from "../lib/active-tab";
import { createMemoryFromTab } from "../lib/supermemory";
import { showFailureToast } from "@raycast/utils";
import { inferSpaceForTab } from "../lib/ai";
import { createSpaceMessage } from "../lib/utils";

export default async function Command() {
  try {
    const tab = await getActiveTab();

    if (!tab) {
      showFailureToast("No active tab found");
      return;
    }

    const spaces = await inferSpaceForTab(tab);

    const { data, error } = await createMemoryFromTab(
      tab,
      spaces.map((space) => space.uuid),
    );

    if (error) {
      showFailureToast("Something went wrong adding site to Supermemory");
      console.error(error);
      return;
    }

    await showToast({
      title: "Added to Supermemory",
      message: createSpaceMessage(spaces.map((space) => space.name)),
    });

    showToast({ title: `created memory with id: ${data.id}` });
  } catch (error) {
    console.error(error);
    showFailureToast("Something went wrong adding site to Supermemory");
  }
}
