const emoji = require('node-emoji');
const { handleBadEmojis, } = require('./handleBadEmojis');

module.exports = {
  aggregateEmojis: (db) => {
    const data = [];
    for (let i of Object.keys(db)) {
      for (let j of Object.keys(db[i].emojis)) {
        data.push(db[i].emojis[j]);
      }
    }

    return data;
  },
  filterEmojisByType: (data, filter) => {
    if (filter === 'all') {
      return data;
    }

    return filter === 'server'
      ? data.filter(i => !i.isDefault)
      : data.filter(i => i.isDefault);
  },
  filterEmojisByField: (data, field, filter) => {
    return data.filter(i => i[field] === filter);
  },
  countData: (data, field) => {
    const count = {};
    for (let i of data) {
      if (!count[i[field]]) {
        count[i[field]] = 0;
      }

      ++count[i[field]];
    }

    return count;
  },
  filterData: (message, count) => {
    // ensure all current server emojis are represented
    const emojis = handleBadEmojis(message);
    for (let i of emojis.keyArray()) {
      if (!count[i]) {
        count[i] = 0;
      }
    }

    // remove retired server emojis
    for (let i of Object.keys(count)) {
      if (emoji.hasEmoji(i) || emojis.has(i)) {
        continue;
      }

      delete count[i];
    }

    return count;
  },
  sortData: (count, isDescending) => {
    return Object
      .keys(count)
      .map(i => {
        return { identifier: i, count: count[i], };
      })
      .sort((a, b) => {
        return isDescending ? b.count - a.count : a.count - b.count;
      });
  },
  getTotalCount: (sorted) => {
    return sorted.reduce((a, b) => a + b.count, 0);
  },
  formatEmojis: (message, sorted) => {
    return sorted.map((i, index) => {
      return `${index + 1}. ` + (emoji.hasEmoji(i.identifier)
        ? emoji.get(i.identifier)
        : message.guild.emojis.get(i.identifier)) + `: ${i.count}`;
    });
  },
  formatUsers: (message, sorted) => {
    return sorted
      .filter(i => message.guild.members.get(i.identifier)) // remove nonexistent members
      .map((i, index) => {
        const user = message.guild.members.get(i.identifier).user;
        return `${index + 1}. ${user} (${user.tag}): ${i.count}`;
      });
  },
}
