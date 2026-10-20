const { createParticipant } = require('../models/diagramModels');

function parseSequenceDiagram(lines) {
  const participants = [];
  const edges = [];

  function addParticipant(id, label) {
    if (!participants.find(p => p.id === id)) {
      participants.push(createParticipant(id, label));
    }
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      parseSequenceLine(lines[i], addParticipant, edges, participants);
    } catch (error) {
      throw new Error(`Error parsing line ${i + 1}: "${lines[i]}" - ${error.message}`);
    }
  }

  if (participants.length === 0) {
    throw new Error('No participants found in sequence diagram');
  }

  return {
    type: 'sequenceDiagram',
    participants,
    edges
  };
}

function parseSequenceLine(line, addParticipant, edges) {
  const participantRegex = /participant\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?/;
  const participantMatch = line.match(participantRegex);

  if (participantMatch) {
    const [, id, label] = participantMatch;
    addParticipant(id, label || id);
    return;
  }

  const messageRegex = /([A-Za-z0-9_]+)\s*(->>|-->|-x|--x)\s*([A-Za-z0-9_]+)\s*:\s*(.+)/;
  const messageMatch = line.match(messageRegex);

  if (messageMatch) {
    const [, from, arrow, to, message] = messageMatch;

    addParticipant(from);
    addParticipant(to);

    edges.push({
      from,
      to,
      type: arrow,
      label: message,
      sequence: edges.length
    });
  }
}

module.exports = { parseSequenceDiagram };