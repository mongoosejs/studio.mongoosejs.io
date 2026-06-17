'use strict';

const mongoose = require('mongoose');

function createSchema(mongooseInstance = mongoose) {
  const trendPointSchema = new mongooseInstance.Schema(
    {
      timestamp: Number,
      date: String,
      matchCount: Number,
      winCount: Number,
      winRate: Number,
      pickRate: Number
    },
    { _id: false }
  );

  const patchStatSchema = new mongooseInstance.Schema(
    {
      gameVersionId: Number,
      matchCount: Number,
      winCount: Number,
      winRate: Number
    },
    { _id: false }
  );

  return new mongooseInstance.Schema(
    {
      heroId: { type: Number, index: true },
      hero: String,
      heroUrl: String,
      heroImageUrl: String,
      rank: Number,
      dataRange: String,
      lastUpdated: String,
      sourceUrl: String,
      startWinRate: Number,
      currentWinRate: Number,
      winRateChange: Number,
      averageWinRate: Number,
      startPickRate: Number,
      currentPickRate: Number,
      pickRateChange: Number,
      averagePickRate: Number,
      matchCount: Number,
      winCount: Number,
      ratingScore: Number,
      winRateByDay: [trendPointSchema],
      pickRateByDay: [trendPointSchema],
      patchStats: [patchStatSchema]
    },
    {
      collection: 'stratz_hero_meta_trends',
      strict: true,
      minimize: false,
      timestamps: false
    }
  );
}

function registerStratzHeroMetaTrendModel(mongooseInstance = mongoose) {
  return mongooseInstance.models.StratzHeroMetaTrend ||
    mongooseInstance.model('StratzHeroMetaTrend', createSchema(mongooseInstance), 'stratz_hero_meta_trends');
}

module.exports = {
  modelName: 'StratzHeroMetaTrend',
  collectionName: 'stratz_hero_meta_trends',
  createSchema,
  register: registerStratzHeroMetaTrendModel
};
