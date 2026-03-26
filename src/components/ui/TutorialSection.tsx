/**
 * TutorialSection — fun, dismissible tip cards for first-time users.
 * Each card has an ocean-blue left border, icon, title, description, and X button.
 * Dismissed tips persist across app restarts via MMKV.
 */

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Fingerprint, Search, LayoutGrid, Palette, Eye, X } from 'lucide-react-native';
import { getDismissedTips, dismissTip } from '@/store/settingsStore';
import { useTheme, useThemedStyles } from '@/theme/useTheme';

interface Tip {
  id: string;
  icon: any;
  title: string;
  description: string;
}

const TIPS: Tip[] = [
  {
    id: 'swipe_vote',
    icon: Fingerprint,
    title: 'Swipe to vote',
    description: 'Swipe right on comments to upvote. Swipe further for downvote. Swipe left to reply!',
  },
  {
    id: 'search_history',
    icon: Search,
    title: 'Your posts, searchable',
    description: 'Every post you vote on or save is searchable offline in the Likes tab \u2014 even without internet.',
  },
  {
    id: 'view_modes',
    icon: LayoutGrid,
    title: 'Three ways to browse',
    description: 'Tap the layout icon in your feed header to switch between Card, Compact, and List views.',
  },
  {
    id: 'themes',
    icon: Palette,
    title: 'Pick your vibe',
    description: 'Choose your theme below. Dark Matte is the signature Orca deep-sea look.',
  },
  {
    id: 'read_tracking',
    icon: Eye,
    title: 'Read tracking',
    description: "Posts you\u2019ve viewed will dim in the feed. Toggle this off anytime in settings.",
  },
];

export function TutorialSection() {
  const { theme } = useTheme();
  const [dismissed, setDismissed] = useState<string[]>(() => getDismissedTips());

  const visibleTips = TIPS.filter((t) => !dismissed.includes(t.id));

  const handleDismiss = (tipId: string) => {
    dismissTip(tipId);
    setDismissed((prev) => [...prev, tipId]);
  };

  const s = useThemedStyles((t) => ({
    container: { gap: 8, marginBottom: 16 },
    sectionTitle: { ...t.typography.label, color: t.colors.text.secondary, paddingHorizontal: 20, marginBottom: 4 },
    card: {
      flexDirection: 'row' as const,
      backgroundColor: t.colors.bg.surface,
      marginHorizontal: 14,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: t.colors.accent.ocean,
      padding: 14,
      gap: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.accent.ocean + '15',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    content: { flex: 1, gap: 2 },
    title: { ...t.typography.label, color: t.colors.text.primary },
    description: { ...t.typography.bodySmall, color: t.colors.text.secondary, lineHeight: 18 },
    dismissBtn: { padding: 4 },
  }));

  if (visibleTips.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>TIPS & TRICKS</Text>
      {visibleTips.map((tip) => {
        const Icon = tip.icon;
        return (
          <View key={tip.id} style={s.card}>
            <View style={s.iconWrap}>
              <Icon size={18} color={theme.colors.accent.ocean} />
            </View>
            <View style={s.content}>
              <Text style={s.title}>{tip.title}</Text>
              <Text style={s.description}>{tip.description}</Text>
            </View>
            <Pressable style={s.dismissBtn} onPress={() => handleDismiss(tip.id)} hitSlop={8}>
              <X size={16} color={theme.colors.text.muted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
