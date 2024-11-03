const _ = require('lodash');

const userIdToShortNameMap = {
  '737674610933448704': 'Jessie',
  '602535346160336896': 'Jiji',
  '583157166454657024': 'Jordan',
  '469183323990650880': 'Eyal',
  '574977951018446848': 'Ron',
  '676195526546391040': 'Bradley',
  '602678724294422528': 'Darren',
  '199232508603146240': 'Siam',
  '603073742746234880': 'Micky',
  '602572680327135232': 'Saltz',
  '583434980294701056': 'Steven',
  '583119825887436800': 'Ben',
};

const buildStandings = ({ users, rosters }) => {
  const standings = [];

  for (const roster of rosters) {
    const user = users.find(user => user.user_id === roster.owner_id);
    standings.push({
      userId: user.user_id,
      rosterId: roster.roster_id,
      displayName: user.display_name,
      shortName: userIdToShortNameMap[user.user_id],
      teamName: user.metadata.team_name || `Team ${user.display_name}`,
      wins: roster.settings.wins,
      losses: roster.settings.losses,
      ties: roster.settings.ties,
      pointsFor: roster.settings.fpts,
      pointsAgainst: roster.settings.fpts_against,
      streak: roster.metadata.streak,
      waiverBudgetUsed: roster.settings.waiver_budget_used,
    });
  }

  // Sort standings by wins, then by points for
  return _.orderBy(standings, ['wins', 'pointsFor'], ['desc', 'desc']);
};

module.exports = {
  buildStandings,
};
