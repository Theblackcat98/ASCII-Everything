function createNode(id, labelMatch) {
  let label = id;
  let shape = 'rect';

  if (labelMatch) {
    if (labelMatch.startsWith('[') && labelMatch.endsWith(']')) {
      label = labelMatch.slice(1, -1);
      shape = 'rect';
    } else if (labelMatch.startsWith('(') && labelMatch.endsWith(')')) {
      label = labelMatch.slice(1, -1);
      shape = 'round';
    } else if (labelMatch.startsWith('{') && labelMatch.endsWith('}')) {
      label = labelMatch.slice(1, -1);
      shape = 'rhombus';
    }
  }

  return {
    id,
    label,
    x: 0,
    y: 0,
    width: Math.max(label.length + 4, 8),
    height: 3,
    shape
  };
}

function createStateNode(id, label) {
  if (id === '[*]') {
    return {
      id,
      label: '',
      x: 0,
      y: 0,
      width: 3,
      height: 3,
      shape: 'rhombus'
    };
  }
  const nodeLabel = label || id;
  return {
    id,
    label: nodeLabel,
    x: 0,
    y: 0,
    width: Math.max(nodeLabel.length + 4, 10),
    height: 3,
    shape: 'roundedRect'
  };
}

function createParticipant(id, label) {
  const participantLabel = label || id;
  return {
    id,
    label: participantLabel,
    x: 0,
    y: 0,
    width: Math.max(participantLabel.length + 4, 10),
    height: 3
  };
}

module.exports = {
  createNode,
  createStateNode,
  createParticipant
};