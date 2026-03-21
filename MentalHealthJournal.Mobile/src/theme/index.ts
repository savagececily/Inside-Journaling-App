// Main theme export
export { colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius, shadows } from './spacing';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

// Combined theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
