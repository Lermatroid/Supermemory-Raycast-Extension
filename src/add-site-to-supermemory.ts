import { showToast } from "@raycast/api";
import { getActiveTab } from "../lib/active-tab";
import { createMemoryFromTab } from "../lib/supermemory";
import { showFailureToast } from "@raycast/utils";

export default async function Command() {
  try {
    const tab = await getActiveTab();

    if (!tab) {
      showFailureToast("No active tab found");
      return;
    }

    const { data, error } = await createMemoryFromTab(tab);

    if (error) {
      showFailureToast("Something went wrong adding site to Supermemory");
      console.error(error);
      return;
    }

    showToast({ title: `created memory with id: ${data.id}` });
  } catch (error) {
    console.error(error);
    showFailureToast("Something went wrong adding site to Supermemory");
  }
}
