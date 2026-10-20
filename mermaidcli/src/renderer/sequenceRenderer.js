const { ASCIICanvas } = require('./asciiCanvas');

class SequenceRenderer {
  constructor(participants, messages) {
    this.participants = participants;
    this.messages = messages;
    this.canvas = new ASCIICanvas();
  }

  render() {
    this.calculateCanvasSize();
    this.canvas.initializeCanvas();
    this.renderParticipants();
    this.renderLifelines();
    this.renderMessages();
    return this.canvas.canvasToString();
  }

  calculateCanvasSize() {
    let maxX = 0;
    let maxY = 10;

    for (const participant of this.participants) {
      maxX = Math.max(maxX, participant.x + participant.width);
    }

    if (this.messages.length > 0) {
      maxY = Math.max(maxY, this.messages[this.messages.length - 1].y + 10);
    }

    this.canvas.width = Math.max(maxX + 10, 50);
    this.canvas.height = Math.max(maxY, 20);
  }

  renderParticipants() {
    for (const participant of this.participants) {
      this.drawBox(participant.x, participant.y, participant.width, participant.height, participant.label);
    }
  }

  renderLifelines() {
    for (const participant of this.participants) {
      const centerX = participant.x + Math.floor(participant.width / 2);
      const startY = participant.y + participant.height;
      const endY = this.canvas.height - 2;

      for (let y = startY; y < endY; y++) {
        this.canvas.setChar(centerX, y, '|');
      }
    }
  }

  renderMessages() {
    for (const message of this.messages) {
      this.drawMessage(message);
    }
  }

  drawMessage(message) {
    const fromParticipant = this.participants.find(p => p.id === message.from);
    const toParticipant = this.participants.find(p => p.id === message.to);

    if (!fromParticipant || !toParticipant) return;

    const fromX = fromParticipant.x + Math.floor(fromParticipant.width / 2);
    const toX = toParticipant.x + Math.floor(toParticipant.width / 2);
    const y = message.y;

    const minX = Math.min(fromX, toX);
    const maxX = Math.max(fromX, toX);

    for (let x = minX; x <= maxX; x++) {
      this.canvas.setChar(x, y, '-');
    }

    if (message.type === '->>') {
      this.canvas.setChar(toX, y, '>');
    } else if (message.type === '-x' || message.type === '--x') {
      this.canvas.setChar(toX, y, 'X');
    } else {
      this.canvas.setChar(toX, y, '>');
    }

    const labelX = Math.min(fromX, toX) + Math.floor(Math.abs(toX - fromX) / 2) - Math.floor(message.label.length / 2);
    const labelY = y - 1;

    for (let i = 0; i < message.label.length; i++) {
      this.canvas.setChar(labelX + i, labelY, message.label[i]);
    }
  }

  drawBox(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.canvas.setChar(x + i, y, '-');
      this.canvas.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.canvas.setChar(x, y + i, '|');
      this.canvas.setChar(x + width - 1, y + i, '|');
    }

    this.canvas.setChar(x, y, '+');
    this.canvas.setChar(x + width - 1, y, '+');
    this.canvas.setChar(x, y + height - 1, '+');
    this.canvas.setChar(x + width - 1, y + height - 1, '+');

    const labelY = y + Math.floor(height / 2);
    const labelX = x + Math.max(2, Math.floor((width - label.length) / 2));

    for (let i = 0; i < label.length && i < width - 2; i++) {
      this.canvas.setChar(labelX + i, labelY, label[i]);
    }
  }
}

module.exports = { SequenceRenderer };