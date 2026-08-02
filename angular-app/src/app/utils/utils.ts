import {v4 as uuid} from 'uuid';
import { Match } from '../interfaces/match';
import { MatchFilters } from '../interfaces/match-filters';

export function generateId(): string {
    return uuid()
}

// Match times are wall-clock times at the venue, so they are stored without a
// zone: `YYYY-MM-DDTHH:mm`. `Date.toString()` would embed the writer's offset
// and `toISOString()` would convert to UTC — either way the saved hour shifts
// depending on where it was entered. Reading it back with `new Date(...)` parses
// it as local time, giving the same clock time it was saved with.
export function toLocalDateTimeString(date: Date): string {
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function filterMatches(
    matches: Match[],
     day: string | null = null,
     gym: string | null = null,
     team: string | null = null,
    ): Match[] {
    let filteredMatches: Match[] = matches
    if(!matches) return filteredMatches;
    if(day) filteredMatches = filteredMatches.filter(match => match.day == day);
    if(gym) filteredMatches = filteredMatches.filter(match => match.location.id == gym);
    if(team) filteredMatches = filteredMatches.filter(match =>
      match.homeTeam.name == team || match.visitorTeam.name == team
    );
    return filteredMatches;
}

// The calendar day a match is played on, as `YYYY-MM-DD`. Used as the value of
// the date filter so it sorts chronologically and is stable across the
// July/August boundary (unlike the stored day-of-month in `match.day`).
export function matchDateKey(match: Match): string | undefined {
    return match.datetime ? toLocalDateTimeString(match.datetime).split('T')[0] : undefined;
}

// Applies the partidos page filters to a match list. Group is only applied when
// the caller asks for it: the standings matches aren't part of any group, so
// filtering them by one would always empty the list.
export function applyMatchFilters(
    matches: Match[],
    filters: MatchFilters,
    { includeGroup = true }: { includeGroup?: boolean } = {}
): Match[] {
    let filteredMatches = matches ?? [];
    if(includeGroup && filters.group) filteredMatches = filteredMatches.filter(match => match.juego == filters.group);
    if(filters.teamId) filteredMatches = filteredMatches.filter(match =>
        match.homeTeam?.id == filters.teamId || match.visitorTeam?.id == filters.teamId
    );
    if(filters.gymId) filteredMatches = filteredMatches.filter(match => match.location?.id == filters.gymId);
    if(filters.day) filteredMatches = filteredMatches.filter(match => matchDateKey(match) == filters.day);
    return filteredMatches;
}