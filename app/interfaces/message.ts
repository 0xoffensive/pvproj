export interface Message {
  messageId?: number;
  chatId: number;
  sender: string; // "thisUser" or "other"
  senderId?: number;
  text: string;
  date?: Date;
  status?: string;
}
