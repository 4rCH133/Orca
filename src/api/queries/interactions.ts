/**
 * Syncs Reddit interactions (upvotes, saves) to Supabase.
 * Enables cross-device search and server-side filtering.
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { InteractionType } from '@/lib/supabase.types';

export function useSearchInteractions(query: string, type?: InteractionType, subreddit?: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['interactions', 'search', query, type, subreddit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('search_interactions', {
        p_user_id: user.id,
        p_query: query,
        p_type: type,
        p_subreddit: subreddit,
        p_limit: 50,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  });
}

export function useUpsertInteraction() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      postId,
      type,
      post,
    }: {
      postId: string;
      type: InteractionType;
      post: {
        title: string;
        subreddit: string;
        author: string;
        url: string;
        thumbnail_url?: string;
        score: number;
        num_comments: number;
        flair?: string;
        created_utc: number;
      };
    }) => {
      if (!user) return;
      const { error } = await supabase.from('post_interactions').upsert({
        user_id: user.id,
        post_id: postId,
        type,
        ...post,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
}

export function useRemoveInteraction() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: InteractionType }) => {
      if (!user) return;
      const { error } = await supabase
        .from('post_interactions')
        .delete()
        .match({ user_id: user.id, post_id: postId, type });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
}

export function useUserPreferences() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // 116 = not found
      return data;
    },
    enabled: !!user,
  });
}
