export interface Tweet {
  id: string;
  text: string;
  author: string;
  author_name: string;
}
  
export interface User {
  userId: string;
  address: string;
}

export interface CommandContext {
  user: User;
  tweet: Tweet;
  command: string;
  args: any[];
}