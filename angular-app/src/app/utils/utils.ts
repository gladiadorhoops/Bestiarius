import {v4 as uuid} from 'uuid';
import { Match } from '../interfaces/match';

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