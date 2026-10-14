import { vspoDict } from '../constants';

export const getMemberStyle = (name) => {
  const found = vspoDict.find(d => d.name === name);
  if (found) {
    const hex = found.color;
    if (hex === '#FFFFFF') {
      return { backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#374151' };
    }
    return { backgroundColor: hex + '40', borderColor: hex, color: '#374151' };
  }
  return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' };
};

export const getMemberMark = (name) => {
  const found = vspoDict.find(d => d.name === name);
  if (found && found.fanmarks && found.fanmarks.length > 0) {
    return found.fanmarks.join('');
  }
  return '👤';
};
