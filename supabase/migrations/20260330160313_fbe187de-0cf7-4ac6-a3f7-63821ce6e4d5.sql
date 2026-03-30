-- Enable realtime for crossings and crossing_events tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.crossings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crossing_events;