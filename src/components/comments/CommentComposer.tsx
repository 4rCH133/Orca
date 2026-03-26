/**
 * CommentComposer — bottom sheet for writing and submitting comments.
 * Features: markdown toolbar, live preview, draft auto-save, quoted context.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Alert, type TextInput } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Bold, Italic, Link, Quote, Code, Strikethrough, List, Eye, Send } from 'lucide-react-native';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { getDraft, saveDraft, clearDraft } from '@/store/settingsStore';
import { useTheme, useThemedStyles } from '@/theme/useTheme';

interface CommentComposerProps {
  parentId: string;
  parentFullname: string; // e.g., 't3_postid' or 't1_commentid'
  parentBody?: string;    // quoted context from parent comment
  onSubmit: (body: string) => void;
  onDismiss: () => void;
  bottomSheetRef: React.RefObject<BottomSheet>;
  isSubmitting?: boolean;
}

const TOOLBAR_ACTIONS = [
  { icon: Bold, syntax: '**', wrap: true, label: 'Bold' },
  { icon: Italic, syntax: '*', wrap: true, label: 'Italic' },
  { icon: Strikethrough, syntax: '~~', wrap: true, label: 'Strikethrough' },
  { icon: Code, syntax: '`', wrap: true, label: 'Code' },
  { icon: Link, syntax: '[text](url)', wrap: false, label: 'Link' },
  { icon: Quote, syntax: '> ', wrap: false, label: 'Quote' },
  { icon: List, syntax: '- ', wrap: false, label: 'List' },
];

export function CommentComposer({
  parentId,
  parentFullname,
  parentBody,
  onSubmit,
  onDismiss,
  bottomSheetRef,
  isSubmitting = false,
}: CommentComposerProps) {
  const [body, setBody] = useState(() => getDraft(parentId) ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);
  const { theme } = useTheme();

  // Delay focus until the bottom sheet animation completes (~300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);
  const c = theme.colors;

  // Auto-save draft on text change (debounced)
  useEffect(() => {
    if (body.length > 0) {
      const timer = setTimeout(() => saveDraft(parentId, body), 500);
      return () => clearTimeout(timer);
    }
  }, [body, parentId]);

  const handleDismiss = useCallback(() => {
    if (body.trim().length > 0) {
      Alert.alert('Discard draft?', 'You have unsaved changes.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { clearDraft(parentId); onDismiss(); } },
      ]);
    } else {
      onDismiss();
    }
  }, [body, parentId, onDismiss]);

  const handleSubmit = useCallback(() => {
    if (!body.trim()) return;
    onSubmit(body.trim());
    clearDraft(parentId);
    setBody('');
  }, [body, parentId, onSubmit]);

  const insertSyntax = useCallback((syntax: string, wrap: boolean) => {
    const { start, end } = selection;
    const before = body.slice(0, start);
    const selected = body.slice(start, end);
    const after = body.slice(end);

    if (wrap && selected.length > 0) {
      setBody(before + syntax + selected + syntax + after);
    } else if (wrap) {
      setBody(before + syntax + 'text' + syntax + after);
    } else {
      setBody(before + syntax + after);
    }
  }, [body, selection]);

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.elevated, padding: 14, gap: 10 },
    handleIndicator: { backgroundColor: t.colors.border.default },
    parentQuote: {
      borderLeftWidth: 3,
      borderLeftColor: t.colors.accent.ocean,
      paddingLeft: 10,
      paddingVertical: 4,
      marginBottom: 4,
    },
    parentLabel: { ...t.typography.caption, color: t.colors.accent.ocean, fontWeight: '600' as const, marginBottom: 4 },
    parentText: { ...t.typography.bodySmall, color: t.colors.text.secondary, lineHeight: 18 },
    input: {
      ...t.typography.body,
      color: t.colors.text.primary,
      backgroundColor: t.colors.bg.input,
      borderRadius: 10,
      padding: 12,
      minHeight: 120,
      textAlignVertical: 'top' as const,
    },
    toolbar: {
      flexDirection: 'row' as const,
      gap: 4,
      paddingVertical: 6,
      borderTopWidth: 0.5,
      borderTopColor: t.colors.border.default,
    },
    toolbarBtn: {
      padding: 8,
      borderRadius: 8,
    },
    previewToggle: {
      padding: 8,
      borderRadius: 8,
      marginLeft: 'auto' as any,
    },
    previewActive: { backgroundColor: t.colors.accent.ocean + '20' },
    previewContainer: {
      backgroundColor: t.colors.bg.input,
      borderRadius: 10,
      padding: 12,
      maxHeight: 150,
    },
    footer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    charCount: { ...t.typography.caption, color: t.colors.text.muted },
    submitBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: t.colors.accent.ocean,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { ...t.typography.label, color: '#FFFFFF' },
  }));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={['50%', '80%']}
      enablePanDownToClose
      onClose={handleDismiss}
      handleIndicatorStyle={s.handleIndicator}
      backgroundStyle={{ backgroundColor: c.bg.elevated }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={s.container}>
        {/* Parent context */}
        {parentBody && (
          <View style={s.parentQuote}>
            <Text style={s.parentLabel}>Replying to:</Text>
            <Text style={s.parentText} numberOfLines={5}>{parentBody}</Text>
          </View>
        )}

        {/* Text input */}
        <BottomSheetTextInput
          ref={inputRef as any}
          style={s.input}
          multiline
          placeholder="Write your reply..."
          placeholderTextColor={c.text.muted}
          value={body}
          onChangeText={setBody}
          onSelectionChange={(e: any) => setSelection(e.nativeEvent.selection)}
        />

        {/* Live preview */}
        {showPreview && body.trim().length > 0 && (
          <ScrollView style={s.previewContainer}>
            <MarkdownRenderer content={body} />
          </ScrollView>
        )}

        {/* Markdown toolbar */}
        <View style={s.toolbar}>
          {TOOLBAR_ACTIONS.map(({ icon: Icon, syntax, wrap, label }) => (
            <Pressable
              key={label}
              style={s.toolbarBtn}
              onPress={() => insertSyntax(syntax, wrap)}
              accessibilityLabel={label}
            >
              <Icon size={18} color={c.text.secondary} />
            </Pressable>
          ))}
          <Pressable
            style={[s.previewToggle, showPreview && s.previewActive]}
            onPress={() => setShowPreview((v) => !v)}
            accessibilityLabel="Toggle preview"
          >
            <Eye size={18} color={showPreview ? c.accent.ocean : c.text.secondary} />
          </Pressable>
        </View>

        {/* Footer: char count + submit */}
        <View style={s.footer}>
          <Text style={s.charCount}>{body.length} characters</Text>
          <Pressable
            style={[s.submitBtn, (!body.trim() || isSubmitting) && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!body.trim() || isSubmitting}
          >
            <Send size={14} color="#FFFFFF" />
            <Text style={s.submitText}>{isSubmitting ? 'Sending...' : 'Reply'}</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
