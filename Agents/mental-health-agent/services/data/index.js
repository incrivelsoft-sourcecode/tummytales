const provider = process.env.DATA_PROVIDER || 'mongo'; // 'mongo' | 'http'
module.exports = provider === 'http'
  ? require('./providers/httpRepo')
  : require('./providers/mongoRepo');
