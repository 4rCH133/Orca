/**
 * Orca Tab Bar Icons — Custom SVG silhouettes.
 * Each icon is an orca-themed shape at 24x24 viewBox.
 * Stroke-based, 1.5px weight, round caps — matches lucide aesthetic.
 *
 * Uses same import pattern as lucide-react-native for react-native-svg compat.
 */

import * as NativeSvg from 'react-native-svg';

const Svg = NativeSvg.Svg;
const Path = NativeSvg.Path;
const Circle = NativeSvg.Circle;

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = {
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * Home — Dorsal Fin
 * Tall triangular orca dorsal fin rising from a wave line.
 */
export function DorsalFinIcon({ size = 24, color = '#E0E0E0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C11.5 7 10 11 7 15L12 14.5L17 15C14 11 12.5 7 12 3Z"
        stroke={color}
        {...STROKE}
      />
      <Path
        d="M3 18C5 16.5 7 17.5 9 17C11 16.5 13 16.5 15 17C17 17.5 19 16.5 21 18"
        stroke={color}
        {...STROKE}
      />
    </Svg>
  );
}

/**
 * Search — Orca Eye
 * Orca eye patch shape with pupil + magnifier handle.
 */
export function OrcaEyeIcon({ size = 24, color = '#E0E0E0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 13C6 8 10 6 14 7C18 8 20 11 20 13C20 15 17 17 13 16C9 15 5 16 4 13Z"
        stroke={color}
        {...STROKE}
      />
      <Circle cx={13} cy={12} r={2} stroke={color} strokeWidth={1.5} />
      <Path
        d="M19 16L21.5 18.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Likes — Splash / Breach
 * Water splash droplet evoking a heart and whale breach.
 */
export function SplashIcon({ size = 24, color = '#E0E0E0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4C12 4 7 9 7 13C7 16.3 9.2 19 12 19C14.8 19 17 16.3 17 13C17 9 12 4 12 4Z"
        stroke={color}
        {...STROKE}
      />
      <Path d="M8 7L6.5 5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16 7L17.5 5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Inbox — Tail Fluke
 * Orca tail fluke (two-lobed tail seen when diving) with wave.
 */
export function TailFlukeIcon({ size = 24, color = '#E0E0E0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4V10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M12 10C10 12 7 14 4 14C5 12 7 10 12 10Z"
        stroke={color}
        {...STROKE}
      />
      <Path
        d="M12 10C14 12 17 14 20 14C19 12 17 10 12 10Z"
        stroke={color}
        {...STROKE}
      />
      <Path
        d="M5 19C7 17.5 9 18.5 12 18C15 17.5 17 18.5 19 19"
        stroke={color}
        {...STROKE}
      />
    </Svg>
  );
}

/**
 * Profile — Orca Head
 * Side-profile orca head with eye and chin patch.
 */
export function OrcaHeadIcon({ size = 24, color = '#E0E0E0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8C6 5 9 3 12 3C16 3 19 6 19 9C19 11 18 13 16 14L14 16C13 17 11 18 9 18C7 18 5 16 5 14C5 13 5.5 12 6 11L6 8Z"
        stroke={color}
        {...STROKE}
      />
      <Circle cx={14} cy={8} r={1.2} stroke={color} strokeWidth={1.5} />
      <Path d="M8 14C9 15 11 15.5 13 15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
