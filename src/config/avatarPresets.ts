export type AvatarPresetOption = {
  id: string;
  label: string;
  /** PNG endpoint — same seeds/styles as SVG; RN `Image` handles PNG reliably. */
  url: string;
};

export const DEFAULT_AVATAR_OPTIONS: readonly AvatarPresetOption[] = [
  {
    id: "aurora",
    label: "Aurora",
    url: "https://api.dicebear.com/7.x/avataaars/png?seed=WeartualAurora&radius=50&backgroundColor=b6e3f4",
  },
  {
    id: "river",
    label: "River",
    url: "https://api.dicebear.com/7.x/avataaars/png?seed=WeartualRiver&radius=50&backgroundColor=c0aede",
  },
  {
    id: "sage",
    label: "Sage",
    url: "https://api.dicebear.com/7.x/notionists/png?seed=WeartualSage&radius=50",
  },
  {
    id: "nova",
    label: "Nova",
    url: "https://api.dicebear.com/7.x/notionists/png?seed=WeartualNova&radius=50",
  },
  {
    id: "orbit",
    label: "Orbit",
    url: "https://api.dicebear.com/7.x/avataaars/png?seed=WeartualOrbit&radius=50&backgroundColor=ffd5dc",
  },
  {
    id: "pixel",
    label: "Pixel",
    url: "https://api.dicebear.com/7.x/pixel-art/png?seed=WeartualPixel&radius=50",
  },
] as const;

/** @deprecated Use `DEFAULT_AVATAR_OPTIONS` */
export const AVATAR_PRESETS = DEFAULT_AVATAR_OPTIONS;

export function findPreset(id: string | null | undefined): AvatarPresetOption | undefined {
  if (!id) return undefined;
  return DEFAULT_AVATAR_OPTIONS.find((p) => p.id === id);
}
