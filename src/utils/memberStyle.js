import { vspoDict } from '../constants';

const findMember = (name) => {
  if (!name) return null;
  const target = String(name).trim();
  const lower = target.toLowerCase();
  return vspoDict.find(d => {
    if (d.name === target || d.name.toLowerCase() === lower) return true;
    if (d.aliases && d.aliases.some(a => a.toLowerCase() === lower)) return true;
    return false;
  });
};

export const getMemberStyle = (name) => {
  const found = findMember(name);
  if (found) {
    const hex = found.color;
    if (hex === '#FFFFFF') {
      return { backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#374151' };
    }
    if (hex === '#000000') {
      return { backgroundColor: '#00000020', borderColor: '#1f2937', color: '#111827' };
    }
    return { backgroundColor: hex + '40', borderColor: hex, color: '#374151' };
  }
  return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' };
};

export const getMemberMark = (name) => {
  const found = findMember(name);
  if (found && found.fanmarks && found.fanmarks.length > 0) {
    return found.fanmarks.join('');
  }
  return '👤';
};
