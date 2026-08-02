// Filters chosen on the partidos page and applied by the results sections
// (Standings and Fase de Grupos). `null` means "no filter on this field".
//
// The object is replaced rather than mutated whenever a filter changes, so the
// sections receiving it as an @Input() see it in ngOnChanges.
export interface MatchFilters {
    group: string | null
    teamId: string | null
    gymId: string | null
    day: string | null
}

export const EMPTY_MATCH_FILTERS: MatchFilters = {
    group: null,
    teamId: null,
    gymId: null,
    day: null
}
