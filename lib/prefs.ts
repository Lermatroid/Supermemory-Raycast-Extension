import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apikey: string;
}

export function getPrefs(): Preferences {
  return getPreferenceValues();
}
