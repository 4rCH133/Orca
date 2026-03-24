/**
 * Auto-generate the full version with: npx supabase gen types typescript --local > src/lib/supabase.types.ts
 * This is a hand-written stub to get TypeScript working before the DB is provisioned.
 */

export type InteractionType = 'upvote' | 'downvote' | 'save' | 'hide';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          reddit_id: string;
          username: string;
          icon_url: string | null;
          total_karma: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: 'system' | 'light' | 'dark' | 'oled';
          feed_layout: 'card' | 'compact' | 'list';
          default_sort: string;
          auto_play_video: boolean;
          blur_nsfw: boolean;
          show_flair: boolean;
          custom_colors: Record<string, string>;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_preferences']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['user_preferences']['Row']>;
      };
      post_interactions: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          type: InteractionType;
          title: string;
          subreddit: string;
          author: string;
          url: string;
          thumbnail_url: string | null;
          score: number;
          num_comments: number;
          flair: string | null;
          created_utc: number;
          interacted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_interactions']['Row'], 'id' | 'interacted_at'>;
        Update: Partial<Database['public']['Tables']['post_interactions']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subreddit: string;
          display_name: string;
          icon_url: string | null;
          pinned: boolean;
          sort_order: number;
          synced_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'synced_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      custom_feeds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          subreddits: string[];
          is_public: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['custom_feeds']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['custom_feeds']['Insert']>;
      };
    };
    Functions: {
      search_interactions: {
        Args: {
          p_user_id: string;
          p_query: string;
          p_type?: InteractionType;
          p_subreddit?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Database['public']['Tables']['post_interactions']['Row'][];
      };
    };
  };
}
