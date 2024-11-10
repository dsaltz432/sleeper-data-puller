

const assignMatchupProbabilities = (matchupsBreakdown, teams, currentWeek) => {
  for (const { week, matchups } of matchupsBreakdown) {
    for (const matchupPair of matchups) {
      const teamA = matchupPair[0];
      const teamB = matchupPair[1];

      // If the week already happened, the win probabilities are either 0 or 1 depending on who won
      if (week < currentWeek) {
        teamA.winProbability = teamA.totalPoints > teamB.totalPoints ? 1 : 0;
        teamB.winProbability = teamB.totalPoints > teamA.totalPoints ? 1 : 0;
      } else {
        // Otherwise, actually calculate the win probabilities

        // Retrieve overall ratings
        const teamAStats = teams.find((team) => team.rosterId === teamA.rosterId);
        const teamBStats = teams.find((team) => team.rosterId === teamB.rosterId);

        const teamAOverallRating = teamAStats.overallRating;
        const teamBOverallRating = teamBStats.overallRating;

        // Calculate win probabilities
        const totalRating = teamAOverallRating + teamBOverallRating;
        const teamAWinProbability = teamAOverallRating / totalRating;
        const teamBWinProbability = teamBOverallRating / totalRating;

        // Attach probabilities to the matchup objects
        teamA.winProbability = teamAWinProbability;
        teamB.winProbability = teamBWinProbability;
      }
    }
  }
};

module.exports = {
  assignMatchupProbabilities,
};
