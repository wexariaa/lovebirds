# Включение Realtime

В Dashboard: **Database → Replication** (или Publications).

Добавьте в publication `supabase_realtime` таблицы:

- heart_pulses
- chat_messages
- tic_tac_toe_games
- savings_goals
- couple_meetings
- daily_moods
- compliments
- album_photos
- couple_members
- couples
- activity_ideas

Либо SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.heart_pulses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tic_tac_toe_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_moods;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.album_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_ideas;
```
