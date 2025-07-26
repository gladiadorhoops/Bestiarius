import {v4 as uuid} from 'uuid';
import { Match } from '../interfaces/match';

export function generateId(): string {
    return uuid()
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