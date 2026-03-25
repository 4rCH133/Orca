/**
 * Orca Design System — Static color export (backward compat).
 *
 * Components that haven't migrated to useTheme() yet can still do:
 *   import { colors } from '@/theme/colors';
 *
 * This always returns the Dark Matte (Orca signature) colors.
 * New code should use: const { theme } = useTheme(); theme.colors.bg.base
 */

export { darkMatteColors as colors } from './tokens';
export type { ColorTokens as Colors } from './tokens';
