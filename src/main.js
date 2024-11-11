const _ = require('lodash');
const sleeper = require('./sleeper-api');
const { formatTeams } = require('./format-teams');
const { getMatchupsBreakdown } = require('./get-matchups-breakdown');
const { assignMatchupProbabilities } = require('./assign-matchup-probabilities');
const { simulatePlayoffProbabilities } = require('./simulate-playoff-probabilities');

let generatedResponse = null;
let weekForGeneratedResponse = null;

const fetchAndFormatData = async() => {

  // Get NFL state
  const nflState = await sleeper.getNflState();
  const currentYear = nflState.season;
  const currentWeek = nflState.week;

  // Return the generated response if it's already been generated for this week
  if (generatedResponse && weekForGeneratedResponse === currentWeek) {
    return generatedResponse;
  } else {
    weekForGeneratedResponse = currentWeek;
  }

  // Get players
  const playersMap = await sleeper.getPlayersMap();

  // Get current league ID
  const leagueId = await sleeper.getCurrentLeagueId(currentYear);

  // Get league users
  const users = await sleeper.getLeagueUsers(leagueId);

  // Get league rosters
  const rosters = await sleeper.getLeagueRosters(leagueId);

  // Get teams from users and rosters
  const teams = formatTeams({ users, rosters });

  // Get previous and future matchups
  const matchupsBreakdown = await getMatchupsBreakdown(teams, leagueId, playersMap, currentWeek);

  // Assign the win probabilities to each matchup
  assignMatchupProbabilities(matchupsBreakdown, teams, currentWeek);

  // Simulate playoffs
  const { playoffProbabilitiesPerTeam, simulatedSeasons } = simulatePlayoffProbabilities(teams, matchupsBreakdown, currentWeek, 10000);

  // Attach playoff probabilities to each team
  for (const team of teams) {
    const playoffData = playoffProbabilitiesPerTeam[team.rosterId];
    team.madePlayoffProbability = playoffData.madePlayoffProbability;
    team.madePlayoffFromRecordProbability = playoffData.madePlayoffFromRecordProbability;
    team.madePlayoffFromJordanRuleProbability = playoffData.madePlayoffFromJordanRuleProbability;
  }

  // Sort teams by win percentage and points for
  const sortedTeams = _.orderBy(teams, ['winPercentage', 'pointsFor'], ['desc', 'desc']);

  generatedResponse = {
    teams: sortedTeams,
    matchupsBreakdown,
    currentWeek,
    // simulatedSeasons,
  };

  return generatedResponse;
};


module.exports = {
  fetchAndFormatData,
};
