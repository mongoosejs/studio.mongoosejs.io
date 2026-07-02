'use strict';

const mongoose = require('mongoose');

const schemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
};

// The World Cup demo is normalized into two collections so Mongoose Studio has
// something to navigate between: a `WorldCupMatch` document per game (1930-2022)
// and a `WorldCupEvent` document per in-game event (goals, cards, substitutions,
// penalties).
const matchSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  round: {
    type: String,
    required: true
  },
  host: String,
  venue: String,
  attendance: Number,
  officials: String,
  referee: String,
  notes: String,
  // Free-form score text from the source data, e.g. "(4) 3–3 (2)".
  score: String,
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  homeScore: Number,
  awayScore: Number,
  homeXg: Number,
  awayXg: Number,
  // Penalty shoot-out tally, only set for matches decided on penalties.
  homePenaltyScore: Number,
  awayPenaltyScore: Number,
  // Resolved outcome, accounting for penalty shoot-outs when the score is level.
  // Both are left unset for genuine draws (e.g. group-stage ties).
  winningTeam: String,
  losingTeam: String,
  homeManager: String,
  awayManager: String,
  homeCaptain: String,
  awayCaptain: String
}, schemaOptions);

matchSchema.virtual('events', {
  ref: 'WorldCupEvent',
  localField: '_id',
  foreignField: 'matchId'
});

const eventSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  matchId: {
    type: Number,
    required: true,
    ref: 'WorldCupMatch'
  },
  // 1-based ordering of this event within its match.
  eventNumber: {
    type: Number,
    required: true
  },
  // Denormalized from the match for easy filtering/grouping in Studio.
  year: {
    type: Number,
    required: true
  },
  date: Date,
  // The team credited with the event (own goals use the benefiting side).
  team: {
    type: String,
    required: true
  },
  opponent: {
    type: String,
    required: true
  },
  side: {
    type: String,
    enum: ['home', 'away'],
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'goal',
      'own_goal',
      'penalty_goal',
      'penalty_miss',
      'penalty_shootout_goal',
      'penalty_shootout_miss',
      'red_card',
      'yellow_red_card',
      'yellow_card',
      'substitution'
    ]
  },
  // Numeric match minute (stoppage time folded in), for sorting/filtering.
  minute: Number,
  // Match minute as text to preserve stoppage time, e.g. "90+3".
  minuteText: String,
  // Kick order within a penalty shoot-out (shoot-out events only).
  sequence: Number,
  // Running score after the event, e.g. "2:0".
  score: String,
  player: {
    type: String,
    required: true
  },
  // Assisting player, for goals that recorded an assist.
  assist: String,
  // Player who left the pitch, for substitutions.
  replacementFor: String,
  // Extra context, e.g. "Penalty saved by Kasper Schmeichel".
  outcome: String,
  // The raw source string this event was parsed from.
  raw: String
}, schemaOptions);

eventSchema.virtual('match', {
  ref: 'WorldCupMatch',
  localField: 'matchId',
  foreignField: '_id',
  justOne: true
});

const WorldCupMatch = mongoose.model('WorldCupMatch', matchSchema, 'world_cup_matches');
const WorldCupEvent = mongoose.model('WorldCupEvent', eventSchema, 'world_cup_events');

module.exports = { WorldCupMatch, WorldCupEvent };
