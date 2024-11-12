
const userIdToShortNameMap = {
  '737674610933448704': 'Jessie',
  '602535346160336896': 'Jiji',
  '583157166454657024': 'Egg Boy',
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

const formatTeams = ({ users, rosters }) => {
  const teams = [];

  for (const roster of rosters) {
    const user = users.find(user => user.user_id === roster.owner_id);

    const team = {
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
    };

    // Calculate Win Percentage
    const totalGames = team.wins + team.losses + team.ties;
    team.winPercentage = totalGames > 0 ? team.wins / totalGames : 0;

    teams.push(team);
  }

  // Attach the overallRating to each team
  attachOverallRatings(teams);

  return teams;
};

const attachOverallRatings = (teams) => {

  // Find min and max for normalization
  const pointsForValues = teams.map(team => team.pointsFor);
  const waiverBudgetUsedValues = teams.map(team => team.waiverBudgetUsed);

  const minPointsFor = Math.min(...pointsForValues);
  const maxPointsFor = Math.max(...pointsForValues);
  const minWaiverBudgetUsed = Math.min(...waiverBudgetUsedValues);
  const maxWaiverBudgetUsed = Math.max(...waiverBudgetUsedValues);

  const pointsForRange = maxPointsFor - minPointsFor || 1; // Avoid division by zero
  const waiverBudgetUsedRange = maxWaiverBudgetUsed - minWaiverBudgetUsed || 1;

  // Calculate normalized values and overall rating
  teams.forEach(team => {
    // Normalize Points For
    const normalizedPointsFor = (team.pointsFor - minPointsFor) / pointsForRange;

    // Waiver Budget Used normalization (lower is better)
    const normalizedWaiverBudgetUsed = (maxWaiverBudgetUsed - team.waiverBudgetUsed) / waiverBudgetUsedRange;

    // Calculate Overall Rating: 60% Points For, 35% Win Percentage, 5% Waiver Budget Used
    team.overallRating =
        normalizedPointsFor * 0.60 +
        team.winPercentage * 0.35 +
        normalizedWaiverBudgetUsed * 0.05;
  });

};

module.exports = {
  formatTeams,
};
