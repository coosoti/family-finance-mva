'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSync(table: string, callback: () => void) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const subscribeToChanges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const realtimeChannel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: table,
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log(`Change detected in ${table}:`, payload);
            callback();
          }
        )
        .subscribe();

      setChannel(realtimeChannel);
    };

    subscribeToChanges();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, callback]);

  return channel;
}

// Multi-table sync hook
export function useMultiTableSync(
  tables: string[],
  callback: (table: string) => void
) {
  useEffect(() => {
    const channels: RealtimeChannel[] = [];

    const subscribeToAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const table of tables) {
        const channel = supabase
          .channel(`${table}-sync`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              callback(table);
            }
          )
          .subscribe();

        channels.push(channel);
      }
    };

    subscribeToAll();

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [tables, callback]);
}