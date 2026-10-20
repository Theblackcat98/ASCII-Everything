class SequenceLayoutEngine {
  constructor(participants, messages) {
    this.participants = participants;
    this.messages = messages;
    this.messageHeight = 4;
  }

  calculateLayout() {
    let currentX = 5;
    for (const participant of this.participants) {
      participant.x = currentX;
      participant.y = 2;
      currentX += participant.width + 15;
    }

    let currentY = 8;
    for (const message of this.messages) {
      message.y = currentY;
      currentY += this.messageHeight;
    }

    return { participants: this.participants, messages: this.messages };
  }
}

module.exports = { SequenceLayoutEngine };