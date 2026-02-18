export interface AvatarOption {
  collection: string;
  label: string;
  value: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    collection: 'Robots',
    label: 'Orbital Neon',
    value: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=orbital-neon',
  },
  {
    collection: 'Robots',
    label: 'Circuit Mint',
    value: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=circuit-mint',
  },
  {
    collection: 'Robots',
    label: 'Mecha Violet',
    value: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=mecha-violet',
  },
  {
    collection: 'Pixel Art',
    label: 'Pixel Nova',
    value: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=pixel-nova',
  },
  {
    collection: 'Pixel Art',
    label: 'Pixel Lime',
    value: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=pixel-lime',
  },
  {
    collection: 'Pixel Art',
    label: 'Pixel Rose',
    value: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=pixel-rose',
  },
  {
    collection: 'Personas',
    label: 'Micah Wave',
    value: 'https://api.dicebear.com/9.x/micah/svg?seed=micah-wave',
  },
  {
    collection: 'Personas',
    label: 'Micah Coral',
    value: 'https://api.dicebear.com/9.x/micah/svg?seed=micah-coral',
  },
  {
    collection: 'Personas',
    label: 'Big Smile',
    value: 'https://api.dicebear.com/9.x/big-smile/svg?seed=big-smile',
  },
  {
    collection: 'Personas',
    label: 'Big Smile Sky',
    value: 'https://api.dicebear.com/9.x/big-smile/svg?seed=big-smile-sky',
  },
  {
    collection: 'Personas',
    label: 'Persona Blue',
    value: 'https://api.dicebear.com/9.x/personas/svg?seed=persona-blue',
  },
  {
    collection: 'Personas',
    label: 'Persona Orange',
    value: 'https://api.dicebear.com/9.x/personas/svg?seed=persona-orange',
  },
  {
    collection: 'Abstractos',
    label: 'Shapes Flux',
    value: 'https://api.dicebear.com/9.x/shapes/svg?seed=shapes-flux',
  },
  {
    collection: 'Abstractos',
    label: 'Shapes Pulse',
    value: 'https://api.dicebear.com/9.x/shapes/svg?seed=shapes-pulse',
  },
  {
    collection: 'Abstractos',
    label: 'Lorelei Soft',
    value: 'https://api.dicebear.com/9.x/lorelei/svg?seed=lorelei-soft',
  },
  {
    collection: 'Abstractos',
    label: 'Lorelei Pop',
    value: 'https://api.dicebear.com/9.x/lorelei/svg?seed=lorelei-pop',
  },
  {
    collection: 'Abstractos',
    label: 'Glass Cyan',
    value: 'https://api.dicebear.com/9.x/glass/svg?seed=glass-cyan',
  },
  {
    collection: 'Abstractos',
    label: 'Glass Sunset',
    value: 'https://api.dicebear.com/9.x/glass/svg?seed=glass-sunset',
  },
  {
    collection: 'Iniciales',
    label: 'Initials Gold',
    value: 'https://api.dicebear.com/9.x/initials/svg?seed=initials-gold',
  },
  {
    collection: 'Iniciales',
    label: 'Initials Navy',
    value: 'https://api.dicebear.com/9.x/initials/svg?seed=initials-navy',
  },
  {
    collection: 'Iniciales',
    label: 'Thumbs Magenta',
    value: 'https://api.dicebear.com/9.x/thumbs/svg?seed=thumbs-magenta',
  },
  {
    collection: 'Iniciales',
    label: 'Thumbs Mint',
    value: 'https://api.dicebear.com/9.x/thumbs/svg?seed=thumbs-mint',
  },
];

export const AVATAR_OPTION_VALUES = AVATAR_OPTIONS.map((option) => option.value);

export const AVATAR_COLLECTIONS = AVATAR_OPTIONS.reduce<Record<string, AvatarOption[]>>((acc, option) => {
  if (!acc[option.collection]) {
    acc[option.collection] = [];
  }
  acc[option.collection].push(option);
  return acc;
}, {});
