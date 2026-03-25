/**
 * MarkdownRenderer — themed Reddit-flavored markdown for post selftext and comments.
 * Uses @ronradtke/react-native-markdown-display with custom theme styles.
 * Handles: u/user links, r/subreddit links, external URLs, spoiler text.
 * Memoized to prevent re-parse on parent re-render.
 */

import React, { useState, useMemo } from 'react';
import { Text, Pressable } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = React.memo(({ content }: MarkdownRendererProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const markdownStyles = useMemo(() => ({
    body: { color: c.text.primary, fontSize: 15, lineHeight: 24 },
    heading1: { color: c.text.primary, fontSize: 24, fontWeight: '700' as const, marginVertical: 8 },
    heading2: { color: c.text.primary, fontSize: 20, fontWeight: '700' as const, marginVertical: 6 },
    heading3: { color: c.text.primary, fontSize: 18, fontWeight: '600' as const, marginVertical: 4 },
    heading4: { color: c.text.primary, fontSize: 16, fontWeight: '600' as const, marginVertical: 3 },
    heading5: { color: c.text.primary, fontSize: 15, fontWeight: '600' as const, marginVertical: 2 },
    heading6: { color: c.text.secondary, fontSize: 14, fontWeight: '600' as const, marginVertical: 2 },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    s: { textDecorationLine: 'line-through' as const },
    link: { color: c.accent.ocean, textDecorationLine: 'none' as const },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: c.accent.ocean,
      paddingLeft: 12,
      marginLeft: 0,
      backgroundColor: c.bg.elevated,
      borderRadius: 4,
      paddingVertical: 4,
    },
    code_inline: {
      fontFamily: 'monospace',
      backgroundColor: c.bg.input,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      fontSize: 13,
      color: c.text.primary,
    },
    code_block: {
      fontFamily: 'monospace',
      backgroundColor: c.bg.input,
      padding: 12,
      borderRadius: 8,
      fontSize: 13,
      color: c.text.primary,
    },
    fence: {
      fontFamily: 'monospace',
      backgroundColor: c.bg.input,
      padding: 12,
      borderRadius: 8,
      fontSize: 13,
      color: c.text.primary,
    },
    table: { borderColor: c.border.default },
    thead: { backgroundColor: c.bg.elevated },
    th: { color: c.text.primary, fontWeight: '600' as const, padding: 8 },
    td: { color: c.text.primary, padding: 8, borderColor: c.border.default },
    tr: { borderBottomWidth: 0.5, borderBottomColor: c.border.default },
    hr: { backgroundColor: c.bg.subtle, height: 1, marginVertical: 12 },
    paragraph: { marginTop: 0, marginBottom: 8 },
    list_item: { color: c.text.primary },
    bullet_list_icon: { color: c.text.secondary },
    ordered_list_icon: { color: c.text.secondary },
    image: { borderRadius: 8 },
  }), [c]);

  // Pre-process: convert Reddit spoiler syntax >!text!< to a visible marker
  const processed = useMemo(() => {
    return content
      .replace(/>!(.+?)!</g, '`[spoiler]$1[/spoiler]`') // wrap in code so it's preserved
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }, [content]);

  const handleLink = (url: string): boolean => {
    // u/username → navigate to user profile
    if (url.match(/^\/u\/|^u\//)) {
      // User profiles not built yet — open in browser for now
      WebBrowser.openBrowserAsync(`https://reddit.com${url.startsWith('/') ? url : '/' + url}`);
      return false;
    }
    // r/subreddit → navigate to subreddit
    if (url.match(/^\/r\/|^r\//)) {
      const sub = url.replace(/^\/?r\//, '').split('/')[0];
      router.push(`/r/${sub}`);
      return false;
    }
    // Reddit internal links
    if (url.match(/^\/comments\/|^https?:\/\/(www\.)?reddit\.com/)) {
      WebBrowser.openBrowserAsync(url.startsWith('http') ? url : `https://reddit.com${url}`);
      return false;
    }
    // External URL → in-app browser
    if (url.startsWith('http')) {
      WebBrowser.openBrowserAsync(url);
      return false;
    }
    return true; // let default handling take over
  };

  return (
    <Markdown style={markdownStyles} onLinkPress={handleLink}>
      {processed}
    </Markdown>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
