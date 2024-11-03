const sleeper = require('./sleeper-api');
const { buildStandings } = require('./build-standings');
const { getMatchupsBreakdown } = require('./get-matchups-breakdown');


const fetchAndFormatData = async() => {

  // Get NFL state
  const nflState = await sleeper.getNflState();
  const currentYear = nflState.season;
  const currentWeek = nflState.week;

  // Get players
  const playersMap = await sleeper.getPlayersMap();

  // Get current league ID
  const leagueId = await sleeper.getCurrentLeagueId(currentYear);

  // Get league users
  const users = await sleeper.getLeagueUsers(leagueId);

  // Get league rosters
  const rosters = await sleeper.getLeagueRosters(leagueId);

  // Get standings from rosters
  const standings = buildStandings({ users, rosters });

  // Get formatted matchups
  const matchupsBreakdown = await getMatchupsBreakdown({ leagueId, standings, playersMap, currentWeek });

  return {
    standings,
    matchupsBreakdown,
  };
};


module.exports = {
  fetchAndFormatData,
};
