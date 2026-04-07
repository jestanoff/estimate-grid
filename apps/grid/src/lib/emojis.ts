export const EMOJI_CATEGORIES = {
  animals: [
    '🐝', '🦋', '🐧', '🐨', '🐔', '🐙', '🐳',
    '🦈', '🐊', '🦩', '🦜', '🐞', '🦔', '🦦', '🐿️',
  ],
  faces: [
    '🤡', '👻', '💀', '👽', '🤖', '🎃', '😈', '🥸',
    '🧙', '🧛', '🧟', '🧜', '🦸', '🥷', '🧑‍🚀', '🧑‍🎤',
  ],
  food: [
    '🌮', '🍕', '🍩', '🧁', '🍉', '🥑', '🌶️', '🍄',
    '🧀', '🥐', '🍔', '🌭', '🥨', '🫑', '🍣', '🥝',
  ],
  fun: [
    '🎸', '🪩', '🛸', '🎪', '🎭', '🏴‍☠️',
    '🧲', '🪃', '🎯', '🪅', '🧊', '💎', '🌈',
  ],
} as const;

export type EmojiCategory = keyof typeof EMOJI_CATEGORIES;

const CATEGORY_KEYS = Object.keys(EMOJI_CATEGORIES) as EmojiCategory[];

export function pickRandomCategory(): EmojiCategory {
  return CATEGORY_KEYS[Math.floor(Math.random() * CATEGORY_KEYS.length)];
}

export function getRandomEmoji(category: EmojiCategory, exclude: string[] = []): string {
  const pool = EMOJI_CATEGORIES[category];
  const available = pool.filter((e) => !exclude.includes(e));
  if (available.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
